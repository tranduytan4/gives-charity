import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type { ApiResponse } from '@/shared/types';
import type {
  AnnouncementReplyResponse,
  CreateReplyPayload,
  ReplyContextDirection,
  ReplyContextResponse,
  ReplyPageResponse,
  ReplySort,
  UpdateReplyPayload,
} from '../types';

export const likeAnnouncement = async (
  campaignId: number,
  announcementId: number,
): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(
    API_ENDPOINTS.ANNOUNCEMENTS.LIKE(campaignId, announcementId),
  );
};

export const unlikeAnnouncement = async (
  campaignId: number,
  announcementId: number,
): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(
    API_ENDPOINTS.ANNOUNCEMENTS.LIKE(campaignId, announcementId),
  );
};

export const getReplies = async (
  campaignId: number,
  announcementId: number,
  cursor?: number,
  limit = 15,
  sort: ReplySort = 'desc',
): Promise<ReplyPageResponse<AnnouncementReplyResponse>> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    sort,
  });
  if (cursor !== undefined) {
    params.append('cursor', cursor.toString());
  }

  const response = await apiClient.get<ApiResponse<ReplyPageResponse<AnnouncementReplyResponse>>>(
    `${API_ENDPOINTS.ANNOUNCEMENTS.REPLIES(campaignId, announcementId)}?${params.toString()}`,
  );
  return response.data.result;
};

export const createReply = async (
  campaignId: number,
  announcementId: number,
  payload: CreateReplyPayload,
): Promise<AnnouncementReplyResponse> => {
  const response = await apiClient.post<ApiResponse<AnnouncementReplyResponse>>(
    API_ENDPOINTS.ANNOUNCEMENTS.REPLIES(campaignId, announcementId),
    payload,
  );
  return response.data.result;
};

export const getReplyContext = async (
  campaignId: number,
  announcementId: number,
  replyId: number,
  limit = 15,
  sort: ReplySort = 'desc',
  cursor?: number,
  direction?: ReplyContextDirection,
): Promise<ReplyContextResponse> => {
  const params = new URLSearchParams({ limit: limit.toString(), sort });
  if (cursor !== undefined) params.append('cursor', cursor.toString());
  if (direction) params.append('direction', direction);

  const response = await apiClient.get<ApiResponse<ReplyContextResponse>>(
    `${API_ENDPOINTS.ANNOUNCEMENTS.REPLY_DETAIL(campaignId, announcementId, replyId)}/context?${params.toString()}`,
  );
  return response.data.result;
};

export const updateReply = async (
  campaignId: number,
  announcementId: number,
  replyId: number,
  payload: UpdateReplyPayload,
): Promise<AnnouncementReplyResponse> => {
  const response = await apiClient.put<ApiResponse<AnnouncementReplyResponse>>(
    API_ENDPOINTS.ANNOUNCEMENTS.REPLY_DETAIL(campaignId, announcementId, replyId),
    payload,
  );
  return response.data.result;
};

export const deleteReply = async (
  campaignId: number,
  announcementId: number,
  replyId: number,
): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(
    API_ENDPOINTS.ANNOUNCEMENTS.REPLY_DETAIL(campaignId, announcementId, replyId),
  );
};

export const announcementEngagementApi = {
  likeAnnouncement,
  unlikeAnnouncement,
  getReplies,
  getReplyContext,
  createReply,
  updateReply,
  deleteReply,
};
