import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { createError } from './errorHandler';

export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        next(createError(`Validation error: ${errorMessage}`, 400));
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'ID is required'),
  }),
});

