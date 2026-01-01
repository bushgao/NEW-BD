import prisma from '../lib/prisma';
import { createNotFoundError } from '../middleware/errorHandler';

// 通知类型枚举
export enum NotificationType {
  DEADLINE_APPROACHING = 'DEADLINE_APPROACHING', // 截止时间即将到达
  DEADLINE_OVERDUE = 'DEADLINE_OVERDUE', // 合作超期
  SAMPLE_NOT_RECEIVED = 'SAMPLE_NOT_RECEIVED', // 样品未签收
  RESULT_NOT_RECORDED = 'RESULT_NOT_RECORDED', // 结果未录入
}

// 通知类型标题映射
export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  [NotificationType.DEADLINE_APPROACHING]: '合作即将到期',
  [NotificationType.DEADLINE_OVERDUE]: '合作已超期',
  [NotificationType.SAMPLE_NOT_RECEIVED]: '样品未签收提醒',
  [NotificationType.RESULT_NOT_RECORDED]: '结果待录入提醒',
};

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  relatedId?: string;
}

export interface NotificationFilter {
  isRead?: boolean;
  type?: string;
}

// ==================== 通知 CRUD ====================

/**
 * 创建通知
 */
export async function createNotification(data: CreateNotificationInput) {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      content: data.content,
      relatedId: data.relatedId,
    },
  });

  return notification;
}

/**
 * 批量创建通知
 */
export async function createNotifications(notifications: CreateNotificationInput[]) {
  const result = await prisma.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      type: n.type,
      title: n.title,
      content: n.content,
      relatedId: n.relatedId,
    })),
  });

  return result.count;
}

/**
 * 获取用户通知列表
 */
export async function listNotifications(
  userId: string,
  filter: NotificationFilter,
  pagination: { page: number; pageSize: number }
) {
  const { isRead, type } = filter;
  const { page, pageSize } = pagination;

  const where: any = { userId };

  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  if (type) {
    where.type = type;
  }

  const total = await prisma.notification.count({ where });

  const data = await prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}


/**
 * 获取用户未读通知数量
 */
export async function getUnreadCount(userId: string) {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  return count;
}

/**
 * 标记通知为已读
 */
export async function markAsRead(id: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw createNotFoundError('通知不存在');
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return updated;
}

/**
 * 标记所有通知为已读
 */
export async function markAllAsRead(userId: string) {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  return result.count;
}

/**
 * 删除通知
 */
export async function deleteNotification(id: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    throw createNotFoundError('通知不存在');
  }

  await prisma.notification.delete({ where: { id } });
}

/**
 * 清空已读通知
 */
export async function clearReadNotifications(userId: string) {
  const result = await prisma.notification.deleteMany({
    where: { userId, isRead: true },
  });

  return result.count;
}

// ==================== 定时任务检查逻辑 ====================

/**
 * 检查即将到期的合作（提前1天）
 * 返回需要发送通知的合作列表
 */
export async function checkDeadlineApproaching() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 查找截止时间在未来24小时内的合作
  const collaborations = await prisma.collaboration.findMany({
    where: {
      deadline: {
        gt: now,
        lte: tomorrow,
      },
      isOverdue: false,
      stage: {
        notIn: ['PUBLISHED', 'REVIEWED'],
      },
    },
    include: {
      influencer: true,
      businessStaff: true,
      factory: {
        include: {
          owner: true,
        },
      },
    },
  });

  const notifications: CreateNotificationInput[] = [];

  for (const collab of collaborations) {
    // 检查是否已经发送过即将到期通知
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: collab.businessStaffId,
        type: NotificationType.DEADLINE_APPROACHING,
        relatedId: collab.id,
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 24小时内
        },
      },
    });

    if (!existingNotification) {
      notifications.push({
        userId: collab.businessStaffId,
        type: NotificationType.DEADLINE_APPROACHING,
        title: NOTIFICATION_TITLES[NotificationType.DEADLINE_APPROACHING],
        content: `与达人「${collab.influencer.nickname}」的合作将于明天到期，请及时跟进`,
        relatedId: collab.id,
      });
    }
  }

  if (notifications.length > 0) {
    await createNotifications(notifications);
  }

  return notifications.length;
}


/**
 * 检查超期合作
 * 向负责商务和工厂老板发送超期提醒
 */
