import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import csvParser from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
// We'll use the Kafka service later when we implement the pub-sub architecture
// import { publishMessage } from '../services/kafkaService';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept only csv files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(createError('Only CSV files are allowed', 400) as any);
    }
  }
});

// Customer CSV schema validation
const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

// Order CSV schema validation
const orderSchema = z.object({
  customerEmail: z.string().email('Invalid customer email format'),
  amount: z.string().transform(val => parseFloat(val)),
  status: z.string().optional(),
  productName: z.string().optional(),
  quantity: z.string().transform(val => parseInt(val)),
  orderDate: z.string().transform(val => new Date(val)).optional(),
});

/**
 * @swagger
 * /api/imports/customers:
 *   post:
 *     summary: Import customers from CSV file
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with customer data
 *     responses:
 *       200:
 *         description: Customers imported successfully
 *       400:
 *         description: Invalid file or data format
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/customers', 
  authenticateToken,
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const customers: any[] = [];
    const errors: any[] = [];
    let lineNumber = 0;
    
    // Create a readable stream from the buffer
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    // Process the CSV file
    await new Promise<void>((resolve, reject) => {
      bufferStream
        .pipe(csvParser())
        .on('data', (row) => {
          lineNumber++;
          try {
            // Validate data against schema
            const customer = customerSchema.parse(row);
            customers.push(customer);
          } catch (error) {
            errors.push({ line: lineNumber, error: (error as Error).message });
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation errors in CSV file', 
        errors 
      });
    }

    // Direct database processing without Kafka
    // In the future, we'll implement Kafka for asynchronous processing
    const result = await prisma.$transaction(async (tx) => {
      const createdCustomers = [];
      for (const customer of customers) {
        // Check if customer already exists by email
        let existingCustomer;
        if (customer.email) {
          existingCustomer = await tx.customer.findUnique({
            where: { email: customer.email },
          });
        }

        if (existingCustomer) {
          // Update existing customer
          const updated = await tx.customer.update({
            where: { id: existingCustomer.id },
            data: customer,
          });
          createdCustomers.push({ ...updated, status: 'updated' });
        } else {
          // Create new customer
          const created = await tx.customer.create({
            data: {
              ...customer,
              userId: req.user.id,
            },
          });
          createdCustomers.push({ ...created, status: 'created' });
        }
      }
      return createdCustomers;
    });

    res.json({
      message: `Successfully processed ${result.length} customers`,
      created: result.filter(c => c.status === 'created').length,
      updated: result.filter(c => c.status === 'updated').length,
      customers: result,
    });
  })
);

/**
 * @swagger
 * /api/imports/orders:
 *   post:
 *     summary: Import orders from CSV file
 *     tags: [Imports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV file with order data
 *     responses:
 *       200:
 *         description: Orders imported successfully
 *       400:
 *         description: Invalid file or data format
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/orders', 
  authenticateToken,
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res) => {
    if (!req.file) {
      throw createError('No file uploaded', 400);
    }

    const orders: any[] = [];
    const errors: any[] = [];
    let lineNumber = 0;
    
    // Create a readable stream from the buffer
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    // Process the CSV file
    await new Promise<void>((resolve, reject) => {
      bufferStream
        .pipe(csvParser())
        .on('data', (row) => {
          lineNumber++;
          try {
            // Validate data against schema
            const order = orderSchema.parse(row);
            orders.push(order);
          } catch (error) {
            errors.push({ line: lineNumber, error: (error as Error).message });
          }
        })
        .on('end', () => {
          resolve();
        })
        .on('error', (error) => {
          reject(error);
        });
    });

    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation errors in CSV file', 
        errors 
      });
    }

    // Direct database processing without Kafka
    // In the future, we'll implement Kafka for asynchronous processing
    const result = await prisma.$transaction(async (tx) => {
      const createdOrders = [];
      for (const order of orders) {
        // Find the customer by email
        const customer = await tx.customer.findUnique({
          where: { email: order.customerEmail },
        });

        if (!customer) {
          errors.push({ 
            error: `Customer with email ${order.customerEmail} not found`,
            data: order 
          });
          continue;
        }

        // Create the order
        const { customerEmail, ...orderData } = order;
        const created = await tx.order.create({
          data: {
            ...orderData,
            customer: { connect: { id: customer.id } },
            userId: req.user.id,
          },
        });
        createdOrders.push(created);
      }
      return createdOrders;
    });

    if (errors.length > 0) {
      return res.status(207).json({
        message: `Processed with errors. Created ${result.length} orders. ${errors.length} orders failed.`,
        created: result.length,
        errors,
        orders: result,
      });
    }

    res.json({
      message: `Successfully processed ${result.length} orders`,
      created: result.length,
      orders: result,
    });
  })
);

export default router;