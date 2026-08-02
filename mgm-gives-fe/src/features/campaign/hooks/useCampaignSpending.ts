import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCampaignSpending,
  deleteCampaignSpending,
  getCampaignSpendings,
  removeSpendingPhoto,
  updateCampaignSpending,
  uploadSpendingPhoto,
} from '../api/campaignSpendingApi';
import { campaignSpendingQueryKeys } from '../constants/spendingQueryKeys';
import type {
  CreateCampaignSpendingRequest,
  UpdateCampaignSpendingRequest,
} from '../types/campaignSpending';

export const useCampaignSpendings = (campaignId: number, enabled = true) =>
  useQuery({
    queryKey: campaignSpendingQueryKeys.campaign(campaignId),
    queryFn: () => getCampaignSpendings(campaignId),
    enabled: enabled && campaignId > 0,
  });

export const useCreateCampaignSpending = (campaignId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: CreateCampaignSpendingRequest) =>
      createCampaignSpending(campaignId, request),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: campaignSpendingQueryKeys.campaign(campaignId) }),
  });
};

export const useUpdateCampaignSpending = (campaignId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      spendingId,
      request,
    }: {
      spendingId: number;
      request: UpdateCampaignSpendingRequest;
    }) => updateCampaignSpending(spendingId, request),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: campaignSpendingQueryKeys.campaign(campaignId) }),
  });
};

export const useDeleteCampaignSpending = (campaignId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spendingId: number) => deleteCampaignSpending(spendingId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: campaignSpendingQueryKeys.campaign(campaignId) }),
  });
};

export const useUploadSpendingPhoto = (campaignId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spendingId, file }: { spendingId: number; file: File }) =>
      uploadSpendingPhoto(spendingId, file),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: campaignSpendingQueryKeys.campaign(campaignId) }),
  });
};

export const useRemoveSpendingPhoto = (campaignId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ spendingId, mediaId }: { spendingId: number; mediaId: number }) =>
      removeSpendingPhoto(spendingId, mediaId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: campaignSpendingQueryKeys.campaign(campaignId) }),
  });
};
