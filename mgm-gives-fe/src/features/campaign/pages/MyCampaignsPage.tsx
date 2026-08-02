import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUp,
  Calendar,
  Clock,
  Edit3,
  ExternalLink,
  FileText,
  Flag,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthUser } from '@/features/auth/hooks';
import {
  CampaignCard,
  CampaignEmptyState,
  CampaignFilters,
  CampaignSearch,
} from '@/features/campaign/components';
import { useCategories } from '@/features/category';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { ROUTES } from '@/shared/constants/routes';
import { formatDate, parseUTCDate } from '@/shared/utils/format';
import { campaignApi, type GetCampaignsParams } from '../api/campaignApi';
import { FinalPostEditorDialog } from '../components/FinalPostEditorDialog';
import { useDeleteCampaignMutation, useEndCampaignMutation } from '../hooks/useCampaigns';
import type { Campaign, CampaignPriority, CampaignResponse, CampaignStatus } from '../types';

const PAGE_SIZE = 9;

const getDaysLeftText = (endDate?: string | null, status?: string, lang?: string) => {
  if (status === 'COMPLETED') return lang === 'vi' ? 'Đã kết thúc' : 'Ended';
  if (!endDate) return lang === 'vi' ? 'Đã kết thúc' : 'Ended';
  const diffTime = parseUTCDate(endDate).getTime() - Date.now();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return lang === 'vi' ? 'Đã kết thúc' : 'Ended';
  return lang === 'vi' ? `Còn ${diffDays} ngày` : `${diffDays} days left`;
};

const skeletonItems = [
  'my-campaign-skeleton-1',
  'my-campaign-skeleton-2',
  'my-campaign-skeleton-3',
  'my-campaign-skeleton-4',
  'my-campaign-skeleton-5',
  'my-campaign-skeleton-6',
];