export async function checkOverdueCollaborations() {
  const now = new Date();

  // 查找已超期但未标记的合作
  const collaborations = await prisma.collaboration.findMany({
    where: {
      deadline: { lt: now },
      isOverdue: false,
      stage: {
        notIn: ['PUBLISHED', 'REVIEWED'],
      },
    },
    include: {
      influencer: true,
      businessStaff: true,
      factory: {
        include: {
          owner: true,
        },
      },
    },
  });

  const notifications: CreateNotificationInput[] = [];

  for (const collab of collaborations) {
    // 更新超期状态
    await prisma.collaboration.update({
      where: { id: collab.id },
      data: { isOverdue: true },
    });

    // 向商务人员发送通知
    notifications.push({
      userId: collab.businessStaffId,
      type: NotificationType.DEADLINE_OVERDUE,
      title: NOTIFICATION_TITLES[NotificationType.DEADLINE_OVERDUE],
      content: `与达人「${collab.influencer.nickname}」的合作已超期，请尽快处理`,
      relatedId: collab.id,
    });

    // 向工厂老板发送通知
    if (collab.factory.owner) {
      notifications.push({
        userId: collab.factory.ownerId,
        type: NotificationType.DEADLINE_OVERDUE,
        title: NOTIFICATION_TITLES[NotificationType.DEADLINE_OVERDUE],
        content: `商务「${collab.businessStaff.name}」负责的与达人「${collab.influencer.nickname}」的合作已超期`,
        relatedId: collab.id,
      });
    }
  }

  if (notifications.length > 0) {
    await createNotifications(notifications);
  }

  return notifications.length;
}

/**
 * 检查样品寄出超过7天未签收
 */
export async function checkPendingSampleReceipts() {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 查找寄出超过7天未签收的样品
  const dispatches = await prisma.sampleDispatch.findMany({
    where: {
      dispatchedAt: { lt: sevenDaysAgo },
      receivedStatus: 'PENDING',
    },
    include: {
      sample: true,
      collaboration: {
        include: {
          influencer: true,
        },
      },
      businessStaff: true,
    },
  });

  const notifications: CreateNotificationInput[] = [];

  for (const dispatch of dispatches) {
    // 检查是否已经发送过未签收通知（7天内）
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: dispatch.businessStaffId,
        type: NotificationType.SAMPLE_NOT_RECEIVED,
        relatedId: dispatch.id,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    if (!existingNotification) {
      notifications.push({
        userId: dispatch.businessStaffId,
        type: NotificationType.SAMPLE_NOT_RECEIVED,
        title: NOTIFICATION_TITLES[NotificationType.SAMPLE_NOT_RECEIVED],
        content: `寄给达人「${dispatch.collaboration.influencer.nickname}」的样品「${dispatch.sample.name}」已超过7天未签收，请确认物流状态`,
        relatedId: dispatch.id,
      });
    }
  }

  if (notifications.length > 0) {
    await createNotifications(notifications);
  }

  return notifications.length;
}


/**
 * 检查已上车但超过14天未录入结果
 */
export async function checkPendingResults() {
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 查找已上车但超过14天未录入结果的寄样记录
  const dispatches = await prisma.sampleDispatch.findMany({
    where: {
      onboardStatus: 'ONBOARD',
      updatedAt: { lt: fourteenDaysAgo },
      collaboration: {
        result: null,
        stage: {
          notIn: ['REVIEWED'],
        },
      },
    },
    include: {
      sample: true,
      collaboration: {
        include: {
          influencer: true,
          result: true,
        },
      },
      businessStaff: true,
    },
  });

  const notifications: CreateNotificationInput[] = [];
  const processedCollaborations = new Set<string>();

  for (const dispatch of dispatches) {
    // 避免同一个合作发送多次通知
    if (processedCollaborations.has(dispatch.collaborationId)) {
      continue;
    }
    processedCollaborations.add(dispatch.collaborationId);

    // 检查是否已经发送过结果待录入通知（14天内）
    const existingNotification = await prisma.notification.findFirst({
      where: {
        userId: dispatch.businessStaffId,
        type: NotificationType.RESULT_NOT_RECORDED,
        relatedId: dispatch.collaborationId,
        createdAt: {
          gte: fourteenDaysAgo,
        },
      },
    });

    if (!existingNotification) {
      notifications.push({
        userId: dispatch.businessStaffId,
        type: NotificationType.RESULT_NOT_RECORDED,
        title: NOTIFICATION_TITLES[NotificationType.RESULT_NOT_RECORDED],
        content: `达人「${dispatch.collaboration.influencer.nickname}」已上车超过14天，请及时录入合作结果`,
        relatedId: dispatch.collaborationId,
      });
    }
  }

  if (notifications.length > 0) {
    await createNotifications(notifications);
  }

  return notifications.length;
}

/**
 * 执行所有定时检查任务
 */
export async function runScheduledChecks() {
  const results = {
    deadlineApproaching: 0,
    overdue: 0,
    pendingReceipts: 0,
    pendingResults: 0,
  };

  try {
    results.deadlineApproaching = await checkDeadlineApproaching();
    results.overdue = await checkOverdueCollaborations();
    results.pendingReceipts = await checkPendingSampleReceipts();
    results.pendingResults = await checkPendingResults();
  } catch (error) {
    console.error('定时检查任务执行失败:', error);
    throw error;
  }

  return results;
}
