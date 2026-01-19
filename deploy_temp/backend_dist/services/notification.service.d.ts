export declare enum NotificationType {
    DEADLINE_APPROACHING = "DEADLINE_APPROACHING",// 截止时间即将到达
    DEADLINE_OVERDUE = "DEADLINE_OVERDUE",// 合作超期
    SAMPLE_NOT_RECEIVED = "SAMPLE_NOT_RECEIVED",// 样品未签收
    RESULT_NOT_RECORDED = "RESULT_NOT_RECORDED"
}
export declare const NOTIFICATION_TITLES: Record<NotificationType, string>;
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
/**
 * 创建通知
 */
export declare function createNotification(data: CreateNotificationInput): Promise<{
    id: string;
    type: string;
    title: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
    relatedId: string | null;
    userId: string;
}>;
/**
 * 批量创建通知
 */
export declare function createNotifications(notifications: CreateNotificationInput[]): Promise<number>;
/**
 * 获取用户通知列表
 */
export declare function listNotifications(userId: string, filter: NotificationFilter, pagination: {
    page: number;
    pageSize: number;
}): Promise<{
    data: {
        id: string;
        type: string;
        title: string;
        content: string;
        createdAt: Date;
        isRead: boolean;
        relatedId: string | null;
        userId: string;
    }[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}>;
/**
 * 获取用户未读通知数量
 */
export declare function getUnreadCount(userId: string): Promise<number>;
/**
 * 标记通知为已读
 */
export declare function markAsRead(id: string, userId: string): Promise<{
    id: string;
    type: string;
    title: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
    relatedId: string | null;
    userId: string;
}>;
/**
 * 标记所有通知为已读
 */
export declare function markAllAsRead(userId: string): Promise<number>;
/**
 * 删除通知
 */
export declare function deleteNotification(id: string, userId: string): Promise<void>;
/**
 * 清空已读通知
 */
export declare function clearReadNotifications(userId: string): Promise<number>;
/**
 * 检查即将到期的合作（提前1天）
 * 返回需要发送通知的合作列表
 */
export declare function checkDeadlineApproaching(): Promise<number>;
/**
 * 检查超期合作
 * 向负责商务和工厂老板发送超期提醒
 */
export declare function checkOverdueCollaborations(): Promise<number>;
/**
 * 检查样品寄出超过7天未签收
 */
export declare function checkPendingSampleReceipts(): Promise<number>;
/**
 * 检查已上车但超过14天未录入结果
 */
export declare function checkPendingResults(): Promise<number>;
/**
 * 执行所有定时检查任务
 */
export declare function runScheduledChecks(): Promise<{
    deadlineApproaching: number;
    overdue: number;
    pendingReceipts: number;
    pendingResults: number;
}>;
//# sourceMappingURL=notification.service.d.ts.map