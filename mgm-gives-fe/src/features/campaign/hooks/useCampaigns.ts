import {
  keepPreviousData,
  type UseMutationOptions,
  type UseQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ApiResponse } from '@/shared/types';
import { campaignApi, type GetCampaignsParams, type PageResponse } from '../api/campaignApi';
import { campaignQueryKeys } from '../constants/queryKeys';
import type { CampaignRequest, CampaignResponse } from '../types';

export const useCampaignsQuery = (
  params?: GetCampaignsParams,
  options?: Omit<UseQueryOptions<PageResponse<CampaignResponse>, Error>, 'queryKey' | 'queryFn'>,
) => {
  return useQuery<PageResponse<CampaignResponse>, Error>({
    queryKey: campaignQueryKeys.list(params),
    queryFn: async () => {
      const res = await campaignApi.getCampaigns(params);
      return res.result;
    },
    placeholderData: keepPreviousData,
    ...options,
  });
};

export const useCampaignQuery = (
  id: number,
  options?: Omit<
    UseQueryOptions<ApiResponse<CampaignResponse>, Error, CampaignResponse>,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery<ApiResponse<CampaignResponse>, Error, CampaignResponse>({
    queryKey: campaignQueryKeys.detail(id),
    queryFn: () => campaignApi.getCampaign(id),
    enabled: !!id,
    select: (data) => data?.result as CampaignResponse,
    ...options,
  });
};

export const useCreateCampaignMutation = (
  options?: UseMutationOptions<CampaignResponse, Error, CampaignRequest>,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};
  return useMutation<CampaignResponse, Error, CampaignRequest>({
    mutationFn: (data: CampaignRequest) => campaignApi.createCampaign(data),
    ...restOptions,
    onSuccess: (data, variables, context, mutationContext) => {
      if (data?.id) {
        queryClient.setQueryData(campaignQueryKeys.detail(data.id), {
          success: true,
          code: 1000,
          message: 'Success',
          result: data,
        });
      }
      queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists });
      onSuccess?.(data, variables, context, mutationContext);
    },
  });
};

export const useUpdateCampaignMutation = (
  options?: UseMutationOptions<CampaignResponse, Error, { id: number; data: CampaignRequest }>,
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};
  return useMutation<CampaignResponse, Error, { id: number; data: CampaignRequest }>({
    mutationFn: ({ id, data }) => campaignApi.updateCampaign(id, data),
    ...restOptions,
    onSuccess: (data, variables, context, mutationContext) => {
      queryClient.setQueryData(campaignQueryKeys.detail(variables.id), (oldData: unknown) => {
        if (oldData && typeof oldData === 'object' && 'result' in oldData) {
          return {
            ...(oldData as ApiResponse<CampaignResponse>),
            result: data,
          };
        }
        return {
          success: true,
          code: 1000,
          message: 'Success',
          result: data,
        };
      });
      queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists });
      queryClient.invalidateQueries({ queryKey: campaignQueryKeys.detail(variables.id) });
      onSuccess?.(data, variables, context, mutationContext);
    },
  });
};

export const useDeleteCampaignMutation = (options?: UseMutationOptions<void, Error, number>) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options || {};
  return useMutation<void, Error, number>({
    mutationFn: (id: number) => campaignApi.deleteCampaign(id),
    ...restOptions,
    onSuccess: (data, variables, context, mutationContext) => {
      queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists });
      queryClient.removeQueries({ queryKey: campaignQueryKeys.detail(variables) });
      onSuccess?.(data, variables, context, mutationContext);
    },
  });
};

export const useEndCampaignMutation = (
  options?: UseMutationOptions<CampaignResponse, Error, number>,
) => {
  return useMutation<CampaignResponse, Error, number>({
    mutationFn: (id: number) => campaignApi.endCampaign(id),
    ...options,
  });
};
