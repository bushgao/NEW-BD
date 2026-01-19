"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.createQuotaExceededError = exports.createConflictError = exports.createNotFoundError = exports.createForbiddenError = exports.createUnauthorizedError = exports.createBadRequestError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
// Common error factory functions
const createBadRequestError = (message, details) => new AppError(message, 400, 'BAD_REQUEST', details);
exports.createBadRequestError = createBadRequestError;
const createUnauthorizedError = (message = '未授权访问') => new AppError(message, 401, 'UNAUTHORIZED');
exports.createUnauthorizedError = createUnauthorizedError;
const createForbiddenError = (message = '权限不足') => new AppError(message, 403, 'FORBIDDEN');
exports.createForbiddenError = createForbiddenError;
const createNotFoundError = (message = '资源不存在') => new AppError(message, 404, 'NOT_FOUND');
exports.createNotFoundError = createNotFoundError;
const createConflictError = (message, details) => new AppError(message, 409, 'CONFLICT', details);
exports.createConflictError = createConflictError;
const createQuotaExceededError = (message = '已达到套餐上限') => new AppError(message, 403, 'QUOTA_EXCEEDED');
exports.createQuotaExceededError = createQuotaExceededError;
const errorHandler = (err, _req, res, _next) => {
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
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map