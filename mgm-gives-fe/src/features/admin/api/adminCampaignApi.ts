import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type { ApiResponse } from '@/shared/types';
import type { AdminCampaignResponse, PageResponse } from '../types';

export const getAdminCampaignById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<AdminCampaignResponse>>(
    `${API_ENDPOINTS.ADMIN_CAMPAIGNS.BASE}/${id}`,
  );
  return response.data;
};

export const approveCampaign = async (id: number) => {
  const response = await apiClient.put<ApiResponse<AdminCampaignResponse>>(
    API_ENDPOINTS.ADMIN_CAMPAIGNS.APPROVE(id),
  );
  return response.data;
};

export const rejectCampaign = async (id: number, reason: string) => {
  const response = await apiClient.put<ApiResponse<AdminCampaignResponse>>(
    API_ENDPOINTS.ADMIN_CAMPAIGNS.REJECT(id),
    { reason },
  );
  return response.data;
};

export interface GetCampaignsParams {
  status?: string;
  categoryId?: number;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const getCampaignsList = async (params?: GetCampaignsParams) => {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminCampaignResponse>>>(
    API_ENDPOINTS.ADMIN_CAMPAIGNS.BASE,
    { params },
  );
  return response.data;
};
