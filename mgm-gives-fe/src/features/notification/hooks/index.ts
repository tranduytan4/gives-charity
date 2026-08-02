import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '../api';

export const useNotificationsQuery = (
  page: number,
  size: number,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ['notifications', page, size],
    queryFn: () => getNotifications(page, size),
    retry: false,
    staleTime: 30_000,
    ...options,
  });
};

export const useInfiniteNotificationsQuery = (size: number, options?: { enabled?: boolean }) => {
  return useInfiniteQuery({
    queryKey: ['notifications', 'infinite', size],
    queryFn: ({ pageParam = 0 }) => getNotifications(pageParam as number, size),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      return lastPage.pageable.pageNumber + 1;
    },
    retry: false,
    staleTime: 30_000,
    ...options,
  });
};

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useDeleteNotificationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUnreadNotificationsCountQuery = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    staleTime: 30_000,
    ...options,
  });
};
