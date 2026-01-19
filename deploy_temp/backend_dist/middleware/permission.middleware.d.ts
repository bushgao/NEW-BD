/**
 * 权限验证中间件
 */
import { Request, Response, NextFunction } from 'express';
/**
 * 检查用户是否有指定权限
 *
 * @param permission - 权限字符串，格式：category.key（如 operations.manageSamples）
 * @returns Express 中间件
 *
 * @example
 * router.post('/samples', authenticate, checkPermission('operations.manageSamples'), createSample);
 */
export declare function checkPermission(permission: string): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * 根据权限过滤数据
 *
 * 用于限制商务只能查看自己的数据
 *
 * @param permission - 权限字符串
 * @returns Express 中间件
 *
 * @example
 * router.get('/influencers', authenticate, filterByPermission('dataVisibility.viewOthersInfluencers'), getInfluencers);
 */
export declare function filterByPermission(permission: string): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
/**
 * 检查是否可以访问指定商务的数据
 *
 * 用于商务详情、商务绩效等需要访问特定商务数据的场景
 *
 * @returns Express 中间件
 */
export declare function checkStaffDataAccess(): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=permission.middleware.d.ts.map