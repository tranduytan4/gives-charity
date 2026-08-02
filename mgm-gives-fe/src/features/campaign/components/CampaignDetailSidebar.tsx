import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Bookmark,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  FileText,
  Flag,
  Heart,
  Hourglass,
  Loader2,
  LogOut,
  Pencil,
  Share2,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AnnouncementShareDialog } from '@/features/announcement/components/AnnouncementShareDialog';
import { useAuthUser } from '@/features/auth/hooks';
import { CampaignDetailProgress } from '@/features/campaign';
import {
  cancelUnjoinRequest,
  followCampaign,
  joinCampaign,
  unfollowCampaign,
  unjoinCampaign,
} from '@/features/campaign/api';
import { campaignQueryKeys } from '@/features/campaign/constants/queryKeys';
import {
  useDeleteCampaignMutation,
  useEndCampaignMutation,
} from '@/features/campaign/hooks/useCampaigns';
import type { ApiResponse, CampaignResponse } from '@/features/campaign/types';
import { useUnjoinRequests } from '@/features/campaign_member/hooks/hooks';
import { getCampaignDonationsForAdmin } from '@/features/donations/api';
import type { DonationResponseData } from '@/features/donations/types/types';
import { Button } from '@/shared/components/ui/Button';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Tooltip } from '@/shared/components/ui/Tooltip';
import { ROUTES } from '@/shared/constants/routes';
import { parseUTCDate } from '@/shared/utils/format';
import { getMediaUrl } from '@/shared/utils/media';
import { CampaignTags } from './CampaignTags';

interface CampaignDetailSidebarProps {
  campaign: CampaignResponse;
  donations?: DonationResponseData[];
  onPostReport?: () => void;
  onVolunteersClick?: () => void;
  onDonorsClick?: () => void;
  publicMode?: boolean;
}

type GuestAuthAction = 'follow' | 'support' | 'volunteer';

const guestAuthPromptContent: Record<GuestAuthAction, { title: string; message: string }> = {
  follow: {
    title: 'Create an account to follow',
    message:
      'Sign up to follow this campaign and receive updates about its progress and announcements.',
  },
  support: {
    title: 'Create an account to support',
    message:
      'Sign up to support this cause, keep your donation details connected to your account, and return to this campaign.',
  },
  volunteer: {
    title: 'Create an account to volunteer',
    message:
      'Sign up to join this campaign as a volunteer and help the campaign team coordinate with you.',
  },
};

const copyTextToClipboard = async (text: string) => {
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for HTTP deployments or browsers that deny the Clipboard API.
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  textArea.style.top = '0';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  const copied = document.execCommand('copy');
  document.body.removeChild(textArea);

  if (!copied) {
    throw new Error('Unable to copy text to clipboard');
  }
};

