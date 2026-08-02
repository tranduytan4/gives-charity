import { ArrowLeft, Check, ChevronLeft, ChevronRight, Hourglass, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthUser } from '@/features/auth/hooks';
import { useCampaignDetails } from '@/features/campaign/hooks';
import {
  useApproveUnjoinRequest,
  useRejectUnjoinRequest,
  useUnjoinRequests,
} from '@/features/campaign_member/hooks/hooks';
import type { UnjoinRequestResponse } from '@/features/campaign_member/types/types';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { ROUTES } from '@/shared/constants/routes';
import NotFoundPage from '@/shared/layouts/NotFoundPage';
import { parseUTCDate } from '@/shared/utils/format';
import { getAvatarUrl } from '@/shared/utils/media';

const PAGE_SIZE = 10;

export default function CampaignUnjoinRequestsPage() {
  const { id } = useParams<{ id: string }>();
  const campaignId = Number(id);
  const { data: user, isLoading: isLoadingUser } = useAuthUser();

  const { data: response, isLoading: isLoadingCampaign } = useCampaignDetails(id || '');
  const campaign = response?.result;

  const isCampaignCreator = campaign?.creatorId && user?.id === campaign.creatorId;
  const isCampaignMemberAdmin = campaign?.roleInCampaign === 'CAMPAIGN_ADMIN';
  const isCampaignAdmin = !!isCampaignCreator || isCampaignMemberAdmin || !!campaign?.campaignAdmin;

  const [page, setPage] = useState(0);
  const [rejectTarget, setRejectTarget] = useState<UnjoinRequestResponse | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState(false);

  useEffect(() => {
    if (rejectTarget) {
      setRejectReason('');
      setRejectReasonError(false);
    }
  }, [rejectTarget]);

  const {
    data: pageData,
    isLoading: isLoadingRequests,
    isFetching,
  } = useUnjoinRequests(campaignId, page, PAGE_SIZE, isCampaignAdmin);

  const approveMutation = useApproveUnjoinRequest(campaignId);
  const rejectMutation = useRejectUnjoinRequest(campaignId);

  const formatDate = (dateStr: string) => {
    try {
      return parseUTCDate(dateStr).toLocaleDateString('en-US', {
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

  const handleApprove = async (request: UnjoinRequestResponse) => {
    try {
      await approveMutation.mutateAsync(request.userId);
      toast.success(`${request.userName} has been unjoined from the campaign.`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to approve unjoin request.');
    }
  };

  const handleOpenReject = (request: UnjoinRequestResponse) => {
    setRejectTarget(request);
    setRejectReason('');
    setRejectReasonError(false);
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectReasonError(true);
      return;
    }
    try {
      await rejectMutation.mutateAsync({ userId: rejectTarget.userId, reason: rejectReason });
      toast.success(`Unjoin request from ${rejectTarget.userName} was rejected.`);
      setRejectTarget(null);
      setRejectReason('');
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || 'Failed to reject unjoin request.');
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
        description="You do not have administrative permissions to review unjoin requests for this campaign."
        backTo={ROUTES.CAMPAIGN_DETAIL.replace(':id', String(campaignId))}
        backToText="Back to Campaign"
      />
    );
  }

  const requests = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={ROUTES.CAMPAIGN_DETAIL.replace(':id', String(campaignId))}
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaign
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-semibold text-gray-800">Unjoin Requests</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 shrink-0">
            <Hourglass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Unjoin Requests</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Volunteers who still have an assigned task must have their unjoin request approved for
              campaign: <span className="text-primary font-bold">{campaign.title}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_12px_38px_rgba(0,0,0,0.03)] border border-gray-100/75 space-y-5">
        {isLoadingRequests ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-xs space-y-3">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 font-medium animate-pulse">
              Loading unjoin requests...
            </p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gradient-to-br from-emerald-50/20 to-teal-50/10 rounded-2xl border border-emerald-100/50 p-8 shadow-2xs">
            <div className="h-12 w-12 rounded-full bg-emerald-100/70 flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg">No pending unjoin requests</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-sm">
              Volunteers without assigned tasks can unjoin immediately, so nothing needs your
              approval right now.
            </p>
          </div>
        ) : (
          <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/75">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Volunteer
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Active Tasks
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Requested At
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {requests.map((request) => (
                    <tr key={request.userId} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2.5">
                          {request.userAvatarUrl ? (
                            <img
                              src={getAvatarUrl(request.userAvatarUrl) ?? undefined}
                              alt={request.userName}
                              className="h-8 w-8 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {request.userName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate">{request.userName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
                        {request.activeTaskCount}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-400">
                        {formatDate(request.requestedAt)}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                            onClick={() => handleApprove(request)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1.5"
                          >
                            {approveMutation.isPending &&
                              approveMutation.variables === request.userId && (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              )}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={approveMutation.isPending || rejectMutation.isPending}
                            onClick={() => handleOpenReject(request)}
                            className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6 bg-slate-50/50">
                <span className="text-xs text-gray-500 font-medium">
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0 || isFetching}
                    variant="outline"
                    size="icon"
                    className="h-8.5 w-8.5 rounded-lg border-slate-200 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1 || isFetching}
                    variant="outline"
                    size="icon"
                    className="h-8.5 w-8.5 rounded-lg border-slate-200 text-gray-500 hover:text-gray-900 cursor-pointer disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {rejectTarget && (
        <Dialog
          isOpen={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          title="Reject Unjoin Request"
          className="max-w-lg rounded-3xl"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Rejecting <span className="font-semibold text-gray-900">{rejectTarget.userName}</span>
              's request keeps them as a volunteer on this campaign. They will be notified with your
              reason below.
            </p>
            <div className="space-y-2.5">
              <label
                htmlFor="unjoin-reject-reason"
                className={`block text-xs font-semibold uppercase tracking-wide ${
                  rejectReasonError ? 'text-red-500 font-bold' : 'text-gray-650'
                }`}
              >
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <textarea
                id="unjoin-reject-reason"
                rows={3}
                placeholder="Enter a reason (e.g. task deadline is close, need this volunteer to finish first)..."
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
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setRejectTarget(null)}
                className="cursor-pointer text-xs font-semibold px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                disabled={rejectMutation.isPending}
                onClick={handleConfirmReject}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer flex items-center gap-1.5"
              >
                {rejectMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Reject
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
