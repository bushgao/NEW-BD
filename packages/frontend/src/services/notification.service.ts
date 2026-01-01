import { request } from './api';

// 通知类型
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface NotificationListResponse {
  data: Notification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface NotificationFilter {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
  type?: string;
}

/**
 * 获取通知列表
 */
export async function getNotifications(filter: NotificationFilter = {}) {
  const params: Record<string, string> = {};
  
  if (filter.page) params.page = String(filter.page);
  if (filter.pageSize) params.pageSize = String(filter.pageSize);
  if (filter.isRead !== undefined) params.isRead = String(filter.isRead);
  if (filter.type) params.type = filter.type;

  return request<NotificationListResponse>('get', '/notifications', params);
}

/**
 * 获取未读通知数量
 */
export async function getUnreadCount() {
  return request<{ count: number }>('get', '/notifications/unread-count');
}

/**
 * 标记单个通知为已读
 */
export async function markAsRead(id: string) {
  return request<Notification>('put', `/notifications/${id}/read`);
}

/**
 * 标记所有通知为已读
 */
export async function markAllAsRead() {
  return request<{ count: number; message: string }>('put', '/notifications/read-all');
}

/**
 * 删除单个通知
 */
export async function deleteNotification(id: string) {
  return request<{ message: string }>('delete', `/notifications/${id}`);
}

/**
 * 清空已读通知
 */
export async function clearReadNotifications() {
  return request<{ count: number; message: string }>('delete', '/notifications/clear-read');
}
