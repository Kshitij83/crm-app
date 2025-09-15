import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, paginationSchema } from '../middleware/validation';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { GeminiService } from '../services/geminiService';
import { setCache, getCache, deleteCache, invalidatePattern } from '../services/redisService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createSegmentSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Segment name is required'),
    rules: z.any(), // JSON object for dynamic rules
  }),
});

const updateSegmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Segment ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    rules: z.any().optional(),
  }),
});

const parseRulesSchema = z.object({
  body: z.object({
    description: z.string().min(1, 'Description is required'),
  }),
});

/**
 * @swagger
 * /api/segments:
 *   post:
 *     summary: Create a new customer segment
 *     tags: [Segments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - rules
 *             properties:
 *               name:
 *                 type: string
 *               rules:
 *                 type: object
 *                 description: JSON object containing segment rules
 *     responses:
 *       201:
 *         description: Segment created successfully
 *       400:
 *         description: Invalid request data
 */
router.post(
  '/',
  authenticateToken,
  validateRequest(createSegmentSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { name, rules } = req.body;
    
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    // Create segment
    const segment = await prisma.segment.create({
      data: {
        name,
        rules,
        createdBy: req.user.id,
      },
    });

    // Invalidate segments cache
    await invalidatePattern('segments:*');

    res.status(201).json({
      message: 'Segment created successfully',
      segment,
    });
  })
);

/**
 * @swagger
 * /api/segments:
 *   get:
 *     summary: Get list of segments
 *     tags: [Segments]
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
 *         description: List of segments retrieved successfully
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
    const cacheKey = `segments:${req.user.id}:list:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    // Get total count for this user's segments
    const total = await prisma.segment.count({
      where: { createdBy: req.user.id }
    });

    // Get segments with pagination
    const segments = await prisma.segment.findMany({
      where: { createdBy: req.user.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    const result = {
      segments,
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
 * /api/segments/{id}:
 *   get:
 *     summary: Get segment by ID
 *     tags: [Segments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Segment ID
 *     responses:
 *       200:
 *         description: Segment retrieved successfully
 *       404:
 *         description: Segment not found
 */
