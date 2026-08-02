import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EyeOff, Loader2, Pencil, Search, ShieldAlert, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  confirmCampaignDonation,
  editCampaignDonation,
  getCampaignDonationsForAdmin,
  rejectCampaignDonation,
} from '@/features/donations/api';
import { donationQueryKeys } from '@/features/donations/constants/queryKeys';
import type { DonationResponseData } from '@/features/donations/types/types';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
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
import { parseUTCDate } from '@/shared/utils/format';

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  SUCCESSFUL: {
    label: 'Successful',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 font-semibold border-0',
  },
  FAILED: {
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

const EDIT_REASON_TEMPLATES = [
  'Correction: receipt verified manually.',
  'Payment confirmed via alternative bank statement.',
  'Update notes to detail the validation process.',
];

interface CampaignDetailApprovalsProps {
  campaignId: number;
}

export const CampaignDetailApprovals = ({ campaignId }: CampaignDetailApprovalsProps) => {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'PENDING' | 'SUCCESSFUL' | 'CANCELLED' | 'REJECTED' | 'ALL'
  >('ALL');
  const [detailDonation, setDetailDonation] = useState<DonationResponseData | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editReason, setEditReason] = useState('');
  const [editReasonError, setEditReasonError] = useState(false);

  const handleStartEdit = () => {
    setEditReason(detailDonation?.rejectReason || '');
    setEditReasonError(false);
    setShowEditForm(true);
  };

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Fetch campaign donations (contains PENDING, SUCCESSFUL, and FAILED)
  const {
    data: donations = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['campaignAdminDonations', campaignId],
    queryFn: async () => {
      const res = await getCampaignDonationsForAdmin(campaignId);
      if (!res.success) {
        throw new Error(res.message || 'Failed to load donations.');
      }
      return res.result || [];
    },
    enabled: !!campaignId,
    placeholderData: keepPreviousData,
  });

  // Filter based on status filter
  const filteredDonations = donations.filter((d) => {
    const statusMatch = statusFilter === 'ALL' || d.status === statusFilter;
    const typeMatch = d.type === 'MONEY';
    return statusMatch && typeMatch;
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => confirmCampaignDonation(id),
    onSuccess: (data) => {
      toast.success(
        currentLang === 'vi'
          ? 'Duyệt khoản quyên góp thành công!'
          : 'Donation approved successfully!',
      );
      const result = data.result;
      if (data.success && result) {
        queryClient.setQueryData(
          ['campaignAdminDonations', campaignId],
          (old: DonationResponseData[] | undefined) =>
            old?.map((d) => (d.id === result.id ? result : d)) ?? [],
        );
        queryClient.setQueryData(
          ['campaignPendingCount', campaignId],
          (old: DonationResponseData[] | undefined) => old?.filter((d) => d.id !== result.id) ?? [],
        );
      }
      // Invalidate queries to refresh campaign details, supporters lists, etc.
      queryClient.invalidateQueries({ queryKey: ['campaignAdminDonations', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaignPendingCount', campaignId] });
      queryClient.invalidateQueries({ queryKey: donationQueryKeys.campaignDonations(campaignId) });
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (data.success && data.result) {
        setDetailDonation(data.result);
      }
    },
    onError: (err: unknown) => {
      const error = err as { message?: string };
      toast.error(
        error.message ||
          (currentLang === 'vi'
            ? 'Duyệt khoản quyên góp thất bại.'
            : 'Failed to approve donation.'),
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      rejectCampaignDonation(id, reason),
    onSuccess: (data) => {
      toast.success(
        currentLang === 'vi'
          ? 'Từ chối khoản quyên góp thành công!'
          : 'Donation rejected successfully!',
      );
      const result = data.result;
      if (data.success && result) {
        queryClient.setQueryData(
          ['campaignAdminDonations', campaignId],
          (old: DonationResponseData[] | undefined) =>
            old?.map((d) => (d.id === result.id ? result : d)) ?? [],
        );
        queryClient.setQueryData(
          ['campaignPendingCount', campaignId],
          (old: DonationResponseData[] | undefined) => old?.filter((d) => d.id !== result.id) ?? [],
        );
      }
      queryClient.invalidateQueries({ queryKey: ['campaignAdminDonations', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaignPendingCount', campaignId] });
      queryClient.invalidateQueries({ queryKey: donationQueryKeys.campaignDonations(campaignId) });
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (data.success && data.result) {
        setDetailDonation(data.result);
      }
      setShowRejectForm(false);
      setRejectReason('');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string; result?: Record<string, string> };
      const fieldError = error.result ? Object.values(error.result)[0] : undefined;
      toast.error(
        fieldError ||
          error.message ||
          (currentLang === 'vi'
            ? 'Từ chối khoản quyên góp thất bại.'
            : 'Failed to reject donation.'),
      );
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      editCampaignDonation(id, { reason }),
    onSuccess: (data) => {
      toast.success(
        currentLang === 'vi'
          ? 'Cập nhật khoản quyên góp thành công!'
          : 'Donation edited successfully!',
      );
      const result = data.result;
      if (data.success && result) {
        queryClient.setQueryData(
          ['campaignAdminDonations', campaignId],
          (old: DonationResponseData[] | undefined) =>
            old?.map((d) => (d.id === result.id ? result : d)) ?? [],
        );
      }
      queryClient.invalidateQueries({ queryKey: ['campaignAdminDonations', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaignPendingCount', campaignId] });
      queryClient.invalidateQueries({ queryKey: donationQueryKeys.campaignDonations(campaignId) });
      queryClient.invalidateQueries({ queryKey: ['campaign', String(campaignId)] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (data.success && data.result) {
        setDetailDonation(data.result);
      }
      setShowEditForm(false);
      setEditReason('');
    },
    onError: (err: unknown) => {
      const error = err as { message?: string; result?: Record<string, string> };
      const fieldError = error.result ? Object.values(error.result)[0] : undefined;
      toast.error(fieldError || error.message || 'Failed to edit donation.');
    },
  });

  const handleOpenDetail = (donation: DonationResponseData) => {
    setDetailDonation(donation);
    setShowRejectForm(false);
    setRejectReason('');
    if (donation.status === 'CANCELLED') {
      setEditReason(donation.rejectReason || '');
      setEditReasonError(false);
      setShowEditForm(true);
    } else {
      setShowEditForm(false);
    }
  };

  const searchedDonations = filteredDonations.filter((donation) => {
    const term = searchTerm.toLowerCase();
    const donorName = (donation.donorName || 'Anonymous').toLowerCase();
    const desc = (donation.transactionDescription || '').toLowerCase();
    const txId = (donation.transactionId || '').toLowerCase();
    return donorName.includes(term) || desc.includes(term) || txId.includes(term);
  });

  const formatVND = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${new Intl.NumberFormat('vi-VN').format(Number.isNaN(num) ? 0 : num)} VND`;
  };

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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-medium animate-pulse">
          Checking manual transfers...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-100 rounded-2xl text-center p-6 shadow-xs">
        <ShieldAlert className="h-10 w-10 text-red-500 mb-3" />
        <h3 className="font-semibold text-gray-900">Failed to load pending donations</h3>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          An error occurred while fetching campaign data.
        </p>
        <Button variant="outline" onClick={() => refetch()} className="cursor-pointer">
          Retry Check
        </Button>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-gradient-to-br from-emerald-50/20 to-teal-50/10 rounded-2xl border border-emerald-100/50 p-8 shadow-2xs">
        <div className="h-12 w-12 rounded-full bg-emerald-100/70 flex items-center justify-center mb-4">
          <Sparkles className="h-6 w-6 text-emerald-600" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg">No manual donations yet</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          No manual QR transfers have been submitted for this campaign.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-tab-fade">
      {/* Toolbar / Filters */}
      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search Input with Clear Button */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            placeholder="Search by donor, description,..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10 w-full bg-white border-gray-200 h-11"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48 shrink-0">
          <Select
            value={statusFilter}
            onValueChange={(val) =>
              setStatusFilter(val as 'PENDING' | 'SUCCESSFUL' | 'CANCELLED' | 'REJECTED' | 'ALL')
            }
            modal={false}
          >
            <SelectTrigger className="h-11 bg-white border-gray-200 text-sm text-gray-900">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUCCESSFUL">Successful</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="ALL">All Statuses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/75">
            <TableRow>
              <TableHead className="font-semibold text-gray-700 py-3.5 pl-4">Donor</TableHead>
              <TableHead className="font-semibold text-gray-700">Amount</TableHead>
              <TableHead className="font-semibold text-gray-700">Description</TableHead>
              <TableHead className="font-semibold text-gray-700">Submitted At</TableHead>
              <TableHead className="font-semibold text-gray-700">Status</TableHead>
              <TableHead className="font-semibold text-gray-700 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searchedDonations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center text-gray-500">
                  No results match your search query.
                </TableCell>
              </TableRow>
            ) : (
              searchedDonations.map((donation) => {
                const badge = STATUS_BADGES[donation.status] || {
                  label: donation.status,
                  className: '',
                };
                const displayDesc =
                  donation.transactionDescription || donation.transactionId || '—';
                return (
                  <TableRow
                    key={donation.id}
                    onClick={() => handleOpenDetail(donation)}
                    className="hover:bg-slate-50/40 transition-colors duration-150 cursor-pointer"
                  >
                    <TableCell className="py-4 pl-4 font-medium text-gray-900">
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">
                          {donation.isAnonymous ? 'Anonymous' : donation.donorName}
                        </span>
                        {!donation.isAnonymous && donation.donorEmail && (
                          <span className="text-xs text-gray-500 font-normal truncate">
                            {donation.donorEmail}
                          </span>
                        )}
                        {donation.isAnonymous && (
                          <span className="text-[10px] text-gray-400 font-normal flex items-center gap-1 mt-0.5">
                            <EyeOff className="h-3 w-3" /> Hidden from public lists
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-emerald-600">
                      {donation.amount != null ? formatVND(donation.amount) : '—'}
                    </TableCell>
                    <TableCell className="text-gray-650 font-mono text-sm">
                      {displayDesc !== '—' ? (
                        <span
                          className="inline-block align-middle bg-slate-100/70 border border-slate-200/50 px-2 py-0.5 rounded text-xs select-all max-w-[150px] truncate"
                          title={displayDesc}
                        >
                          {displayDesc}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500 font-normal">
                      {formatDate(donation.createdAt)}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge className={badge.className}>{badge.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex justify-end gap-1">
                        {(donation.status === 'PENDING' || donation.status === 'CANCELLED') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetail(donation);
                              if (donation.status === 'CANCELLED') {
                                setEditReason(donation.rejectReason || '');
                                setEditReasonError(false);
                                setShowEditForm(true);
                              }
                            }}
                            className="h-8 w-8 hover:bg-gray-100 cursor-pointer"
                            title="Edit Donation"
                          >
                            <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600 transition-colors" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Donation Details Modal */}
      {detailDonation && (
        <Dialog
          isOpen={!!detailDonation}
          onClose={() => setDetailDonation(null)}
          title={currentLang === 'vi' ? 'Chi tiết khoản quyên góp' : 'Donation Details'}
          className="max-w-lg rounded-3xl"
        >
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                <span className="text-gray-500 font-medium">
                  {currentLang === 'vi' ? 'Trạng thái:' : 'Status:'}
                </span>
                <Badge
                  className={
                    STATUS_BADGES[detailDonation.status]?.className || 'bg-slate-100 text-slate-800'
                  }
                >
                  {currentLang === 'vi'
                    ? detailDonation.status === 'PENDING'
                      ? 'Đang chờ'
                      : detailDonation.status === 'SUCCESSFUL'
                        ? 'Thành công'
                        : detailDonation.status === 'CANCELLED'
                          ? 'Đã hủy'
                          : detailDonation.status === 'REJECTED'
                            ? 'Đã từ chối'
                            : detailDonation.status
                    : STATUS_BADGES[detailDonation.status]?.label || detailDonation.status}
                </Badge>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 font-medium shrink-0">
                  {currentLang === 'vi' ? 'Nhà hào tâm:' : 'Donor:'}
                </span>
                <span className="text-gray-900 font-semibold text-right">
                  {detailDonation.isAnonymous
                    ? currentLang === 'vi'
                      ? 'Ẩn danh'
                      : 'Anonymous'
                    : detailDonation.donorName}
                  {detailDonation.isAnonymous && (
                    <span className="block text-[10px] text-gray-400 font-normal mt-0.5">
                      {currentLang === 'vi'
                        ? 'Ẩn danh trên danh sách công khai'
                        : 'Hidden from public lists'}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  {currentLang === 'vi' ? 'Số tiền:' : 'Amount:'}
                </span>
                <span className="text-emerald-600 font-extrabold text-lg">
                  {detailDonation.amount != null ? formatVND(detailDonation.amount) : '—'}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-gray-500 font-medium shrink-0">
                  {currentLang === 'vi' ? 'Nội dung:' : 'Description:'}
                </span>
                <span className="text-gray-900 font-mono text-xs text-right bg-white border border-slate-200/60 px-2 py-1 rounded-lg select-all max-w-[240px] break-all">
                  {detailDonation.transactionDescription || '—'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">
                  {currentLang === 'vi' ? 'Thời gian gửi:' : 'Submitted At:'}
                </span>
                <span className="text-gray-900 text-xs font-semibold">
                  {formatDate(detailDonation.createdAt)}
                </span>
              </div>

              {detailDonation.status === 'SUCCESSFUL' && detailDonation.confirmedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">
                    {currentLang === 'vi' ? 'Thời gian duyệt:' : 'Approved At:'}
                  </span>
                  <span className="text-emerald-700 text-xs font-semibold">
                    {formatDate(detailDonation.confirmedAt)}
                  </span>
                </div>
              )}

              {detailDonation.status === 'REJECTED' && detailDonation.confirmedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">
                    {currentLang === 'vi' ? 'Thời gian từ chối:' : 'Rejected At:'}
                  </span>
                  <span className="text-red-700 text-xs font-semibold">
                    {formatDate(detailDonation.confirmedAt)}
                  </span>
                </div>
              )}

              {detailDonation.status === 'CANCELLED' && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">
                    {currentLang === 'vi' ? 'Thời gian hủy:' : 'Cancelled At:'}
                  </span>
                  <span className="text-gray-900 text-xs font-semibold">
                    {formatDate(detailDonation.updatedAt || detailDonation.createdAt)}
                  </span>
                </div>
              )}

              {detailDonation.updatedAt &&
                detailDonation.updatedAt !== detailDonation.createdAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">
                      {currentLang === 'vi' ? 'Thời gian chỉnh sửa:' : 'Edited At:'}
                    </span>
                    <span className="text-blue-700 text-xs font-semibold">
                      {formatDate(detailDonation.updatedAt)}
                    </span>
                  </div>
                )}

              {detailDonation.message && (
                <div className="flex flex-col gap-1 pt-2 border-t border-slate-200/50">
                  <span className="text-gray-500 font-medium">
                    {currentLang === 'vi' ? 'Lời nhắn từ nhà hào tâm:' : 'Donor Message:'}
                  </span>
                  <p className="text-gray-700 italic bg-white border border-slate-200/50 rounded-xl p-3 text-xs leading-relaxed">
                    {detailDonation.message}
                  </p>
                </div>
              )}

              {detailDonation.rejectReason && (
                <div
                  className={`flex flex-col gap-1 pt-2 border-t ${detailDonation.status === 'REJECTED' ? 'border-red-200/50' : 'border-blue-200/50'}`}
                >
                  <span
                    className={
                      detailDonation.status === 'REJECTED'
                        ? 'text-red-650 font-semibold'
                        : 'text-blue-650 font-semibold'
                    }
                  >
                    {detailDonation.status === 'REJECTED'
                      ? currentLang === 'vi'
                        ? 'Lý do từ chối:'
                        : 'Rejection Reason:'
                      : currentLang === 'vi'
                        ? 'Ghi chú của quản trị viên:'
                        : 'Admin Note:'}
                  </span>
                  <p
                    className={`${detailDonation.status === 'REJECTED' ? 'text-red-705 bg-red-50/50 border border-red-105' : 'text-blue-705 bg-blue-50/50 border border-blue-105'} rounded-xl p-3 text-xs leading-relaxed`}
                  >
                    {detailDonation.rejectReason}
                  </p>
                </div>
              )}
            </div>

            {/* Receipt Proof Image */}
            {detailDonation.transactionProofUrl && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {currentLang === 'vi' ? 'Minh chứng chuyển khoản' : 'Transaction Receipt Proof'}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPreviewImageUrl(
                      `${
                        import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
                      }/media/${detailDonation.transactionProofUrl}`,
                    )
                  }
                  className="w-full relative border border-slate-200 hover:border-slate-300 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 group shadow-xs cursor-zoom-in transition-colors"
                >
                  <img
                    src={`${
                      import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
                    }/media/${detailDonation.transactionProofUrl}`}
                    alt="Receipt Proof"
                    className="max-w-full max-h-[220px] object-contain rounded-xl"
                  />
                </button>
              </div>
            )}

            {/* Rejection Form (Inline) */}
            {showRejectForm && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100 animate-fade-in">
                <label
                  htmlFor="modal-reject-reason"
                  className={`block text-xs font-semibold uppercase tracking-wide ${
                    rejectReasonError ? 'text-red-500 font-bold' : 'text-gray-650'
                  }`}
                >
                  {currentLang === 'vi' ? 'Lý do từ chối' : 'Reason for Rejection'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="modal-reject-reason"
                  rows={3}
                  placeholder={
                    currentLang === 'vi'
                      ? 'Nhập lý do từ chối (ví dụ: không tìm thấy mã giao dịch, số tiền không khớp)...'
                      : 'Enter rejection reason (e.g. transaction ID not found, mismatch)...'
                  }
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (e.target.value.trim()) {
                      setRejectReasonError(false);
                    }
                  }}
                  className={`w-full text-sm bg-slate-50 border rounded-xl p-3 focus:outline-none placeholder-gray-400 ${
                    rejectReasonError
                      ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                  }`}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                      setRejectReasonError(false);
                    }}
                    className="cursor-pointer text-xs font-semibold px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl"
                  >
                    {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button
                    disabled={rejectMutation.isPending}
                    onClick={async () => {
                      if (!rejectReason.trim()) {
                        setRejectReasonError(true);
                        return;
                      }
                      await rejectMutation.mutateAsync({
                        id: detailDonation.id,
                        reason: rejectReason,
                      });
                    }}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
                  >
                    {rejectMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {currentLang === 'vi' ? 'Xác nhận từ chối' : 'Confirm Reject'}
                  </Button>
                </div>
              </div>
            )}

            {/* Edit Form (Inline) */}
            {showEditForm && (
              <div className="space-y-4 pt-2 border-t border-slate-100 animate-fade-in">
                <div className="space-y-2.5">
                  <label
                    htmlFor="modal-edit-reason"
                    className={`block text-xs font-semibold uppercase tracking-wide ${
                      editReasonError ? 'text-red-500 font-bold' : 'text-gray-650'
                    }`}
                  >
                    {currentLang === 'vi' ? 'Lý do / Ghi chú chỉnh sửa' : 'Reason / Notes for Edit'}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="modal-edit-reason"
                    rows={3}
                    placeholder={
                      currentLang === 'vi'
                        ? 'Nhập lý do chỉnh sửa...'
                        : 'Enter reason for edit (e.g. corrected transaction, updated bank reference)...'
                    }
                    value={editReason}
                    onChange={(e) => {
                      setEditReason(e.target.value);
                      if (e.target.value.trim()) {
                        setEditReasonError(false);
                      }
                    }}
                    className={`w-full text-sm bg-slate-50 border rounded-xl p-3 focus:outline-none placeholder-gray-400 ${
                      editReasonError
                        ? 'border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500'
                        : 'border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">
                    {currentLang === 'vi' ? 'Mẫu nhanh' : 'Quick templates'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {EDIT_REASON_TEMPLATES.map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => {
                          setEditReason(template);
                          setEditReasonError(false);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
                      >
                        {template}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditReason('');
                      setEditReasonError(false);
                    }}
                    className="cursor-pointer text-xs font-semibold px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl"
                  >
                    {currentLang === 'vi' ? 'Hủy' : 'Cancel'}
                  </Button>
                  <Button
                    disabled={editMutation.isPending}
                    onClick={async () => {
                      if (!editReason.trim()) {
                        setEditReasonError(true);
                        return;
                      }
                      await editMutation.mutateAsync({
                        id: detailDonation.id,
                        reason: editReason,
                      });
                    }}
                    className={`text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5 ${
                      detailDonation.status === 'PENDING'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {editMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {detailDonation.status === 'PENDING'
                      ? currentLang === 'vi'
                        ? 'Xác nhận từ chối'
                        : 'Confirm Rejection'
                      : currentLang === 'vi'
                        ? 'Xác nhận & Duyệt'
                        : 'Confirm & Approve'}
                  </Button>
                </div>
              </div>
            )}

            {!showRejectForm && !showEditForm && (
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setDetailDonation(null)}
                  className="cursor-pointer text-xs font-semibold px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl"
                >
                  {currentLang === 'vi' ? 'Đóng' : 'Close'}
                </Button>
                {detailDonation.status === 'CANCELLED' && (
                  <>
                    <Button
                      variant="outline"
                      disabled={
                        confirmMutation.isPending ||
                        rejectMutation.isPending ||
                        editMutation.isPending
                      }
                      onClick={handleStartEdit}
                      className="bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      {currentLang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={
                        confirmMutation.isPending ||
                        rejectMutation.isPending ||
                        editMutation.isPending
                      }
                      onClick={() => setShowRejectForm(true)}
                      className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      {currentLang === 'vi' ? 'Từ chối' : 'Reject'}
                    </Button>
                  </>
                )}
                {detailDonation.status === 'PENDING' && (
                  <>
                    <Button
                      disabled={confirmMutation.isPending}
                      onClick={async () => {
                        await confirmMutation.mutateAsync(detailDonation.id);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
                    >
                      {confirmMutation.isPending && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      )}
                      {currentLang === 'vi' ? 'Duyệt' : 'Approve'}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={confirmMutation.isPending || rejectMutation.isPending}
                      onClick={() => setShowRejectForm(true)}
                      className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      {currentLang === 'vi' ? 'Từ chối' : 'Reject'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </Dialog>
      )}

      {/* Receipt Proof Preview Dialog */}
      {previewImageUrl && (
        <Dialog
          isOpen={!!previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
          title="Receipt Proof Preview"
          className="max-w-3xl rounded-3xl"
        >
          <div className="flex flex-col items-center justify-center p-2 space-y-4">
            <img
              src={previewImageUrl}
              alt="Receipt Proof Full"
              className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-md"
            />
            <Button
              variant="outline"
              onClick={() => setPreviewImageUrl(null)}
              className="cursor-pointer text-xs font-semibold px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl"
            >
              Close Preview
            </Button>
          </div>
        </Dialog>
      )}
    </div>
  );
};
