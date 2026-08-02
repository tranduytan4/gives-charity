import { useQuery } from '@tanstack/react-query';
import { campaignApi } from '../api/campaignApi';
import { campaignQueryKeys } from '../constants/queryKeys';

export const useCampaignDetails = (id: string, publicMode = false) => {
  return useQuery({
    queryKey: publicMode ? ['public-campaign', id] : campaignQueryKeys.detail(id),
    queryFn: () => (publicMode ? campaignApi.getPublicCampaign(id) : campaignApi.getCampaign(id)),

    enabled: !!id,
    retry: false,
  });
};
