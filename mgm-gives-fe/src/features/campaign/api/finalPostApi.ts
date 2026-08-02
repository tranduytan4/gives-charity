import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type { ApiResponse } from '@/shared/types';
import type {
  CampaignResult,
  CampaignResultGenerateResponse,
  CampaignResultRequest,
} from '../types/finalPost';

export const getCampaignResult = async (campaignId: number): Promise<CampaignResult | null> => {
  try {
    const response = await apiClient.get<ApiResponse<CampaignResult>>(
      API_ENDPOINTS.CAMPAIGN.RESULT(campaignId),
    );
    return response.data.result;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number } };
    if (axiosError?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const postCampaignResult = async (
  campaignId: number,
  payload: CampaignResultRequest,
): Promise<CampaignResult> => {
  const response = await apiClient.post<ApiResponse<CampaignResult>>(
    API_ENDPOINTS.CAMPAIGN.RESULT(campaignId),
    payload,
  );
  return response.data.result;
};

export const updateCampaignResult = async (
  campaignId: number,
  payload: CampaignResultRequest,
): Promise<CampaignResult> => {
  const response = await apiClient.put<ApiResponse<CampaignResult>>(
    API_ENDPOINTS.CAMPAIGN.RESULT(campaignId),
    payload,
  );
  return response.data.result;
};

export const generateCampaignResultWithAI = async (
  campaignId: number,
): Promise<CampaignResultGenerateResponse> => {
  const response = await apiClient.post<ApiResponse<CampaignResultGenerateResponse>>(
    API_ENDPOINTS.CAMPAIGN.RESULT_GENERATE(campaignId),
  );
  return response.data.result;
};
