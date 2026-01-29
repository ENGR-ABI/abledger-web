import { apiClient } from './client';
import type { Notification, NotificationListResponse, UnreadCountResponse } from './types';

export const notificationsApi = {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(
    limit: number = 50,
    offset: number = 0,
    unreadOnly: boolean = false
  ): Promise<NotificationListResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      ...(unreadOnly && { unreadOnly: 'true' }),
    });
    return apiClient.get<NotificationListResponse>(`/notifications?${params.toString()}`);
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.count;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<Notification> {
    return apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<{ count: number }> {
    return apiClient.patch<{ count: number }>('/notifications/mark-all-read');
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return apiClient.delete(`/notifications/${notificationId}`);
  },
};

