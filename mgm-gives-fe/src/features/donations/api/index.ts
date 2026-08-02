import type {
  AdminGetDonationsParams,
  DonationAdminResponseData,
  DonationPayload,
  DonationResponseData,
  DonationStatus,
  DonationType,
  PaginatedResponse,
  PayOSPayload,
  PayOSResponseData,
  StandardApiResponse,
} from '@/features/donations/types/types.ts';
import apiClient from '@/lib/apiClient';

// User Actions
export async function createDonation(
  payload: DonationPayload,
  idempotencyKey?: string,
): Promise<StandardApiResponse<DonationResponseData>> {
  const headers = idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined;
  const response = await apiClient.post<StandardApiResponse<DonationResponseData>>(
    '/donations',
    payload,
    { headers },
  );
  return response.data;
}

export async function getMyDonations(params?: {
  status?: DonationStatus | '';
  type?: DonationType | '';
  anonymous?: boolean;
  search?: string;
  page?: number;
  size?: number;
}): Promise<PaginatedResponse<DonationResponseData>> {
  const response = await apiClient.get<PaginatedResponse<DonationResponseData>>('/donations/me', {
    params,
  });
  return response.data;
}

export async function getCampaignDonations(
  campaignId: number,
): Promise<StandardApiResponse<DonationResponseData[]>> {
  const response = await apiClient.get<StandardApiResponse<DonationResponseData[]>>('/donations', {
    params: { campaignId },
  });
  return response.data;
}

export async function getCampaignDonationsForAdmin(
  campaignId: number,
): Promise<StandardApiResponse<DonationResponseData[]>> {
  const response = await apiClient.get<StandardApiResponse<DonationResponseData[]>>(
    `/donations/campaign/${campaignId}`,
  );
  return response.data;
}

// Admin Actions

export async function getAdminDonations(
  params: AdminGetDonationsParams,
): Promise<PaginatedResponse<DonationAdminResponseData>> {
  const response = await apiClient.get<PaginatedResponse<DonationAdminResponseData>>(
    '/admin/donations',
    { params },
  );
  return response.data;
}

export async function confirmDonation(
  id: number,
): Promise<StandardApiResponse<DonationAdminResponseData>> {
  const response = await apiClient.patch<StandardApiResponse<DonationAdminResponseData>>(
    `/admin/donations/${id}/confirm`,
  );
  return response.data;
}

export async function confirmCampaignDonation(
  id: number,
): Promise<StandardApiResponse<DonationResponseData>> {
  const response = await apiClient.patch<StandardApiResponse<DonationResponseData>>(
    `/donations/${id}/confirm`,
  );
  return response.data;
}

export async function rejectCampaignDonation(
  id: number,
  reason?: string,
): Promise<StandardApiResponse<DonationResponseData>> {
  const response = await apiClient.patch<StandardApiResponse<DonationResponseData>>(
    `/donations/${id}/reject`,
    { reason },
  );
  return response.data;
}

// PayOS Actions

export async function createPayOSDonation(
  payload: PayOSPayload,
): Promise<StandardApiResponse<PayOSResponseData>> {
  const response = await apiClient.post<StandardApiResponse<PayOSResponseData>>(
    '/donations/payos/create',
    payload,
  );
  return response.data;
}

export async function cancelPayOSDonation(
  donationId: number,
): Promise<StandardApiResponse<DonationResponseData>> {
  const response = await apiClient.post<StandardApiResponse<DonationResponseData>>(
    `/donations/payos/cancel/${donationId}`,
  );
  return response.data;
}

export async function verifyPayOSDonation(
  donationId: number,
): Promise<StandardApiResponse<DonationResponseData>> {
  const response = await apiClient.post<StandardApiResponse<DonationResponseData>>(
    `/donations/payos/verify/${donationId}`,
  );
  return response.data;
}

export async function hideDonationMessage(
  id: number,
  hidden: boolean,
): Promise<StandardApiResponse<DonationResponseData>> {
  const response = await apiClient.patch<StandardApiResponse<DonationResponseData>>(
    `/donations/${id}/message/hide`,
    null,
    { params: { hidden } },
  );
  return response.data;
}

export async function toggleDonationAmountVisibility(
  id: number,
  hidden: boolean,
): Promise<StandardApiResponse<DonationResponseData>> {
  const response = await apiClient.patch<StandardApiResponse<DonationResponseData>>(
    `/donations/${id}/amount/visibility`,
    null,
    { params: { hidden } },
  );
  return response.data;
}

export async function submitManualProof(
  id: number,
  proofUrl?: string,
): Promise<StandardApiResponse<DonationResponseData>> {
  const response = await apiClient.patch<StandardApiResponse<DonationResponseData>>(
    `/donations/${id}/proof`,
    null,
    { params: { proofUrl } },
  );
  return response.data;
}

export async function editCampaignDonation(
  id: number,
  payload: { amount?: number; transactionDescription?: string; reason?: string },
): Promise<StandardApiResponse<DonationResponseData>> {
  const response = await apiClient.patch<StandardApiResponse<DonationResponseData>>(
    `/donations/${id}/edit`,
    payload,
  );
  return response.data;
}

export type {
  DonationAdminResponseData,
  DonationResponseData,
  DonationStatus,
  DonationType,
  StandardApiResponse,
} from '@/features/donations/types/types';
