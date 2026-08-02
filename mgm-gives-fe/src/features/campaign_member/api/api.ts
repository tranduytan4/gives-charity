import type {
  CampaignRosterResponse,
  JoinedCampaignResponse,
  MemberListVisibility,
  UnjoinRequestResponse,
} from '@/features/campaign_member/types/types';
import { apiClient } from '@/lib/apiClient';
import type { ApiResponse, PageResponse } from '@/shared/types';

export interface GetJoinedCampaignsParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  priority?: string;
  categoryIds?: number[];
}

export async function getJoinedCampaigns({
  page = 0,
  size = 10,
  keyword,
  status,
  priority,
  categoryIds,
}: GetJoinedCampaignsParams): Promise<PageResponse<JoinedCampaignResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<JoinedCampaignResponse>>>(
    'campaigns/joined',
    {
      params: {
        page,
        size,
        ...(keyword?.trim() ? { keyword: keyword.trim() } : {}),
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(priority && priority !== 'ALL' ? { priority } : {}),
        ...(categoryIds && categoryIds.length > 0 ? { categoryIds: categoryIds.join(',') } : {}),
      },
    },
  );
  return response.data.result;
}

export async function getUnjoinRequests(
  campaignId: number,
  page = 0,
  size = 10,
): Promise<PageResponse<UnjoinRequestResponse>> {
  const response = await apiClient.get<ApiResponse<PageResponse<UnjoinRequestResponse>>>(
    `campaigns/${campaignId}/members/unjoin-requests`,
    { params: { page, size } },
  );
  return response.data.result;
}

export async function getCampaignRoster(campaignId: number): Promise<CampaignRosterResponse> {
  const response = await apiClient.get<ApiResponse<CampaignRosterResponse>>(
    `campaigns/${campaignId}/members`,
  );
  return response.data.result;
}

export async function updateRosterVisibility(
  campaignId: number,
  visibility: MemberListVisibility,
): Promise<void> {
  await apiClient.patch(`campaigns/${campaignId}/members/visibility`, { visibility });
}

export async function updateMyRosterVisibility(campaignId: number, hidden: boolean): Promise<void> {
  await apiClient.patch(`campaigns/${campaignId}/members/me/visibility`, { hidden });
}

export async function approveUnjoinRequest(campaignId: number, userId: number): Promise<void> {
  await apiClient.put(`campaigns/${campaignId}/members/${userId}/unjoin-request/approve`);
}

export async function rejectUnjoinRequest(
  campaignId: number,
  userId: number,
  reason: string,
): Promise<void> {
  await apiClient.put(`campaigns/${campaignId}/members/${userId}/unjoin-request/reject`, {
    reason,
  });
}