router.get(
  '/:id',
  authenticateToken,
  validateRequest(paginationSchema.merge(z.object({
    params: z.object({
      id: z.string().min(1, 'Segment ID is required'),
    }),
  }))),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;

    // Check cache first
    const cacheKey = `segments:${req.user.id}:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const segment = await prisma.segment.findUnique({
      where: { 
        id,
        createdBy: req.user.id // Ensure user can only see their own segments
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        campaigns: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    });

    if (!segment) {
      return res.status(404).json({
        error: 'Segment not found',
      });
    }

    // Cache the result
    await setCache(cacheKey, segment, 3600);

    res.json(segment);
  })
);

/**
 * @swagger
 * /api/segments/{id}/preview:
 *   get:
 *     summary: Preview segment audience size
 *     tags: [Segments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Segment ID
 *     responses:
 *       200:
 *         description: Segment preview retrieved successfully
 *       404:
 *         description: Segment not found
 */
router.get(
  '/:id/preview',
  authenticateToken,
  validateRequest(paginationSchema.merge(z.object({
    params: z.object({
      id: z.string().min(1, 'Segment ID is required'),
    }),
  }))),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { id } = req.params;

    // Check cache first
    const cacheKey = `segments:${req.user.id}:${id}:preview`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const segment = await prisma.segment.findUnique({
      where: { 
        id,
        createdBy: req.user.id // Ensure user can only see their own segments
      },
    });

    if (!segment) {
      return res.status(404).json({
        error: 'Segment not found',
      });
    }

    // Apply segment rules to get matching customers
    const matchingCustomers = await applySegmentRules(segment.rules as any);

    const preview = {
      segmentId: id,
      segmentName: segment.name,
      totalCustomers: matchingCustomers.length,
      customers: matchingCustomers.slice(0, 10), // Show first 10 customers
    };

    // Cache the result
    await setCache(cacheKey, preview, 300);

    res.json(preview);
  })
);

/**
 * @swagger
 * /api/segments/parse-rules:
 *   post:
 *     summary: Parse natural language rules using AI
 *     tags: [Segments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - description
 *             properties:
 *               description:
 *                 type: string
 *                 description: Natural language description of segment rules
 *     responses:
 *       200:
 *         description: Rules parsed successfully
 *       400:
 *         description: Invalid request or parsing failed
 */
router.post(
  '/parse-rules',
  authenticateToken,
  validateRequest(parseRulesSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { description } = req.body;

    try {
      const rules = await GeminiService.parseNaturalLanguageRules({ description });

      res.json({
        message: 'Rules parsed successfully',
        rules,
        originalDescription: description,
      });
    } catch (error: any) {
      // Check for quota errors
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
        error: 'Failed to parse rules from description',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

/**
 * @swagger
 * /api/segments/{id}:
 *   put:
 *     summary: Update segment
 *     tags: [Segments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Segment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rules:
 *                 type: object
 *     responses:
 *       200:
 *         description: Segment updated successfully
 *       404:
 *         description: Segment not found
 */
router.put(
  '/:id',
  authenticateToken,
  validateRequest(updateSegmentSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;
    const updateData = req.body;

    // Check if segment exists and belongs to the user
    const existingSegment = await prisma.segment.findFirst({
      where: { 
        id,
        createdBy: req.user.id 
      },
    });

    if (!existingSegment) {
      return res.status(404).json({
        error: 'Segment not found',
      });
    }

    // Update segment
    const segment = await prisma.segment.update({
      where: { id },
      data: updateData,
    });

    // Invalidate cache
    await invalidatePattern(`segments:${req.user.id}:*`);

    res.json({
      message: 'Segment updated successfully',
      segment,
    });
  })
);

/**
 * @swagger
 * /api/segments/preview-rules:
 *   post:
 *     summary: Preview audience size for a set of rules without creating a segment
 *     tags: [Segments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rules
 *             properties:
 *               rules:
 *                 type: object
 *                 description: JSON object containing segment rules
 *     responses:
 *       200:
 *         description: Audience preview calculated successfully
 *       400:
 *         description: Invalid request data
 */
router.post(
  '/preview-rules',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { rules } = req.body;

    if (!rules || typeof rules !== 'object') {
      throw createError('Valid rules object is required', 400);
    }

    // Apply segment rules to get matching customers
    const matchingCustomers = await applySegmentRules(rules);

    const preview = {
      totalCustomers: matchingCustomers.length,
      customers: matchingCustomers.slice(0, 10), // Show first 10 customers
    };

    res.json(preview);
  })
);

// Helper function to apply segment rules
async function applySegmentRules(rules: any): Promise<any[]> {
  try {
    // This is a simplified implementation
    // In a real application, you would have a more sophisticated rule engine
    
    const where: any = {};

    if (rules.operator === 'AND') {
      // Apply all rules with AND logic
      for (const rule of rules.rules) {
        applyRule(where, rule);
      }
    } else if (rules.operator === 'OR') {
      // Apply rules with OR logic
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
        totalSpend: true,
        visits: true,
        lastActiveDate: true,
      },
    });

    return customers;
  } catch (error) {
    console.error('Error applying segment rules:', error);
    return [];
  }
}

// Helper function to apply individual rule
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

/**
 * @swagger
 * /api/segments/{id}:
 *   delete:
 *     summary: Delete a segment
 *     tags: [Segments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Segment ID
 *     responses:
 *       200:
 *         description: Segment deleted successfully
 *       404:
 *         description: Segment not found
 */
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { id } = req.params;

    // Check if segment exists and belongs to the user
    const existingSegment = await prisma.segment.findFirst({
      where: { 
        id,
        createdBy: req.user.id 
      },
    });

    if (!existingSegment) {
      return res.status(404).json({
        error: 'Segment not found',
      });
    }

    // Delete segment
    await prisma.segment.delete({
      where: { id },
    });

    // Invalidate cache
    await invalidatePattern(`segments:${req.user.id}:*`);

    res.json({
      message: 'Segment deleted successfully',
      id,
    });
  })
);

/**
 * @swagger
 * /api/segments/test-rule-parsing:
 *   post:
 *     summary: Test natural language to rule parsing
 *     tags: [Segments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 description: Natural language description of segment rules
 *     responses:
 *       200:
 *         description: Parsed rules from natural language
 */
router.post(
  '/test-rule-parsing',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.user) {
      throw createError('Authentication required', 401);
    }
    
    const { description } = req.body;
    
    if (!description) {
      throw createError('Description is required', 400);
    }
    
    try {
      const rules = await GeminiService.parseNaturalLanguageRules({ description });
      
      res.json({
        message: "Rule parsing completed",
        input: description,
        output: rules
      });
    } catch (error: any) {
      // Check for quota errors
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
        error: 'Failed to parse rules from description',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })
);

export default router;

