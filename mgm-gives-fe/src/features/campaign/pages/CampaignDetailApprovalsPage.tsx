import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Coins,
  EyeOff,
  Loader2,
  Pencil,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthUser } from '@/features/auth/hooks';
import { useCampaignDetails } from '@/features/campaign/hooks';
import { useDashboardSocket } from '@/features/dashboard/hooks/useDashboardSocket';
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
import { ROUTES } from '@/shared/constants/routes';
import NotFoundPage from '@/shared/layouts/NotFoundPage';
import { parseUTCDate } from '@/shared/utils/format';

const PAGE_SIZE = 10;

const REJECT_REASON_TEMPLATES = [
  'Transaction details do not match the submitted donation.',
  'Transaction proof is unclear or incomplete.',
  'Duplicate donation transaction detected.',
];

const EDIT_REASON_TEMPLATES = [
  'Correction: receipt verified manually.',
  'Payment confirmed via alternative bank statement.',
  'Update notes to detail the validation process.',
];

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

export default function CampaignDetailApprovalsPage() {
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const campaignId = Number(id);
  const queryClient = useQueryClient();
  const { data: user, isLoading: isLoadingUser } = useAuthUser();

  useDashboardSocket(() => {
    if (campaignId) {
      queryClient.invalidateQueries({
        queryKey: ['campaignAdminDonations', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: donationQueryKeys.campaignDonations(campaignId),
      });
    }
  });

  const { data: response, isLoading: isLoadingCampaign } = useCampaignDetails(id || '');
  const campaign = response?.result;

  const isCampaignCreator = campaign?.creatorId && user?.id === campaign.creatorId;
  const isCampaignMemberAdmin = campaign?.roleInCampaign === 'CAMPAIGN_ADMIN';
  const isCampaignAdmin = !!isCampaignCreator || isCampaignMemberAdmin || !!campaign?.campaignAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

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
    isLoading: isLoadingDonations,
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
    enabled: !!campaignId && isCampaignAdmin,
    placeholderData: keepPreviousData,
  });

  // Calculate pending donations for count statistics
  const pendingDonations = donations.filter((d) => d.status === 'PENDING' && d.type === 'MONEY');

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
      queryClient.invalidateQueries({
        queryKey: ['campaignAdminDonations', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaignPendingCount', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: donationQueryKeys.campaignDonations(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: ['campaign', String(campaignId)],
      });
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
      queryClient.invalidateQueries({
        queryKey: ['campaignAdminDonations', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaignPendingCount', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: donationQueryKeys.campaignDonations(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: ['campaign', String(campaignId)],
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (data.success && data.result) {
        setDetailDonation(data.result);
      }
      setShowRejectForm(false);
      setRejectReason('');
    },
    onError: (err: unknown) => {
      const error = err as {
        message?: string;
        result?: Record<string, string>;
      };
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
      queryClient.invalidateQueries({
        queryKey: ['campaignAdminDonations', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaignPendingCount', campaignId],
      });
      queryClient.invalidateQueries({
        queryKey: donationQueryKeys.campaignDonations(campaignId),
      });
      queryClient.invalidateQueries({
        queryKey: ['campaign', String(campaignId)],
      });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      if (data.success && data.result) {
        setDetailDonation(data.result);
      }
      setShowEditForm(false);
      setEditReason('');
    },
    onError: (err: unknown) => {
      const error = err as {
        message?: string;
        result?: Record<string, string>;
      };
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

  if (isLoadingCampaign || isLoadingUser) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500 font-medium">Loading campaign details...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <NotFoundPage
        title="Campaign Not Found"
        description="The campaign you are looking for does not exist or has been removed."
        backTo={ROUTES.CAMPAIGNS}
        backToText="Back to Campaigns"
      />
    );
  }

  if (!isCampaignAdmin) {
    return (
      <NotFoundPage
        title="Access Denied"
        description="You do not have administrative permissions to review manual donations for this campaign."
        backTo={ROUTES.CAMPAIGN_DETAIL.replace(':id', String(campaignId))}
        backToText="Back to Campaign"
      />
    );
  }

  // Frontend Pagination Logic
  const totalPages = Math.max(1, Math.ceil(searchedDonations.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const paginatedDonations = searchedDonations.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb / Back Navigation */}
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.CAMPAIGN_DETAIL.replace(':id', String(campaignId))}
          state={state}
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaign
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800">Donation Approvals</span>
      </div>

      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Donation Approvals</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Review and approve manual QR transfer donations for campaign:{' '}
              <span className="text-primary font-bold">{campaign.title}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl px-5 py-3 shadow-xs">
          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Pending Count
            </p>
            <p className="text-lg font-black text-gray-900 leading-none mt-0.5">
              {pendingDonations.length} transfers
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_38px_rgba(0,0,0,0.03)] border border-gray-100/75 space-y-5">
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
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-10 w-full bg-white border-gray-200 h-11"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
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
              onValueChange={(val) => {
                setStatusFilter(val as 'PENDING' | 'SUCCESSFUL' | 'CANCELLED' | 'REJECTED' | 'ALL');
                setCurrentPage(1);
              }}
              modal={false}
            >
              <SelectTrigger className="h-11 bg-white border-gray-200 text-sm text-gray-900">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUCCESSFUL">Successful</SelectItem>
                <SelectItem value="FAILED">Cancelled</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoadingDonations ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium animate-pulse">
              Checking manual transfers...
            </p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-100 rounded-2xl text-center p-6 shadow-xs">
            <ShieldAlert className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="font-semibold text-gray-900">Failed to load donations</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">
              An error occurred while fetching campaign data.
            </p>
            <Button variant="outline" onClick={() => refetch()} className="cursor-pointer">
              Retry Check
            </Button>
          </div>
        ) : donations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gradient-to-br from-emerald-50/20 to-teal-50/10 rounded-2xl border border-emerald-100/50 p-8 shadow-2xs">
            <div className="h-12 w-12 rounded-full bg-emerald-100/70 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">No manual donations yet</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              No manual QR transfers have been submitted for this campaign.
            </p>
          </div>
        ) : (
          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/75">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Donor
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Submitted At
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {searchedDonations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400">
                        No results match your search query.
                      </td>
                    </tr>
                  ) : (
                    paginatedDonations.map((donation) => {
                      const badge = STATUS_BADGES[donation.status] || {
                        label: donation.status,
                        className: '',
                      };
                      const displayDesc =
                        donation.transactionDescription || donation.transactionId || '—';
                      return (
                        <tr
                          key={donation.id}
                          onClick={() => handleOpenDetail(donation)}
                          className="hover:bg-slate-50/40 transition-colors duration-150 cursor-pointer"
                        >
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
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
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm font-bold text-emerald-600">
                            {donation.amount != null ? formatVND(donation.amount) : '—'}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 font-mono">
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
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-400">
                            {formatDate(donation.createdAt)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs">
                            <Badge className={badge.className}>{badge.label}</Badge>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-1">
                              {(donation.status === 'PENDING' ||
                                donation.status === 'CANCELLED') && (
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
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6 bg-slate-50/50">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">
                      Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span>{' '}
                      to{' '}
                      <span className="font-semibold text-gray-900">
                        {Math.min(safePage * PAGE_SIZE, searchedDonations.length)}
                      </span>{' '}
                      of{' '}
                      <span className="font-semibold text-gray-900">
                        {searchedDonations.length}
                      </span>{' '}
                      results
                    </p>
                  </div>
                  <div>
                    <nav
                      className="isolate inline-flex -space-x-px rounded-xl shadow-2xs gap-1.5 animate-fade-in"
                      aria-label="Pagination"
                    >
                      <Button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        variant="outline"
                        size="icon"
                        className="h-8.5 w-8.5 rounded-lg border-slate-200 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="px-3.5 py-1.5 text-sm font-semibold text-gray-700 bg-white border border-slate-200 rounded-lg">
                        Page {safePage} of {totalPages}
                      </span>
                      <Button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        variant="outline"
                        size="icon"
                        className="h-8.5 w-8.5 rounded-lg border-slate-200 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
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
                  <p className="max-w-full whitespace-pre-wrap [overflow-wrap:anywhere] text-gray-700 italic bg-white border border-slate-200/50 rounded-xl p-3 text-xs leading-relaxed">
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
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500">Quick templates</p>
                  <div className="flex flex-wrap gap-2">
                    {REJECT_REASON_TEMPLATES.map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => {
                          setRejectReason(template);
                          setRejectReasonError(false);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700"
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
                    Reason / Notes for Edit <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="modal-edit-reason"
                    rows={3}
                    placeholder="Enter reason for edit (e.g. corrected transaction, updated bank reference)..."
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
                  <p className="text-xs font-semibold text-gray-500">Quick templates</p>
                  <div className="flex flex-wrap gap-2">
                    {EDIT_REASON_TEMPLATES.map((template) => (
                      <button
                        key={template}
                        type="button"
                        onClick={() => {
                          setEditReason(template);
                          setEditReasonError(false);
                        }}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
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
                    Cancel
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
                      ? 'Confirm Rejection'
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
                  Close
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
                      Edit
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
                      Reject
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
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      disabled={confirmMutation.isPending || rejectMutation.isPending}
                      onClick={() => setShowRejectForm(true)}
                      className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer"
                    >
                      Reject
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
}
