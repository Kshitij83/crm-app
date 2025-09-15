import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, paginationSchema } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { GeminiService } from '../services/geminiService';
// Temporarily commenting out Kafka integration
// import { publishMessage } from '../services/kafkaService';
import { setCache, getCache, deleteCache, invalidatePattern } from '../services/redisService';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createCampaignSchema = z.object({
  body: z.object({
    // Support both direct segment data or segment ID reference
    segmentId: z.string().optional(),
    segmentName: z.string().optional(),
    segmentRules: z.any().optional(),
    messageText: z.string().min(1, 'Message text is required'),
  }).refine(data => {
    // Either segmentId OR (segmentName AND segmentRules) must be provided
    return (!!data.segmentId) || (!!data.segmentName && !!data.segmentRules);
  }, {
    message: 'Either segmentId OR both segmentName and segmentRules must be provided',
  }),
});

const updateCampaignStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Campaign ID is required'),
  }),
  body: z.object({
    status: z.enum(['draft', 'sent', 'failed']),
  }),
});

const messageSuggestionSchema = z.object({
  body: z.object({
    objective: z.string().min(1, 'Objective is required'),
    targetAudience: z.string().min(1, 'Target audience is required'),
    tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).optional(),
    maxLength: z.number().min(50).max(500).optional(),
  }),
});

/**
 * @swagger
 * /api/campaigns:
 *   post:
 *     summary: Create a new campaign
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - segmentId
 *               - messageText
 *             properties:
 *               segmentId:
 *                 type: string
 *               messageText:
 *                 type: string
 *     responses:
 *       201:
 *         description: Campaign created and sent successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Segment not found
 */
router.post(
  '/',
  authenticateToken,
  validateRequest(createCampaignSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { segmentId, segmentName, segmentRules, messageText } = req.body;
    
    let segmentRulesToApply;
    let campaign;
    
    // Handle both types of requests (using existing segment or creating embedded segment)
    if (segmentId) {
      // Verify segment exists and belongs to the user (legacy flow)
      const segment = await prisma.segment.findFirst({
        where: { 
          id: segmentId,
          createdBy: req.user.id 
        },
      });

      if (!segment) {
        return res.status(404).json({
          error: 'Segment not found or not owned by you',
        });
      }

      segmentRulesToApply = segment.rules as any;
      
      // Create campaign with segmentId reference
      campaign = await prisma.campaign.create({
        data: {
          segmentId,
          messageText,
          status: 'draft',
          createdBy: req.user.id,
        },
      });
    } else {
      // New flow - embedded segment data
      segmentRulesToApply = segmentRules;
      
      // Create campaign with embedded segment data
      // Explicitly cast the data fields to match Prisma's expectations
      // @ts-ignore - we know these fields exist in the schema even if Prisma types aren't updated
      campaign = await prisma.campaign.create({
        data: {
          // @ts-ignore - we know these fields exist in the schema even if Prisma types aren't updated
          segmentName,
          // @ts-ignore - we know these fields exist in the schema even if Prisma types aren't updated
          segmentRules: segmentRules as any, // Use type assertion for the JSON field
          messageText,
          status: 'draft',
          createdBy: req.user.id,
        },
      });
    }

    // Get customers matching the segment rules
    const matchingCustomers = await applySegmentRules(segmentRulesToApply);

    // Simulate campaign delivery
    const deliveryResults = await simulateCampaignDelivery(campaign.id, matchingCustomers, messageText);

    // Update campaign status
    const successCount = deliveryResults.filter(r => r.status === 'SENT').length;
    const campaignStatus = successCount > 0 ? 'sent' : 'failed';

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: campaignStatus },
    });

    // In the future, we'll implement Kafka for asynchronous processing
    // For now, we're processing synchronously
    // await publishMessage('campaigns', {
    //   type: 'campaign_created',
    //   campaignId: campaign.id,
    //   segmentId,
    //   customerCount: matchingCustomers.length,
    //   successCount,
    //   data: campaign,
    // });

    res.status(201).json({
      message: 'Campaign created and delivered successfully',
      campaign: {
        ...campaign,
        status: campaignStatus,
      },
      delivery: {
        totalCustomers: matchingCustomers.length,
        successCount,
        failureCount: matchingCustomers.length - successCount,
        successRate: matchingCustomers.length > 0 ? (successCount / matchingCustomers.length) * 100 : 0,
      },
    });
  })
);

