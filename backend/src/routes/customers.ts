import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { validateRequest, paginationSchema } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { publishMessage } from '../services/kafkaService';
import { setCache, getCache } from '../services/redisService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().optional(),
    totalSpend: z.number().min(0).default(0),
    visits: z.number().int().min(0).default(0),
    lastActiveDate: z.string().datetime().optional(),
  }),
});

const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Customer ID is required'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    totalSpend: z.number().min(0).optional(),
    visits: z.number().int().min(0).optional(),
    lastActiveDate: z.string().datetime().optional(),
  }),
});

const getCustomersSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'email', 'totalSpend', 'visits', 'lastActiveDate', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

/**
 * @swagger
 * /api/customers:
 *   post:
 *     summary: Create a new customer
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               totalSpend:
 *                 type: number
 *                 minimum: 0
 *               visits:
 *                 type: integer
 *                 minimum: 0
 *               lastActiveDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: Customer with email already exists
 */
router.post(
  '/',
  authenticateToken,
  validateRequest(createCustomerSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const customerData = req.body;

    // Check if customer with email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: customerData.email },
    });

    if (existingCustomer) {
      return res.status(409).json({
        error: 'Customer with this email already exists',
      });
    }

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        ...customerData,
        lastActiveDate: customerData.lastActiveDate ? new Date(customerData.lastActiveDate) : null,
      },
    });

    // Publish to Kafka for async processing
    await publishMessage('customers', {
      type: 'customer_created',
      customerId: customer.id,
      data: customer,
    });

    // Invalidate cache
    await setCache(`customers:${customer.id}`, customer, 3600);

    res.status(201).json({
      message: 'Customer created successfully',
      customer,
    });
  })
);

/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Get list of customers with pagination and filtering
 *     tags: [Customers]
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or email
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, email, totalSpend, visits, lastActiveDate, createdAt]
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of customers retrieved successfully
 */
router.get(
  '/',
  authenticateToken,
  validateRequest(getCustomersSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Check cache first
    const cacheKey = `customers:${page}:${limit}:${search}:${sortBy}:${sortOrder}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    // Build where clause
    const where: any = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {};

    // Build orderBy clause
    const orderBy: any = { [sortBy]: sortOrder };

    // Get total count
    const total = await prisma.customer.count({ where });

    // Get customers with pagination
    const customers = await prisma.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        orders: {
          select: {
            id: true,
            orderAmount: true,
            orderDate: true,
          },
          orderBy: { orderDate: 'desc' },
          take: 5, // Latest 5 orders
        },
        _count: {
          select: {
            orders: true,
            communicationLogs: true,
          },
        },
      },
    });

    const result = {
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache the result
    await setCache(cacheKey, result, 300); // 5 minutes cache

    res.json(result);
  })
);

/**
 * @swagger
 * /api/customers/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *       404:
 *         description: Customer not found
 */
router.get(
  '/:id',
  authenticateToken,
  validateRequest(paginationSchema.merge(z.object({
    params: z.object({
      id: z.string().min(1, 'Customer ID is required'),
    }),
  }))),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    // Check cache first
    const cached = await getCache(`customers:${id}`);
    if (cached) {
      return res.json(cached);
    }

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { orderDate: 'desc' },
        },
        communicationLogs: {
          include: {
            campaign: {
              select: {
                id: true,
                messageText: true,
                createdAt: true,
              },
            },
          },
          orderBy: { sentAt: 'desc' },
        },
        _count: {
          select: {
            orders: true,
            communicationLogs: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
      });
    }

    // Cache the result
    await setCache(`customers:${id}`, customer, 3600);

    res.json(customer);
  })
);

/**
 * @swagger
 * /api/customers/{id}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               totalSpend:
 *                 type: number
 *                 minimum: 0
 *               visits:
 *                 type: integer
 *                 minimum: 0
 *               lastActiveDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       404:
 *         description: Customer not found
 */
router.put(
  '/:id',
  authenticateToken,
  validateRequest(updateCustomerSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updateData = req.body;

    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id },
    });

    if (!existingCustomer) {
      return res.status(404).json({
        error: 'Customer not found',
      });
    }

    // Update customer
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...updateData,
        lastActiveDate: updateData.lastActiveDate ? new Date(updateData.lastActiveDate) : undefined,
      },
    });

    // Publish to Kafka
    await publishMessage('customers', {
      type: 'customer_updated',
      customerId: customer.id,
      data: customer,
    });

    // Invalidate cache
    await setCache(`customers:${customer.id}`, customer, 3600);

    res.json({
      message: 'Customer updated successfully',
      customer,
    });
  })
);

export default router;

