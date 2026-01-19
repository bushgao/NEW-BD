import { Request, Response, NextFunction } from 'express';
/**
 * Middleware factory to check quota before creating resources
 * @param type - The type of quota to check ('staff' or 'influencer')
 */
export declare function checkQuota(type: 'staff' | 'influencer'): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check staff quota
 */
export declare const checkStaffQuota: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * Middleware to check influencer quota
 */
export declare const checkInfluencerQuota: (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=quota.middleware.d.ts.map