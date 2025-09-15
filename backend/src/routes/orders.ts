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
const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().min(1, 'Customer ID is required'),
    orderAmount: z.number().min(0, 'Order amount must be positive'),
    orderDate: z.string().datetime().optional(),
  }),
});

const getOrdersSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    customerId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
    sortBy: z.enum(['orderDate', 'orderAmount', 'createdAt']).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - orderAmount
 *             properties:
 *               customerId:
 *                 type: string
 *               orderAmount:
 *                 type: number
 *                 minimum: 0
 *               orderDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Customer not found
 */
router.post(
  '/',
  authenticateToken,
  validateRequest(createOrderSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { customerId, orderAmount, orderDate } = req.body;

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return res.status(404).json({
        error: 'Customer not found',
      });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId,
        orderAmount,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
      },
    });

    // Update customer's total spend
    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalSpend: {
          increment: orderAmount,
        },
        visits: {
          increment: 1,
        },
        lastActiveDate: new Date(),
      },
    });

    // Publish to Kafka for async processing
    await publishMessage('orders', {
      type: 'order_created',
      orderId: order.id,
      customerId,
      orderAmount,
      data: order,
    });

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  })
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get list of orders with pagination and filtering
 *     tags: [Orders]
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
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter orders until this date
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum order amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum order amount
 *     responses:
 *       200:
 *         description: List of orders retrieved successfully
 */
router.get(
  '/',
  authenticateToken,
  validateRequest(getOrdersSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const customerId = req.query.customerId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined;
    const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined;
    const sortBy = (req.query.sortBy as string) || 'orderDate';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'desc';

    // Check cache first
    const cacheKey = `orders:${page}:${limit}:${customerId}:${startDate}:${endDate}:${minAmount}:${maxAmount}:${sortBy}:${sortOrder}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    // Build where clause
    const where: any = {};

    if (customerId) {
      where.customerId = customerId;
    }

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate);
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.orderAmount = {};
      if (minAmount !== undefined) {
        where.orderAmount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.orderAmount.lte = maxAmount;
      }
    }

    // Build orderBy clause
    const orderBy: any = { [sortBy]: sortOrder };

    // Get total count
    const total = await prisma.order.count({ where });

    // Get orders with pagination
    const orders = await prisma.order.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const result = {
      orders,
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
 * /api/orders/stats:
 *   get:
 *     summary: Get order statistics
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 */
router.get(
  '/stats',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res) => {
    const { period = 'month' } = req.query;

    // Check cache first
    const cacheKey = `orders:stats:${period}`;
    const cached = await getCache(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get statistics
    const [
      totalOrders,
      totalRevenue,
      averageOrderValue,
      topCustomers,
    ] = await Promise.all([
      prisma.order.count({
        where: { orderDate: { gte: startDate } },
      }),
      prisma.order.aggregate({
        where: { orderDate: { gte: startDate } },
        _sum: { orderAmount: true },
      }),
      prisma.order.aggregate({
        where: { orderDate: { gte: startDate } },
        _avg: { orderAmount: true },
      }),
      prisma.order.groupBy({
        by: ['customerId'],
        where: { orderDate: { gte: startDate } },
        _sum: { orderAmount: true },
        _count: { id: true },
        orderBy: { _sum: { orderAmount: 'desc' } },
        take: 5,
      }),
    ]);

    // Get customer details for top customers
    const topCustomerIds = topCustomers.map(c => c.customerId);
    const customerDetails = await prisma.customer.findMany({
      where: { id: { in: topCustomerIds } },
      select: { id: true, name: true, email: true },
    });

    const topCustomersWithDetails = topCustomers.map(customer => {
      const details = customerDetails.find(c => c.id === customer.customerId);
      return {
        ...customer,
        customer: details,
      };
    });

    const stats = {
      period,
      totalOrders,
      totalRevenue: totalRevenue._sum.orderAmount || 0,
      averageOrderValue: averageOrderValue._avg.orderAmount || 0,
      topCustomers: topCustomersWithDetails,
    };

    // Cache the result
    await setCache(cacheKey, stats, 600); // 10 minutes cache

    res.json(stats);
  })
);

export default router;

