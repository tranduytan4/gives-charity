import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelUnjoinRequest, unjoinCampaign } from '@/features/campaign/api';
import {
  approveUnjoinRequest,
  type GetJoinedCampaignsParams,
  getCampaignRoster,
  getJoinedCampaigns,
  getUnjoinRequests,
  rejectUnjoinRequest,
  updateMyRosterVisibility,
  updateRosterVisibility,
} from '@/features/campaign_member/api/api';
import type { MemberListVisibility } from '@/features/campaign_member/types/types';

export const joinedCampaignsQueryKey = ['joined-campaigns'];
export const unjoinRequestsQueryKey = (campaignId: number) => ['unjoin-requests', campaignId];
export const campaignRosterQueryKey = (campaignId: number) => ['campaign-roster', campaignId];

export function useCampaignRoster(campaignId: number, enabled = true) {
  return useQuery({
    queryKey: campaignRosterQueryKey(campaignId),
    queryFn: () => getCampaignRoster(campaignId),
    enabled: !!campaignId && enabled,
  });
}

export function useUpdateRosterVisibility(campaignId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (visibility: MemberListVisibility) =>
      updateRosterVisibility(campaignId, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignRosterQueryKey(campaignId) });
    },
  });
}

export function useUpdateMyRosterVisibility(campaignId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hidden: boolean) => updateMyRosterVisibility(campaignId, hidden),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignRosterQueryKey(campaignId) });
    },
  });
}

export function useJoinedCampaigns(params: GetJoinedCampaignsParams) {
  return useQuery({
    queryKey: [...joinedCampaignsQueryKey, params],
    queryFn: () => getJoinedCampaigns(params),
    placeholderData: keepPreviousData,
  });
}

export function useUnjoinCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: number) => unjoinCampaign(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: joinedCampaignsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
    },
  });
}

export function useCancelUnjoinRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (campaignId: number) => cancelUnjoinRequest(campaignId),
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: joinedCampaignsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
    },
  });
}

export function useUnjoinRequests(campaignId: number, page = 0, size = 10, enabled = true) {
  return useQuery({
    queryKey: [...unjoinRequestsQueryKey(campaignId), page, size],
    queryFn: () => getUnjoinRequests(campaignId, page, size),
    enabled: !!campaignId && enabled,
    placeholderData: keepPreviousData,
  });
}

export function useApproveUnjoinRequest(campaignId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => approveUnjoinRequest(campaignId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unjoinRequestsQueryKey(campaignId) });
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
    },
  });
}

export function useRejectUnjoinRequest(campaignId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: number; reason: string }) =>
      rejectUnjoinRequest(campaignId, userId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: unjoinRequestsQueryKey(campaignId) });
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
    },
  });
}
