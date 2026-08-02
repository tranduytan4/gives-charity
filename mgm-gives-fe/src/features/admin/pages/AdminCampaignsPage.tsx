import { Check, Clock, Eye, Megaphone, Search, TrendingUp, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCategories } from '@/features/category/hooks/useCategories';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
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
import { parseUTCDate } from '@/shared/utils/format';
import { getCampaignsList } from '../api/adminCampaignApi';
import RejectCampaignDialog from '../components/RejectCampaignDialog';
import { useAdminCampaignMutations } from '../hooks/useAdminCampaignMutations';
import type { AdminCampaignResponse, CampaignStatus, CategoryResponse } from '../types';

const VISIBLE_CATEGORY_LIMIT = 2;

const getStatusLabel = (status: CampaignStatus, lang: string) => {
  if (lang === 'vi') {
    switch (status) {
      case 'PENDING':
        return 'Đang chờ duyệt';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'IN_PROGRESS':
        return 'Đang diễn ra';
      case 'REJECTED':
        return 'Đã từ chối';
      case 'COMPLETED':
        return 'Hoàn thành';
      default:
        return status;
    }
  }
  switch (status) {
    case 'PENDING':
      return 'Pending';
    case 'APPROVED':
      return 'Approved';
    case 'IN_PROGRESS':
      return 'In Progress';
    case 'REJECTED':
      return 'Rejected';
    case 'COMPLETED':
      return 'Completed';
    default:
      return status;
  }
};

const getStatusBadgeClassName = (status: CampaignStatus) => {
  switch (status) {
    case 'APPROVED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100';
    case 'PENDING':
      return 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100';
    case 'REJECTED':
      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50';
    case 'IN_PROGRESS':
      return 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-50';
    case 'COMPLETED':
      return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100';
  }
};

const formatDate = (dateString: string) => {
  return parseUTCDate(dateString)
    .toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('/')
    .reverse()
    .join('-'); // returns YYYY-MM-DD
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('de-DE').format(amount); // Returns 12.000.000 format
};

