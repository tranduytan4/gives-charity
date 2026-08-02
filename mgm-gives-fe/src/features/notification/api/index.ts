import apiClient from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type { PaginatedNotifications } from '../types';

interface ApiResponse<T> {
  result: T;
  message: string;
  success: boolean;
}

export const getNotifications = async (page: number, size: number) => {
  const { data } = await apiClient.get<ApiResponse<PaginatedNotifications>>(
    API_ENDPOINTS.NOTIFICATIONS.BASE,
    {
      params: { page, size },
    },
  );
  return data.result;
};

export const markAsRead = async (id: number) => {
  const { data } = await apiClient.put<ApiResponse<void>>(API_ENDPOINTS.NOTIFICATIONS.READ(id));
  return data.result;
};

export const markAllAsRead = async () => {
  const { data } = await apiClient.put<ApiResponse<void>>(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
  return data.result;
};

export const deleteNotification = async (id: number) => {
  const { data } = await apiClient.delete<ApiResponse<void>>(
    API_ENDPOINTS.NOTIFICATIONS.DELETE(id),
  );
  return data.result;
};

export const getUnreadCount = async (): Promise<number> => {
  const { data } = await apiClient.get<ApiResponse<number>>(
    API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT,
  );
  return data.result;
};
