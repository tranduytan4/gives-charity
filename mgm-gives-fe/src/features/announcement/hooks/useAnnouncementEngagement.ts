import {
  type InfiniteData,
  type QueryKey,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import type { ErrorResponse } from '@/shared/types';
import { announcementEngagementApi } from '../api/announcementEngagementApi';
import type {
  Announcement,
  AnnouncementPage,
  AnnouncementReplyResponse,
  CreateReplyPayload,
  ReplyContextDirection,
  ReplyContextResponse,
  ReplyPageResponse,
  ReplySort,
  UpdateReplyPayload,
} from '../types';
import { announcementQueryKeys } from './useAnnouncements';

export const announcementReplyQueryKeys = {
  all: ['announcement-replies'] as const,
  byAnnouncement: (campaignId: number, announcementId: number) =>
    ['announcement-replies', campaignId, announcementId] as const,
  list: (campaignId: number, announcementId: number, sort: ReplySort, limit: number) =>
    ['announcement-replies', campaignId, announcementId, sort, limit] as const,
  context: (
    campaignId: number,
    announcementId: number,
    replyId: number,
    sort: ReplySort,
    limit: number,
  ) => ['announcement-reply-context', campaignId, announcementId, replyId, sort, limit] as const,
};

export const REPLY_NOT_FOUND_ERROR_CODE = 2019;

// Single hook for like/unlike toggling with Optimistic Updates
export function useToggleLikeMutation(campaignId: number, announcementId: number) {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    ErrorResponse,
    boolean, // isLikedBeforeMutation passed to mutate()
    {
      previousListQueries: [QueryKey, AnnouncementPage<Announcement> | undefined][];
      previousDetailQuery: Announcement | undefined;
    }
  >({
    mutationFn: (isLikedBeforeMutation) => {
      if (isLikedBeforeMutation) {
        return announcementEngagementApi.unlikeAnnouncement(campaignId, announcementId);
      }
      return announcementEngagementApi.likeAnnouncement(campaignId, announcementId);
    },
    onMutate: async (isLikedBeforeMutation) => {
      // Cancel refetches to prevent overwriting optimistic updates
      await Promise.all([
        queryClient.cancelQueries({ queryKey: announcementQueryKeys.lists(campaignId) }),
        queryClient.cancelQueries({
          queryKey: announcementQueryKeys.detail(campaignId, announcementId),
        }),
      ]);

      // Take snapshots of current query data
      const previousListQueries = queryClient.getQueriesData<AnnouncementPage<Announcement>>({
        queryKey: announcementQueryKeys.lists(campaignId),
      });
      const previousDetailQuery = queryClient.getQueryData<Announcement>(
        announcementQueryKeys.detail(campaignId, announcementId),
      );

      // Optimistically update every cached list variant for this campaign.
      queryClient.setQueriesData<AnnouncementPage<Announcement>>(
        { queryKey: announcementQueryKeys.lists(campaignId) },
        (oldData) => {
          if (!oldData?.content) return oldData;
          return {
            ...oldData,
            content: oldData.content.map((ann) => {
              if (ann.id === announcementId) {
                return {
                  ...ann,
                  isLiked: !isLikedBeforeMutation,
                  likesCount: Math.max(0, ann.likesCount + (isLikedBeforeMutation ? -1 : 1)),
                };
              }
              return ann;
            }),
          };
        },
      );

      // Optimistically update the detail query
      queryClient.setQueryData<Announcement>(
        announcementQueryKeys.detail(campaignId, announcementId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            isLiked: !isLikedBeforeMutation,
            likesCount: Math.max(0, oldData.likesCount + (isLikedBeforeMutation ? -1 : 1)),
          };
        },
      );

      // Return context with rollback snapshots
      return { previousListQueries, previousDetailQuery };
    },
    onError: (_err, _variables, context) => {
      // Rollback to previous state on error
      if (context) {
        if (context.previousListQueries) {
          for (const [queryKey, oldData] of context.previousListQueries) {
            queryClient.setQueryData(queryKey, oldData);
          }
        }
        if (context.previousDetailQuery) {
          queryClient.setQueryData(
            announcementQueryKeys.detail(campaignId, announcementId),
            context.previousDetailQuery,
          );
        }
      }
    },
    onSettled: () => {
      // Reconcile after both success and failure. A transport error can occur after commit.
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.detail(campaignId, announcementId),
      });
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.lists(campaignId),
      });
    },
  });
}

