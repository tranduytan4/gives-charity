import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type { ApiResponse } from '@/shared/types';
import { getMediaUrl } from '@/shared/utils/media';
import type {
  CampaignMedia,
  CampaignMediaResponse,
  CampaignMeeting,
  CampaignMeetingActivity,
  CampaignMeetingAttachment,
  CampaignMeetingNotes,
  CampaignMeetingRecipient,
  CampaignMeetingView,
  CampaignPriority,
  CampaignQueryParams,
  CampaignRequest,
  CampaignResponse,
  CampaignStatus,
  CreateCampaignMeetingRequest,
  UnjoinCampaignResponse,
  UpdateCampaignMeetingNotesRequest,
  UpdateCampaignMeetingRequest,
} from '../types';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GetCampaignsParams {
  status?: CampaignStatus;
  priority?: CampaignPriority;
  categoryId?: number;
  userId?: number;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
  isFollowing?: boolean;
}

export const createCampaign = async (payload: CampaignRequest): Promise<CampaignResponse> => {
  const response = await apiClient.post<ApiResponse<CampaignResponse>>(
    API_ENDPOINTS.CAMPAIGN.BASE,
    payload,
  );
  return response.data.result;
};

export const updateCampaign = async (
  id: number,
  payload: CampaignRequest,
): Promise<CampaignResponse> => {
  const response = await apiClient.put<ApiResponse<CampaignResponse>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${id}`,
    payload,
  );
  return response.data.result;
};

export const endCampaign = async (id: number): Promise<CampaignResponse> => {
  const response = await apiClient.put<ApiResponse<CampaignResponse>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${id}/end`,
  );
  return response.data.result;
};

export const deleteCampaign = async (id: number): Promise<void> => {
  const url = `${API_ENDPOINTS.CAMPAIGN.BASE}/${id}`;
  await apiClient.delete<ApiResponse<void>>(url);
};

export const getCampaigns = async (
  params?: CampaignQueryParams,
): Promise<ApiResponse<PageResponse<CampaignResponse>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<CampaignResponse>>>(
    API_ENDPOINTS.CAMPAIGN.BASE,
    { params },
  );
  return response.data;
};

export const getPublicCampaigns = async (
  params?: CampaignQueryParams,
): Promise<ApiResponse<PageResponse<CampaignResponse>>> => {
  const response = await apiClient.get<ApiResponse<PageResponse<CampaignResponse>>>(
    API_ENDPOINTS.PUBLIC_CAMPAIGN.BASE,
    { params },
  );
  return response.data;
};

export const getCampaignById = async (id: number): Promise<CampaignResponse> => {
  const response = await apiClient.get<ApiResponse<CampaignResponse>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${id}`,
  );
  return response.data.result;
};

export const getCampaign = async (id: string | number): Promise<ApiResponse<CampaignResponse>> => {
  const response = await apiClient.get<ApiResponse<CampaignResponse>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${id}`,
  );
  return response.data;
};

export const getPublicCampaign = async (
  id: string | number,
): Promise<ApiResponse<CampaignResponse>> => {
  const response = await apiClient.get<ApiResponse<CampaignResponse>>(
    `${API_ENDPOINTS.PUBLIC_CAMPAIGN.BASE}/${id}`,
  );
  return response.data;
};

export const getCampaignMedia = async (
  campaignId: number,
): Promise<ApiResponse<CampaignMediaResponse[]>> => {
  const response = await apiClient.get<ApiResponse<CampaignMediaResponse[]>>(
    `${API_ENDPOINTS.CAMPAIGN.MEDIA_CAMPAIGN}/${campaignId}`,
  );
  return response.data;
};

export const getCampaignCoverMedia = async (
  campaignId: number,
): Promise<ApiResponse<CampaignMediaResponse>> => {
  const response = await apiClient.get<ApiResponse<CampaignMediaResponse>>(
    `${API_ENDPOINTS.CAMPAIGN.MEDIA_COVER}/${campaignId}`,
  );
  return response.data;
};

export { getMediaUrl };

export const followCampaign = async (campaignId: number): Promise<void> => {
  await apiClient.post(`campaigns/followed/${campaignId}`);
};

export const unfollowCampaign = async (campaignId: number): Promise<void> => {
  await apiClient.delete(`campaigns/followed/${campaignId}`);
};

export const joinCampaign = async (campaignId: number): Promise<void> => {
  await apiClient.post(`${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/members`);
};

export const unjoinCampaign = async (campaignId: number): Promise<UnjoinCampaignResponse> => {
  const response = await apiClient.delete<ApiResponse<UnjoinCampaignResponse>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/members`,
  );
  return response.data.result;
};

export const cancelUnjoinRequest = async (campaignId: number): Promise<void> => {
  await apiClient.delete(`${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/members/unjoin-request`);
};

export const uploadCampaignMedia = async (
  campaignId: number,
  file: File,
  isCover = false,
  context?: 'CAMPAIGN' | 'FINAL_REPORT',
): Promise<CampaignMedia> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('campaignId', campaignId.toString());
  formData.append('isCover', isCover.toString());
  if (context) {
    formData.append('context', context);
  }
  const response = await apiClient.post<ApiResponse<CampaignMedia>>(
    'media/upload/campaign',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data.result;
};

export const deleteCampaignMedia = async (mediaId: number): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(`media/${mediaId}/campaign`);
};

export const getCampaignMeetings = async (
  campaignId: number,
  view?: CampaignMeetingView,
): Promise<CampaignMeeting[]> => {
  const response = await apiClient.get<ApiResponse<CampaignMeeting[]>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings`,
    { params: view ? { view } : undefined },
  );
  return response.data.result;
};

