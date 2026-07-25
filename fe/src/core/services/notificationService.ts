import { apiGet, apiPost } from '@core/api/client';

export type AppNotification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  linkTab: string;
  isRead: boolean;
  createdAt: string;
};

export const notificationService = {
  list: () => apiGet<AppNotification[]>('/api/v1/notifications'),
  unreadCount: () => apiGet<{ count: number }>('/api/v1/notifications/unread-count'),
  markRead: (id: string) => apiPost<{ ok: boolean }>(`/api/v1/notifications/${id}/read`, {}),
  markAllRead: () => apiPost<{ ok: boolean }>('/api/v1/notifications/read-all', {}),
};
