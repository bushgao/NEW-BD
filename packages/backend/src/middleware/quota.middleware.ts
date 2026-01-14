import { Request, Response, NextFunction } from 'express';
import { validateQuota } from '../services/platform.service';

/**
 * Middleware factory to check quota before creating resources
 * @param type - The type of quota to check ('staff' or 'influencer')
 */
export function checkQuota(type: 'staff' | 'influencer') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get brandId from user context or request body
      const brandId = req.user?.brandId || req.body.brandId;

      if (!brandId) {
        // If no brandId, skip quota check (will be handled by other validation)
        return next();
      }

      // Platform admins bypass quota checks
      if (req.user?.role === 'PLATFORM_ADMIN') {
        return next();
      }

      await validateQuota(brandId, type);
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check staff quota
 */
export const checkStaffQuota = checkQuota('staff');

/**
 * Middleware to check influencer quota
 */
export const checkInfluencerQuota = checkQuota('influencer');