function ScrollToTopButton({ topRef }: { topRef: React.RefObject<HTMLDivElement | null> }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!topRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry) {
          setIsVisible(!firstEntry.isIntersecting);
        }
      },
      { rootMargin: '100px 0px 0px 0px' },
    );

    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [topRef]);

  const scrollToTop = () => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default function MyCampaignsPage() {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const { data: user } = useAuthUser();

  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, 400);

    return () => clearTimeout(handler);
  }, [keyword]);

  const queryParams = useMemo<GetCampaignsParams>(() => {
    const params: GetCampaignsParams = {
      userId: user?.id,
      size: PAGE_SIZE,
    };

    if (debouncedKeyword.trim()) {
      params.keyword = debouncedKeyword.trim();
    }

    if (statusFilter !== 'ALL') {
      params.status = statusFilter as CampaignStatus;
    }

    if (priorityFilter !== 'ALL') {
      params.priority = priorityFilter as CampaignPriority;
    }

    if (selectedCategoryIds.length > 0) {
      params.categoryId = selectedCategoryIds[0];
    }

    return params;
  }, [user?.id, debouncedKeyword, statusFilter, priorityFilter, selectedCategoryIds]);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['my-campaigns', 'infinite', queryParams],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await campaignApi.getCampaigns({ ...queryParams, page: pageParam });
      return res.result;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage.last) return undefined;
      const pageNum =
        'number' in lastPage
          ? (lastPage as { number: number }).number
          : (lastPage as { page: number }).page;
      return pageNum + 1;
    },
    enabled: !!user?.id,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (firstEntry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '400px' },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const deleteCampaignMutation = useDeleteCampaignMutation();
  const endCampaignMutation = useEndCampaignMutation();
  const [campaignToDelete, setCampaignToDelete] = useState<CampaignResponse | null>(null);
  const lastCampaignToDeleteRef = useRef<CampaignResponse | null>(null);
  if (campaignToDelete) {
    lastCampaignToDeleteRef.current = campaignToDelete;
  }
  const activeCampaignToDelete = campaignToDelete ?? lastCampaignToDeleteRef.current;

  const [campaignToEnd, setCampaignToEnd] = useState<CampaignResponse | null>(null);
  const lastCampaignToEndRef = useRef<CampaignResponse | null>(null);
  if (campaignToEnd) {
    lastCampaignToEndRef.current = campaignToEnd;
  }
  const activeCampaignToEnd = campaignToEnd ?? lastCampaignToEndRef.current;

  const [rejectionFeedbackCampaign, setRejectionFeedbackCampaign] =
    useState<CampaignResponse | null>(null);
  const lastRejectionFeedbackRef = useRef<CampaignResponse | null>(null);
  if (rejectionFeedbackCampaign) {
    lastRejectionFeedbackRef.current = rejectionFeedbackCampaign;
  }
  const activeRejectionCampaign = rejectionFeedbackCampaign ?? lastRejectionFeedbackRef.current;
  const [finalReportCampaign, setFinalReportCampaign] = useState<CampaignResponse | null>(null);

  const campaigns = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.content || []);
  }, [data?.pages]);

  const totalElements = data?.pages[0]?.totalElements ?? 0;
  const hasActiveFilters =
    debouncedKeyword.trim() !== '' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    selectedCategoryIds.length > 0;

  function handleStatusChange(value: string) {
    setStatusFilter(value);
  }

  function handlePriorityChange(value: string) {
    setPriorityFilter(value);
  }

  function handleCategoryChange(ids: number[]) {
    setSelectedCategoryIds(ids);
  }

  const handleOpenCreateModal = () => {
    navigate(ROUTES.CREATE_CAMPAIGN);
  };

  const handleOpenEditModal = (campaign: CampaignResponse) => {
    navigate(ROUTES.EDIT_CAMPAIGN.replace(':id', String(campaign.id)));
  };

  const handleDeleteConfirm = () => {
    if (campaignToDelete) {
      deleteCampaignMutation.mutate(campaignToDelete.id, {
        onSuccess: () => {
          toast.success(
            currentLang === 'vi' ? 'Xóa chiến dịch thành công!' : 'Campaign deleted successfully!',
          );
          setCampaignToDelete(null);
          refetch();
        },
        onError: (err) => {
          toast.error(
            err.message ||
              (currentLang === 'vi' ? 'Không thể xóa chiến dịch' : 'Failed to delete campaign'),
          );
        },
      });
    }
  };

  const handleEndConfirm = () => {
    if (campaignToEnd) {
      endCampaignMutation.mutate(campaignToEnd.id, {
        onSuccess: () => {
          toast.success(
            currentLang === 'vi'
              ? 'Kết thúc chiến dịch thành công!'
              : 'Campaign ended successfully!',
          );
          setCampaignToEnd(null);
          refetch();
        },
        onError: (err) => {
          toast.error(
            err.message ||
              (currentLang === 'vi' ? 'Không thể kết thúc chiến dịch' : 'Failed to end campaign'),
          );
        },
      });
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading && campaigns.length === 0) {
    return (
      <div className="w-full max-w-[1060px] min-[1600px]:max-w-[1400px] mx-auto px-2 py-2 space-y-6 min-h-[calc(100vh-200px)]">
        <div>
          <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
          <div className="mt-2 h-4 w-80 animate-pulse rounded-md bg-muted/60" />
        </div>

        <div className="grid grid-cols-1 gap-5 min-[641px]:grid-cols-2 min-[1008px]:grid-cols-3 min-[1008px]:gap-4 min-[1600px]:grid-cols-4 min-[1600px]:gap-5">
          {skeletonItems.map((item) => (
            <div key={item} className="h-[420px] bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className="w-full max-w-[1060px] min-[1600px]:max-w-[1400px] mx-auto px-2 py-2 min-h-[calc(100vh-200px)]">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-100 p-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-red-900">Failed to load campaigns</h2>
              <p className="mt-1 text-sm text-red-700">
                {error?.message || 'Something went wrong while fetching your campaigns.'}
              </p>
              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main content ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1060px] min-[1600px]:max-w-[1400px] mx-auto px-2 py-2 space-y-6 min-h-[calc(100vh-200px)] relative">
      <div ref={topRef} className="absolute top-0 left-0 w-full h-1 pointer-events-none" />

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {currentLang === 'vi' ? 'Chiến dịch của tôi' : 'My Campaigns'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {currentLang === 'vi'
              ? 'Quản lý các ý tưởng chiến dịch, theo dõi trạng thái và gửi đề xuất phê duyệt.'
              : 'Manage your campaign ideas, view draft states, and submit proposals for review.'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground hidden sm:block">
            {totalElements}{' '}
            {currentLang === 'vi' ? 'chiến dịch' : `campaign${totalElements === 1 ? '' : 's'}`}
          </p>

          <Button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            {currentLang === 'vi' ? 'Tạo ý tưởng chiến dịch' : 'Create Campaign Idea'}
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <CampaignSearch value={keyword} onChange={setKeyword} />
        </div>
        <CampaignFilters
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          onCategoryChange={handleCategoryChange}
          status={statusFilter}
          onStatusChange={handleStatusChange}
          priority={priorityFilter}
          onPriorityChange={handlePriorityChange}
        />
      </div>

      {/* Content Grid or Empty State */}
      {campaigns.length === 0 ? (
        <CampaignEmptyState
          title={
            hasActiveFilters
              ? currentLang === 'vi'
                ? 'Không tìm thấy chiến dịch phù hợp với bộ lọc'
                : 'No campaigns match your filters'
              : currentLang === 'vi'
                ? 'Bạn chưa tạo chiến dịch nào'
                : "You haven't created any campaigns yet"
          }
          message={
            hasActiveFilters
              ? currentLang === 'vi'
                ? 'Thử điều chỉnh từ khóa tìm kiếm hoặc bộ lọc.'
                : 'Try adjusting your search or filters.'
              : currentLang === 'vi'
                ? 'Đề xuất một mục tiêu bạn quan tâm để bắt đầu tạo ra tác động tích cực.'
                : 'Propose a cause you care about to start making a real impact.'
          }
        />
      ) : (
        <>
          {/* Card Grid */}
          <motion.div
            layout
            className="grid grid-cols-1 gap-5 min-[641px]:grid-cols-2 min-[1008px]:grid-cols-3 min-[1008px]:gap-4 min-[1600px]:grid-cols-4 min-[1600px]:gap-5"
          >
            <AnimatePresence mode="popLayout">
              {campaigns.map((c) => {
                const mappedCampaign: Campaign = {
                  id: String(c.id),
                  title: c.title,
                  description: c.description || '',
                  coverImage: c.coverImageUrl || '',
                  categories: c.categories || [],
                  status: c.status,
                  priority: c.priority,
                  target: c.target || 0,
                  currentRaised: c.currentRaised || 0,
                  createdAt: c.createdAt || c.startDate || '',
                  endDate: c.endDate || '',
                  donorsCount: c.donorsCount || 0,
                  volunteersCount: c.volunteersCount || 0,
                  creatorId: c.creatorId,
                  creatorName: c.creatorName,
                  creatorAvatarUrl: c.creatorAvatarUrl,
                  isFollowed: c.isFollowed,
                  isJoined: c.isJoined,
                  roleInCampaign: c.roleInCampaign,
                };

                const metaSlot = (
                  <div className="flex flex-col gap-1.5 text-xs text-white/90 font-medium pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-white/80">
                        <Calendar className="h-3.5 w-3.5 opacity-80 shrink-0" />
                        <span>
                          {currentLang === 'vi' ? 'Đã tạo' : 'Created'}{' '}
                          {c.createdAt ? formatDate(c.createdAt) : '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-white/90">
                        <Clock className="h-3.5 w-3.5 opacity-80 shrink-0" />
                        <span>{getDaysLeftText(c.endDate, c.status, currentLang)}</span>
                      </div>
                    </div>
                  </div>
                );

                const actionSlot = (
                  <div className="flex items-center justify-start gap-1.5 flex-wrap w-full">
                    {c.status === 'COMPLETED' ? (
                      <>
                        {c.isEditable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(c);
                            }}
                            className="flex items-center gap-1 cursor-pointer bg-white/20 border-white/30 text-white hover:bg-white/30"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            {currentLang === 'vi' ? 'Chỉnh sửa / Gửi duyệt' : 'Edit / Submit'}
                          </Button>
                        )}

                        {c.resultPosted ? (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(ROUTES.CAMPAIGN_RESULT.replace(':id', String(c.id)));
                            }}
                            className="flex items-center justify-center gap-1 cursor-pointer bg-white text-gray-900 hover:bg-white/90"
                          >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            {currentLang === 'vi' ? 'Xem báo cáo' : 'View Report'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFinalReportCampaign(c);
                            }}
                            className="flex items-center justify-center gap-1 cursor-pointer bg-white text-gray-900 hover:bg-white/90"
                          >
                            <FileText className="h-3.5 w-3.5 shrink-0" />
                            {currentLang === 'vi' ? 'Đăng báo cáo' : 'Post Report'}
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {c.status === 'IN_PROGRESS' && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCampaignToEnd(c);
                            }}
                            disabled={endCampaignMutation.isPending}
                            className="flex items-center gap-1 cursor-pointer bg-orange-600 hover:bg-orange-700 text-white border-0"
                            title={currentLang === 'vi' ? 'Kết thúc chiến dịch' : 'End Campaign'}
                          >
                            <Flag className="h-3.5 w-3.5" />
                            {currentLang === 'vi' ? 'Kết thúc' : 'End Campaign'}
                          </Button>
                        )}

                        {c.status === 'REJECTED' && c.rejectionReason && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRejectionFeedbackCampaign(c);
                            }}
                            className="flex items-center gap-1 cursor-pointer bg-red-600/80 hover:bg-red-700/80 text-white border-0 px-2.5"
                            title={
                              currentLang === 'vi' ? 'Xem lý do từ chối' : 'View Rejection Reason'
                            }
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            {currentLang === 'vi' ? 'Lý do' : 'Reason'}
                          </Button>
                        )}

                        {(c.status === 'DRAFT' ||
                          c.status === 'REJECTED' ||
                          c.status === 'PENDING') && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCampaignToDelete(c);
                            }}
                            disabled={deleteCampaignMutation.isPending}
                            className="flex items-center gap-1 cursor-pointer px-2.5"
                            title={currentLang === 'vi' ? 'Xóa chiến dịch' : 'Delete Campaign'}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            {currentLang === 'vi' ? 'Xóa' : 'Delete'}
                          </Button>
                        )}

                        {c.isEditable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(c);
                            }}
                            className="flex items-center gap-1 cursor-pointer bg-white/20 border-white/30 text-white hover:bg-white/30 px-2.5"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            {currentLang === 'vi' ? 'Chỉnh sửa / Gửi duyệt' : 'Edit / Submit'}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                );

                return (
                  <motion.div
                    key={c.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CampaignCard
                      campaign={mappedCampaign}
                      metaSlot={metaSlot}
                      actionSlot={actionSlot}
                      navigationState={{ from: 'my-campaigns' }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Infinite Loading Skeleton Trigger */}
          {isFetchingNextPage && (
            <div className="grid grid-cols-1 gap-5 pt-4 min-[641px]:grid-cols-2 min-[1008px]:grid-cols-3 min-[1008px]:gap-4 min-[1600px]:grid-cols-4 min-[1600px]:gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[420px] bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          )}

          <div ref={loadMoreRef} className="h-10 w-full" />
          <ScrollToTopButton topRef={topRef} />
        </>
      )}

      {/* Final Report Editor Dialog */}
      {finalReportCampaign && (
        <FinalPostEditorDialog
          isOpen
          onClose={() => setFinalReportCampaign(null)}
          campaign={finalReportCampaign}
        />
      )}

      {/* End Campaign Confirmation Modal */}
      <Dialog
        isOpen={campaignToEnd !== null}
        onClose={() => setCampaignToEnd(null)}
        title={currentLang === 'vi' ? 'Kết thúc chiến dịch' : 'End Campaign'}
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500 leading-relaxed break-words [overflow-wrap:anywhere]">
            {currentLang === 'vi' ? (
              <>
                Bạn có chắc chắn muốn kết thúc chiến dịch{' '}
                <span className="font-semibold text-gray-900">"{activeCampaignToEnd?.title}"</span>{' '}
                ngay bây giờ? Chiến dịch sẽ được đánh dấu là hoàn thành và dừng nhận quyên góp /
                đăng ký tình nguyện.
              </>
            ) : (
              <>
                Are you sure you want to end the campaign{' '}
                <span className="font-semibold text-gray-900">"{activeCampaignToEnd?.title}"</span>{' '}
                now? It will be marked as completed, and volunteer/donation sign-ups will stop.
              </>
            )}
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={() => setCampaignToEnd(null)}>
            {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
          </Button>
          <Button
            type="button"
            className="bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
            onClick={handleEndConfirm}
            disabled={endCampaignMutation.isPending}
          >
            {endCampaignMutation.isPending
              ? currentLang === 'vi'
                ? 'Đang kết thúc...'
                : 'Ending...'
              : currentLang === 'vi'
                ? 'Kết thúc chiến dịch'
                : 'End Campaign'}
          </Button>
        </div>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={campaignToDelete !== null}
        onClose={() => setCampaignToDelete(null)}
        title={currentLang === 'vi' ? 'Xóa chiến dịch' : 'Delete Campaign'}
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500 leading-relaxed break-words [overflow-wrap:anywhere]">
            {currentLang === 'vi' ? (
              <>
                Bạn có chắc chắn muốn xóa chiến dịch{' '}
                <span className="font-semibold text-gray-900">
                  "{activeCampaignToDelete?.title}"
                </span>
                ? Hành động này không thể hoàn tác.
              </>
            ) : (
              <>
                Are you sure you want to delete the campaign{' '}
                <span className="font-semibold text-gray-900">
                  "{activeCampaignToDelete?.title}"
                </span>
                ? This action cannot be undone.
              </>
            )}
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={() => setCampaignToDelete(null)}>
            {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={deleteCampaignMutation.isPending}
          >
            {deleteCampaignMutation.isPending
              ? currentLang === 'vi'
                ? 'Đang xóa...'
                : 'Deleting...'
              : currentLang === 'vi'
                ? 'Xóa'
                : 'Delete'}
          </Button>
        </div>
      </Dialog>

      {/* Rejection Feedback Modal */}
      <Dialog
        isOpen={rejectionFeedbackCampaign !== null}
        onClose={() => setRejectionFeedbackCampaign(null)}
        title={currentLang === 'vi' ? 'Lý do từ chối' : 'Rejection Feedback'}
      >
        <div className="mt-2 space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-700 dark:text-red-200">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1 min-w-0 flex-1">
              <p className="font-semibold text-red-800 dark:text-red-300 break-words [overflow-wrap:anywhere]">
                "{activeRejectionCampaign?.title}"
              </p>
              <p className="whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere]">
                {activeRejectionCampaign?.rejectionReason ||
                  (currentLang === 'vi'
                    ? 'Không có phản hồi chi tiết.'
                    : 'No specific feedback provided.')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRejectionFeedbackCampaign(null)}
          >
            {currentLang === 'vi' ? 'Đóng' : 'Close'}
          </Button>
          {activeRejectionCampaign?.isEditable && (
            <Button
              type="button"
              onClick={() => {
                const target = activeRejectionCampaign;
                setRejectionFeedbackCampaign(null);
                if (target) handleOpenEditModal(target);
              }}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="h-4 w-4" />
              {currentLang === 'vi' ? 'Chỉnh sửa chiến dịch' : 'Edit Campaign'}
            </Button>
          )}
        </div>
      </Dialog>
    </div>
  );
}