export const getCampaignMeeting = async (
  campaignId: number,
  meetingId: number,
): Promise<CampaignMeeting> => {
  const response = await apiClient.get<ApiResponse<CampaignMeeting>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}`,
  );
  return response.data.result;
};

export const getCampaignMeetingRecipients = async (
  campaignId: number,
): Promise<CampaignMeetingRecipient[]> => {
  const response = await apiClient.get<ApiResponse<CampaignMeetingRecipient[]>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meeting-recipients`,
  );
  return response.data.result;
};

export const createCampaignMeeting = async (
  campaignId: number,
  payload: CreateCampaignMeetingRequest,
): Promise<CampaignMeeting> => {
  const response = await apiClient.post<ApiResponse<CampaignMeeting>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings`,
    payload,
  );
  return response.data.result;
};

export const updateCampaignMeeting = async (
  campaignId: number,
  meetingId: number,
  payload: UpdateCampaignMeetingRequest,
): Promise<CampaignMeeting> => {
  const response = await apiClient.patch<ApiResponse<CampaignMeeting>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}`,
    payload,
  );
  return response.data.result;
};

export const cancelCampaignMeeting = async (
  campaignId: number,
  meetingId: number,
): Promise<CampaignMeeting> => {
  const response = await apiClient.patch<ApiResponse<CampaignMeeting>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}/cancel`,
  );
  return response.data.result;
};

export const getCampaignMeetingInvitedMembers = async (
  campaignId: number,
  meetingId: number,
): Promise<CampaignMeetingRecipient[]> => {
  const response = await apiClient.get<ApiResponse<CampaignMeetingRecipient[]>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}/invited-members`,
  );
  return response.data.result;
};

export const getCampaignMeetingNotes = async (
  campaignId: number,
  meetingId: number,
): Promise<CampaignMeetingNotes> => {
  const response = await apiClient.get<ApiResponse<CampaignMeetingNotes>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}/notes`,
  );
  return response.data.result;
};

export const updateCampaignMeetingNotes = async (
  campaignId: number,
  meetingId: number,
  payload: UpdateCampaignMeetingNotesRequest,
): Promise<CampaignMeetingNotes> => {
  const response = await apiClient.patch<ApiResponse<CampaignMeetingNotes>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}/notes`,
    payload,
  );
  return response.data.result;
};

export const getCampaignMeetingActivity = async (
  campaignId: number,
  meetingId: number,
): Promise<CampaignMeetingActivity[]> => {
  const response = await apiClient.get<ApiResponse<CampaignMeetingActivity[]>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}/activity`,
  );
  return response.data.result;
};

export const getCampaignMeetingAttachments = async (
  campaignId: number,
  meetingId: number,
): Promise<CampaignMeetingAttachment[]> => {
  const response = await apiClient.get<ApiResponse<CampaignMeetingAttachment[]>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}/attachments`,
  );
  return response.data.result;
};

export const uploadCampaignMeetingAttachment = async (
  campaignId: number,
  meetingId: number,
  file: File,
): Promise<CampaignMeetingAttachment> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<CampaignMeetingAttachment>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}/attachments`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data.result;
};

export const deleteCampaignMeetingAttachment = async (
  campaignId: number,
  meetingId: number,
  attachmentId: number,
): Promise<CampaignMeetingAttachment> => {
  const response = await apiClient.delete<ApiResponse<CampaignMeetingAttachment>>(
    `${API_ENDPOINTS.CAMPAIGN.BASE}/${campaignId}/meetings/${meetingId}/attachments/${attachmentId}`,
  );
  return response.data.result;
};

export const campaignApi = {
  createCampaign,
  updateCampaign,
  endCampaign,
  deleteCampaign,
  getCampaigns,
  getPublicCampaigns,
  getCampaignById,
  getCampaign,
  getPublicCampaign,
  getCampaignMedia,
  getCampaignCoverMedia,
  getMediaUrl,
  followCampaign,
  unfollowCampaign,
  joinCampaign,
  unjoinCampaign,
  cancelUnjoinRequest,
  uploadCampaignMedia,
  deleteCampaignMedia,
  getCampaignMeetings,
  getCampaignMeeting,
  getCampaignMeetingRecipients,
  createCampaignMeeting,
  updateCampaignMeeting,
  cancelCampaignMeeting,
  getCampaignMeetingInvitedMembers,
  getCampaignMeetingNotes,
  updateCampaignMeetingNotes,
  getCampaignMeetingActivity,
  getCampaignMeetingAttachments,
  uploadCampaignMeetingAttachment,
  deleteCampaignMeetingAttachment,
};

export const uploadCampaignQr = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<string>>('media/upload/campaign-qr', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.result;
};

export const uploadTransactionProof = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<string>>(
    'media/upload/transaction-proof',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data.result;
};
