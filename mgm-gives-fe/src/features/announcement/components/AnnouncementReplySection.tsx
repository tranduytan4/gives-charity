import { type InfiniteData, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, Loader2, MessageSquare } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthUser } from '@/features/auth/hooks';
import { Button } from '@/shared/components/ui/Button';
import {
  announcementReplyQueryKeys,
  REPLY_NOT_FOUND_ERROR_CODE,
  useAnnouncementRepliesQuery,
  useAnnouncementReplyContextQuery,
} from '../hooks/useAnnouncementEngagement';
import { useAnnouncementRepliesSocket } from '../hooks/useAnnouncementRepliesSocket';
import { announcementQueryKeys } from '../hooks/useAnnouncements';
import type {
  AnnouncementReplyResponse,
  ReplyContextDirection,
  ReplyPageResponse,
  ReplySort,
} from '../types';
import { AnnouncementReplyComposer } from './AnnouncementReplyComposer';
import { AnnouncementReplyItem } from './AnnouncementReplyItem';

interface AnnouncementReplySectionProps {
  campaignId: number;
  announcementId: number;
  variant: 'list' | 'detail';
  canManageCampaign: boolean;
}

interface ContextPaginationState {
  newerCursor: number | null;
  olderCursor: number | null;
  hasNewer: boolean;
  hasOlder: boolean;
}