export function CampaignDetailSidebar({
  campaign,
  donations = [],
  onPostReport,
  onVolunteersClick,
  onDonorsClick,
  publicMode = false,
}: CampaignDetailSidebarProps) {
  const { i18n } = useTranslation('campaign');
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useAuthUser({ enabled: !publicMode });
  const [isFollowed, setIsFollowed] = useState(campaign.isFollowed || false);
  const [isJoined, setIsJoined] = useState(campaign.isJoined || false);
  const [isUnjoinPending, setIsUnjoinPending] = useState(campaign.hasPendingUnjoinRequest || false);
  const [isToggling, setIsToggling] = useState(false);
  const [isTogglingJoin, setIsTogglingJoin] = useState(false);
  const [isCancellingUnjoin, setIsCancellingUnjoin] = useState(false);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState(false);
  const [showUnjoinConfirm, setShowUnjoinConfirm] = useState(false);
  const [guestAuthAction, setGuestAuthAction] = useState<GuestAuthAction | null>(null);
  const [isGuestAuthPromptOpen, setIsGuestAuthPromptOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);

  const isOwnCampaign = user?.id === campaign.creatorId;
  const isCampaignCreator = campaign.creatorId && user?.id === campaign.creatorId;
  const isCampaignMemberAdmin = campaign.roleInCampaign === 'CAMPAIGN_ADMIN';
  const isCampaignAdmin = !!isCampaignCreator || isCampaignMemberAdmin || !!campaign.campaignAdmin;
  const campaignDetailPath = ROUTES.CAMPAIGN_DETAIL.replace(':id', String(campaign.id));
  const registerWithRedirect = (redirectPath: string) =>
    `${ROUTES.REGISTER}?redirect=${encodeURIComponent(redirectPath)}`;

  const { data: pendingDonations = [], isLoading: isLoadingPendingDonations } = useQuery({
    queryKey: ['campaignAdminDonations', campaign.id],
    queryFn: async () => {
      const res = await getCampaignDonationsForAdmin(campaign.id);
      if (!res.success) {
        throw new Error(res.message || 'Failed to load donations.');
      }
      return res.result || [];
    },
    select: (donations) => donations.filter((d) => d.status === 'PENDING'),
    enabled: isCampaignAdmin,
    placeholderData: keepPreviousData,
  });

  const { data: unjoinRequestsPage, isLoading: isLoadingUnjoinRequests } = useUnjoinRequests(
    campaign.id,
    0,
    1,
    isCampaignAdmin,
  );
  const pendingUnjoinRequestsCount = unjoinRequestsPage?.totalElements ?? 0;

  const isEditable = campaign.isEditable;
  const isDeletable =
    isOwnCampaign &&
    (campaign.status === 'DRAFT' ||
      campaign.status === 'REJECTED' ||
      campaign.status === 'PENDING');

  const isEndable = campaign.status === 'IN_PROGRESS' && isCampaignAdmin;
  const isPostReportable =
    campaign.status === 'COMPLETED' && !campaign.resultPosted && isCampaignAdmin;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  const deleteCampaignMutation = useDeleteCampaignMutation({
    onSuccess: () => {
      toast.success('Campaign deleted successfully');
      navigate(ROUTES.MY_CAMPAIGNS);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete campaign');
    },
  });

  const endCampaignMutation = useEndCampaignMutation({
    onSuccess: () => {
      toast.success('Campaign ended successfully');
      void queryClient.invalidateQueries({
        queryKey: campaignQueryKeys.detail(String(campaign.id)),
      });
      setShowEndConfirm(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to end campaign');
    },
  });

  const handleDelete = () => {
    deleteCampaignMutation.mutate(campaign.id);
  };

  const handleEndCampaign = () => {
    endCampaignMutation.mutate(campaign.id);
  };

  useEffect(() => {
    if (campaign.isFollowed !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsFollowed(campaign.isFollowed);
    }
    if (campaign.isJoined !== undefined) {
      setIsJoined(campaign.isJoined);
    }
    if (campaign.hasPendingUnjoinRequest !== undefined) {
      setIsUnjoinPending(campaign.hasPendingUnjoinRequest);
    }
  }, [campaign.isFollowed, campaign.isJoined, campaign.hasPendingUnjoinRequest]);

  // eslint-disable-next-line react-hooks/purity
  const endDate = new Date(campaign.endDate || Date.now() + 86400000 * 30);
  // eslint-disable-next-line react-hooks/purity
  const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isEnded = daysLeft <= 0 || campaign.status === 'COMPLETED';
  const startDate = parseUTCDate(campaign.startDate || campaign.createdAt);
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const organizerName =
    campaign.creatorName ||
    ((campaign as unknown as Record<string, unknown>).organizerName as string) ||
    'mgm Cares Team';
  const donationMethodLabel =
    campaign.donationMethod === 'HYBRID'
      ? 'Hybrid'
      : campaign.donationMethod === 'MANUAL_QR'
        ? 'Manual QR'
        : 'PayOS';
  const showManagement =
    isEditable ||
    isDeletable ||
    isEndable ||
    isPostReportable ||
    campaign.status === 'REJECTED' ||
    isCampaignAdmin;

  const redirectGuestToRegister = (redirectPath = campaignDetailPath) => {
    window.localStorage.setItem('mgmGivesAuthRedirect', redirectPath);
    navigate(registerWithRedirect(redirectPath));
  };

  const requestGuestAuth = (action: GuestAuthAction) => {
    setGuestAuthAction(action);
    setIsGuestAuthPromptOpen(true);
  };

  const handleGuestAuthConfirm = () => {
    setIsGuestAuthPromptOpen(false);
    redirectGuestToRegister();
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    if (publicMode) {
      try {
        await copyTextToClipboard(shareUrl);
        setIsShareCopied(true);
        toast.success('Campaign link copied');
        window.setTimeout(() => setIsShareCopied(false), 1800);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        toast.error('Failed to copy campaign link');
      }
      return;
    }

    setIsShareOpen(true);
  };

  const handleToggleFollow = async () => {
    if (publicMode) {
      requestGuestAuth('follow');
      return;
    }

    if (isToggling) return;

    if (isFollowed) {
      setShowUnfollowConfirm(true);
      return;
    }

    setIsToggling(true);
    try {
      await followCampaign(campaign.id);
      setIsFollowed(true);
      queryClient.setQueryData(
        campaignQueryKeys.detail(String(campaign.id)),
        (oldData: ApiResponse<CampaignResponse> | undefined) => {
          if (!oldData?.result) return oldData;
          return { ...oldData, result: { ...oldData.result, isFollowed: true } };
        },
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists }),
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.followed }),
      ]);
      toast.success(currentLang === 'vi' ? 'Đã theo dõi chiến dịch' : 'Followed campaign');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast.error(
        currentLang === 'vi' ? 'Không thể theo dõi chiến dịch' : 'Failed to follow campaign',
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleConfirmUnfollow = async () => {
    setIsToggling(true);
    try {
      await unfollowCampaign(campaign.id);
      setIsFollowed(false);
      queryClient.setQueryData(
        campaignQueryKeys.detail(String(campaign.id)),
        (oldData: ApiResponse<CampaignResponse> | undefined) => {
          if (!oldData?.result) return oldData;
          return { ...oldData, result: { ...oldData.result, isFollowed: false } };
        },
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists }),
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.followed }),
      ]);
      toast.success(currentLang === 'vi' ? 'Đã hủy theo dõi chiến dịch' : 'Unfollowed campaign');
      setShowUnfollowConfirm(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast.error(
        currentLang === 'vi' ? 'Không thể hủy theo dõi chiến dịch' : 'Failed to unfollow campaign',
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleToggleJoin = async () => {
    if (publicMode) {
      requestGuestAuth('volunteer');
      return;
    }

    if (isTogglingJoin) return;

    if (isJoined) {
      setShowUnjoinConfirm(true);
      return;
    }

    setIsTogglingJoin(true);
    try {
      await joinCampaign(campaign.id);
      setIsJoined(true);
      setIsFollowed(true);
      queryClient.setQueryData(
        campaignQueryKeys.detail(String(campaign.id)),
        (oldData: ApiResponse<CampaignResponse> | undefined) => {
          if (!oldData?.result) return oldData;
          return {
            ...oldData,
            result: {
              ...oldData.result,
              isJoined: true,
              isFollowed: true,
              volunteersCount: (oldData.result.volunteersCount || 0) + 1,
            },
          };
        },
      );
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.lists }),
        queryClient.invalidateQueries({ queryKey: campaignQueryKeys.followed }),
      ]);
      toast.success(
        currentLang === 'vi' ? 'Đã tham gia tình nguyện viên' : 'Joined campaign as volunteer',
      );
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast.error(
        currentLang === 'vi' ? 'Không thể tham gia chiến dịch' : 'Failed to join campaign',
      );
    } finally {
      setIsTogglingJoin(false);
    }
  };

  const handleConfirmUnjoin = async () => {
    setIsTogglingJoin(true);
    try {
      const result = await unjoinCampaign(campaign.id);
      if (result.status === 'PENDING_APPROVAL') {
        setIsUnjoinPending(true);
        queryClient.setQueryData(
          campaignQueryKeys.detail(String(campaign.id)),
          (oldData: ApiResponse<CampaignResponse> | undefined) => {
            if (!oldData?.result) return oldData;
            return {
              ...oldData,
              result: { ...oldData.result, hasPendingUnjoinRequest: true },
            };
          },
        );
        toast.info(
          currentLang === 'vi'
            ? 'Bạn vẫn còn công việc được phân công. Yêu cầu rời cần Quản trị viên duyệt.'
            : 'You still have an assigned task. Your unjoin request needs admin approval.',
        );
      } else {
        setIsJoined(false);
        queryClient.setQueryData(
          campaignQueryKeys.detail(String(campaign.id)),
          (oldData: ApiResponse<CampaignResponse> | undefined) => {
            if (!oldData?.result) return oldData;
            return {
              ...oldData,
              result: {
                ...oldData.result,
                isJoined: false,
                hasPendingUnjoinRequest: false,
                volunteersCount: Math.max(0, (oldData.result.volunteersCount || 0) - 1),
              },
            };
          },
        );
        toast.success(
          currentLang === 'vi'
            ? 'Đã rời tình nguyện viên chiến dịch'
            : 'Unjoined campaign volunteer',
        );
      }
      setShowUnjoinConfirm(false);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast.error(currentLang === 'vi' ? 'Không thể rời chiến dịch' : 'Failed to unjoin campaign');
    } finally {
      setIsTogglingJoin(false);
    }
  };

  const handleCancelUnjoinRequest = async () => {
    setIsCancellingUnjoin(true);
    try {
      await cancelUnjoinRequest(campaign.id);
      setIsUnjoinPending(false);
      queryClient.setQueryData(
        campaignQueryKeys.detail(String(campaign.id)),
        (oldData: ApiResponse<CampaignResponse> | undefined) => {
          if (!oldData?.result) return oldData;
          return { ...oldData, result: { ...oldData.result, hasPendingUnjoinRequest: false } };
        },
      );
      toast.success(currentLang === 'vi' ? 'Đã hủy yêu cầu rời' : 'Unjoin request cancelled');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      toast.error(
        currentLang === 'vi' ? 'Không thể hủy yêu cầu rời' : 'Failed to cancel unjoin request',
      );
    } finally {
      setIsCancellingUnjoin(false);
    }
  };

  return (
    <div className="contents">
      {showManagement && (
        <section className="relative order-3 mt-4 lg:col-span-2">
          {/* Layer 2 - Back Layer */}
          <div
            className="absolute inset-0 translate-x-3 translate-y-3 rounded-2xl border border-blue-300 bg-blue-100/80 shadow-sm"
            aria-hidden="true"
          />
          {/* Layer 1 - Front Card */}
          <div className="relative rounded-2xl border border-blue-300 bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(37,99,235,0.08)]">
            <div className="flex min-h-14 items-center justify-between gap-4 pb-3">
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">
                {currentLang === 'vi' ? 'Quản lý chiến dịch' : 'Campaign Management'}
              </h2>
              <div className="flex items-center gap-1.5">
                {isPostReportable && (
                  <button
                    type="button"
                    onClick={onPostReport}
                    className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-xs font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Post final report"
                    title="Post final report"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {currentLang === 'vi' ? 'Đăng báo cáo' : 'Post report'}
                  </button>
                )}
                {isEndable && (
                  <button
                    type="button"
                    onClick={() => setShowEndConfirm(true)}
                    disabled={endCampaignMutation.isPending}
                    className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-xs font-medium text-orange-600 transition-colors hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    aria-label="End campaign"
                    title="End campaign"
                  >
                    <Flag className="h-3.5 w-3.5" />
                    {currentLang === 'vi' ? 'Kết thúc chiến dịch' : 'End campaign'}
                  </button>
                )}
                {isEditable && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(ROUTES.EDIT_CAMPAIGN.replace(':id', String(campaign.id)), {
                        state: { fromDetail: true },
                      })
                    }
                    className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-xs font-medium text-foreground transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Edit campaign"
                    title="Edit campaign"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    {currentLang === 'vi' ? 'Chỉnh sửa' : 'Edit'}
                  </button>
                )}
                {isDeletable && (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteCampaignMutation.isPending}
                    className="flex h-8 items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-xs font-medium text-destructive transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                    aria-label="Delete campaign"
                    title="Delete campaign"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {currentLang === 'vi' ? 'Xóa' : 'Delete'}
                  </button>
                )}
              </div>
            </div>

            {isCampaignAdmin && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4">
                <div className="flex flex-1 min-h-14 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {currentLang === 'vi' ? 'Giao dịch QR chờ duyệt' : 'Pending QR transfers'}
                    </p>
                    <p className="text-sm font-bold text-foreground tabular-nums flex items-center gap-1.5 mt-0.5">
                      {isLoadingPendingDonations ? (
                        <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                          {currentLang === 'vi' ? 'Đang kiểm tra...' : 'Checking...'}
                        </span>
                      ) : (
                        <>
                          {pendingDonations.length}{' '}
                          <span className="font-normal text-muted-foreground">
                            {currentLang === 'vi'
                              ? 'giao dịch'
                              : `transfer${pendingDonations.length === 1 ? '' : 's'}`}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(ROUTES.CAMPAIGN_APPROVALS.replace(':id', String(campaign.id)))
                  }
                  className="flex min-h-14 sm:w-auto items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 font-medium cursor-pointer"
                >
                  <ShieldCheck className="h-4 w-4" />
                  {currentLang === 'vi' ? 'Duyệt khoản quyên góp' : 'Review Approvals'}
                </button>
              </div>
            )}

            {isCampaignAdmin && (isLoadingUnjoinRequests || pendingUnjoinRequestsCount > 0) && (
              <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4">
                <div className="flex flex-1 min-h-14 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                    <Hourglass className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      {currentLang === 'vi' ? 'Yêu cầu rời chờ duyệt' : 'Pending unjoin requests'}
                    </p>
                    <p className="text-sm font-bold text-foreground tabular-nums flex items-center gap-1.5 mt-0.5">
                      {isLoadingUnjoinRequests ? (
                        <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin text-amber-600" />
                          {currentLang === 'vi' ? 'Đang kiểm tra...' : 'Checking...'}
                        </span>
                      ) : (
                        <>
                          {pendingUnjoinRequestsCount}{' '}
                          <span className="font-normal text-muted-foreground">
                            {currentLang === 'vi'
                              ? 'yêu cầu'
                              : `request${pendingUnjoinRequestsCount === 1 ? '' : 's'}`}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    navigate(ROUTES.CAMPAIGN_UNJOIN_REQUESTS.replace(':id', String(campaign.id)))
                  }
                  className="flex min-h-14 sm:w-auto items-center justify-center gap-2 rounded-lg bg-amber-600 px-6 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 font-medium cursor-pointer"
                >
                  <Hourglass className="h-4 w-4" />
                  {currentLang === 'vi' ? 'Duyệt yêu cầu rời' : 'Review Unjoin Requests'}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      <aside className="order-2 flex min-w-0 flex-col p-6 lg:p-8">
        <h1 className="min-w-0 max-w-[16ch] break-words [overflow-wrap:anywhere] text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-[-0.035em] text-[#102820] sm:text-5xl lg:text-[3rem]">
          {campaign.title}
        </h1>

        <CampaignTags
          tags={
            campaign.categories?.length
              ? [...campaign.categories]
                  .sort((a, b) => a.id - b.id || a.name.localeCompare(b.name))
                  .map((c) => c.name)
              : [campaign.categoryName || 'Community']
          }
        />

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          {(publicMode || !isOwnCampaign) && (
            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={isJoined || isToggling}
              className={`inline-flex items-center gap-1.5 rounded px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
                isFollowed ? 'text-primary' : 'hover:text-foreground'
              }`}
            >
              <Bookmark className={`h-5 w-5 ${isFollowed ? 'fill-current' : ''}`} />
              <span className="font-medium">
                {isFollowed
                  ? currentLang === 'vi'
                    ? 'Đã theo dõi'
                    : 'Followed'
                  : currentLang === 'vi'
                    ? 'Theo dõi'
                    : 'Follow'}
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={handleShare}
            className={`inline-flex items-center gap-1.5 rounded px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isShareCopied ? 'bg-emerald-50 text-emerald-700' : 'hover:text-foreground'
            }`}
          >
            {isShareCopied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            <span className="font-medium">
              {isShareCopied
                ? currentLang === 'vi'
                  ? 'Đã sao chép!'
                  : 'Copied!'
                : currentLang === 'vi'
                  ? 'Chia sẻ'
                  : 'Share'}
            </span>
          </button>
        </div>

        <div className="mt-5 space-y-3 text-base text-[#102820]">
          <div className="flex items-center gap-2.5">
            <UserRound className="h-4 w-4 text-[#102820]/70" />
            <span>{currentLang === 'vi' ? 'Người tổ chức:' : 'Organized by'}</span>
            <span className="font-semibold text-[#102820]">{organizerName}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 text-[#102820]/70" />
            <span>
              {dateFormatter.format(startDate)} - {dateFormatter.format(endDate)}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-2.5 text-center">
          <button
            type="button"
            onClick={onDonorsClick}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 px-2 py-4 shadow-sm shadow-rose-200/25 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="View supporters list"
          >
            <Heart className="mb-2 h-5 w-5 text-rose-500" />
            <span className="text-xl font-bold text-foreground tabular-nums">
              {campaign.donorsCount || 0}
            </span>
            <span className="mt-1 text-[11px] font-semibold text-rose-600">
              {currentLang === 'vi' ? 'Người ủng hộ' : 'Donors'}
            </span>
          </button>
          <button
            type="button"
            onClick={onVolunteersClick}
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-2 py-4 shadow-sm shadow-blue-200/25 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="View volunteer list"
          >
            <Users className="mb-2 h-5 w-5 text-blue-500" />
            <span className="text-xl font-bold text-foreground tabular-nums">
              {campaign.volunteersCount || 0}
            </span>
            <span className="mt-1 text-[11px] font-semibold text-blue-600">
              {currentLang === 'vi' ? 'Tình nguyện viên' : 'Volunteers'}
            </span>
          </button>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-200/70 bg-amber-50/90 px-2 py-4 shadow-sm shadow-amber-200/20 transition-transform hover:scale-[1.02]">
            <Clock className="mb-2 h-5 w-5 text-amber-500" />
            <span className="text-xl font-bold text-foreground tabular-nums">{daysLeft}</span>
            <span className="mt-1 text-[11px] font-semibold text-amber-600">
              {currentLang === 'vi' ? 'Ngày còn lại' : 'Days left'}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-200/70 bg-emerald-50/90 px-2 py-4 shadow-sm shadow-emerald-200/20 transition-transform hover:scale-[1.02]">
            <CreditCard className="mb-2 h-5 w-5 text-emerald-500" />
            {campaign.donationMethod === 'HYBRID' ? (
              <Tooltip content="PayOS + Manual QR">
                <span className="max-w-full cursor-help truncate text-xs font-bold leading-[28px] text-foreground underline decoration-dotted underline-offset-4">
                  {donationMethodLabel}
                </span>
              </Tooltip>
            ) : (
              <span className="max-w-full truncate text-xs font-bold leading-[28px] text-foreground">
                {donationMethodLabel}
              </span>
            )}
            <span className="mt-1 text-[11px] font-semibold text-emerald-600">
              {currentLang === 'vi' ? 'Hình thức' : 'Method'}
            </span>
          </div>
        </div>

        {campaign.acceptsMoney && (campaign.target ?? 0) > 0 && (
          <CampaignDetailProgress campaign={campaign} donations={donations} />
        )}

        <div
          className={`mt-5 grid gap-2.5 ${
            campaign.status === 'APPROVED' ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-2'
          }`}
        >
          {(publicMode || (!isEnded && !isOwnCampaign && campaign.status !== 'APPROVED')) && (
            <button
              type="button"
              onClick={() =>
                publicMode
                  ? requestGuestAuth('support')
                  : navigate(ROUTES.CAMPAIGN_DONATE.replace(':id', String(campaign.id)))
              }
              className="flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
            >
              <Heart className="h-4 w-4 fill-current" />
              {currentLang === 'vi' ? 'Ủng hộ chiến dịch' : 'Support Our Cause'}
            </button>
          )}
          {!publicMode && !isEnded && !isOwnCampaign && isJoined && isUnjoinPending ? (
            <div className="flex h-11 items-center justify-between gap-2 rounded-full border border-amber-400 bg-amber-50/70 px-4 text-xs font-semibold text-amber-700">
              <span className="inline-flex items-center gap-2">
                <Hourglass className="h-4 w-4" />
                {currentLang === 'vi' ? 'Chờ Admin phê duyệt' : 'Pending admin approval'}
              </span>
              <button
                type="button"
                onClick={handleCancelUnjoinRequest}
                disabled={isCancellingUnjoin}
                className="text-amber-700 underline decoration-dotted underline-offset-2 hover:text-amber-900 disabled:opacity-50 cursor-pointer"
              >
                {isCancellingUnjoin
                  ? currentLang === 'vi'
                    ? 'Đang hủy...'
                    : 'Cancelling...'
                  : currentLang === 'vi'
                    ? 'Hủy yêu cầu'
                    : 'Cancel request'}
              </button>
            </div>
          ) : (
            (publicMode || (!isEnded && !isOwnCampaign)) && (
              <button
                type="button"
                onClick={handleToggleJoin}
                disabled={isTogglingJoin}
                aria-label={
                  isJoined ? 'Joined as volunteer. Leave volunteer team' : 'Join as volunteer'
                }
                title={isJoined ? 'Click to leave the volunteer team' : undefined}
                className={`flex h-11 items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer ${
                  isJoined
                    ? 'border border-destructive bg-white text-destructive hover:bg-destructive/10'
                    : 'border border-transparent bg-white/75 text-[#102820] hover:bg-white'
                }`}
              >
                {isJoined ? <LogOut className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                {isJoined
                  ? currentLang === 'vi'
                    ? 'Rời nhóm Tình nguyện'
                    : 'Unjoin Volunteer'
                  : currentLang === 'vi'
                    ? 'Tham gia Tình nguyện'
                    : 'Join as Volunteer'}
              </button>
            )
          )}
        </div>
      </aside>

      <ConfirmDialog
        isOpen={showUnfollowConfirm}
        onClose={() => setShowUnfollowConfirm(false)}
        onConfirm={handleConfirmUnfollow}
        title={currentLang === 'vi' ? 'Bỏ theo dõi chiến dịch' : 'Unfollow Campaign'}
        confirmLabel={currentLang === 'vi' ? 'Bỏ theo dõi' : 'Unfollow'}
        isPending={isToggling}
      >
        {currentLang === 'vi'
          ? 'Bạn có chắc chắn muốn bỏ theo dõi chiến dịch này không? Bạn sẽ không còn nhận được cập nhật về nó.'
          : 'Are you sure you want to unfollow this campaign? You will no longer receive updates about it.'}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={showUnjoinConfirm}
        onClose={() => setShowUnjoinConfirm(false)}
        onConfirm={handleConfirmUnjoin}
        title={currentLang === 'vi' ? 'Rời Tình nguyện viên' : 'Unjoin Volunteer'}
        confirmLabel={currentLang === 'vi' ? 'Rời nhóm' : 'Unjoin'}
        pendingLabel={currentLang === 'vi' ? 'Đang rời...' : 'Unjoining...'}
        isPending={isTogglingJoin}
      >
        {currentLang === 'vi'
          ? 'Bạn có chắc chắn muốn rời nhóm tình nguyện viên cho chiến dịch này không? Nếu bạn vẫn còn công việc được giao, hệ thống sẽ gửi yêu cầu cần Quản trị viên duyệt.'
          : 'Are you sure you want to unjoin as a volunteer for this campaign? If you still have an assigned task, this will send a request that requires admin approval instead of leaving immediately.'}
      </ConfirmDialog>

      <Dialog
        isOpen={isGuestAuthPromptOpen}
        onClose={() => setIsGuestAuthPromptOpen(false)}
        title={
          guestAuthAction
            ? guestAuthPromptContent[guestAuthAction].title
            : 'Create an account to continue'
        }
      >
        <p className="mt-2 text-sm leading-6 text-gray-600">
          {guestAuthAction
            ? guestAuthPromptContent[guestAuthAction].message
            : 'Sign up to continue with this campaign.'}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setIsGuestAuthPromptOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleGuestAuthConfirm}>Sign up</Button>
        </div>
      </Dialog>

      <ConfirmDialog
        isOpen={showEndConfirm}
        onClose={() => setShowEndConfirm(false)}
        onConfirm={handleEndCampaign}
        title={currentLang === 'vi' ? 'Kết thúc chiến dịch' : 'End Campaign'}
        confirmLabel={currentLang === 'vi' ? 'Kết thúc' : 'End Campaign'}
        pendingLabel={currentLang === 'vi' ? 'Đang kết thúc...' : 'Ending...'}
        isPending={endCampaignMutation.isPending}
      >
        {currentLang === 'vi'
          ? 'Bạn có chắc chắn muốn kết thúc chiến dịch này ngay bây giờ không?'
          : 'Are you sure you want to end this campaign now?'}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title={currentLang === 'vi' ? 'Xóa chiến dịch' : 'Delete Campaign'}
        confirmLabel={currentLang === 'vi' ? 'Xóa' : 'Delete'}
        pendingLabel={currentLang === 'vi' ? 'Đang xóa...' : 'Deleting...'}
        isPending={deleteCampaignMutation.isPending}
      >
        {currentLang === 'vi'
          ? 'Bạn có chắc chắn muốn xóa chiến dịch này không?'
          : 'Are you sure you want to delete this campaign?'}
      </ConfirmDialog>

      <AnnouncementShareDialog
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        shareUrl={window.location.href}
        announcementTitle={campaign.title}
        dialogTitle="Share Campaign"
        imageUrl={campaign.coverImageUrl ? getMediaUrl(campaign.coverImageUrl) : undefined}
      />
    </div>
  );
}