const formatCompactCurrency = (amount: number): string => {
  if (amount >= 1_000_000_000) {
    const b = amount / 1_000_000_000;
    return `${b % 1 === 0 ? b : Number(b.toFixed(1))}B VNĐ`;
  }
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m % 1 === 0 ? m : Number(m.toFixed(1))}M VNĐ`;
  }
  return `${new Intl.NumberFormat('de-DE').format(amount)} VNĐ`;
};

const sortCategoriesByName = <T extends { name: string }>(categories: T[]) =>
  [...categories].sort((a, b) => a.name.localeCompare(b.name));

function CampaignCategoryBadges({ categories }: { categories: CategoryResponse[] }) {
  const sortedCategories = sortCategoriesByName(categories);
  const visibleCategories = sortedCategories.slice(0, VISIBLE_CATEGORY_LIMIT);
  const hiddenCategories = sortedCategories.slice(VISIBLE_CATEGORY_LIMIT);

  return (
    <div className="flex flex-wrap gap-1">
      {visibleCategories.map((category) => (
        <Badge
          key={category.id}
          variant="outline"
          className="border-gray-200 bg-gray-50/50 text-xs font-medium text-gray-600"
        >
          {category.name}
        </Badge>
      ))}

      {hiddenCategories.length > 0 && (
        <div className="group relative">
          <button
            type="button"
            className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            aria-label={`Show ${hiddenCategories.length} more categories`}
          >
            <Badge
              variant="outline"
              className="cursor-default border-blue-200 bg-blue-50 text-xs font-semibold text-blue-600 transition-colors group-hover:bg-blue-100"
            >
              +{hiddenCategories.length} more
            </Badge>
          </button>

          <div
            role="tooltip"
            className="invisible absolute top-full left-0 z-50 mt-1.5 w-64 rounded-xl border border-gray-200/80 bg-white p-3 opacity-0 shadow-[0_10px_30px_rgba(15,23,42,0.15)] transition-all duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
          >
            <p className="mb-2 text-xs font-bold text-gray-900">More categories</p>
            <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              {hiddenCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="border-gray-200 bg-gray-50/50 text-xs font-medium text-gray-600"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCampaignsPage() {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();

  // Stats Metrics State
  const [metrics, setMetrics] = useState({ total: 0, inProgress: 0, pending: 0 });
  const [isMetricsLoading, setIsMetricsLoading] = useState(true);

  // Query / Filter State
  const [searchVal, setSearchVal] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'ANY'>('ANY');
  const [categoryFilter, setCategoryFilter] = useState<number | 'ANY'>('ANY');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 10;

  // Campaigns list state
  const [campaigns, setCampaigns] = useState<AdminCampaignResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Dialog/Modal State
  const [campaignToReject, setCampaignToReject] = useState<AdminCampaignResponse | null>(null);

  const requestCountRef = useRef(0);

  // Fetch metrics cards
  const fetchMetrics = useCallback(async () => {
    setIsMetricsLoading(true);
    try {
      const [totalRes, inProgressRes, pendingRes] = await Promise.all([
        getCampaignsList({ size: 1 }),
        getCampaignsList({ status: 'IN_PROGRESS', size: 1 }),
        getCampaignsList({ status: 'PENDING', size: 1 }),
      ]);
      setMetrics({
        total: totalRes.result?.totalElements || 0,
        inProgress: inProgressRes.result?.totalElements || 0,
        pending: pendingRes.result?.totalElements || 0,
      });
    } catch (error) {
      console.error('Failed to fetch campaign metrics', error);
    } finally {
      setIsMetricsLoading(false);
    }
  }, []);

  // Fetch list of campaigns
  const fetchCampaigns = useCallback(async () => {
    const currentRequest = ++requestCountRef.current;
    setIsLoading(true);
    try {
      const params: {
        status?: string;
        categoryId?: number;
        keyword?: string;
        page?: number;
        size?: number;
        sort?: string;
      } = {
        page: currentPage,
        size: pageSize,
        sort: 'createdAt,desc',
      };

      if (statusFilter !== 'ANY') params.status = statusFilter;
      if (categoryFilter !== 'ANY') params.categoryId = categoryFilter;
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();

      const response = await getCampaignsList(params);

      if (currentRequest !== requestCountRef.current) return;

      if (response.success && response.result) {
        setCampaigns(response.result.content);
        setTotalPages(response.result.totalPages);
        setTotalElements(response.result.totalElements);
      } else {
        toast.error(response.message || 'Failed to fetch campaigns');
      }
    } catch (error) {
      if (currentRequest !== requestCountRef.current) return;
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to fetch campaigns');
    } finally {
      if (currentRequest === requestCountRef.current) {
        setIsLoading(false);
      }
    }
  }, [currentPage, statusFilter, categoryFilter, debouncedKeyword]);

  // Initial and reactive loading
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(searchVal);
      setCurrentPage(0);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const handleRefresh = () => {
    fetchCampaigns();
    fetchMetrics();
  };

  // Mutation hooks
  const { handleApprove, handleReject } = useAdminCampaignMutations({
    onSuccess: handleRefresh,
  });

  const onApprove = async (campaign: AdminCampaignResponse) => {
    await handleApprove(campaign.id);
  };

  const onRejectRequest = (campaign: AdminCampaignResponse) => {
    setCampaignToReject(campaign);
  };

  const onRejectConfirm = async (campaignId: number, reason: string) => {
    await handleReject(campaignId, reason);
  };

  const onViewDetails = (campaign: AdminCampaignResponse) => {
    navigate(`/admin/campaigns/${campaign.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {t('campaignTable.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">{t('campaignTable.subtitle')}</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Campaigns */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Megaphone className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
              {t('stats.totalCampaigns')}
            </span>
            {isMetricsLoading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{metrics.total}</div>
            )}
          </div>
        </div>

        {/* Card 2: In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
              {t('common:status.inProgress', 'In Progress')}
            </span>
            {isMetricsLoading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{metrics.inProgress}</div>
            )}
          </div>
        </div>

        {/* Card 3: Pending */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
              {t('common:status.pending', 'Pending')}
            </span>
            {isMetricsLoading ? (
              <div className="h-8 w-16 bg-slate-100 animate-pulse rounded-md mt-1" />
            ) : (
              <div className="text-3xl font-extrabold text-gray-900 mt-1">{metrics.pending}</div>
            )}
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('campaignTable.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder-gray-400"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val as CampaignStatus | 'ANY');
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 h-[38px]">
              <SelectValue placeholder={t('campaignTable.allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">{t('campaignTable.allStatuses')}</SelectItem>
              <SelectItem value="PENDING">{t('common:status.pending', 'Pending')}</SelectItem>
              <SelectItem value="APPROVED">{t('common:status.approved', 'Approved')}</SelectItem>
              <SelectItem value="IN_PROGRESS">
                {t('common:status.inProgress', 'In Progress')}
              </SelectItem>
              <SelectItem value="REJECTED">{t('common:status.rejected', 'Rejected')}</SelectItem>
              <SelectItem value="COMPLETED">{t('common:status.completed', 'Completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-56">
          <Select
            value={String(categoryFilter)}
            onValueChange={(val) => {
              setCategoryFilter(val === 'ANY' ? 'ANY' : Number(val));
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-sm text-gray-700 h-[38px]">
              <SelectValue placeholder={t('campaignTable.allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ANY">{t('campaignTable.allCategories')}</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="w-[25%] font-semibold text-gray-600">
                {currentLang === 'vi' ? 'Chiến dịch' : 'Campaign'}
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                {currentLang === 'vi' ? 'Danh mục' : 'Category'}
              </TableHead>
              <TableHead className="min-w-[170px] font-semibold text-gray-600">
                {currentLang === 'vi' ? 'Người tạo' : 'Organizer'}
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                {currentLang === 'vi' ? 'Tiến độ' : 'Progress'}
              </TableHead>
              <TableHead className="font-semibold text-gray-600">
                {currentLang === 'vi' ? 'Trạng thái' : 'Status'}
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-600 pr-6">
                {currentLang === 'vi' ? 'Thao tác' : 'Actions'}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-gray-400 text-sm">
                  {currentLang === 'vi'
                    ? 'Đang tải danh sách chiến dịch...'
                    : 'Loading campaigns...'}
                </TableCell>
              </TableRow>
            ) : campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <TableRow key={campaign.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Campaign Column */}
                  <TableCell className="w-[25%] max-w-0 py-4 align-top">
                    <div className="min-w-0">
                      <div className="break-words text-sm font-semibold leading-5 text-gray-900 [overflow-wrap:anywhere]">
                        {campaign.title}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {currentLang === 'vi'
                          ? `Gửi ngày ${formatDate(campaign.createdAt)}`
                          : `Submitted ${formatDate(campaign.createdAt)}`}
                      </div>
                    </div>
                  </TableCell>

                  {/* Category Column */}
                  <TableCell>
                    <CampaignCategoryBadges categories={campaign.categories} />
                  </TableCell>

                  {/* Organizer Column */}
                  <TableCell className="min-w-[170px] text-gray-900 font-medium text-sm">
                    {campaign.creatorName}
                  </TableCell>

                  {/* Progress Column */}
                  <TableCell>
                    {(() => {
                      const targetGoal = campaign.target || 0;
                      const currentRaised = campaign.currentRaised || 0;
                      const progressPercentage =
                        targetGoal > 0 ? Math.min((currentRaised / targetGoal) * 100, 100) : 0;
                      return (
                        <div className="w-48">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                          <div
                            className="text-xs text-gray-500 mt-1 font-medium whitespace-nowrap"
                            title={`${formatCurrency(currentRaised)} VNĐ / ${formatCurrency(targetGoal)} VNĐ`}
                          >
                            {formatCompactCurrency(currentRaised)} /{' '}
                            {formatCompactCurrency(targetGoal)}
                          </div>
                        </div>
                      );
                    })()}
                  </TableCell>

                  {/* Status Column */}
                  <TableCell>
                    <Badge className={getStatusBadgeClassName(campaign.status)}>
                      {getStatusLabel(campaign.status, currentLang)}
                    </Badge>
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="text-right pr-6 py-4">
                    <div className="flex justify-end gap-1">
                      {/* View details */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewDetails(campaign)}
                        title={currentLang === 'vi' ? 'Xem chi tiết' : 'View Details'}
                        className="h-8 w-8 rounded-lg"
                      >
                        <Eye className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                      </Button>

                      {/* Approve & Reject (Only shown for PENDING campaigns) */}
                      {campaign.status === 'PENDING' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onApprove(campaign)}
                            title={currentLang === 'vi' ? 'Phê duyệt' : 'Approve Campaign'}
                            className="h-8 w-8 rounded-lg"
                          >
                            <Check className="h-4 w-4 text-emerald-600 hover:text-emerald-700" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onRejectRequest(campaign)}
                            title={currentLang === 'vi' ? 'Từ chối' : 'Reject Campaign'}
                            className="h-8 w-8 rounded-lg"
                          >
                            <X className="h-4 w-4 text-rose-600 hover:text-rose-700" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500 space-y-3 py-6">
                    <div className="rounded-full bg-slate-100 p-3">
                      <Megaphone className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 text-base">
                        {currentLang === 'vi'
                          ? 'Không tìm thấy chiến dịch nào'
                          : 'No campaigns found'}
                      </p>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto">
                        {currentLang === 'vi'
                          ? 'Không có chiến dịch nào phù hợp với bộ lọc đã chọn.'
                          : 'There are no campaigns matching the selected filters.'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                variant="outline"
                size="sm"
              >
                {currentLang === 'vi' ? 'Trước' : 'Previous'}
              </Button>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={currentPage === totalPages - 1}
                variant="outline"
                size="sm"
              >
                {currentLang === 'vi' ? 'Sau' : 'Next'}
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  {currentLang === 'vi' ? (
                    <>
                      Hiển thị{' '}
                      <span className="font-medium text-gray-900">
                        {currentPage * pageSize + 1}
                      </span>{' '}
                      đến{' '}
                      <span className="font-medium text-gray-900">
                        {Math.min((currentPage + 1) * pageSize, totalElements)}
                      </span>{' '}
                      trong tổng số{' '}
                      <span className="font-medium text-gray-900">{totalElements}</span> kết quả
                    </>
                  ) : (
                    <>
                      Showing{' '}
                      <span className="font-medium text-gray-900">
                        {currentPage * pageSize + 1}
                      </span>{' '}
                      to{' '}
                      <span className="font-medium text-gray-900">
                        {Math.min((currentPage + 1) * pageSize, totalElements)}
                      </span>{' '}
                      of <span className="font-medium text-gray-900">{totalElements}</span> results
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                  disabled={currentPage === 0}
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9"
                >
                  {currentLang === 'vi' ? 'Trước' : 'Previous'}
                </Button>
                <span className="text-sm text-gray-500 font-medium px-2">
                  {currentLang === 'vi'
                    ? `Trang ${currentPage + 1} / ${totalPages}`
                    : `Page ${currentPage + 1} of ${totalPages}`}
                </span>
                <Button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                  disabled={currentPage === totalPages - 1}
                  variant="outline"
                  size="sm"
                  className="rounded-lg h-9"
                >
                  {currentLang === 'vi' ? 'Sau' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table Footer Legend / Note */}
      <p className="text-xs text-gray-400 px-1 font-normal">
        {currentLang === 'vi'
          ? '* Ghi chú: M = Triệu (VNĐ), B = Tỷ (VNĐ)'
          : '* Note: M = Million (VND), B = Billion (VND)'}
      </p>

      {/* Reject Confirmation Dialog */}
      <RejectCampaignDialog
        isOpen={campaignToReject !== null}
        onClose={() => setCampaignToReject(null)}
        campaign={campaignToReject}
        onConfirm={onRejectConfirm}
      />
    </div>
  );
}
