import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type { ApiResponse } from '@/shared/types';
import type {
  Announcement,
  AnnouncementPage,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from '../types';

export interface GetAnnouncementsParams {
  page?: number;
  size?: number;
  sort?: string;
}

export const getAnnouncements = async (
  campaignId: number,
  params?: GetAnnouncementsParams,
): Promise<AnnouncementPage<Announcement>> => {
  const response = await apiClient.get<ApiResponse<AnnouncementPage<Announcement>>>(
    API_ENDPOINTS.ANNOUNCEMENTS.BASE(campaignId),
    { params },
  );
  return response.data.result;
};

export const getAnnouncement = async (
  campaignId: number,
  announcementId: number,
): Promise<Announcement> => {
  const response = await apiClient.get<ApiResponse<Announcement>>(
    API_ENDPOINTS.ANNOUNCEMENTS.DETAIL(campaignId, announcementId),
  );
  return response.data.result;
};

export const createAnnouncement = async (
  campaignId: number,
  payload: CreateAnnouncementRequest,
): Promise<Announcement> => {
  const response = await apiClient.post<ApiResponse<Announcement>>(
    API_ENDPOINTS.ANNOUNCEMENTS.BASE(campaignId),
    payload,
  );
  return response.data.result;
};

export const updateAnnouncement = async (
  campaignId: number,
  announcementId: number,
  payload: UpdateAnnouncementRequest,
): Promise<Announcement> => {
  const response = await apiClient.put<ApiResponse<Announcement>>(
    API_ENDPOINTS.ANNOUNCEMENTS.DETAIL(campaignId, announcementId),
    payload,
  );
  return response.data.result;
};

export const deleteAnnouncement = async (
  campaignId: number,
  announcementId: number,
): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(
    API_ENDPOINTS.ANNOUNCEMENTS.DETAIL(campaignId, announcementId),
  );
};