export function AnnouncementReplySection({
  campaignId,
  announcementId,
  variant,
  canManageCampaign,
}: AnnouncementReplySectionProps) {
  const { data: user } = useAuthUser();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const limit = variant === 'list' ? 3 : 15;
  const [sort, setSort] = useState<ReplySort>('desc');
  const [createdReplies, setCreatedReplies] = useState<AnnouncementReplyResponse[]>([]);
  const [highlightedReplyId, setHighlightedReplyId] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<AnnouncementReplyResponse | null>(null);
  const [contextReplies, setContextReplies] = useState<AnnouncementReplyResponse[]>([]);
  const [contextPagination, setContextPagination] = useState<ContextPaginationState | null>(null);
  const [hasNewReplies, setHasNewReplies] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const normalScrollPositionRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const listHeaderRef = useRef<HTMLDivElement>(null);
  const [isScrolledPast, setIsScrolledPast] = useState(false);

  useEffect(() => {
    if (variant !== 'detail') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsScrolledPast(!entry.isIntersecting && entry.boundingClientRect.top < 112);
        }
      },
      {
        rootMargin: '-112px 0px 0px 0px',
        threshold: 0,
      },
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [variant]);

  const handleStickyClick = () => {
    if (listHeaderRef.current) {
      listHeaderRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (hasNewReplies) {
      setHasNewReplies(false);
      setSort('desc');
      if (isFocused) {
        setSearchParams((previous) => {
          const next = new URLSearchParams(previous);
          next.delete('reply');
          return next;
        });
      }
      void queryClient.invalidateQueries({
        queryKey: announcementReplyQueryKeys.byAnnouncement(campaignId, announcementId),
      });
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.lists(campaignId),
      });
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.detail(campaignId, announcementId),
      });
    }
  };

  const replyParam = searchParams.get('reply');
  const [replyAnnouncementId, replyId] = replyParam?.split(':') ?? [];
  const focusedReplyId =
    Number(replyAnnouncementId) === announcementId &&
    Number.isSafeInteger(Number(replyId)) &&
    Number(replyId) > 0
      ? Number(replyId)
      : null;
  const isFocused = focusedReplyId !== null;

  const normalQuery = useAnnouncementRepliesQuery(
    campaignId,
    announcementId,
    sort,
    limit,
    !isFocused,
  );
  const contextQuery = useAnnouncementReplyContextQuery(
    campaignId,
    announcementId,
    focusedReplyId,
    sort,
    limit,
  );

  useAnnouncementRepliesSocket({
    announcementId,
    enabled: variant === 'detail',
    onCreated: (event) => {
      const isAlreadyLoaded =
        createdReplies.some((r) => r.id === event.replyId) ||
        normalQuery.data?.pages.some((page) => page.content.some((r) => r.id === event.replyId));
      if (!isAlreadyLoaded) {
        setHasNewReplies(true);
      }
    },
    onEdited: (event) => {
      if (!event.reply) return;
      const updatedReply = event.reply;

      queryClient.setQueriesData(
        { queryKey: announcementReplyQueryKeys.byAnnouncement(campaignId, announcementId) },
        (oldData: InfiniteData<ReplyPageResponse<AnnouncementReplyResponse>> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: ReplyPageResponse<AnnouncementReplyResponse>) => ({
              ...page,
              content: page.content.map((reply: AnnouncementReplyResponse) =>
                reply.id === updatedReply.id ? updatedReply : reply,
              ),
            })),
          };
        },
      );

      handleReplyUpdated(updatedReply);
    },
    onDeleted: (event) => {
      queryClient.setQueriesData(
        { queryKey: announcementReplyQueryKeys.byAnnouncement(campaignId, announcementId) },
        (oldData: InfiniteData<ReplyPageResponse<AnnouncementReplyResponse>> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map((page: ReplyPageResponse<AnnouncementReplyResponse>) => ({
              ...page,
              content: page.content.filter(
                (reply: AnnouncementReplyResponse) => reply.id !== event.replyId,
              ),
            })),
          };
        },
      );

      handleReplyDeleted(event.replyId);

      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.lists(campaignId),
      });
      void queryClient.invalidateQueries({
        queryKey: announcementQueryKeys.detail(campaignId, announcementId),
      });
    },
  });

  useEffect(() => {
    if (!contextQuery.data) return;

    setContextReplies(contextQuery.data.content);
    setContextPagination({
      newerCursor: contextQuery.data.newerCursor,
      olderCursor: contextQuery.data.olderCursor,
      hasNewer: contextQuery.data.hasNewer,
      hasOlder: contextQuery.data.hasOlder,
    });
    setHighlightedReplyId(contextQuery.data.anchorReplyId);
  }, [contextQuery.data]);

  const handleReplySuccess = (newReply: AnnouncementReplyResponse) => {
    setHasNewReplies(false);
    setCreatedReplies((previousReplies) => {
      if (previousReplies.some((reply) => reply.id === newReply.id)) return previousReplies;
      return [...previousReplies, newReply];
    });

    if (isFocused) {
      setContextReplies((previousReplies) => {
        if (previousReplies.some((reply) => reply.id === newReply.id)) return previousReplies;
        return sort === 'desc' ? [newReply, ...previousReplies] : [...previousReplies, newReply];
      });
    }
    setHighlightedReplyId(newReply.id);
  };

  const handleReplyUpdated = (updatedReply: AnnouncementReplyResponse) => {
    setCreatedReplies((previousReplies) =>
      previousReplies.map((reply) => (reply.id === updatedReply.id ? updatedReply : reply)),
    );
    setContextReplies((previousReplies) =>
      previousReplies.map((reply) => (reply.id === updatedReply.id ? updatedReply : reply)),
    );
  };

  const handleReplyDeleted = (replyId: number) => {
    setCreatedReplies((previousReplies) => previousReplies.filter((reply) => reply.id !== replyId));
    setContextReplies((previousReplies) => previousReplies.filter((reply) => reply.id !== replyId));
    setReplyTarget((previousReply) => (previousReply?.id === replyId ? null : previousReply));
    setHighlightedReplyId((previousReplyId) =>
      previousReplyId === replyId ? null : previousReplyId,
    );

    if (replyId === focusedReplyId) {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous);
        next.delete('reply');
        return next;
      });
    }
  };

  useEffect(() => {
    if (
      variant !== 'detail' ||
      isFocused ||
      !normalQuery.hasNextPage ||
      normalQuery.isFetchingNextPage
    )
      return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void normalQuery.fetchNextPage();
      },
      { threshold: 0.1 },
    );
    const currentTarget = loadMoreRef.current;
    if (currentTarget) observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [
    isFocused,
    normalQuery.fetchNextPage,
    normalQuery.hasNextPage,
    normalQuery.isFetchingNextPage,
    variant,
  ]);

  const fetchedReplies = normalQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const fetchedReplyIds = new Set(fetchedReplies.map((reply) => reply.id));
  const localReplies = createdReplies.filter((reply) => !fetchedReplyIds.has(reply.id));
  const normalReplies =
    sort === 'desc'
      ? [...localReplies].reverse().concat(fetchedReplies)
      : fetchedReplies.concat(localReplies);
  const replies = isFocused ? contextReplies : normalReplies;
  const hasHighlightedReply = replies.some((reply) => reply.id === highlightedReplyId);

  const handleNavigateToReply = (replyId: number) => {
    if (replies.some((reply) => reply.id === replyId)) {
      setHighlightedReplyId(replyId);
      return;
    }

    if (!isFocused) normalScrollPositionRef.current = window.scrollY;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set('reply', `${announcementId}:${replyId}`);
      return next;
    });
  };

  const handleBackToAllReplies = () => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('reply');
      return next;
    });
    window.setTimeout(() => {
      if (normalScrollPositionRef.current !== null) {
        window.scrollTo({ top: normalScrollPositionRef.current });
      }
    }, 0);
  };

  const handleLoadContext = async (direction: ReplyContextDirection) => {
    const cursor =
      direction === 'newer' ? contextPagination?.newerCursor : contextPagination?.olderCursor;
    if (cursor === null || cursor === undefined) return;

    try {
      const page = await contextQuery.loadPage({ cursor, direction });
      setContextReplies((previousReplies) => {
        const knownIds = new Set(previousReplies.map((reply) => reply.id));
        const additions = page.content.filter((reply) => !knownIds.has(reply.id));
        if (direction === 'newer') {
          return sort === 'desc'
            ? [...additions, ...previousReplies]
            : [...previousReplies, ...additions];
        }
        return sort === 'desc'
          ? [...previousReplies, ...additions]
          : [...additions, ...previousReplies];
      });
      setContextPagination((previous) => {
        if (!previous) return previous;
        return direction === 'newer'
          ? { ...previous, newerCursor: page.newerCursor, hasNewer: page.hasNewer }
          : { ...previous, olderCursor: page.olderCursor, hasOlder: page.hasOlder };
      });
    } catch (error: unknown) {
      const message = error as { message?: string };
      toast.error(message.message || 'Failed to load more replies.');
    }
  };

  useEffect(() => {
    if (highlightedReplyId === null || !hasHighlightedReply) return;

    const element = document.getElementById(`reply-${highlightedReplyId}`);
    if (!element) return;

    const { bottom, top } = element.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const timeoutId = window.setTimeout(() => {
      setHighlightedReplyId((previousReplyId) =>
        previousReplyId === highlightedReplyId ? null : previousReplyId,
      );
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [hasHighlightedReply, highlightedReplyId]);

  const isLoading = isFocused ? contextQuery.isLoading : normalQuery.isLoading;
  const isError = isFocused ? contextQuery.isError : normalQuery.isError;
  const isFocusedReplyNotFound =
    isFocused && contextQuery.error?.code === REPLY_NOT_FOUND_ERROR_CODE;

  const showStickyButton = hasNewReplies || isScrolledPast;

  return (
    <div ref={listHeaderRef} className="mt-4 border-t border-border pt-4 scroll-mt-32">
      <AnnouncementReplyComposer
        campaignId={campaignId}
        announcementId={announcementId}
        onSuccess={handleReplySuccess}
      />

      {/* Sentinel for scroll detection */}
      <div ref={sentinelRef} className="h-0 w-full pointer-events-none" />

      {/* Sticky morphing navigation button */}
      {variant === 'detail' && showStickyButton && (
        <div className="sticky top-[-1rem] z-40 w-full flex justify-center pointer-events-none h-0">
          <div className="relative pointer-events-auto -top-3 animate-in fade-in slide-in-from-top-2 duration-200">
            {hasNewReplies ? (
              <Button
                type="button"
                onClick={handleStickyClick}
                className="flex items-center gap-1.5 rounded-full border-primary/30 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-105"
              >
                <ArrowUp className="h-3.5 w-3.5 animate-bounce" />
                New replies
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleStickyClick}
                className="flex items-center gap-1.5 rounded-full border-border bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 shadow-md transition-all hover:bg-slate-50 hover:text-slate-900 hover:scale-105"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Jump to top
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {isFocused ? 'Viewing original comment' : 'Replies'}
          </h3>
          {isFocused && (
            <p className="text-xs text-muted-foreground">
              Browse the conversation around this comment.
            </p>
          )}
        </div>
        {isFocused ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleBackToAllReplies}>
            Back to all replies
          </Button>
        ) : (
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as ReplySort)}
            className="cursor-pointer rounded-md border-none bg-transparent py-1 pl-2 pr-7 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground focus:outline-none focus:ring-0"
          >
            <option value="desc" className="bg-background text-foreground">
              Newest First
            </option>
            <option value="asc" className="bg-background text-foreground">
              Oldest First
            </option>
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading replies...
        </div>
      ) : isError ? (
        <div className="py-4 text-center text-sm">
          <p className={isFocusedReplyNotFound ? 'text-muted-foreground' : 'text-destructive'}>
            {isFocusedReplyNotFound
              ? 'This comment is no longer available.'
              : 'Failed to load comments.'}
          </p>
          {isFocusedReplyNotFound && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={handleBackToAllReplies}
            >
              Back to all replies
            </Button>
          )}
        </div>
      ) : replies.length === 0 ? (
        <div className="flex flex-col items-center gap-1.5 py-6 text-sm text-muted-foreground">
          <MessageSquare className="h-5 w-5 text-muted-foreground/60" />
          <span>No replies yet. Be the first to reply!</span>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {isFocused && contextPagination?.hasNewer && (
            <div className="flex justify-center py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleLoadContext('newer')}
                disabled={contextQuery.isLoadingPage}
              >
                {contextQuery.isLoadingPage && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Load newer replies
              </Button>
            </div>
          )}

          {replies.map((reply) => (
            <Fragment key={reply.id}>
              <AnnouncementReplyItem
                campaignId={campaignId}
                announcementId={announcementId}
                reply={reply}
                currentUser={user}
                canManageCampaign={canManageCampaign}
                isHighlighted={reply.id === highlightedReplyId}
                onReply={setReplyTarget}
                onNavigateToReply={
                  reply.inReplyTo && !reply.inReplyTo.isDeleted ? handleNavigateToReply : undefined
                }
                onUpdated={handleReplyUpdated}
                onDeleted={handleReplyDeleted}
              />
              {replyTarget?.id === reply.id && (
                <div className="pb-3 pl-11">
                  <AnnouncementReplyComposer
                    campaignId={campaignId}
                    announcementId={announcementId}
                    replyTarget={replyTarget}
                    onClearReplyTarget={() => setReplyTarget(null)}
                    onSuccess={handleReplySuccess}
                  />
                </div>
              )}
            </Fragment>
          ))}

          {isFocused && contextPagination?.hasOlder && (
            <div className="flex justify-center py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void handleLoadContext('older')}
                disabled={contextQuery.isLoadingPage}
              >
                {contextQuery.isLoadingPage && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Load older replies
              </Button>
            </div>
          )}

          {!isFocused && variant === 'detail' && normalQuery.hasNextPage && (
            <div ref={loadMoreRef} className="flex justify-center py-3">
              {normalQuery.isFetchingNextPage && (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              )}
            </div>
          )}

          {!isFocused && variant === 'list' && normalQuery.hasNextPage && (
            <div className="flex justify-center pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => normalQuery.fetchNextPage()}
                disabled={normalQuery.isFetchingNextPage}
                className="text-xs font-semibold text-primary hover:bg-primary/5 hover:text-primary/90"
              >
                {normalQuery.isFetchingNextPage && (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                )}
                Load more replies
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
