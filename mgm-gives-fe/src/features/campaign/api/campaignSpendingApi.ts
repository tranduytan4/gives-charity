import type { AxiosProgressEvent } from 'axios';
import apiClient from '@/lib/apiClient';
import type { ApiResponse } from '@/shared/types/ApiResponse';
import type {
  CampaignSpendingListResponse,
  CampaignSpendingResponse,
  CreateCampaignSpendingRequest,
  Spending,
  UpdateCampaignSpendingRequest,
} from '../types/campaignSpending';
import { toSpending } from '../types/campaignSpending';

const getResult = <T>(response: { data: ApiResponse<T> }): T => response.data.result;

export interface SpendingList {
  items: Spending[];
  totalRaised: number;
  totalSpent: number;
  remainingFunds: number;
}

const toSpendingList = (response: CampaignSpendingListResponse): SpendingList => ({
  ...response,
  items: response.items.map(toSpending),
});

export const getCampaignSpendings = async (campaignId: number): Promise<SpendingList> => {
  const response = await apiClient.get<ApiResponse<CampaignSpendingListResponse>>(
    `/campaigns/${campaignId}/spendings`,
  );
  return toSpendingList(getResult(response));
};

export const createCampaignSpending = async (
  campaignId: number,
  request: CreateCampaignSpendingRequest,
): Promise<Spending> => {
  const response = await apiClient.post<ApiResponse<CampaignSpendingResponse>>(
    `/campaigns/${campaignId}/spendings`,
    request,
  );
  return toSpending(getResult(response));
};

export const updateCampaignSpending = async (
  spendingId: number,
  request: UpdateCampaignSpendingRequest,
): Promise<Spending> => {
  const response = await apiClient.patch<ApiResponse<CampaignSpendingResponse>>(
    `/spendings/${spendingId}`,
    request,
  );
  return toSpending(getResult(response));
};

export const deleteCampaignSpending = async (spendingId: number): Promise<void> => {
  await apiClient.delete(`/spendings/${spendingId}`);
};

export const uploadSpendingPhoto = async (
  spendingId: number,
  file: File,
  onUploadProgress?: (event: AxiosProgressEvent) => void,
): Promise<Spending> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<CampaignSpendingResponse>>(
    `/spendings/${spendingId}/photos`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress },
  );
  return toSpending(getResult(response));
};

export const removeSpendingPhoto = async (
  spendingId: number,
  mediaId: number,
): Promise<Spending> => {
  const response = await apiClient.delete<ApiResponse<CampaignSpendingResponse>>(
    `/spendings/${spendingId}/photos/${mediaId}`,
  );
  return toSpending(getResult(response));
};
