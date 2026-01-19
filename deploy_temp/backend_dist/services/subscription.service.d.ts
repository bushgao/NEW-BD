/**
 * 订阅管理服务
 * 处理套餐到期、锁定、提醒等功能
 */
import { PlanType } from '@prisma/client';
export interface SubscriptionStatus {
    brandId: string;
    planType: PlanType;
    isPaid: boolean;
    isLocked: boolean;
    planStartedAt: Date;
    planExpiresAt: Date | null;
    daysRemaining: number | null;
    shouldShowReminder: boolean;
    reminderMessage: string | null;
}
/**
 * 初始化品牌订阅（设置到期时间）
 */
export declare function initializeSubscription(brandId: string, planType: PlanType, isPaid?: boolean): Promise<void>;
/**
 * 获取品牌订阅状态
 */
export declare function getSubscriptionStatus(brandId: string): Promise<SubscriptionStatus>;
/**
 * 标记提醒已发送
 */
export declare function markReminderSent(brandId: string): Promise<void>;
/**
 * 检查并锁定所有已到期的品牌
 * 可用于定时任务
 */
export declare function checkAndLockExpiredBrands(): Promise<number>;
/**
 * 解锁品牌（续费后调用）
 */
export declare function unlockBrand(brandId: string): Promise<void>;
/**
 * 续费套餐
 */
export declare function renewSubscription(brandId: string, planType: PlanType, durationDays?: number): Promise<void>;
/**
 * 获取用户的品牌订阅状态（用于前端）
 */
export declare function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null>;
//# sourceMappingURL=subscription.service.d.ts.map