/**
 * @swagger
 * /api/campaigns:
 *   get:
 *     summary: Get list of campaigns
 *     tags: [Campaigns]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of campaigns retrieved successfully
 */
router.get(
  '/',
  authenticateToken,
  validateRequest(paginationSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Check cache first
    const cacheKey = `campaigns:${req.user.id}:list:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    // Get total count for this user's campaigns
    const total = await prisma.campaign.count({
      where: { createdBy: req.user.id }
    });

    // Get campaigns with pagination
    const campaigns = await prisma.campaign.findMany({
      where: { createdBy: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        segment: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            communicationLogs: true,
          },
        },
      },
    });

    // Add delivery statistics to each campaign
    const campaignsWithStats = await Promise.all(
      campaigns.map(async (campaign) => {
        const logs = await prisma.communicationLog.findMany({
          where: { campaignId: campaign.id },
        });

        const successCount = logs.filter(log => log.status === 'SENT').length;
        const totalCount = logs.length;
        const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

        return {
          ...campaign,
          stats: {
            totalSent: totalCount,
            successCount,
            failureCount: totalCount - successCount,
            successRate,
          },
        };
      })
    );

    const result = {
      campaigns: campaignsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache the result
    await setCache(cacheKey, result, 300);

    res.json(result);
  })
);

/**
 * @swagger
 * /api/campaigns/{id}:
 *   get:
 *     summary: Get campaign by ID with detailed statistics
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign retrieved successfully
 *       404:
 *         description: Campaign not found
 */
router.get(
  '/:id',
  authenticateToken,
  validateRequest(paginationSchema.merge(z.object({
    params: z.object({
      id: z.string().min(1, 'Campaign ID is required'),
    }),
  }))),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;

    // Check cache first
    const cacheKey = `campaigns:${req.user.id}:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const campaign = await prisma.campaign.findUnique({
      where: { 
        id,
        createdBy: req.user.id // Ensure user can only see their own campaigns
      },
      include: {
        segment: {
          select: {
            id: true,
            name: true,
            rules: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        communicationLogs: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found',
      });
    }

    // Calculate detailed statistics
    const logs = campaign.communicationLogs;
    const successCount = logs.filter(log => log.status === 'SENT').length;
    const failureCount = logs.filter(log => log.status === 'FAILED').length;
    const totalCount = logs.length;
    const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

    const campaignWithStats = {
      ...campaign,
      stats: {
        totalSent: totalCount,
        successCount,
        failureCount,
        successRate,
        logs: logs.slice(0, 50), // Show latest 50 logs
      },
    };

    // Cache the result
    await setCache(cacheKey, campaignWithStats, 3600);

    res.json(campaignWithStats);
  })
);

/**
 * @swagger
 * /api/campaigns/{id}/receipt:
 *   post:
 *     summary: Update campaign delivery status (simulate vendor callback)
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, sent, failed]
 *     responses:
 *       200:
 *         description: Campaign status updated successfully
 *       404:
 *         description: Campaign not found
 */
router.post(
  '/:id/receipt',
  authenticateToken,
  validateRequest(updateCampaignStatusSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const { status } = req.body;

    // Check if campaign exists and belongs to the user
    const campaign = await prisma.campaign.findFirst({
      where: { 
        id,
        createdBy: req.user.id 
      },
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found or not owned by you',
      });
    }

    // Update campaign status
    const updatedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status },
    });

    // Invalidate cache
    await invalidatePattern(`campaigns:${req.user.id}:*`);

    res.json({
      message: 'Campaign status updated successfully',
      campaign: updatedCampaign,
    });
  })
);

/**
 * @swagger
 * /api/campaigns/suggest-message:
 *   post:
 *     summary: Generate AI-powered message suggestions
 *     tags: [Campaigns]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - objective
 *               - targetAudience
 *             properties:
 *               objective:
 *                 type: string
 *               targetAudience:
 *                 type: string
 *               tone:
 *                 type: string
 *                 enum: [professional, casual, friendly, urgent]
 *               maxLength:
 *                 type: integer
 *                 minimum: 50
 *                 maximum: 500
 *     responses:
 *       200:
 *         description: Message suggestions generated successfully
 *       400:
 *         description: Invalid request or generation failed
 */
