import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '@ics/shared';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: unknown;
    constructor(message: string, statusCode: number, code: string, details?: unknown);
}
export declare const createBadRequestError: (message: string, details?: unknown) => AppError;
export declare const createUnauthorizedError: (message?: string) => AppError;
export declare const createForbiddenError: (message?: string) => AppError;
export declare const createNotFoundError: (message?: string) => AppError;
export declare const createConflictError: (message: string, details?: unknown) => AppError;
export declare const createQuotaExceededError: (message?: string) => AppError;
export declare const errorHandler: (err: Error | AppError, _req: Request, res: Response<ApiResponse>, _next: NextFunction) => Response<ApiResponse<unknown>, Record<string, any>>;
//# sourceMappingURL=errorHandler.d.ts.map