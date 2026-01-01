import { Request, Response } from 'express';
import type { ApiResponse } from '@ics/shared';

export const notFoundHandler = (_req: Request, res: Response<ApiResponse>) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: '请求的资源不存在',
    },
  });
};
