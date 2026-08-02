import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  EyeOff,
  Gift,
  HandCoins,
  Search,
  ShieldAlert,
  TrendingUp,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboardSocket } from '@/features/dashboard/hooks/useDashboardSocket';
import {
  type DonationStatus,
  type DonationType,
  getAdminDonations,
} from '@/features/donations/api';
import DonationRejectReason from '@/features/donations/components/DonationRejectReason';
import { Badge } from '@/shared/components/ui/Badge';
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
import { formatCompactNumber, formatFullCurrency } from '@/shared/utils/currency';
import { parseUTCDate } from '@/shared/utils/format';
import { localizeDonationStatus } from '@/shared/utils/localizeContent';
import { useAdminDashboard } from '../hooks/useAdminDashboard';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  SUCCESSFUL: {
    label: 'Successful',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 font-semibold border-0',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800 hover:bg-gray-100 font-semibold border-0',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-rose-100 text-rose-800 hover:bg-rose-100 font-semibold border-0',
  },
  PENDING: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 hover:bg-amber-100 font-semibold border-0',
  },
};

export default function AdminDonationManagement() {
  const { t, i18n } = useTranslation(['admin', 'common', 'donation']);
  const currentLang = i18n.language;
  const [statusFilter, setStatusFilter] = useState<DonationStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<DonationType | ''>('');
  const [searchFilter, setSearchFilter] = useState('');
  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const debouncedSearch = useDebounce(searchFilter, 500);

  // Fetch admin donations
  const {
    data: response,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['adminDonations', statusFilter, typeFilter, debouncedSearch, page, size],
    queryFn: () =>
      getAdminDonations({
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        search: debouncedSearch || undefined,
        page,
        size,
      }),
    staleTime: 5000,
  });

  const queryClient = useQueryClient();

  // Fetch admin dashboard data (for total money donated)
  const { data: dashboardData } = useAdminDashboard();

  // Fetch pending donations count
  const { data: pendingRes } = useQuery({
    queryKey: ['adminDonationsCount', 'PENDING'],
    queryFn: () => getAdminDonations({ status: 'PENDING', page: 0, size: 1 }),
    staleTime: 5000,
  });

  // Fetch successful donations count
  const { data: successfulRes } = useQuery({
    queryKey: ['adminDonationsCount', 'SUCCESSFUL'],
    queryFn: () => getAdminDonations({ status: 'SUCCESSFUL', page: 0, size: 1 }),
    staleTime: 5000,
  });

  // Fetch total donations count
  const { data: totalRes } = useQuery({
    queryKey: ['adminDonationsCount', 'ALL'],
    queryFn: () => getAdminDonations({ page: 0, size: 1 }),
    staleTime: 5000,
  });

  const pendingCount = pendingRes?.result?.totalElements ?? 0;
  const successfulCount = successfulRes?.result?.totalElements ?? 0;
  const totalDonationsCount = totalRes?.result?.totalElements ?? 0;
  const totalMoneyDonated = dashboardData?.overview?.totalDonation ?? 0;

  // Subscribe to real-time update events via WebSocket
  useDashboardSocket(() => {
    queryClient.invalidateQueries({ queryKey: ['adminDonations'] });
    queryClient.invalidateQueries({ queryKey: ['adminDonationsCount'] });
    queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
  });

  const donations = response?.result?.content || [];
  const totalPages = response?.result?.totalPages || 0;
  const totalElements = response?.result?.totalElements || 0;

  const formatDate = (dateStr: string) => {
    try {
      const date = parseUTCDate(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const renderMoneyAmount = (val: unknown): React.ReactNode => {
    if (val === undefined || val === null) return '—';
    const num = Number(val);
    if (Number.isNaN(num)) return String(val);

    return (
      <Tooltip content={`Exact amount: ${formatFullCurrency(num)}`}>
        <span className="inline-flex flex-wrap items-baseline gap-x-0.5 cursor-default leading-none">
          {/* Compact version shown on tablet/mobile */}
          <span className="lg:hidden text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">
            {formatCompactNumber(num)}
          </span>
          {/* Full version shown on desktop (lg and up) */}
          <span className="hidden lg:inline text-sm font-semibold text-slate-900 tabular-nums whitespace-nowrap">
            {new Intl.NumberFormat('vi-VN').format(num)}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase">VND</span>
        </span>
      </Tooltip>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex justify-between items-center border-b pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {t('donationTable.title')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('donationTable.subtitle')}</p>
        </div>
      </div>

      {/* ── STAT CARDS ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total money donated */}
        <div
          className="relative rounded-2xl border border-slate-200/60 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 @container"
          style={{
            background:
              'linear-gradient(to bottom, transparent 4px, #ffffff 4px), linear-gradient(to right, #a7f3d0, #99f6e4)',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                {currentLang === 'vi' ? 'TỔNG TIỀN VẬN ĐỘNG' : 'TOTAL RAISED'}
              </p>
              <div className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2 text-slate-900">
                {totalMoneyDonated >= 1_000_000_000 ? (
                  <Tooltip
                    content={`Exact amount: ${formatFullCurrency(totalMoneyDonated, 'VND')}`}
                  >
                    <span className="flex flex-col @[280px]:flex-row @[280px]:items-baseline gap-y-0.5 @[280px]:gap-x-1 focus:outline-hidden cursor-default relative">
                      <span className="@[280px]:hidden">
                        {formatCompactNumber(totalMoneyDonated)}
                      </span>
                      <span className="hidden @[280px]:inline">
                        {new Intl.NumberFormat(currentLang === 'vi' ? 'vi-VN' : 'en-US').format(
                          totalMoneyDonated,
                        )}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 shrink-0">VNĐ</span>
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip
                    content={`Exact amount: ${formatFullCurrency(totalMoneyDonated, 'VND')}`}
                  >
                    <span className="flex flex-col @[160px]:flex-row @[160px]:items-baseline gap-y-0.5 @[160px]:gap-x-1 focus:outline-hidden cursor-default relative">
                      <span className="@[160px]:hidden">
                        {formatCompactNumber(totalMoneyDonated)}
                      </span>
                      <span className="hidden @[160px]:inline">
                        {new Intl.NumberFormat(currentLang === 'vi' ? 'vi-VN' : 'en-US').format(
                          totalMoneyDonated,
                        )}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 shrink-0">VNĐ</span>
                    </span>
                  </Tooltip>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-1 font-medium">
                {currentLang === 'vi'
                  ? 'Tổng quỹ quyên góp toàn hệ thống'
                  : 'Total system-wide funds'}
              </p>
            </div>
            <div
              className="shrink-0 rounded-xl p-2.5 bg-slate-50 border border-slate-100/60 text-emerald-600"
              aria-hidden="true"
            >
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Card 2: Total donations count */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[4px] rounded-t-2xl bg-gradient-to-r from-blue-300 to-indigo-300" />
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                {currentLang === 'vi' ? 'TỔNG LƯỢT QUYÊN GÓP' : 'TOTAL DONATIONS'}
              </p>
              <p className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2 text-slate-900">
                {totalDonationsCount}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight mt-1 font-medium">
                {currentLang === 'vi' ? 'Lượt đóng góp đã ghi nhận' : 'All-time submitted logs'}
              </p>
            </div>
            <div
              className="shrink-0 rounded-xl p-2.5 bg-slate-50 border border-slate-100/60 text-blue-600"
              aria-hidden="true"
            >
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Card 3: Pending Approval */}
        <div
          className={[
            'relative overflow-hidden rounded-2xl border p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300',
            pendingCount > 0 ? 'border-amber-250 bg-amber-50/20' : 'border-slate-200/60 bg-white',
          ].join(' ')}
        >
          <div className="absolute top-0 left-0 right-0 h-[4px] rounded-t-2xl bg-gradient-to-r from-amber-300 to-orange-300" />
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                {currentLang === 'vi' ? 'ĐANG CHỜ DUYỆT' : 'PENDING APPROVAL'}
              </p>
              <p
                className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-2 ${
                  pendingCount > 0 ? 'text-amber-700' : 'text-slate-900'
                }`}
              >
                {pendingCount}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight mt-1 font-medium">
                {pendingCount > 0
                  ? currentLang === 'vi'
                    ? 'Cần quản trị viên duyệt'
                    : 'Requires admin review'
                  : currentLang === 'vi'
                    ? 'Không có khoản chờ duyệt'
                    : 'No pending actions'}
              </p>
            </div>
            <div
              className={`shrink-0 rounded-xl p-2.5 border ${
                pendingCount > 0
                  ? 'bg-amber-100/60 border-amber-200/40 text-amber-700'
                  : 'bg-slate-50 border-slate-100/60 text-amber-600'
              }`}
              aria-hidden="true"
            >
              <Clock className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Card 4: Successful */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-[4px] rounded-t-2xl bg-gradient-to-r from-green-300 to-emerald-300" />
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-1 min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                {currentLang === 'vi' ? 'THÀNH CÔNG' : 'SUCCESSFUL'}
              </p>
              <p className="text-xl sm:text-2xl font-extrabold tracking-tight mt-2 text-slate-900">
                {successfulCount}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight mt-1 font-medium">
                {currentLang === 'vi' ? 'Khoản quyên góp đã xác nhận' : 'Verified contributions'}
              </p>
            </div>
            <div
              className="shrink-0 rounded-xl p-2.5 bg-slate-50 border border-slate-100/60 text-emerald-600"
              aria-hidden="true"
            >
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_2px_8px_rgba(0,0,0,0.015)] hover:border-slate-300/80 transition-all duration-300">
        {/* Search input */}
        <div className="flex-1 w-full">
          <Input
            id="donation-search"
            type="search"
            placeholder={t('donationTable.searchPlaceholder')}
            value={searchFilter}
            onChange={(e) => {
              setSearchFilter(e.target.value);
              setPage(0);
            }}
            startAdornment={<Search className="h-4 w-4 text-slate-400" aria-hidden="true" />}
            className="rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto lg:shrink-0">
          {/* Type Select */}
          <Select
            value={typeFilter}
            onValueChange={(val) => {
              setTypeFilter(val === '__all__' ? '' : (val as DonationType));
              setPage(0);
            }}
          >
            <SelectTrigger
              id="filter-type"
              aria-label="Filter by donation type"
              className="w-full sm:w-[140px] cursor-pointer rounded-xl"
            >
              <SelectValue placeholder={t('donationTable.allTypes')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">
                {currentLang === 'vi' ? 'Tất cả hình thức' : 'All Types'}
              </SelectItem>
              <SelectItem value="MONEY">{currentLang === 'vi' ? 'Tiền mặt' : 'Money'}</SelectItem>
              <SelectItem value="GOODS">{currentLang === 'vi' ? 'Hiện vật' : 'Goods'}</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Select */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val === '__all__' ? '' : (val as DonationStatus));
              setPage(0);
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
              <SelectItem value="__all__">
                {currentLang === 'vi' ? 'Tất cả trạng thái' : 'All Statuses'}
              </SelectItem>
              <SelectItem value="PENDING">
                {currentLang === 'vi' ? 'Đang chờ' : 'Pending'}
              </SelectItem>
              <SelectItem value="SUCCESSFUL">
                {currentLang === 'vi' ? 'Thành công' : 'Successful'}
              </SelectItem>
              <SelectItem value="CANCELLED">
                {currentLang === 'vi' ? 'Đã hủy' : 'Cancelled'}
              </SelectItem>
              <SelectItem value="REJECTED">
                {currentLang === 'vi' ? 'Đã từ chối' : 'Rejected'}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {(statusFilter !== '' || typeFilter !== '' || searchFilter !== '') && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setSearchFilter('');
                setPage(0);
              }}
              aria-label="Clear all filters"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {currentLang === 'vi' ? 'Xóa bộ lọc' : 'Clear'}
            </Button>
          )}
        </div>
      </div>

      {/* Result count */}
      <div className="flex items-center gap-2 mt-1 px-1">
        <span className="text-xs text-slate-400">
          {currentLang === 'vi' ? (
            <>
              Tìm thấy <span className="font-semibold text-slate-600">{totalElements}</span> lượt
              đóng góp
            </>
          ) : (
            <>
              Found <span className="font-semibold text-slate-600">{totalElements}</span>{' '}
              contribution
              {totalElements !== 1 ? 's' : ''}
            </>
          )}
        </span>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-2xl bg-white space-y-3">
          <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500">
            {currentLang === 'vi' ? 'Đang tải danh sách đóng góp...' : 'Loading contributions...'}
          </p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-16 border rounded-2xl bg-white text-center p-6">
          <ShieldAlert className="h-10 w-10 text-red-500 mb-3" />
          <h3 className="font-semibold text-gray-900">
            {currentLang === 'vi'
              ? 'Không thể tải danh sách quyên góp'
              : 'Failed to load donations'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            {currentLang === 'vi'
              ? 'Đã xảy ra lỗi trong quá trình lấy dữ liệu hệ thống.'
              : 'An error occurred while fetching system data.'}
          </p>
          <Button variant="outline" onClick={() => refetch()} className="cursor-pointer">
            {currentLang === 'vi' ? 'Thử lại' : 'Retry'}
          </Button>
        </div>
      ) : donations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border rounded-2xl bg-white text-center p-6">
          <Coins className="h-12 w-12 text-gray-300 mb-2" />
          <h3 className="font-semibold text-gray-900">
            {currentLang === 'vi' ? 'Không tìm thấy khoản quyên góp nào' : 'No donations found'}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {currentLang === 'vi'
              ? 'Không có khoản quyên góp nào khớp với tiêu chí bộ lọc của bạn.'
              : 'There are no donations matching your filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/60 overflow-x-auto bg-white shadow-[0_2px_8px_rgba(0,0,0,0.015)] w-full max-w-full">
            <Table className="min-w-[950px] md:min-w-full table-fixed">
              <TableHeader>
                <TableRow className="bg-slate-50/75 border-b border-slate-200/60 hover:bg-slate-50/75">
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 w-[18%] min-w-[150px]">
                    {t('donationTable.donor')}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 w-[21%] min-w-[170px]">
                    {t('donationTable.campaign')}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 w-[10%] min-w-[90px]">
                    {t('donationTable.type')}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 w-[18%] min-w-[150px]">
                    {t('donationTable.amount')}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 w-[15%] min-w-[130px]">
                    {t('donationTable.transactionRef')}
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 w-[110px]">
                    {t('donationTable.status')}
                  </TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-500 uppercase tracking-wider py-3.5 px-4 w-[18%] min-w-[170px]">
                    {t('donationTable.date')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {donations.map((donation) => {
                  const badge = STATUS_BADGES[donation.status] || {
                    label: donation.status,
                    className: '',
                  };
                  return (
                    <TableRow
                      key={donation.id}
                      className="group border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors duration-150"
                    >
                      <TableCell className="font-semibold text-slate-800 text-sm leading-snug py-3.5 px-4">
                        <div className="flex flex-col min-w-0">
                          <span
                            className="truncate text-slate-800 text-sm font-semibold group-hover:text-slate-900 transition-colors"
                            title={
                              donation.isAnonymous
                                ? currentLang === 'vi'
                                  ? 'Ẩn danh'
                                  : 'Anonymous'
                                : donation.userName
                            }
                          >
                            {donation.isAnonymous
                              ? currentLang === 'vi'
                                ? 'Ẩn danh'
                                : 'Anonymous'
                              : donation.userName}
                          </span>
                          <span className="text-xs text-slate-400 font-normal truncate max-w-[150px] mt-0.5">
                            {donation.isAnonymous ? (
                              <span className="flex items-center gap-1 text-[10px]">
                                <EyeOff className="h-3 w-3" />{' '}
                                {currentLang === 'vi' ? 'Ẩn danh' : 'Anonymous'}
                              </span>
                            ) : (
                              donation.userEmail
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div
                          className="line-clamp-2 break-words text-sm font-semibold text-slate-800 leading-snug group-hover:text-slate-900 transition-colors"
                          title={donation.campaignName}
                        >
                          {donation.campaignName}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          {donation.type === 'MONEY' ? (
                            <>
                              <Coins className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              {currentLang === 'vi' ? 'Tiền' : 'Money'}
                            </>
                          ) : (
                            <>
                              <Gift className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                              {currentLang === 'vi' ? 'Hiện vật' : 'Goods'}
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        {donation.type === 'MONEY' ? (
                          renderMoneyAmount(donation.amount)
                        ) : (
                          <span
                            className="text-slate-600 text-xs line-clamp-1 max-w-[130px] font-medium"
                            title={donation.detail ?? undefined}
                          >
                            {donation.detail}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-500 py-3.5 px-4">
                        <div
                          className="truncate max-w-[130px]"
                          title={
                            donation.transactionDescription || donation.transactionId || undefined
                          }
                        >
                          {donation.transactionDescription || donation.transactionId || '—'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-center">
                        <div className="flex flex-col gap-0.5 items-center justify-center">
                          {donation.status === 'REJECTED' ? (
                            <DonationRejectReason
                              rejectReason={donation.rejectReason}
                              confirmedAt={donation.confirmedAt}
                            />
                          ) : (
                            <Badge className={badge.className}>
                              {localizeDonationStatus(donation.status, currentLang)}
                            </Badge>
                          )}
                          {donation.status === 'SUCCESSFUL' && donation.confirmedByName && (
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              {currentLang === 'vi' ? 'Duyệt bởi: ' : 'By: '}
                              {donation.confirmedByName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap">
                          <Calendar
                            className="h-3.5 w-3.5 text-slate-400 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{formatDate(donation.createdAt)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── PAGINATION ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
            {/* Record count info */}
            <p className="text-xs text-slate-400 order-2 sm:order-1">
              {currentLang === 'vi' ? (
                <>
                  Hiển thị{' '}
                  <span className="font-medium text-slate-600">
                    {page * size + 1}–{Math.min((page + 1) * size, totalElements)}
                  </span>{' '}
                  trong tổng số <span className="font-medium text-slate-600">{totalElements}</span>{' '}
                  lượt đóng góp
                </>
              ) : (
                <>
                  Showing{' '}
                  <span className="font-medium text-slate-600">
                    {page * size + 1}–{Math.min((page + 1) * size, totalElements)}
                  </span>{' '}
                  of <span className="font-medium text-slate-600">{totalElements}</span>{' '}
                  contribution
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
                  onClick={() => setPage((p) => Math.max(p - 1, 0))}
                  disabled={page === 0}
                  aria-label="Previous page"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page number pills */}
                {Array.from({ length: totalPages }, (_, i) => i).map((pIndex) => {
                  const displayPage = pIndex + 1;
                  // Show: first, last, current ±1, and ellipsis
                  const isFirst = pIndex === 0;
                  const isLast = pIndex === totalPages - 1;
                  const isNearCurrent = Math.abs(pIndex - page) <= 1;

                  if (!isFirst && !isLast && !isNearCurrent) {
                    if (pIndex === 1 || pIndex === totalPages - 2) {
                      return (
                        <span key={pIndex} className="px-1 text-xs text-slate-400 select-none">
                          …
                        </span>
                      );
                    }
                    return null;
                  }

                  return (
                    <button
                      key={pIndex}
                      type="button"
                      onClick={() => setPage(pIndex)}
                      aria-label={`Page ${displayPage}`}
                      aria-current={pIndex === page ? 'page' : undefined}
                      className={[
                        'inline-flex items-center justify-center h-8 min-w-8 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                        pIndex === page
                          ? 'bg-blue-600 text-white border border-blue-600 shadow-sm shadow-blue-500/20'
                          : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      ].join(' ')}
                    >
                      {displayPage}
                    </button>
                  );
                })}

                {/* Next */}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
                  disabled={page === totalPages - 1}
                  aria-label="Next page"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
