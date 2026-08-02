import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Coins,
  Eye,
  EyeOff,
  HandCoins,
  Heart,
  Search,
  Target,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getMyDonations, toggleDonationAmountVisibility } from '@/features/donations/api';
import DonationRejectReason from '@/features/donations/components/DonationRejectReason';
import { donationQueryKeys } from '@/features/donations/constants/queryKeys';
import type { DonationStatus, DonationType } from '@/features/donations/types/types.ts';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/Table';
import { Tooltip } from '@/shared/components/ui/Tooltip';
import { useDebounce } from '@/shared/hooks';
import { cn } from '@/shared/utils/cn';
import { formatCompactNumber, formatFullCurrency } from '@/shared/utils/currency';
import { localizeDonationStatus, localizeShortDate } from '@/shared/utils/localizeContent';

const PAGE_SIZE = 10;

export default function MyDonationsPage() {
  const { i18n } = useTranslation(['donation', 'common']);
  const currentLang = i18n.language;

  const ALL_TYPES: Array<{ value: DonationType | ''; label: string }> = [
    { value: '', label: currentLang === 'vi' ? 'Tất cả loại' : 'All Types' },
    { value: 'MONEY', label: currentLang === 'vi' ? 'Tiền mặt' : 'Money' },
    { value: 'GOODS', label: currentLang === 'vi' ? 'Hiện vật' : 'Goods' },
  ];

  const ALL_STATUSES: Array<{ value: DonationStatus | ''; label: string }> = [
    { value: '', label: currentLang === 'vi' ? 'Tất cả trạng thái' : 'All Statuses' },
    { value: 'SUCCESSFUL', label: currentLang === 'vi' ? 'Thành công' : 'Successful' },
    { value: 'PENDING', label: currentLang === 'vi' ? 'Đang chờ' : 'Pending' },
    { value: 'CANCELLED', label: currentLang === 'vi' ? 'Đã hủy' : 'Cancelled' },
    { value: 'REJECTED', label: currentLang === 'vi' ? 'Bị từ chối' : 'Rejected' },
  ];

  // ── Search & filter state ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DonationType | ''>('');
  const [filterStatus, setFilterStatus] = useState<DonationStatus | ''>('');
  const [filterAnonymous, setFilterAnonymous] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearch = useDebounce(searchQuery, 500);

  // ── Retrieve overall user donations list for top summary metrics ───────────
  const { data: allDonationsResponse, isLoading: isAllLoading } = useQuery({
    queryKey: [...donationQueryKeys.myDonations, 'summary-metrics'],
    queryFn: () => getMyDonations({ size: 1000 }),
    staleTime: 10000,
  });

  const allDonations = allDonationsResponse?.result?.content || [];

  // ── Retrieve user's filtered donations list ────────────────────────────────
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      ...donationQueryKeys.myDonations,
      filterType,
      filterStatus,
      filterAnonymous,
      debouncedSearch,
      currentPage,
    ],
    queryFn: () =>
      getMyDonations({
        type: filterType || undefined,
        status: filterStatus || undefined,
        anonymous: filterAnonymous || undefined,
        search: debouncedSearch || undefined,
        page: currentPage - 1, // backend is 0-indexed
        size: PAGE_SIZE,
      }),
    staleTime: 5000,
  });

  const donations = response?.result?.content || [];
  const totalElements = response?.result?.totalElements ?? 0;
  const totalPages = response?.result?.totalPages ?? 1;

  const [updatingVisibilityIds, setUpdatingVisibilityIds] = useState<Record<number, boolean>>({});

  const handleToggleAmountVisibility = async (donationId: number, currentHiddenStatus: boolean) => {
    if (updatingVisibilityIds[donationId]) return;
    try {
      setUpdatingVisibilityIds((prev) => ({ ...prev, [donationId]: true }));
      const res = await toggleDonationAmountVisibility(donationId, !currentHiddenStatus);
      if (res.success) {
        toast.success(
          currentLang === 'vi'
            ? `Đã ${!currentHiddenStatus ? 'ẩn' : 'hiển thị'} số tiền quyên góp thành công.`
            : `Donation amount ${!currentHiddenStatus ? 'hidden' : 'shown'} successfully.`,
        );
        void refetch();
      } else {
        toast.error(
          res.message ||
            (currentLang === 'vi'
              ? 'Không thể cập nhật quyền riêng tư số tiền.'
              : 'Failed to update donation amount visibility.'),
        );
      }
    } catch (error) {
      console.error(error);
      toast.error(currentLang === 'vi' ? 'Đã xảy ra lỗi.' : 'An error occurred.');
    } finally {
      setUpdatingVisibilityIds((prev) => ({ ...prev, [donationId]: false }));
    }
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' || filterType !== '' || filterStatus !== '' || filterAnonymous;

  const showNoDonationsAtAll = !hasActiveFilters && totalElements === 0;
  const showNoResultsFound = hasActiveFilters && totalElements === 0;

  const safePage = Math.min(currentPage, totalPages);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterType('');
    setFilterStatus('');
    setFilterAnonymous(false);
    setCurrentPage(1);
  };

  // ── Formatters ─────────────────────────────────────────────────────────────

  const parseAmount = (val: unknown): number => {
    if (!val) return 0;
    const num = Number(val);
    return Number.isNaN(num) ? 0 : num;
  };

  const displayAmount = (val: unknown): React.ReactNode => {
    if (val === undefined || val === null) return '—';
    const num = Number(val);
    if (Number.isNaN(num)) return String(val);

    return (
      <Tooltip content={`Exact amount: ${formatFullCurrency(num)}`}>
        <span className="inline-flex flex-wrap items-baseline gap-x-0.5 cursor-default leading-none">
          {/* Compact version shown on tablet/mobile */}
          <span className="lg:hidden text-sm font-bold text-slate-900 tabular-nums whitespace-nowrap">
            {formatCompactNumber(num)}
          </span>
          {/* Full version shown on desktop (lg and up) */}
          <span className="hidden lg:inline text-sm font-bold text-slate-900 tabular-nums whitespace-nowrap">
            {new Intl.NumberFormat('vi-VN').format(num)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">VNĐ</span>
        </span>
      </Tooltip>
    );
  };

  // ── Insight metrics (derived from overall user donations) ──────────────────
  const completedDonations = allDonations.filter((d) => d.status === 'SUCCESSFUL');

  const totalMoneyDonated = completedDonations
    .filter((d) => d.type === 'MONEY')
    .reduce((sum, d) => sum + parseAmount(d.amount), 0);

  const totalCount = completedDonations.length;
  const anonymousCount = completedDonations.filter((d) => d.isAnonymous).length;
  const campaignsCount = new Set(completedDonations.map((d) => d.campaignId)).size;

  const insights = [
    {
      label: currentLang === 'vi' ? 'Tổng tiền đóng góp' : 'Total Contributed',
      titleText: totalMoneyDonated > 0 ? formatFullCurrency(totalMoneyDonated, 'VNĐ') : undefined,
      value:
        totalMoneyDonated > 0 ? (
          totalMoneyDonated >= 1_000_000_000 ? (
            <Tooltip content={`Exact amount: ${formatFullCurrency(totalMoneyDonated, 'VNĐ')}`}>
              <span className="flex flex-col @[280px]:flex-row @[280px]:items-baseline gap-y-0.5 @[280px]:gap-x-1 focus:outline-hidden cursor-default relative">
                {/* Compact display shown when card width is narrow (< 280px) */}
                <span className="@[280px]:hidden">{formatCompactNumber(totalMoneyDonated)}</span>
                {/* Full display shown when card width is wide (>= 280px) */}
                <span className="hidden @[280px]:inline">
                  {new Intl.NumberFormat('en-US').format(totalMoneyDonated)}
                </span>
                <span className="text-xs font-semibold text-slate-400 shrink-0">VNĐ</span>
              </span>
            </Tooltip>
          ) : (
            <Tooltip content={`Exact amount: ${formatFullCurrency(totalMoneyDonated, 'VNĐ')}`}>
              <span className="flex flex-col @[160px]:flex-row @[160px]:items-baseline gap-y-0.5 @[160px]:gap-x-1 focus:outline-hidden cursor-default relative">
                {/* Compact display shown when card width is narrow (< 160px) */}
                <span className="@[160px]:hidden">{formatCompactNumber(totalMoneyDonated)}</span>
                {/* Full display shown when card width is wide (>= 160px) */}
                <span className="hidden @[160px]:inline">
                  {new Intl.NumberFormat('en-US').format(totalMoneyDonated)}
                </span>
                <span className="text-xs font-semibold text-slate-400 shrink-0">VNĐ</span>
              </span>
            </Tooltip>
          )
        ) : (
          '—'
        ),
      sub:
        currentLang === 'vi' ? 'Tất cả các khoản quyên góp bằng tiền' : 'All money contributions',
      icon: TrendingUp,
      accent: 'from-emerald-300 to-teal-300',
      text: 'text-emerald-600',
    },
    {
      label: currentLang === 'vi' ? 'Tổng lượt quyên góp' : 'Total Donations',
      value: totalCount.toString(),
      sub: currentLang === 'vi' ? 'Tất cả hình thức' : 'All types combined',
      icon: HandCoins,
      accent: 'from-blue-300 to-indigo-300',
      text: 'text-blue-600',
    },
    {
      label: currentLang === 'vi' ? 'Ủng hộ ẩn danh' : 'Anonymous',
      value: anonymousCount.toString(),
      sub: currentLang === 'vi' ? 'Lượt quyên góp riêng tư' : 'Private donations',
      icon: EyeOff,
      accent: 'from-violet-300 to-purple-300',
      text: 'text-violet-600',
    },
    {
      label: currentLang === 'vi' ? 'Chiến dịch đã ủng hộ' : 'Campaigns Supported',
      value: campaignsCount.toString(),
      sub:
        currentLang === 'vi' ? 'Số chiến dịch khác nhau đã đóng góp' : 'Unique campaigns supported',
      icon: Target,
      accent: 'from-sky-300 to-cyan-300',
      text: 'text-sky-600',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
      {/* ── HERO HEADER ─────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          <Heart className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          <span>{currentLang === 'vi' ? 'Lịch sử quyên góp' : 'Giving History'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
          {currentLang === 'vi' ? 'Quyên góp của tôi' : 'My Donations'}
        </h1>
        <p className="text-sm sm:text-base text-slate-500 max-w-2xl leading-relaxed mt-1.5">
          {currentLang === 'vi'
            ? 'Theo dõi trạng thái thời gian thực các khoản quyên góp bằng tiền và hiện vật của bạn. Mỗi tấm lòng ủng hộ đều được ghi nhận tại đây.'
            : 'Track the real-time status of your money and goods contributions. Every act of generosity is recorded here.'}
        </p>
      </div>

      {/* ── INSIGHT CARDS (only when data exists) ───────────────────────────── */}
      {!isAllLoading && allDonations.length > 0 && (
        <section aria-label="Donation summary">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {insights.map(({ label, value, titleText, sub, icon: Icon, accent, text }) => {
              const isCard1 =
                label === (currentLang === 'vi' ? 'Tổng tiền đóng góp' : 'Total Contributed');
              return (
                <div
                  key={label}
                  className={[
                    'relative rounded-2xl border border-slate-200/60 p-5',
                    'shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-300',
                    'hover:shadow-md hover:-translate-y-0.5',
                    isCard1 ? '@container' : 'bg-white overflow-hidden',
                  ].join(' ')}
                  style={
                    isCard1
                      ? {
                          background:
                            'linear-gradient(to bottom, transparent 4px, #ffffff 4px), linear-gradient(to right, #a7f3d0, #99f6e4)',
                        }
                      : undefined
                  }
                >
                  {!isCard1 && (
                    <div
                      className={`absolute top-0 left-0 right-0 h-[4px] rounded-t-2xl bg-gradient-to-r ${accent}`}
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                        {label}
                      </p>
                      {isCard1 && totalMoneyDonated > 0 ? (
                        <div className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2 text-slate-900">
                          {value}
                        </div>
                      ) : (
                        <p
                          className={`text-xl sm:text-2xl font-extrabold tracking-tight truncate mt-2 ${text}`}
                          title={titleText || (typeof value === 'string' ? value : undefined)}
                        >
                          {value}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 leading-tight mt-1 font-medium">
                        {sub}
                      </p>
                    </div>
                    <div
                      className="shrink-0 rounded-xl p-2.5 bg-slate-50 border border-slate-100/60"
                      aria-hidden="true"
                    >
                      <Icon className={`h-4 w-4 ${text}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── SEARCH & FILTER BAR ─────────────────────────────────────────────── */}
      {!isLoading && !isError && !showNoDonationsAtAll && (
        <section aria-label="Search and filter donations">
          <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:border-slate-300/80 transition-all duration-300">
            {/* Search input */}
            <div className="flex-1 w-full">
              <Input
                id="donation-search"
                type="search"
                placeholder={
                  currentLang === 'vi'
                    ? 'Tìm kiếm theo tên chiến dịch hoặc ghi chú...'
                    : 'Search by campaign name or transaction ID…'
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label="Search donations"
                startAdornment={<Search className="h-4 w-4 text-slate-400" aria-hidden="true" />}
                className="rounded-xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:shrink-0">
              {/* Type filter */}
              <Select
                value={filterType}
                onValueChange={(val) => {
                  setFilterType(val === '__all__' ? '' : (val as DonationType));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  id="filter-type"
                  aria-label="Filter by donation type"
                  className="w-full sm:w-[140px] cursor-pointer rounded-xl"
                >
                  <SelectValue placeholder={currentLang === 'vi' ? 'Tất cả loại' : 'All Types'} />
                </SelectTrigger>
                <SelectContent>
                  {ALL_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value === '' ? '__all__' : opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status filter */}
              <Select
                value={filterStatus}
                onValueChange={(val) => {
                  setFilterStatus(val === '__all__' ? '' : (val as DonationStatus));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger
                  id="filter-status"
                  aria-label="Filter by donation status"
                  className="w-full sm:w-[140px] cursor-pointer rounded-xl"
                >
                  <SelectValue
                    placeholder={currentLang === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value === '' ? '__all__' : opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Anonymous filter button */}
              <button
                type="button"
                onClick={() => {
                  setFilterAnonymous((prev) => !prev);
                  setCurrentPage(1);
                }}
                className={cn(
                  'h-10 px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer select-none shrink-0 w-full sm:w-auto',
                  filterAnonymous
                    ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
                )}
              >
                <div
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    filterAnonymous
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : 'border-slate-300 bg-white',
                  )}
                >
                  {filterAnonymous && (
                    <Check className="h-3 w-3 stroke-[3] text-white" aria-hidden="true" />
                  )}
                </div>
                <EyeOff
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    filterAnonymous ? 'text-purple-600' : 'text-slate-400',
                  )}
                  aria-hidden="true"
                />
                <span>{currentLang === 'vi' ? 'Chỉ xem ẩn danh' : 'Anonymous only'}</span>
              </button>

              {/* Clear filters button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  aria-label="Clear all filters"
                  className="group h-10 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-xs font-semibold text-slate-600 hover:text-red-600 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 w-full sm:w-auto shadow-2xs"
                >
                  <X
                    className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500 transition-colors"
                    aria-hidden="true"
                  />
                  <span>{currentLang === 'vi' ? 'Xóa lọc' : 'Clear'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Active filter chips + result count */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-xs text-slate-400">
              {currentLang === 'vi' ? (
                <>
                  Tìm thấy <span className="font-semibold text-slate-600">{totalElements}</span>{' '}
                  lượt quyên góp
                </>
              ) : (
                <>
                  Found <span className="font-semibold text-slate-600">{totalElements}</span>{' '}
                  donation
                  {totalElements !== 1 ? 's' : ''}
                </>
              )}
            </span>

            {filterType !== '' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                {ALL_TYPES.find((t) => t.value === filterType)?.label}
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('');
                    setCurrentPage(1);
                  }}
                  aria-label="Remove type filter"
                  className="ml-0.5 hover:text-blue-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filterStatus !== '' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                {ALL_STATUSES.find((s) => s.value === filterStatus)?.label}
                <button
                  type="button"
                  onClick={() => {
                    setFilterStatus('');
                    setCurrentPage(1);
                  }}
                  aria-label="Remove status filter"
                  className="ml-0.5 hover:text-blue-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filterAnonymous && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                <EyeOff className="h-3 w-3" aria-hidden="true" />
                {currentLang === 'vi' ? 'Chỉ xem ẩn danh' : 'Anonymous only'}
                <button
                  type="button"
                  onClick={() => {
                    setFilterAnonymous(false);
                    setCurrentPage(1);
                  }}
                  aria-label="Remove anonymous filter"
                  className="ml-0.5 hover:text-blue-900 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </section>
      )}

      {/* ── TABLE / STATES ──────────────────────────────────────────────────── */}
      {isLoading ? (
        /* Loading state */
        <div
          role="status"
          aria-label="Loading donations"
          className="flex flex-col items-center justify-center py-24 rounded-2xl border border-slate-100 bg-white space-y-4 shadow-sm"
        >
          <div
            className="h-9 w-9 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin"
            aria-hidden="true"
          />
          <p className="text-sm text-slate-500 font-medium">
            {currentLang === 'vi' ? 'Đang tải lịch sử quyên góp…' : 'Loading your donations…'}
          </p>
        </div>
      ) : isError ? (
        /* Error state */
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-red-100 bg-red-50/30 text-center px-6 space-y-3 shadow-sm">
          <div className="rounded-full bg-red-100 p-3" aria-hidden="true">
            <AlertCircle className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-base">
              {currentLang === 'vi'
                ? 'Không thể tải lịch sử quyên góp'
                : 'Unable to load donations'}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {currentLang === 'vi'
                ? 'Đã xảy ra lỗi khi tải dữ liệu lịch sử.'
                : 'Something went wrong while fetching your history.'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="cursor-pointer border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
          >
            {currentLang === 'vi' ? 'Thử lại' : 'Try again'}
          </Button>
        </div>
      ) : showNoDonationsAtAll ? (
        /* Empty state — no donations at all */
        <div className="flex flex-col items-center justify-center py-28 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center px-6 space-y-4">
          <div className="relative" aria-hidden="true">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-inner">
              <HandCoins className="h-9 w-9 text-blue-400" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm">
              <Heart className="h-2.5 w-2.5 text-white fill-white" />
            </span>
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-xl font-bold text-slate-900">
              {currentLang === 'vi' ? 'Chưa có khoản quyên góp nào' : 'No donations yet'}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              {currentLang === 'vi'
                ? 'Bạn chưa thực hiện khoản quyên góp nào. Hãy tham gia một chiến dịch và thực hiện quyên góp đầu tiên — mỗi tấm lòng ủng hộ đều quý giá.'
                : "You haven't made any contributions yet. Join a campaign and make your first donation — every bit of generosity counts."}
            </p>
          </div>
        </div>
      ) : showNoResultsFound ? (
        /* Empty state — no results matching filters */
        <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-slate-200 bg-white text-center px-6 space-y-4">
          <div className="rounded-full bg-slate-100 p-4" aria-hidden="true">
            <Search className="h-7 w-7 text-slate-400" />
          </div>
          <div className="space-y-1 max-w-xs">
            <h3 className="font-semibold text-slate-900">
              {currentLang === 'vi' ? 'Không tìm thấy kết quả' : 'No results found'}
            </h3>
            <p className="text-sm text-slate-500">
              {currentLang === 'vi'
                ? 'Không có khoản quyên góp nào khớp với bộ lọc hiện tại. Hãy thử thay đổi ô tìm kiếm hoặc xóa bộ lọc.'
                : 'No donations match your current filters. Try adjusting your search or clearing the filters.'}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={clearFilters}
            className="cursor-pointer rounded-xl border-slate-200 text-slate-600 hover:border-slate-300"
          >
            {currentLang === 'vi' ? 'Xóa bộ lọc' : 'Clear filters'}
          </Button>
        </div>
      ) : (
        /* ── Donations table ──────────────────────────────────────────────── */
        <section aria-label="Donations table">
          <div className="rounded-2xl border border-slate-200/60 overflow-x-auto bg-white shadow-[0_2px_8px_rgba(0,0,0,0.015)] w-full max-w-full">
            <Table className="min-w-full table-fixed">
              <TableHeader>
                <TableRow className="bg-slate-50/75 border-b border-slate-200/60 hover:bg-slate-50/75">
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-3 w-[22%]">
                    {currentLang === 'vi' ? 'Chiến dịch' : 'Campaign'}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-3 w-[9%]">
                    {currentLang === 'vi' ? 'Loại' : 'Type'}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-3 w-[16%]">
                    {currentLang === 'vi' ? 'Khoản quyên góp' : 'Contribution'}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-3 w-[13%]">
                    {currentLang === 'vi' ? 'Mã giao dịch' : 'Transaction Ref'}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-3 w-[12%]">
                    {currentLang === 'vi' ? 'Trạng thái' : 'Status'}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-3 w-[18%]">
                    {currentLang === 'vi' ? 'Ngày' : 'Date'}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-3 w-[10%]">
                    {currentLang === 'vi' ? 'Quyền riêng tư' : 'Visibility'}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {donations.map((donation) => (
                  <TableRow
                    key={donation.id}
                    className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors duration-150"
                  >
                    {/* Campaign name */}
                    <TableCell className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span
                          className="font-semibold text-slate-800 text-sm leading-snug group-hover:text-slate-900 transition-colors line-clamp-2 break-words"
                          title={donation.campaignName}
                        >
                          {donation.campaignName}
                        </span>
                        {donation.isAnonymous && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 mt-0.5">
                            <EyeOff className="h-3 w-3" aria-hidden="true" />
                            {currentLang === 'vi' ? 'Ẩn danh' : 'Anonymous'}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Donation type */}
                    <TableCell className="py-3.5 px-4">
                      {donation.type === 'MONEY' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                          <Coins className="h-3.5 w-3.5" aria-hidden="true" />
                          {currentLang === 'vi' ? 'Tiền' : 'Money'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2.5 py-1">
                          <HandCoins className="h-3.5 w-3.5" aria-hidden="true" />
                          {currentLang === 'vi' ? 'Hiện vật' : 'Goods'}
                        </span>
                      )}
                    </TableCell>

                    {/* Contribution value */}
                    <TableCell className="py-3.5 px-4">
                      {donation.type === 'MONEY' ? (
                        displayAmount(donation.amount)
                      ) : (
                        <span
                          className="text-sm text-slate-600 line-clamp-1 max-w-[130px]"
                          title={donation.detail ?? undefined}
                        >
                          {donation.detail}
                        </span>
                      )}
                    </TableCell>

                    {/* Transaction ID */}
                    <TableCell className="py-3.5 px-4 text-xs font-mono text-slate-500">
                      <div
                        className="truncate max-w-[130px]"
                        title={
                          donation.transactionDescription || donation.transactionId || undefined
                        }
                      >
                        {donation.transactionDescription || donation.transactionId || '—'}
                      </div>
                    </TableCell>

                    {/* Status badge */}
                    <TableCell className="py-3.5 px-4">
                      {donation.status === 'SUCCESSFUL' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                          {localizeDonationStatus('SUCCESSFUL', currentLang)}
                        </span>
                      ) : donation.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                          {localizeDonationStatus('PENDING', currentLang)}
                        </span>
                      ) : donation.status === 'REJECTED' ? (
                        <DonationRejectReason
                          rejectReason={donation.rejectReason}
                          confirmedAt={donation.confirmedAt}
                        />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                          {localizeDonationStatus('CANCELLED', currentLang)}
                        </span>
                      )}
                    </TableCell>

                    {/* Date */}
                    <TableCell className="py-3.5 px-3">
                      <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                        <Calendar
                          className="h-3.5 w-3.5 text-slate-400 shrink-0"
                          aria-hidden="true"
                        />
                        <span>{localizeShortDate(donation.createdAt, currentLang)}</span>
                      </div>
                    </TableCell>

                    {/* Amount Visibility Toggle */}
                    <TableCell className="py-3.5 px-3">
                      {donation.type === 'MONEY' && donation.status === 'SUCCESSFUL' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={updatingVisibilityIds[donation.id]}
                            onClick={() =>
                              handleToggleAmountVisibility(donation.id, !!donation.isAmountHidden)
                            }
                            className={`p-1 rounded-full hover:bg-slate-100/80 transition-colors focus-visible:outline-none ${updatingVisibilityIds[donation.id] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer text-slate-500 hover:text-slate-700'}`}
                            title={
                              donation.isAmountHidden
                                ? currentLang === 'vi'
                                  ? 'Hiển thị số tiền quyên góp cho mọi người'
                                  : 'Show donation amount to others'
                                : currentLang === 'vi'
                                  ? 'Ẩn số tiền quyên góp với mọi người'
                                  : 'Hide donation amount from others'
                            }
                          >
                            {donation.isAmountHidden ? (
                              <div className="flex items-center gap-1.5">
                                <EyeOff className="h-4 w-4 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {currentLang === 'vi' ? 'Đã ẩn' : 'Hidden'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <Eye className="h-4 w-4 text-emerald-600" />
                                <span className="text-xs text-emerald-600 font-semibold">
                                  {currentLang === 'vi' ? 'Hiển thị' : 'Shown'}
                                </span>
                              </div>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ── PAGINATION ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
            {/* Range info */}
            <p className="text-sm text-slate-450 order-2 sm:order-1 font-medium">
              {currentLang === 'vi' ? (
                <>
                  Hiển thị{' '}
                  <span className="font-medium text-slate-600">
                    {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, totalElements)}
                  </span>{' '}
                  trong số <span className="font-medium text-slate-600">{totalElements}</span> lượt
                  quyên góp
                </>
              ) : (
                <>
                  Showing{' '}
                  <span className="font-medium text-slate-600">
                    {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, totalElements)}
                  </span>{' '}
                  of <span className="font-medium text-slate-600">{totalElements}</span> donation
                  {totalElements !== 1 ? 's' : ''}
                </>
              )}
            </p>

            {/* Page controls */}
            {totalPages > 1 && (
              <nav
                aria-label="Pagination"
                className="inline-flex items-center gap-1 order-1 sm:order-2"
              >
                {/* Prev */}
                <button
                  type="button"
                  onClick={() => goToPage(safePage - 1)}
                  disabled={safePage === 1}
                  aria-label="Previous page"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page number pills */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show: first, last, current ±1, and ellipsis
                  const isFirst = page === 1;
                  const isLast = page === totalPages;
                  const isNearCurrent = Math.abs(page - safePage) <= 1;

                  if (!isFirst && !isLast && !isNearCurrent) {
                    // Render ellipsis only once between gaps
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <span key={page} className="px-1 text-xs text-slate-400 select-none">
                          …
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => goToPage(page)}
                      aria-label={`Page ${page}`}
                      aria-current={page === safePage ? 'page' : undefined}
                      className={[
                        'inline-flex items-center justify-center h-8 min-w-8 px-2.5 rounded-lg text-xs font-semibold transition-colors',
                        page === safePage
                          ? 'bg-blue-600 text-white border border-blue-600 shadow-sm shadow-blue-500/20'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      ].join(' ')}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next */}
                <button
                  type="button"
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === totalPages}
                  aria-label="Next page"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
