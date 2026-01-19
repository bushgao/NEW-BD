/**
 * 订阅管理服务
 * 处理套餐到期、锁定、提醒等功能
 */

import { prisma } from '../lib/prisma';
import { PlanType } from '@prisma/client';

// 套餐有效期配置（天数）
const PLAN_DURATION: Record<PlanType, number> = {
    FREE: 30,      // 免费版 30 天试用
    PERSONAL: 30,  // 个人版 30 天试用（付费后 365 天）
    PROFESSIONAL: 365,
    ENTERPRISE: 365,
};

// 提醒规则配置
const REMINDER_CONFIG = {
    // 试用版（FREE/PERSONAL 试用期）
    trial: {
        reminderDays: 5,  // 剩余 5 天时开始提醒
    },
    // 付费版
    paid: {
        firstReminderDays: 30,  // 剩余 30 天首次提醒
        intervalDays: 5,        // 之后每 5 天提醒一次
        dailyReminderDays: 3,   // 最后 3 天每天提醒
    },
};

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
export async function initializeSubscription(
    brandId: string,
    planType: PlanType,
    isPaid: boolean = false
): Promise<void> {
    const duration = isPaid ? 365 : PLAN_DURATION[planType];
    const planExpiresAt = new Date();
    planExpiresAt.setDate(planExpiresAt.getDate() + duration);

    await prisma.brand.update({
        where: { id: brandId },
        data: {
            planType,
            planStartedAt: new Date(),
            planExpiresAt,
            isPaid,
            isLocked: false,
            lockedAt: null,
            lastReminderAt: null,
        },
    });
}

/**
 * 获取品牌订阅状态
 */
export async function getSubscriptionStatus(brandId: string): Promise<SubscriptionStatus> {
    const brand = await prisma.brand.findUnique({
        where: { id: brandId },
        select: {
            id: true,
            planType: true,
            isPaid: true,
            isLocked: true,
            planStartedAt: true,
            planExpiresAt: true,
            lastReminderAt: true,
        },
    });

    if (!brand) {
        throw new Error('品牌不存在');
    }

    const daysRemaining = brand.planExpiresAt
        ? Math.ceil((brand.planExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    const { shouldShow, message } = calculateReminder(
        brand.planType,
        brand.isPaid,
        daysRemaining,
        brand.lastReminderAt
    );

    return {
        brandId: brand.id,
        planType: brand.planType,
        isPaid: brand.isPaid,
        isLocked: brand.isLocked,
        planStartedAt: brand.planStartedAt,
        planExpiresAt: brand.planExpiresAt,
        daysRemaining,
        shouldShowReminder: shouldShow,
        reminderMessage: message,
    };
}

/**
 * 计算是否需要显示提醒
 */
function calculateReminder(
    planType: PlanType,
    isPaid: boolean,
    daysRemaining: number | null,
    lastReminderAt: Date | null
): { shouldShow: boolean; message: string | null } {
    if (daysRemaining === null) {
        return { shouldShow: false, message: null };
    }

    // 已过期
    if (daysRemaining <= 0) {
        return {
            shouldShow: true,
            message: '您的套餐已到期，账户已锁定。请续费以恢复使用。',
        };
    }

    // 试用版逻辑（FREE 或未付费的 PERSONAL）
    const isTrial = planType === 'FREE' || (planType === 'PERSONAL' && !isPaid);

    if (isTrial) {
        if (daysRemaining <= REMINDER_CONFIG.trial.reminderDays) {
            return {
                shouldShow: true,
                message: `您的试用期还剩 ${daysRemaining} 天，到期后将无法使用。请升级为付费版。`,
            };
        }
        return { shouldShow: false, message: null };
    }

    // 付费版逻辑
    const { firstReminderDays, intervalDays, dailyReminderDays } = REMINDER_CONFIG.paid;

    // 最后 3 天每天提醒
    if (daysRemaining <= dailyReminderDays) {
        return {
            shouldShow: true,
            message: `您的套餐还剩 ${daysRemaining} 天到期，请尽快续费！`,
        };
    }

    // 30 天内，每 5 天提醒一次
    if (daysRemaining <= firstReminderDays) {
        // 检查是否需要提醒（距离上次提醒超过 5 天）
        if (!lastReminderAt) {
            return {
                shouldShow: true,
                message: `您的套餐将在 ${daysRemaining} 天后到期，请及时续费。`,
            };
        }

        const daysSinceLastReminder = Math.floor(
            (Date.now() - lastReminderAt.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastReminder >= intervalDays) {
            return {
                shouldShow: true,
                message: `您的套餐将在 ${daysRemaining} 天后到期，请及时续费。`,
            };
        }
    }

    return { shouldShow: false, message: null };
}

/**
 * 标记提醒已发送
 */
export async function markReminderSent(brandId: string): Promise<void> {
    await prisma.brand.update({
        where: { id: brandId },
        data: { lastReminderAt: new Date() },
    });
}

/**
 * 检查并锁定所有已到期的品牌
 * 可用于定时任务
 */
export async function checkAndLockExpiredBrands(): Promise<number> {
    const result = await prisma.brand.updateMany({
        where: {
            planExpiresAt: { lte: new Date() },
            isLocked: false,
        },
        data: {
            isLocked: true,
            lockedAt: new Date(),
        },
    });

    return result.count;
}

/**
 * 解锁品牌（续费后调用）
 */
export async function unlockBrand(brandId: string): Promise<void> {
    await prisma.brand.update({
        where: { id: brandId },
        data: {
            isLocked: false,
            lockedAt: null,
        },
    });
}

/**
 * 续费套餐
 */
export async function renewSubscription(
    brandId: string,
    planType: PlanType,
    durationDays: number = 365
): Promise<void> {
    const brand = await prisma.brand.findUnique({
        where: { id: brandId },
    });

    if (!brand) {
        throw new Error('品牌不存在');
    }

    // 计算新的到期时间
    let newExpiresAt: Date;
    if (brand.planExpiresAt && brand.planExpiresAt > new Date()) {
        // 如果还没过期，在原有基础上延长
        newExpiresAt = new Date(brand.planExpiresAt);
    } else {
        // 如果已过期，从今天开始计算
        newExpiresAt = new Date();
    }
    newExpiresAt.setDate(newExpiresAt.getDate() + durationDays);

    await prisma.brand.update({
        where: { id: brandId },
        data: {
            planType,
            planExpiresAt: newExpiresAt,
            isPaid: true,
            isLocked: false,
            lockedAt: null,
            lastReminderAt: null,
        },
    });
}

/**
 * 获取用户的品牌订阅状态（用于前端）
 */
export async function getUserSubscriptionStatus(userId: string): Promise<SubscriptionStatus | null> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { brand: true },
    });

    if (!user || !user.brand) {
        return null;
    }

    return getSubscriptionStatus(user.brand.id);
}
