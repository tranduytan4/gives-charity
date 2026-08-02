import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { CampaignEmptyState, CampaignFilters, CampaignSearch } from '@/features/campaign';
import { useCategories } from '@/features/category';
import { Button } from '@/shared/components/ui/Button';
import { JoinedCampaignCard } from '../components/JoinedCampaignCard';
import { useJoinedCampaigns, useUnjoinCampaign } from '../hooks/hooks';

const VALID_STATUSES = [
  'ALL',
  'DRAFT',
  'PENDING',
  'APPROVED',
  'IN_PROGRESS',
  'REJECTED',
  'COMPLETED',
] as const;

type JoinedStatus = (typeof VALID_STATUSES)[number];

const PAGE_SIZE = 9;

const skeletonItems = [
  'joined-campaign-skeleton-1',
  'joined-campaign-skeleton-2',
  'joined-campaign-skeleton-3',
  'joined-campaign-skeleton-4',
  'joined-campaign-skeleton-5',
  'joined-campaign-skeleton-6',
];

export function JoinedCampaignsPage() {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const [searchParams, setSearchParams] = useSearchParams();
  const rawStatus = searchParams.get('status');
  const statusParam: JoinedStatus =
    rawStatus && VALID_STATUSES.includes(rawStatus as JoinedStatus)
      ? (rawStatus as JoinedStatus)
      : 'ALL';

  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<JoinedStatus>(statusParam);
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const { data: categories = [] } = useCategories();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(keyword);
      setPage(0);
    }, 400);

    return () => clearTimeout(handler);
  }, [keyword]);

  const {
    data: pageData,
    isLoading,
    isError,
    refetch,
  } = useJoinedCampaigns({
    page,
    size: PAGE_SIZE,
    keyword: debouncedKeyword,
    status: statusFilter,
    priority: priorityFilter,
    categoryIds: selectedCategoryIds,
  });

  const unjoinMutation = useUnjoinCampaign();

  const campaigns = pageData?.content ?? [];
  const totalElements = pageData?.totalElements ?? 0;
  const totalPages = pageData?.totalPages ?? 0;
  const isFirstPage = page === 0;
  const isLastPage = pageData?.last ?? true;
  const hasActiveFilters =
    debouncedKeyword.trim() !== '' ||
    statusFilter !== 'ALL' ||
    priorityFilter !== 'ALL' ||
    selectedCategoryIds.length > 0;

  function handleStatusChange(value: string) {
    const validValue = VALID_STATUSES.includes(value as JoinedStatus)
      ? (value as JoinedStatus)
      : 'ALL';
    setStatusFilter(validValue);
    setPage(0);
    setSearchParams(
      (prev) => {
        if (validValue === 'ALL') {
          prev.delete('status');
        } else {
          prev.set('status', validValue);
        }
        return prev;
      },
      { replace: true },
    );
  }

  useEffect(() => {
    const rawStatus = searchParams.get('status');
    if (rawStatus && !VALID_STATUSES.includes(rawStatus as JoinedStatus)) {
      setSearchParams(
        (params) => {
          params.delete('status');
          return params;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const rawStatus = searchParams.get('status');
    const currentParam: JoinedStatus =
      rawStatus && VALID_STATUSES.includes(rawStatus as JoinedStatus)
        ? (rawStatus as JoinedStatus)
        : 'ALL';
    if (currentParam !== statusFilter) {
      setStatusFilter(currentParam);
      setPage(0);
    }
  }, [searchParams, statusFilter]);

  function handlePriorityChange(value: string) {
    setPriorityFilter(value);
    setPage(0);
  }

  function handleCategoryChange(ids: number[]) {
    setSelectedCategoryIds(ids);
    setPage(0);
  }

  function handleLeave(campaignId: number, { onDone }: { onDone: () => void }) {
    unjoinMutation.mutate(campaignId, {
      onSuccess: (result) => {
        if (result.status === 'PENDING_APPROVAL') {
          toast.info('You still have an assigned task. Your unjoin request needs admin approval.');
        } else {
          toast.success('Left campaign');
          if (campaigns.length === 1 && page > 0) {
            setPage((currentPage) => Math.max(currentPage - 1, 0));
          }
        }
        onDone();
      },
      onError: () => {
        toast.error('Failed to leave campaign');
      },
    });
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading) {
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
              <h2 className="text-lg font-semibold text-red-900">
                {currentLang === 'vi'
                  ? 'Không thể tải danh sách chiến dịch đã tham gia'
                  : 'Failed to load joined campaigns'}
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {currentLang === 'vi'
                  ? 'Đã xảy ra lỗi trong quá trình tải danh sách chiến dịch bạn tham gia.'
                  : 'Something went wrong while loading your joined campaigns.'}
              </p>

              <button
                type="button"
                onClick={() => void refetch()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                {currentLang === 'vi' ? 'Thử lại' : 'Try again'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Main content ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-[1060px] min-[1600px]:max-w-[1400px] mx-auto px-2 py-2 space-y-6 min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {currentLang === 'vi' ? 'Chiến dịch đã tham gia' : 'Joined Campaigns'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {currentLang === 'vi'
              ? 'Các chiến dịch bạn đang tham gia tình nguyện.'
              : 'Campaigns you are volunteering in.'}
          </p>
        </div>

        <p className="text-sm text-muted-foreground">
          {currentLang === 'vi'
            ? `${totalElements} chiến dịch`
            : `${totalElements} campaign${totalElements === 1 ? '' : 's'}`}
        </p>
      </div>

      {/* Filter bar */}
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
          allowedStatuses={['APPROVED', 'IN_PROGRESS', 'COMPLETED']}
        />
      </div>

      {/* Empty state */}
      {campaigns.length === 0 ? (
        <CampaignEmptyState
          title={
            hasActiveFilters
              ? currentLang === 'vi'
                ? 'Không có chiến dịch nào khớp với bộ lọc'
                : 'No campaigns match your filters'
              : currentLang === 'vi'
                ? 'Bạn chưa tham gia chiến dịch nào'
                : "You haven't joined any campaigns yet"
          }
          message={
            hasActiveFilters
              ? currentLang === 'vi'
                ? 'Hãy thử điều chỉnh từ khóa hoặc bộ lọc của bạn.'
                : 'Try adjusting your search or filters.'
              : currentLang === 'vi'
                ? 'Các chiến dịch bạn tham gia tình nguyện sẽ xuất hiện ở đây.'
                : 'Campaigns you volunteer in will appear here.'
          }
        />
      ) : (
        <>
          {/* Card grid */}
          <motion.div
            layout
            className="grid grid-cols-1 gap-5 min-[641px]:grid-cols-2 min-[1008px]:grid-cols-3 min-[1008px]:gap-4 min-[1600px]:grid-cols-4 min-[1600px]:gap-5"
          >
            <AnimatePresence mode="popLayout">
              {campaigns.map((campaign) => (
                <motion.div
                  key={campaign.campaignId}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <JoinedCampaignCard
                    campaign={campaign}
                    onLeave={handleLeave}
                    isLeaving={
                      unjoinMutation.isPending && unjoinMutation.variables === campaign.campaignId
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 0))}
                disabled={isFirstPage}
                className="flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
                {currentLang === 'vi' ? 'Trang trước' : 'Previous'}
              </Button>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalPages }, (_, i) => i).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="h-8 w-8 p-0 text-xs font-semibold cursor-pointer"
                  >
                    {pageNum + 1}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                disabled={isLastPage}
                className="flex items-center gap-1 cursor-pointer"
              >
                {currentLang === 'vi' ? 'Trang sau' : 'Next'}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