router.post(
  '/suggest-message',
  authenticateToken,
  validateRequest(messageSuggestionSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { objective, targetAudience, tone, maxLength } = req.body;

    try {
      const suggestions = await GeminiService.generateMessageSuggestions({
        objective,
        targetAudience,
        tone,
        maxLength,
      });

      res.json({
        message: 'Message suggestions generated successfully',
        suggestions,
        metadata: {
          objective,
          targetAudience,
          tone,
          maxLength,
        },
      });
    } catch (error: any) {
      console.error('Message suggestion error:', error);
      
      // Send a more helpful error message for quota issues
      if (error.message && (
          error.message.includes('quota') || 
          error.message.includes('rate limit') || 
          error.message.includes('insufficient_quota'))) {
        return res.status(429).json({
          error: 'AI service quota exceeded',
          details: 'The AI service is currently unavailable due to quota limitations. Please try again later or contact support.'
        });
      }
      
      res.status(400).json({
        error: 'Failed to generate message suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * @swagger
 * /api/campaigns/{id}/insights:
 *   get:
 *     summary: Generate AI-powered campaign insights
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID
 *     responses:
 *       200:
 *         description: Campaign insights generated successfully
 *       404:
 *         description: Campaign not found
 */
router.get(
  '/:id/insights',
  authenticateToken,
  validateRequest(paginationSchema.merge(z.object({
    params: z.object({
      id: z.string().min(1, 'Campaign ID is required'),
    }),
  }))),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: { 
        id,
        createdBy: req.user.id // Ensure user can only see their own campaigns
      },
      include: {
        segment: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            communicationLogs: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({
        error: 'Campaign not found or not owned by you',
      });
    }

    // Get campaign statistics
    const logs = await prisma.communicationLog.findMany({
      where: { campaignId: id },
    });

    const successCount = logs.filter(log => log.status === 'SENT').length;
    const totalSent = logs.length;
    const successRate = totalSent > 0 ? (successCount / totalSent) * 100 : 0;

    const campaignData = {
      name: campaign.messageText.substring(0, 50) + '...',
      totalSent,
      successRate,
      segmentName: campaign.segment?.name || 'Embedded Segment', // Handle embedded segments
      messageText: campaign.messageText,
    };

    try {
      const insights = await GeminiService.generateCampaignInsights(campaignData);

      res.json({
        message: 'Campaign insights generated successfully',
        insights,
        campaignData,
      });
    } catch (error: any) {
      console.error('Campaign insights error:', error);
      
      // Handle OpenAI service quota issues specifically
      if (error.message && (
          error.message.includes('quota') || 
          error.message.includes('rate limit') || 
          error.message.includes('insufficient_quota'))) {
        return res.status(429).json({
          error: 'AI service quota exceeded',
          details: 'The AI service is currently unavailable due to quota limitations. Please try again later or contact support.'
        });
      }
      
      res.status(500).json({
        error: 'Failed to generate campaign insights',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

// Helper function to apply segment rules (reused from segments route)
async function applySegmentRules(rules: any): Promise<any[]> {
  try {
    const where: any = {};

    if (rules.operator === 'AND') {
      for (const rule of rules.rules) {
        applyRule(where, rule);
      }
    } else if (rules.operator === 'OR') {
      const orConditions: any[] = [];
      for (const rule of rules.rules) {
        const ruleWhere: any = {};
        applyRule(ruleWhere, rule);
        orConditions.push(ruleWhere);
      }
      if (orConditions.length > 0) {
        where.OR = orConditions;
      }
    }

    const customers = await prisma.customer.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return customers;
  } catch (error) {
    console.error('Error applying segment rules:', error);
    return [];
  }
}

// Helper function to apply individual rule (reused from segments route)
function applyRule(where: any, rule: any) {
  const { field, operator, value } = rule;

  switch (field) {
    case 'totalSpend':
      if (operator === '>') {
        where.totalSpend = { ...where.totalSpend, gt: value };
      } else if (operator === '<') {
        where.totalSpend = { ...where.totalSpend, lt: value };
      } else if (operator === '>=') {
        where.totalSpend = { ...where.totalSpend, gte: value };
      } else if (operator === '<=') {
        where.totalSpend = { ...where.totalSpend, lte: value };
      } else if (operator === '=') {
        where.totalSpend = value;
      }
      break;

    case 'visits':
      if (operator === '>') {
        where.visits = { ...where.visits, gt: value };
      } else if (operator === '<') {
        where.visits = { ...where.visits, lt: value };
      } else if (operator === '>=') {
        where.visits = { ...where.visits, gte: value };
      } else if (operator === '<=') {
        where.visits = { ...where.visits, lte: value };
      } else if (operator === '=') {
        where.visits = value;
      }
      break;

    case 'lastActiveDate':
      if (operator === 'is_null') {
        where.lastActiveDate = null;
      } else if (operator === 'is_not_null') {
        where.lastActiveDate = { not: null };
      } else {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - value);
        
        if (operator === '<') {
          where.lastActiveDate = { ...where.lastActiveDate, lt: daysAgo };
        } else if (operator === '>') {
          where.lastActiveDate = { ...where.lastActiveDate, gt: daysAgo };
        }
      }
      break;

    case 'email':
      if (operator === 'contains') {
        where.email = { ...where.email, contains: value, mode: 'insensitive' };
      } else if (operator === 'not_contains') {
        where.email = { ...where.email, not: { contains: value, mode: 'insensitive' } };
      }
      break;

    case 'name':
      if (operator === 'contains') {
        where.name = { ...where.name, contains: value, mode: 'insensitive' };
      } else if (operator === 'not_contains') {
        where.name = { ...where.name, not: { contains: value, mode: 'insensitive' } };
      }
      break;
  }
}

// Helper function to simulate campaign delivery
async function simulateCampaignDelivery(campaignId: string, customers: any[], messageText: string) {
  const results = [];

  for (const customer of customers) {
    // Simulate 90% success rate
    const isSuccess = Math.random() < 0.9;
    const status = isSuccess ? 'SENT' : 'FAILED';

    // Create communication log
    const log = await prisma.communicationLog.create({
      data: {
        campaignId,
        customerId: customer.id,
        status,
        sentAt: new Date(),
      },
    });

    results.push({
      customerId: customer.id,
      status,
      logId: log.id,
    });
  }

  return results;
}

// Second implementation of suggest-message endpoint removed to avoid duplication

/**
 * @swagger
 * /api/campaigns/test-ai-features:
 *   get:
 *     summary: Test all OpenAI integration features with mock data
 *     tags: [Campaigns]
 *     responses:
 *       200:
 *         description: AI features test results
 */
router.get(
  '/test-ai-features',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    let testsSucceeded = 0;
    let testsAttempted = 0;
    const testResults: any = {
      naturalLanguageRules: { status: 'pending' },
      messageSuggestions: { status: 'pending' },
      campaignInsights: { status: 'pending' }
    };
    
    // Test natural language to segment rules
    try {
      testsAttempted++;
      const ruleDescription = "Customers who spent more than 1000 and have visited the site at least 3 times";
      const rules = await GeminiService.parseNaturalLanguageRules({ description: ruleDescription });
      
      testResults.naturalLanguageRules = {
        status: 'success',
        input: ruleDescription,
        output: rules
      };
      testsSucceeded++;
    } catch (error: any) {
      testResults.naturalLanguageRules = {
        status: 'error',
        error: error.message || 'Unknown error'
      };
    }
    
    // Test message suggestions
    try {
      testsAttempted++;
      const messageSuggestions = await GeminiService.generateMessageSuggestions({
        objective: "Launch our new premium subscription service",
        targetAudience: "High-value customers",
        tone: "professional"
      });
      
      testResults.messageSuggestions = {
        status: 'success',
        input: {
          objective: "Launch our new premium subscription service",
          targetAudience: "High-value customers",
          tone: "professional"
        },
        output: messageSuggestions
      };
      testsSucceeded++;
    } catch (error: any) {
      testResults.messageSuggestions = {
        status: 'error',
        error: error.message || 'Unknown error'
      };
    }
    
    // Test campaign insights
    try {
      testsAttempted++;
      const campaignData = {
        name: "Summer Sale Campaign",
        totalSent: 1500,
        successRate: 85,
        segmentName: "Active Customers",
        messageText: "Get 25% off on all summer products! Limited time offer."
      };
      
      const insights = await GeminiService.generateCampaignInsights(campaignData);
      
      testResults.campaignInsights = {
        status: 'success',
        input: campaignData,
        output: insights
      };
      testsSucceeded++;
    } catch (error: any) {
      testResults.campaignInsights = {
        status: 'error',
        error: error.message || 'Unknown error'
      };
    }
    
    res.json({
      message: `AI features test completed (${testsSucceeded}/${testsAttempted} successful)`,
      testResults,
      quotaStatus: testsSucceeded < testsAttempted ? 'unavailable' : 'available'
    });
  })
);

export default router;

