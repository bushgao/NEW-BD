import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@ics/shared';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, statusCode: number, code: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory functions
export const createBadRequestError = (message: string, details?: unknown) =>
  new AppError(message, 400, 'BAD_REQUEST', details);

export const createUnauthorizedError = (message: string = '未授权访问') =>
  new AppError(message, 401, 'UNAUTHORIZED');

export const createForbiddenError = (message: string = '权限不足') =>
  new AppError(message, 403, 'FORBIDDEN');

export const createNotFoundError = (message: string = '资源不存在') =>
  new AppError(message, 404, 'NOT_FOUND');

export const createConflictError = (message: string, details?: unknown) =>
  new AppError(message, 409, 'CONFLICT', details);

export const createQuotaExceededError = (message: string = '已达到套餐上限') =>
  new AppError(message, 403, 'QUOTA_EXCEEDED');

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: '数据库操作错误',
      },
    });
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
      },
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    },
  });
};
