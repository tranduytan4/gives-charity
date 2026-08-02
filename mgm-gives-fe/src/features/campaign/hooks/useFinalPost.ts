import {
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  generateCampaignResultWithAI,
  getCampaignResult,
  postCampaignResult,
  updateCampaignResult,
} from '../api/finalPostApi';
import type {
  CampaignResult,
  CampaignResultGenerateResponse,
  CampaignResultRequest,
} from '../types/finalPost';

export const campaignResultQueryKeys = {
  byCampaign: (campaignId: number) => ['campaignResult', campaignId] as const,
};

export const useCampaignResult = (
  campaignId: number,
  options?: Omit<UseQueryOptions<CampaignResult | null, Error>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery<CampaignResult | null, Error>({
    queryKey: campaignResultQueryKeys.byCampaign(campaignId),
    queryFn: () => getCampaignResult(campaignId),
    enabled: !!campaignId,
    retry: false,
    ...options,
  });
};

export const usePostCampaignResultMutation = (
  options?: UseMutationOptions<
    CampaignResult,
    Error,
    { campaignId: number; data: CampaignResultRequest }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<CampaignResult, Error, { campaignId: number; data: CampaignResultRequest }>({
    mutationFn: ({ campaignId, data }) => postCampaignResult(campaignId, data),
    onSuccess: (result, { campaignId }) => {
      queryClient.setQueryData(campaignResultQueryKeys.byCampaign(campaignId), result);
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
    },
    ...options,
  });
};

export const useUpdateCampaignResultMutation = (
  options?: UseMutationOptions<
    CampaignResult,
    Error,
    { campaignId: number; data: CampaignResultRequest }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<CampaignResult, Error, { campaignId: number; data: CampaignResultRequest }>({
    mutationFn: ({ campaignId, data }) => updateCampaignResult(campaignId, data),
    onSuccess: (result, { campaignId }) => {
      queryClient.setQueryData(campaignResultQueryKeys.byCampaign(campaignId), result);
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
    },
    ...options,
  });
};

export const useGenerateCampaignResultMutation = (
  options?: UseMutationOptions<CampaignResultGenerateResponse, Error, number>,
) => {
  return useMutation<CampaignResultGenerateResponse, Error, number>({
    mutationFn: (campaignId: number) => generateCampaignResultWithAI(campaignId),
    ...options,
  });
};
