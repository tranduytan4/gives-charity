import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createAnnouncement,
  deleteAnnouncement,
  type GetAnnouncementsParams,
  getAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../api';
import type {
  Announcement,
  AnnouncementPage,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from '../types';

export const announcementQueryKeys = {
  all: ['announcements'] as const,
  lists: (campaignId: number) => ['announcements', campaignId, 'list'] as const,
  list: (campaignId: number, params?: GetAnnouncementsParams) =>
    ['announcements', campaignId, 'list', params] as const,
  detail: (campaignId: number, announcementId: number) =>
    ['announcements', campaignId, 'detail', announcementId] as const,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return fallback;
};

export const useAnnouncementsQuery = (
  campaignId: number,
  params?: GetAnnouncementsParams,
  enabled = true,
) => {
  return useQuery<AnnouncementPage<Announcement>, Error>({
    queryKey: announcementQueryKeys.list(campaignId, params),
    queryFn: () => getAnnouncements(campaignId, params),
    enabled: enabled && !!campaignId,
    placeholderData: keepPreviousData,
    refetchInterval: 60000,
  });
};

export const useAnnouncementQuery = (
  campaignId: number,
  announcementId: number,
  enabled = true,
) => {
  return useQuery<Announcement, Error>({
    queryKey: announcementQueryKeys.detail(campaignId, announcementId),
    queryFn: () => getAnnouncement(campaignId, announcementId),
    enabled: enabled && !!campaignId && !!announcementId,
    refetchInterval: 60000,
  });
};

export const useCreateAnnouncementMutation = (campaignId: number) => {
  const queryClient = useQueryClient();
  return useMutation<Announcement, Error, CreateAnnouncementRequest>({
    mutationFn: (payload) => createAnnouncement(campaignId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all });
      toast.success('Announcement broadcast successfully.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to create announcement.'));
    },
  });
};

export const useUpdateAnnouncementMutation = (campaignId: number) => {
  const queryClient = useQueryClient();
  return useMutation<
    Announcement,
    Error,
    { announcementId: number; payload: UpdateAnnouncementRequest }
  >({
    mutationFn: ({ announcementId, payload }) =>
      updateAnnouncement(campaignId, announcementId, payload),
    onSuccess: (announcement) => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all });
      queryClient.setQueryData(
        announcementQueryKeys.detail(campaignId, announcement.id),
        announcement,
      );
      toast.success('Announcement updated.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to update announcement.'));
    },
  });
};

export const useDeleteAnnouncementMutation = (campaignId: number) => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (announcementId) => deleteAnnouncement(campaignId, announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: announcementQueryKeys.all });
      toast.success('Announcement deleted.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Failed to delete announcement.'));
    },
  });
};