// Keyset pagination for replies
export function useAnnouncementRepliesQuery(
  campaignId: number,
  announcementId: number,
  sort: ReplySort = 'desc',
  limit = 15,
  enabled = true,
) {
  return useInfiniteQuery<
    ReplyPageResponse<AnnouncementReplyResponse>,
    ErrorResponse,
    InfiniteData<ReplyPageResponse<AnnouncementReplyResponse>>,
    ReturnType<typeof announcementReplyQueryKeys.list>,
    number | undefined
  >({
    queryKey: announcementReplyQueryKeys.list(campaignId, announcementId, sort, limit),
    queryFn: ({ pageParam }) =>
      announcementEngagementApi.getReplies(campaignId, announcementId, pageParam, limit, sort),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: enabled && !!campaignId && !!announcementId,
  });
}

export function useAnnouncementReplyContextQuery(
  campaignId: number,
  announcementId: number,
  replyId: number | null,
  sort: ReplySort,
  limit: number,
) {
  const initialQuery = useQuery<
    ReplyContextResponse,
    ErrorResponse,
    ReplyContextResponse,
    ReturnType<typeof announcementReplyQueryKeys.context>
  >({
    queryKey: announcementReplyQueryKeys.context(
      campaignId,
      announcementId,
      replyId ?? 0,
      sort,
      limit,
    ),
    queryFn: () =>
      announcementEngagementApi.getReplyContext(
        campaignId,
        announcementId,
        replyId ?? 0,
        limit,
        sort,
      ),
    enabled: !!campaignId && !!announcementId && replyId !== null,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => error.code !== REPLY_NOT_FOUND_ERROR_CODE && failureCount < 3,
  });

  const pageMutation = useMutation<
    ReplyContextResponse,
    ErrorResponse,
    { cursor: number; direction: ReplyContextDirection }
  >({
    mutationFn: ({ cursor, direction }) =>
      announcementEngagementApi.getReplyContext(
        campaignId,
        announcementId,
        replyId ?? 0,
        limit,
        sort,
        cursor,
        direction,
      ),
  });

  return {
    ...initialQuery,
    loadPage: pageMutation.mutateAsync,
    isLoadingPage: pageMutation.isPending,
  };
}

// Create Reply
export function useCreateReplyMutation(campaignId: number, announcementId: number) {
  const queryClient = useQueryClient();

  return useMutation<AnnouncementReplyResponse, ErrorResponse, CreateReplyPayload>({
    mutationFn: (payload) =>
      announcementEngagementApi.createReply(campaignId, announcementId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: announcementReplyQueryKeys.byAnnouncement(campaignId, announcementId),
      });
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.lists(campaignId),
      });
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.detail(campaignId, announcementId),
      });
    },
  });
}

// Update Reply
export function useUpdateReplyMutation(campaignId: number, announcementId: number) {
  const queryClient = useQueryClient();

  return useMutation<
    AnnouncementReplyResponse,
    ErrorResponse,
    { replyId: number; payload: UpdateReplyPayload }
  >({
    mutationFn: ({ replyId, payload }) =>
      announcementEngagementApi.updateReply(campaignId, announcementId, replyId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: announcementReplyQueryKeys.byAnnouncement(campaignId, announcementId),
      });
    },
  });
}

// Delete Reply
export function useDeleteReplyMutation(campaignId: number, announcementId: number) {
  const queryClient = useQueryClient();

  return useMutation<void, ErrorResponse, number>({
    mutationFn: (replyId) =>
      announcementEngagementApi.deleteReply(campaignId, announcementId, replyId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: announcementReplyQueryKeys.byAnnouncement(campaignId, announcementId),
      });
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.lists(campaignId),
      });
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.detail(campaignId, announcementId),
      });
    },
  });
}
