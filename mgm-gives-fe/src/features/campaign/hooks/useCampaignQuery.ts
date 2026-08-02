import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getMediaUrl } from '@/shared/utils/media';
import { getCampaignCoverMedia, getCampaignMedia, getCampaigns, getPublicCampaigns } from '../api';
import type {
  Campaign,
  CampaignMediaResponse,
  CampaignQueryParams,
  CampaignResponse,
} from '../types';

export const mapCampaignResponseToCampaign = (res: CampaignResponse): Campaign => {
  return {
    id: String(res.id),
    title: res.title || '',
    description: res.description || '',
    coverImage: (() => {
      const coverMedia = res.medias?.find((m) => m.isCover);
      const fileName = coverMedia?.url || res.coverImageUrl;
      return getMediaUrl(fileName);
    })(),
    categories: res.categories,
    target: res.target ?? 0,
    currentRaised: res.currentRaised ?? 0,
    status: res.status || 'APPROVED',
    priority: res.priority,
    createdAt: res.createdAt,
    endDate: res.endDate ?? res.dueDate ?? new Date().toISOString(),
    donorsCount: res.donorsCount ?? 0,
    volunteersCount: res.volunteersCount ?? 0,
    creatorId: res.creatorId,
    creatorName: res.creatorName,
    creatorAvatarUrl: res.creatorAvatarUrl,
    isFollowed: res.isFollowed,
    isJoined: res.isJoined,
    roleInCampaign: res.roleInCampaign,
  };
};

export const useCampaignQuery = (
  params?: CampaignQueryParams,
  options?: { enabled?: boolean; public?: boolean },
) => {
  return useQuery({
    queryKey: [options?.public ? 'public-campaigns' : 'campaigns', params],
    queryFn: async () => {
      const response = options?.public
        ? await getPublicCampaigns(params)
        : await getCampaigns(params);
      if (response.success && response.result) {
        const mappedContent = response.result.content.map(mapCampaignResponseToCampaign);
        return {
          ...response.result,
          content: mappedContent,
        };
      }
      throw new Error(response.message || 'Failed to fetch campaigns');
    },
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
  });
};

export const useInfiniteCampaignQuery = (params?: Omit<CampaignQueryParams, 'page'>) => {
  return useInfiniteQuery({
    queryKey: ['campaigns', 'infinite', params],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await getCampaigns({ ...params, page: pageParam });
      if (response.success && response.result) {
        const mappedContent = response.result.content.map(mapCampaignResponseToCampaign);
        return {
          ...response.result,
          content: mappedContent,
        };
      }
      throw new Error(response.message || 'Failed to fetch campaigns');
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      const pageNum =
        'number' in lastPage
          ? (lastPage as { number: number }).number
          : (lastPage as unknown as { page: number }).page;
      return pageNum + 1;
    },
    placeholderData: keepPreviousData,
  });
};

export const useCampaignMedia = (campaignId: number, enabled = true) => {
  return useQuery<CampaignMediaResponse[], Error>({
    queryKey: ['campaign-media', campaignId],
    queryFn: async () => {
      const response = await getCampaignMedia(campaignId);
      if (response.success && response.result) {
        return response.result;
      }
      throw new Error(response.message || 'Failed to fetch campaign media');
    },
    enabled: !!campaignId && enabled,
  });
};

export const useCampaignCoverMedia = (campaignId: number, enabled = true) => {
  return useQuery<CampaignMediaResponse, Error>({
    queryKey: ['campaign-cover-media', campaignId],
    queryFn: async () => {
      const response = await getCampaignCoverMedia(campaignId);
      if (response.success && response.result) {
        return response.result;
      }
      throw new Error(response.message || 'Failed to fetch campaign cover media');
    },
    enabled: !!campaignId && enabled,
  });
};
