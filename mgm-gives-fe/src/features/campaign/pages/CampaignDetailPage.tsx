import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUp,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  HeartHandshake,
  Megaphone,
  Pencil,
  Users,
  Wallet,
  XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { CampaignAnnouncements } from '@/features/announcement';
import { useAuthUser } from '@/features/auth/hooks';
import { FinalPostEditorDialog, useCampaignResult } from '@/features/campaign';
import { CampaignVolunteerRoster } from '@/features/campaign_member/components/CampaignVolunteerRoster';
import { useDashboardSocket } from '@/features/dashboard/hooks/useDashboardSocket';
import { getMyDonations, verifyPayOSDonation } from '@/features/donations/api';
import { donationQueryKeys } from '@/features/donations/constants/queryKeys';
import type { DonationResponseData } from '@/features/donations/types/types';
import { Button } from '@/shared/components/ui/Button';
import { Dialog } from '@/shared/components/ui/Dialog';
import { Logo } from '@/shared/components/ui/Logo';
import { ROUTES } from '@/shared/constants/routes';
import NotFoundPage from '@/shared/layouts/NotFoundPage';
import { formatDateTime } from '@/shared/utils/format';
import {
  CampaignCard,
  CampaignDetailAbout,
  CampaignDetailHeader,
  CampaignDetailSidebar,
  CampaignDetailSupporters,
  CampaignMeetings,
  CampaignSpendingTab,
} from '../components';
import { useCampaignDetails, useCampaignDonations, useCampaignQuery } from '../hooks';

type CampaignDetailTab =
  | 'details'
  | 'announcements'
  | 'meetings'
  | 'supporters'
  | 'spending'
  | 'volunteers';

const PUBLIC_CAMPAIGN_STATUSES = new Set(['APPROVED', 'IN_PROGRESS', 'COMPLETED']);

interface CampaignDetailPageProps {
  publicMode?: boolean;
}

const PUBLIC_CAMPAIGNS_RETURN_PATH = `${ROUTES.DEFAULT}#campaigns`;

function PublicCampaignHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to={`${ROUTES.DEFAULT}#home`}
          className="flex shrink-0 items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Back to mgmGives home"
        >
          <Logo className="h-10 w-40" />
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 overflow-x-auto text-xs font-semibold text-slate-600 md:flex lg:gap-5 lg:text-sm">
          <Link
            to={PUBLIC_CAMPAIGNS_RETURN_PATH}
            className="shrink-0 whitespace-nowrap rounded-full px-2 py-1 transition-colors hover:text-primary"
          >
            Campaigns
          </Link>
          <Link
            to={`${ROUTES.DEFAULT}#transparency`}
            className="shrink-0 whitespace-nowrap rounded-full px-2 py-1 transition-colors hover:text-primary"
          >
            Transparency
          </Link>
          <Link
            to={`${ROUTES.DEFAULT}#security`}
            className="shrink-0 whitespace-nowrap rounded-full px-2 py-1 transition-colors hover:text-primary"
          >
            Security & Roles
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 text-sm font-bold">
          <Link
            to={ROUTES.LOGIN}
            className="rounded-full px-3 py-2 text-slate-700 transition-colors hover:bg-blue-50 hover:text-primary sm:px-4"
          >
            Sign in
          </Link>
          <Link
            to={ROUTES.REGISTER}
            className="rounded-full bg-primary px-3 py-2 text-white shadow-sm transition-colors hover:bg-blue-700 sm:px-4"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function CampaignDetailPage({ publicMode = false }: CampaignDetailPageProps) {
  const { id } = useParams<{ id: string }>();
  const { state } = useLocation();
  const { data: response, isLoading, error } = useCampaignDetails(id || '', publicMode);
  const campaign = response?.result;
  const loadedCampaignId = campaign?.id;

  const { data: user } = useAuthUser({ enabled: !publicMode });
  const isCampaignCreator = campaign?.creatorId && user?.id === campaign.creatorId;
  const isCampaignMemberAdmin = campaign?.roleInCampaign === 'CAMPAIGN_ADMIN';
  const isCampaignAdmin = !!isCampaignCreator || isCampaignMemberAdmin || !!campaign?.campaignAdmin;
  const canManageAnnouncements = isCampaignAdmin;

  const donationsProps = useCampaignDonations(id, !publicMode);
  const { data: relatedCampaignsResponse, isLoading: isRelatedCampaignsLoading } = useCampaignQuery(
    {
      page: 0,
      size: 30,
      sort: 'createdAt,desc',
    },
    { enabled: !publicMode },
  );
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<CampaignDetailTab>('details');
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const { i18n } = useTranslation(['campaign', 'common']);
  const currentLang = i18n.language;

  const tabs = [
    { id: 'details', label: currentLang === 'vi' ? 'Mô tả' : 'Description', icon: FileText },
    {
      id: 'announcements',
      label: currentLang === 'vi' ? 'Thông báo' : 'Announcement',
      icon: Megaphone,
    },
    { id: 'spending', label: currentLang === 'vi' ? 'Thu chi' : 'Spending', icon: Wallet },
    { id: 'supporters', label: currentLang === 'vi' ? 'Người ủng hộ' : 'Supporters', icon: Users },
    {
      id: 'volunteers',
      label: currentLang === 'vi' ? 'Tình nguyện viên' : 'Volunteers',
      icon: HeartHandshake,
    },
    { id: 'meetings', label: currentLang === 'vi' ? 'Cuộc họp' : 'Meeting', icon: CalendarRange },
  ];

  const isCompleted = campaign?.status === 'COMPLETED';
  const { data: campaignResult, isLoading: isLoadingFinalPost } = useCampaignResult(
    campaign?.id ?? 0,
    {
      enabled: !publicMode && isCompleted && !!campaign?.id,
    },
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const tabsSectionRef = useRef<HTMLElement>(null);

  // Public mode gets the same tab-switch behavior as the authenticated view (just a
  // smaller tab set) so the Volunteers view replaces the panel content instead of being
  // appended below the description - that's what lets both modes scroll to the exact
  // same place: the top of a panel that contains nothing but the roster.
  const visibleTabs = publicMode
    ? tabs.filter((tab) => tab.id === 'details' || tab.id === 'volunteers')
    : tabs.filter((tab) => {
        if (tab.id === 'meetings') {
          return isCampaignAdmin || campaign?.isJoined;
        }
        return true;
      });

  const handleVolunteersCardClick = () => {
    setActiveTab('volunteers');
    if (!publicMode) {
      handleTabChange('volunteers');
    }
    tabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDonorsCardClick = () => {
    setActiveTab('supporters');
    if (!publicMode) {
      handleTabChange('supporters');
    }
    tabsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      if (direction === 'left') {
        if (current.scrollLeft <= 10) {
          current.scrollTo({ left: current.scrollWidth, behavior: 'smooth' });
        } else {
          current.scrollBy({ left: -current.offsetWidth, behavior: 'smooth' });
        }
      } else {
        const isAtEnd = current.scrollLeft + current.clientWidth >= current.scrollWidth - 10;
        if (isAtEnd) {
          current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          current.scrollBy({ left: current.offsetWidth, behavior: 'smooth' });
        }
      }
    }
  };

  const toastShown = useRef(false);

  const topRef = useRef<HTMLElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset scroll to top on campaign id change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    if (topRef.current) {
      topRef.current.scrollTop = 0;
      if (topRef.current.parentElement) {
        topRef.current.parentElement.scrollTop = 0;
        topRef.current.parentElement.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant' as ScrollBehavior,
        });
      }
    }
  }, [id, loadedCampaignId]);

  useEffect(() => {
    if (!loadedCampaignId) return;

    const scrollContainer = topRef.current?.parentElement;
    if (!scrollContainer) return;

    const updateVisibility = () => setIsScrollTopVisible(scrollContainer.scrollTop > 400);
    updateVisibility();
    scrollContainer.addEventListener('scroll', updateVisibility, { passive: true });

    return () => scrollContainer.removeEventListener('scroll', updateVisibility);
  }, [loadedCampaignId]);

  useEffect(() => {
    const payment = searchParams.get('payment');
    const donationIdParam = searchParams.get('donationId');
    if (payment === 'success' && !toastShown.current) {
      toastShown.current = true;
      const campaignIdNum = Number(id);

      const completeVerification = () => {
        toast.success('Thank you! Your donation was successful.', {
          duration: 5000,
        });
        queryClient.invalidateQueries({
          queryKey: donationQueryKeys.campaignDonations(campaignIdNum),
        });
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        setSearchParams({}, { replace: true });
      };

      const donationIdNum = donationIdParam ? Number(donationIdParam) : null;
      if (donationIdNum && !Number.isNaN(donationIdNum)) {
        verifyPayOSDonation(donationIdNum)
          .then(completeVerification)
          .catch((err) => {
            console.error('Failed to active-verify donation on landing:', err);
            completeVerification();
          });
      } else {
        completeVerification();
      }
    }
  }, [searchParams, id, queryClient, setSearchParams]);

  useEffect(() => {
    if (publicMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('details');
      return;
    }

    const tabParam = searchParams.get('tab');
    if (tabParam === 'announcements') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('announcements');
    } else if (tabParam === 'meetings' && (isCampaignAdmin || campaign?.isJoined)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('meetings');
    } else if (tabParam === 'supporters') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab('supporters');
      donationsProps.setMainTab('LEDGER');
    } else if (tabParam === 'approvals') {
      navigate(`/campaigns/${id}/approvals`, { replace: true });
    }
  }, [
    searchParams,
    id,
    navigate,
    donationsProps.setMainTab,
    publicMode,
    isCampaignAdmin,
    campaign?.isJoined,
  ]);

  useEffect(() => {
    const webexResult = searchParams.get('webex');
    if (!webexResult) return;

    if (webexResult === 'success') {
      toast.success('Webex connected successfully.');
    } else if (webexResult === 'error') {
      toast.error(searchParams.get('message') || 'Unable to connect Webex.');
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('webex');
    nextSearchParams.delete('message');
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const rejectedDonationId =
    searchParams.get('rejectedDonationId') || location.state?.rejectedDonationId;
  const [activeRejectedDonation, setActiveRejectedDonation] = useState<DonationResponseData | null>(
    null,
  );

  const { data: myDonationsResp } = useQuery({
    queryKey: ['myDonations'],
    queryFn: () => getMyDonations({ size: 100 }),
    enabled: !!user && !!rejectedDonationId,
  });

  const rejectedDonation = myDonationsResp?.result?.content?.find(
    (d) => d.id === Number(rejectedDonationId) && d.status === 'REJECTED',
  );

  useEffect(() => {
    if (rejectedDonation) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveRejectedDonation(rejectedDonation);
    }
  }, [rejectedDonation]);

  const closeRejectModal = () => {
    if (searchParams.has('rejectedDonationId')) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('rejectedDonationId');
      setSearchParams(newParams, { replace: true });
    }
    if (location.state?.rejectedDonationId) {
      navigate(location.pathname + location.search, {
        replace: true,
        state: { ...location.state, rejectedDonationId: undefined },
      });
    }
    setTimeout(() => {
      setActiveRejectedDonation(null);
    }, 300);
  };

  // Subscribe to real-time update events via WebSocket
  useDashboardSocket(() => {
    const campaignIdNum = Number(id);
    if (campaignIdNum) {
      queryClient.invalidateQueries({
        queryKey: donationQueryKeys.campaignDonations(campaignIdNum),
      });
      queryClient.invalidateQueries({ queryKey: ['campaignPendingCount', campaignIdNum] });
      queryClient.invalidateQueries({ queryKey: ['campaignAdminDonations', campaignIdNum] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    }
  }, !publicMode);

  if (isLoading) {
    return (
      <div
        className={`min-h-screen bg-surface px-4 py-8 sm:px-6 lg:px-8 ${publicMode ? 'pt-28' : ''}`}
      >
        {publicMode && <PublicCampaignHeader />}
        <div className="mx-auto max-w-7xl animate-pulse space-y-8">
          <div className="h-5 w-56 rounded bg-secondary" />
          <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-2">
            <div className="min-h-80 bg-secondary lg:min-h-[34rem]" />
            <div className="space-y-6 p-8 lg:p-10">
              <div className="flex gap-2">
                <div className="h-6 w-20 rounded bg-secondary" />
                <div className="h-6 w-28 rounded bg-secondary" />
              </div>
              <div className="h-24 max-w-lg rounded bg-secondary" />
              <div className="h-14 max-w-md rounded bg-secondary" />
              <div className="mt-16 h-24 rounded bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    if (publicMode) {
      return (
        <div className="min-h-screen bg-[#eef5ff] pt-20">
          <PublicCampaignHeader />
          <NotFoundPage
            title="Campaign Not Found"
            description="The campaign you are looking for does not exist, has been removed, or is temporarily unavailable."
            backTo={PUBLIC_CAMPAIGNS_RETURN_PATH}
            backToText="Back to Campaigns"
          />
        </div>
      );
    }

    return (
      <NotFoundPage
        title="Campaign Not Found"
        description="The campaign you are looking for does not exist, has been removed, or is temporarily unavailable."
        backTo={ROUTES.CAMPAIGNS}
        backToText="Back to Campaigns"
      />
    );
  }

  const resultPath = ROUTES.CAMPAIGN_RESULT.replace(':id', String(campaign.id));
  const relatedCampaigns = (relatedCampaignsResponse?.content ?? []).filter(
    (relatedCampaign) =>
      relatedCampaign.id !== String(campaign.id) &&
      PUBLIC_CAMPAIGN_STATUSES.has(relatedCampaign.status) &&
      (!user || relatedCampaign.creatorId !== user.id),
  );

  const handleTabChange = (tabId: CampaignDetailTab) => {
    const nextSearchParams = new URLSearchParams(searchParams);

    if (tabId === 'announcements' || tabId === 'meetings') {
      nextSearchParams.set('tab', tabId);
    } else {
      nextSearchParams.delete('tab');
      nextSearchParams.delete('editAnnouncementId');
    }

    setSearchParams(nextSearchParams, { replace: true, state });

    if (tabId === 'supporters') {
      donationsProps.setMainTab('LEDGER');
    }
  };

  return (
    <main
      ref={topRef}
      className={
        publicMode
          ? 'min-h-screen overflow-x-hidden bg-[#eef5ff] px-5 pb-5 pt-28 text-[#102820] sm:px-6 sm:pb-6 lg:px-8 lg:pb-8'
          : 'min-h-screen -m-5 overflow-x-hidden bg-[#eef5ff] p-5 text-[#102820] sm:-m-6 sm:p-6 lg:-m-8 lg:p-8'
      }
    >
      {publicMode && <PublicCampaignHeader />}
      <div className="mx-auto max-w-7xl">
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex min-w-0 items-start gap-3 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500"
        >
          <Link
            to={
              publicMode
                ? PUBLIC_CAMPAIGNS_RETURN_PATH
                : isCampaignCreator
                  ? ROUTES.MY_CAMPAIGNS
                  : ROUTES.CAMPAIGNS
            }
            className="inline-flex shrink-0 items-center gap-1 font-semibold text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-4 w-4" />
            {publicMode
              ? 'Back to Home'
              : isCampaignCreator
                ? 'Back to My Campaigns'
                : 'Back to Campaigns'}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="min-w-0 break-words font-semibold leading-5 text-[#102820] [overflow-wrap:anywhere]">
            {campaign.title}
          </span>
        </nav>

        {campaign.status === 'REJECTED' && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-red-700 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="text-sm leading-6 min-w-0 flex-1">
              <p className="font-semibold">Campaign Rejected</p>
              <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                {campaign.rejectionReason || 'No rejection feedback was provided.'}
              </p>
            </div>
          </div>
        )}

        {/* Final report banner — result exists */}
        {!publicMode && isCompleted && !isLoadingFinalPost && !!campaignResult && (
          <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <FileText className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-900">Final report is available</p>
                <p className="text-xs text-emerald-700">
                  The campaign admin has published the final report for this campaign.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              {isCampaignAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditorOpen(true)}
                  className="flex items-center gap-1.5 cursor-pointer border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Report
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => navigate(resultPath)}
                className="flex items-center gap-1.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Final Report
              </Button>
            </div>
          </div>
        )}

        {/* Admin prompt — no result posted yet */}
        {!publicMode &&
          isCompleted &&
          isCampaignAdmin &&
          !isLoadingFinalPost &&
          campaignResult === null && (
            <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2 motion-safe:duration-500 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Campaign completed</p>
                  <p className="text-xs text-amber-700">
                    Post a final report to notify donors, volunteers, and followers.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => setIsEditorOpen(true)}
                className="shrink-0 cursor-pointer bg-amber-600 hover:bg-amber-700"
              >
                Post Final Report
              </Button>
            </div>
          )}

        <div className="grid items-start gap-7 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 lg:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)] lg:gap-10">
          <CampaignDetailHeader campaign={campaign} />
          <CampaignDetailSidebar
            campaign={campaign}
            donations={donationsProps.donations}
            onPostReport={() => setIsEditorOpen(true)}
            onVolunteersClick={handleVolunteersCardClick}
            onDonorsClick={handleDonorsCardClick}
            publicMode={publicMode}
          />
        </div>

        <div className="mt-14">
          <section
            ref={tabsSectionRef}
            className={`min-w-0 p-4 sm:p-5 ${
              activeTab === 'details'
                ? 'bg-transparent shadow-none'
                : 'rounded-3xl border border-blue-100/80 bg-[#eef5ff] shadow-[0_24px_70px_rgba(37,99,235,0.05)]'
            }`}
          >
            <div className="py-2">
              <div
                className="flex gap-1 overflow-x-auto scrollbar-none"
                role="tablist"
                aria-label="Campaign information"
              >
                {visibleTabs.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        const tabId = tab.id as CampaignDetailTab;
                        setActiveTab(tabId);
                        if (!publicMode) {
                          handleTabChange(tabId);
                        }
                      }}
                      role="tab"
                      aria-selected={isActive}
                      className={`flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold'
                          : 'bg-white/75 text-[#102820] font-medium hover:bg-primary-soft hover:text-primary'
                      }`}
                    >
                      <TabIcon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
                {!publicMode && (isCampaignAdmin || campaign.isJoined) && (
                  <Link
                    to={ROUTES.CAMPAIGN_TASKS.replace(':campaignId', String(campaign.id))}
                    state={state}
                    role="tab"
                    aria-selected="false"
                    className="flex shrink-0 items-center gap-2 rounded-full bg-white/75 px-5 py-2.5 text-sm font-medium text-[#102820] transition-colors duration-200 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ClipboardList className="h-4 w-4" />
                    Task Board
                  </Link>
                )}
              </div>
            </div>

            <div
              className={`motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300 ${
                publicMode ? 'pt-0' : 'pt-8'
              }`}
              key={activeTab}
              role="tabpanel"
            >
              {activeTab === 'details' && <CampaignDetailAbout campaign={campaign} />}
              {activeTab === 'volunteers' && <CampaignVolunteerRoster campaignId={campaign.id} />}
              {!publicMode && activeTab === 'announcements' && (
                <CampaignAnnouncements
                  campaignId={campaign.id}
                  campaignName={campaign.title}
                  canManage={canManageAnnouncements}
                />
              )}
              {!publicMode &&
                activeTab === 'meetings' &&
                (isCampaignAdmin || campaign?.isJoined) && (
                  <CampaignMeetings
                    campaignId={campaign.id}
                    canManageMeetings={isCampaignAdmin}
                    campaignName={campaign.title}
                  />
                )}
              {!publicMode && activeTab === 'supporters' && (
                <CampaignDetailSupporters
                  {...donationsProps}
                  isCampaignAdmin={isCampaignAdmin}
                  hideTabSelector={true}
                  currentUserEmail={user?.email}
                />
              )}
              {activeTab === 'spending' && (
                <CampaignSpendingTab
                  campaignId={campaign.id}
                  campaignStatus={campaign.status}
                  campaignStartDate={campaign.startDate}
                  isCampaignAdmin={isCampaignAdmin}
                />
              )}
            </div>
          </section>
        </div>

        {!publicMode && (
          <section className="mt-14 rounded-3xl border border-blue-100/80 bg-[#eef5ff] p-4 shadow-[0_24px_70px_rgba(37,99,235,0.05)] sm:p-5">
            <CampaignDetailSupporters
              {...donationsProps}
              isCampaignAdmin={isCampaignAdmin}
              hideTabSelector={true}
              mainTab="WALL"
              currentUserEmail={user?.email}
            />
          </section>
        )}

        {!publicMode && (isRelatedCampaignsLoading || relatedCampaigns.length > 0) && (
          <section className="relative -mx-4 mt-16 py-16 sm:-mx-6 lg:-mx-8 lg:mt-20 lg:py-20">
            <div
              aria-hidden="true"
              className="absolute top-0 -bottom-5 left-1/2 w-screen -translate-x-1/2 bg-[#e6f0fc] sm:-bottom-6 lg:-bottom-8"
            />
            <div className="@container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mb-9 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {currentLang === 'vi' ? 'Tiếp tục lan tỏa yêu thương' : 'Keep making an impact'}
                </p>
                <h2 className="mx-auto mt-2 max-w-xl text-balance font-display text-2xl font-bold tracking-[-0.025em] text-foreground sm:text-3xl">
                  {currentLang === 'vi'
                    ? 'Các chiến dịch khác bạn có thể quan tâm'
                    : 'More Campaigns You May Like'}
                </h2>
              </div>

              {isRelatedCampaignsLoading ? (
                <div className="grid gap-6 @min-[641px]:grid-cols-2 @min-[1008px]:grid-cols-3">
                  {['related-1', 'related-2', 'related-3'].map((skeletonKey) => (
                    <div
                      key={skeletonKey}
                      className="h-[30rem] animate-pulse rounded-xl bg-secondary"
                    />
                  ))}
                </div>
              ) : (
                <div className="group/carousel relative mx-auto @min-[641px]:@max-[1007px]:max-w-[760px]">
                  {relatedCampaigns.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => scroll('left')}
                        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary lg:flex opacity-0 group-hover/carousel:opacity-100"
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        onClick={() => scroll('right')}
                        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary lg:flex opacity-0 group-hover/carousel:opacity-100"
                      >
                        <ChevronRight className="h-6 w-6 text-gray-600" />
                      </button>
                    </>
                  )}
                  <div className="mx-14 overflow-hidden">
                    <div
                      ref={scrollRef}
                      className="-mx-1 flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 py-4 @min-[641px]:gap-4 @min-[1008px]:gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                    >
                      {relatedCampaigns.map((relatedCampaign) => (
                        <div
                          key={relatedCampaign.id}
                          className="w-full shrink-0 snap-start @min-[641px]:w-[calc(50%-8px)] @min-[1008px]:w-[calc(33.333%-16px)]"
                        >
                          <CampaignCard campaign={relatedCampaign} enableHoverScale={false} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {!publicMode && isCampaignAdmin && (
          <FinalPostEditorDialog
            isOpen={isEditorOpen}
            onClose={() => setIsEditorOpen(false)}
            campaign={campaign}
          />
        )}
      </div>

      <button
        type="button"
        onClick={() =>
          topRef.current?.parentElement?.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
        }
        className={`fixed right-8 bottom-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-[opacity,transform,background-color] duration-300 hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isScrollTopVisible
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-3 opacity-0'
        }`}
        aria-label="Back to top"
        title="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {(() => {
        const displayDonation = rejectedDonation || activeRejectedDonation;
        return (
          <Dialog
            isOpen={!!rejectedDonationId}
            onClose={closeRejectModal}
            title={currentLang === 'vi' ? 'Khoản quyên góp bị từ chối' : 'Donation Rejected'}
            className="max-w-md"
          >
            <div className="space-y-4 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">
                {currentLang === 'vi'
                  ? 'Khoản quyên góp của bạn đã bị từ chối'
                  : 'Your donation was rejected'}
              </h3>
              <p className="text-sm text-gray-500 break-words">
                {currentLang === 'vi'
                  ? 'Rất tiếc, quản trị viên chiến dịch đã từ chối khoản quyên góp trực tiếp gần đây của bạn cho chiến dịch '
                  : "We're sorry, but the campaign administrator has rejected your recent manual donation transfer for "}
                <span className="font-semibold text-gray-700 break-words" title={campaign.title}>
                  "{campaign.title}"
                </span>
                .
              </p>
              {displayDonation?.rejectReason && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg text-left border border-red-100 space-y-2">
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-1">
                      {currentLang === 'vi' ? 'Lý do từ Quản trị viên:' : 'Reason from Admin:'}
                    </p>
                    <p className="text-sm text-red-705">{displayDonation.rejectReason}</p>
                  </div>
                  {displayDonation.confirmedAt && (
                    <div className="pt-2 border-t border-red-200/50 flex justify-between items-center text-[11px] text-red-650 font-medium">
                      <span>{currentLang === 'vi' ? 'Thời gian từ chối:' : 'Rejected At:'}</span>
                      <span>{formatDateTime(displayDonation.confirmedAt)}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={closeRejectModal}
                  className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white cursor-pointer px-8 py-2 rounded-xl"
                >
                  {currentLang === 'vi' ? 'Đóng' : 'Close'}
                </Button>
              </div>
            </div>
          </Dialog>
        );
      })()}
    </main>
  );
}
