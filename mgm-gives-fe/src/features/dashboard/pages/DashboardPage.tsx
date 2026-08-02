import DOMPurify from 'dompurify';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Bell,
  Bookmark,
  Clock,
  Coins,
  Gift,
  Heart,
  Megaphone,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import heroImg2 from '@/assets/image/587060747_1431972062266474_4260127970844541890_n.jpg';
import heroImg3 from '@/assets/image/587917354_1431971958933151_4503624089503503278_n.jpg';
import heroImg1 from '@/assets/image/588562958_1431972428933104_8072517601409147699_n.jpg';
import { useAuthUser } from '@/features/auth/hooks';
import { TempDashboard } from '@/features/auth/pages';
import { useJoinedCampaigns } from '@/features/campaign_member/hooks/hooks';
import { type DashboardOverviewData, getDashboardOverview } from '@/features/dashboard/api';
import { useDashboardSocket } from '@/features/dashboard/hooks/useDashboardSocket';
import { useNotificationSocket } from '@/features/notification/hooks/useNotificationSocket';
import { Tooltip } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { formatCompactNumber, formatFullCurrency } from '@/shared/utils/currency';
import { filterCardDescription } from '@/shared/utils/html';
import {
  localizeDonationStatus,
  localizeNotificationMessage,
  localizeNotificationTitle,
  localizePaymentMethod,
  localizeShortDate,
  localizeTimeAgo,
} from '@/shared/utils/localizeContent';
import { getMediaUrl } from '@/shared/utils/media';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

const campaignHeroImages = [heroImg1, heroImg2, heroImg3];

const getActivityIconAndStyle = (act: {
  type: 'NOTIFICATION' | 'ANNOUNCEMENT' | 'DONATION';
  title: string;
  message: string;
}) => {
  if (act.type === 'ANNOUNCEMENT') {
    return {
      icon: <Megaphone className="h-4 w-4" />,
      style: 'bg-emerald-50 text-emerald-500 border-emerald-100/50 shadow-sm',
    };
  }

  const msg = act.message.toLowerCase();
  const title = act.title.toLowerCase();
  const isDonation =
    act.type === 'DONATION' || msg.includes('donation') || title.includes('donation');

  if (isDonation) {
    if (
      msg.includes('reject') ||
      title.includes('reject') ||
      msg.includes('fail') ||
      title.includes('fail')
    ) {
      return {
        icon: <AlertCircle className="h-4 w-4" />,
        style: 'bg-red-50 text-red-600 border-red-100/50 shadow-sm',
      };
    }
    return {
      icon: <Heart className="h-4 w-4 fill-current" />,
      style: 'bg-rose-50 text-rose-500 border-rose-100/50 shadow-sm',
    };
  }

  return {
    icon: <Bell className="h-4 w-4" />,
    style: 'bg-amber-50 text-amber-500 border-amber-100/50 shadow-sm',
  };
};

const formatVND = (value: number): string => `${new Intl.NumberFormat('vi-VN').format(value)} VND`;

const getRemainingDays = (endDateStr: string): number =>
  Math.max(0, Math.ceil((new Date(endDateStr).getTime() - Date.now()) / 86_400_000));

export default function DashboardPage() {
  const { t, i18n } = useTranslation('dashboard');
  const currentLang = i18n.language;
  const navigate = useNavigate();
  const { data: user } = useAuthUser();
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % campaignHeroImages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Auto-refresh relative timestamps every 30 seconds (realtime UX)
  const [, setTimeTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTimeTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fetch Joined Campaigns data using the exact same React Query hook as Joined Campaigns page
  const { data: joinedCampaignsPageData, isLoading: joinedLoading } = useJoinedCampaigns({
    page: 0,
    size: 1,
  });

  const joinedCount = joinedCampaignsPageData?.totalElements ?? 0;

  // Core fetch
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await getDashboardOverview();
      if (res.success && res.result) {
        setData(res.result);
        setError(null);
      } else {
        setError(res.message || 'Failed to retrieve dashboard data.');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('An error occurred while connecting to the server.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    void fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    if (user?.status !== 'INACTIVE') {
      void fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  useDashboardSocket(() => {
    if (user?.status !== 'INACTIVE') {
      console.log('Real-time dashboard update event received. Refetching dashboard data...');
      void fetchDashboardData();
    }
  });

  useNotificationSocket(() => {
    if (user?.status !== 'INACTIVE') {
      console.log('Real-time notification socket event received. Refetching dashboard data...');
      void fetchDashboardData();
    }
  });

  if (user?.status === 'INACTIVE') {
    return <TempDashboard />;
  }

  const isPageLoading = loading || joinedLoading;

  // Loading state (Skeleton screens)
  if (isPageLoading) {
    return (
      <div className="space-y-8 animate-pulse p-1">
        {/* Banner Skeleton */}
        <div className="h-44 rounded-3xl bg-gray-200/80" />

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-gray-200/80" />
          ))}
        </div>

        {/* Recommended Campaigns Skeleton */}
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200/80 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-gray-200/80" />
            ))}
          </div>
        </div>

        {/* Two Column Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-[380px] rounded-2xl bg-gray-200/80" />
          <div className="h-[380px] rounded-2xl bg-gray-200/80" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50/50 p-8 text-center max-w-2xl mx-auto my-12 shadow-sm">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-sm text-gray-600 mb-6">{error}</p>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen -m-6 overflow-hidden bg-transparent p-6 lg:-m-8 lg:p-8">
      {/* Subtle non-slop background glow effects */}
      <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-blue-50/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-indigo-50/30 rounded-full blur-[130px] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 space-y-10 pb-10"
      >
        {/* 1. Welcome Banner */}
        <motion.div
          variants={itemVariants}
          className="group relative h-[220px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1e3a8a] via-[#1e3a5f] to-[#0c1a2e] p-5 text-white shadow-[0_12px_40px_rgba(30,58,138,0.22)] md:h-[260px] md:p-8"
        >
          {/* Background photo slideshow */}
          <div className="absolute inset-0 overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.img
                key={activeImageIndex}
                src={campaignHeroImages[activeImageIndex]}
                alt=""
                initial={{ opacity: 0, scale: 1.06 }}
                animate={{ opacity: 0.55, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 1.8, ease: 'easeInOut' }}
                className="absolute inset-0 h-full w-full object-cover object-center"
              />
            </AnimatePresence>
          </div>

          {/* Deep navy overlay — readable text, right side shows photo */}
          <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(15,23,65,0.85)_0%,rgba(15,23,65,0.55)_50%,rgba(15,23,65,0.15)_100%)]" />

          {/* Subtle bottom vignette */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            {/* Top row: eyebrow */}
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-blue-400/25 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold normal-case tracking-wide text-blue-200 backdrop-blur-sm">
              {t('bannerEyebrow')}
            </span>

            {/* Bottom row: content + CTAs */}
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="space-y-1">
                <h1 className="text-2xl font-black leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] md:text-3xl">
                  {t('welcomeBanner', {
                    name: user?.fullName ? user.fullName.split(' ').pop() : '',
                  })}
                </h1>
                <p className="text-xs font-medium text-white/70 md:text-sm">{t('subtitle')}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => navigate(ROUTES.CAMPAIGNS)}
                  className="flex h-10 items-center gap-1.5 rounded-xl bg-white px-4 text-xs font-extrabold text-slate-800 shadow-md transition-all hover:bg-slate-50 cursor-pointer"
                >
                  {t('browseCampaigns')}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => navigate(ROUTES.CREATE_CAMPAIGN)}
                  className="h-10 rounded-xl border border-white/25 bg-white/12 px-4 text-xs font-extrabold text-white backdrop-blur-md transition-colors hover:bg-white/20 cursor-pointer"
                >
                  {t('startCampaign')}
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2. Overview Stat Cards */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {t('yourOverview')}
            </p>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card: Total Donated */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className="relative rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:border-emerald-200/80 transition-all duration-300 group flex items-center justify-between gap-4"
            >
              <div className="space-y-1 relative z-10 min-w-0 flex-1 @container">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {t('metrics.totalDonated')}
                </p>
                <Tooltip
                  content={`Exact amount: ${formatFullCurrency(data?.totalDonatedAmount || 0, 'VND')}`}
                >
                  {(data?.totalDonatedAmount || 0) >= 1_000_000_000 ? (
                    <h3
                      className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex flex-col @[280px]:flex-row @[280px]:items-baseline gap-y-0.5 @[280px]:gap-x-1 focus:outline-hidden cursor-default relative"
                      aria-label={`Total donated: ${formatFullCurrency(data?.totalDonatedAmount || 0, 'VND')}`}
                    >
                      {/* Compact display shown when text container is narrow (< 280px) */}
                      <span className="@[280px]:hidden">
                        {formatCompactNumber(data?.totalDonatedAmount || 0)}
                      </span>
                      {/* Full display shown when text container is wide (>= 280px) */}
                      <span className="hidden @[280px]:inline">
                        {new Intl.NumberFormat('en-US').format(data?.totalDonatedAmount || 0)}
                      </span>
                      <span className="text-xs md:text-sm font-semibold text-slate-400 shrink-0">
                        VND
                      </span>
                    </h3>
                  ) : (
                    <h3
                      className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight flex flex-col @[160px]:flex-row @[160px]:items-baseline gap-y-0.5 @[160px]:gap-x-1 focus:outline-hidden cursor-default relative"
                      aria-label={`Total donated: ${formatFullCurrency(data?.totalDonatedAmount || 0, 'VND')}`}
                    >
                      {/* Compact display shown when text container is narrow (< 160px) */}
                      <span className="@[160px]:hidden">
                        {formatCompactNumber(data?.totalDonatedAmount || 0)}
                      </span>
                      {/* Full display shown when text container is wide (>= 160px) */}
                      <span className="hidden @[160px]:inline">
                        {new Intl.NumberFormat('en-US').format(data?.totalDonatedAmount || 0)}
                      </span>
                      <span className="text-xs md:text-sm font-semibold text-slate-400 shrink-0">
                        VND
                      </span>
                    </h3>
                  )}
                </Tooltip>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {t('metrics.totalDonatedSub')}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/30 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <Coins className="h-5 w-5 transition-transform duration-300 ease-out group-hover:scale-108 group-hover:-translate-y-0.5" />
              </div>
            </motion.div>

            {/* Card: Joined Campaigns (Replaced Active Campaigns) */}
            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:border-blue-200/80 transition-all duration-300 group flex items-center justify-between gap-4"
            >
              <div className="space-y-1 relative z-10 min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {t('metrics.joinedCampaigns')}
                </p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight truncate">
                  {joinedCount}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {t('metrics.joinedCampaignsSub')}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/30 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                <Users className="h-5 w-5 transition-transform duration-300 ease-out group-hover:scale-108 group-hover:-translate-y-0.5" />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:border-indigo-200/80 transition-all duration-300 group flex items-center justify-between gap-4"
            >
              <div className="space-y-1 relative z-10 min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {t('metrics.followedCampaigns')}
                </p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight truncate">
                  {data?.followedCampaignsCount || 0}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {t('metrics.followedCampaignsSub')}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/30 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                <Bookmark className="h-5 w-5 transition-transform duration-300 ease-out group-hover:scale-108 group-hover:-translate-y-0.5" />
              </div>
            </motion.div>

            <motion.div
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.03)] hover:border-purple-200/80 transition-all duration-300 group flex items-center justify-between gap-4"
            >
              <div className="space-y-1 relative z-10 min-w-0 flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                  {t('metrics.completedCampaigns')}
                </p>
                <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight truncate">
                  {data?.completedCampaignsCount || 0}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {t('metrics.completedCampaignsSub')}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100/30 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                <Award className="h-5 w-5 transition-transform duration-300 ease-out group-hover:scale-108 group-hover:-translate-y-0.5" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* 3. Recommended Campaigns */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                {t('sections.recommendedForYou')}
              </p>
            </div>
            <div className="flex-1 h-px bg-slate-100" />
            <button
              type="button"
              onClick={() => navigate(ROUTES.CAMPAIGNS)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer transition-colors duration-200 shrink-0"
            >
              {t('viewAll')}
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {!data?.recommendedCampaigns || data.recommendedCampaigns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-8 text-center text-slate-400 text-sm">
              No active campaigns recommended at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.recommendedCampaigns.map((c) => {
                const targetVal = c.target || 0;
                const raisedVal = c.currentRaised || 0;
                const rawPercent = targetVal > 0 ? (raisedVal / targetVal) * 100 : 0;
                const progressPercent =
                  rawPercent > 0 && rawPercent < 0.01
                    ? '0.01'
                    : Math.min(100, rawPercent).toFixed(2);
                const remainingDays = getRemainingDays(c.endDate || '');
                const coverImage = getMediaUrl(c.coverImageUrl);

                return (
                  <motion.button
                    key={c.id}
                    whileHover={{ y: -6, scale: 1.005 }}
                    type="button"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                    className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.01)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.04)] hover:border-blue-100 transition-all duration-350 cursor-pointer text-left h-full w-full font-inherit focus:outline-none"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-50 shrink-0">
                      <img
                        src={coverImage || undefined}
                        alt={c.title}
                        className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-700"
                      />
                      <div className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-bold text-blue-600 shadow-sm border border-blue-50/20">
                        {currentLang === 'vi'
                          ? remainingDays === 0
                            ? 'Hết hạn hôm nay'
                            : `Còn ${remainingDays} ngày`
                          : remainingDays === 0
                            ? 'Ends Today'
                            : `${remainingDays} days left`}
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-blue-600 transition-colors duration-200">
                          {c.title}
                        </h3>
                        <div
                          className="text-[11px] text-slate-400 leading-relaxed font-medium line-clamp-2 prose prose-sm max-w-none break-words w-full [&>*]:m-0"
                          // biome-ignore lint/security/noDangerouslySetInnerHtml: Render HTML
                          dangerouslySetInnerHTML={{
                            __html: filterCardDescription(DOMPurify.sanitize(c.description || '')),
                          }}
                        />
                      </div>

                      {/* Progress */}
                      <div className="space-y-2.5 pt-2.5 border-t border-slate-50">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-blue-600">
                            {currentLang === 'vi'
                              ? `Đã đạt ${progressPercent}%`
                              : `${progressPercent}% raised`}
                          </span>
                          <span className="text-slate-800">{formatVND(raisedVal)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500 relative"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                          <span>
                            {currentLang === 'vi' ? 'Mục tiêu: ' : 'Target: '}
                            {formatVND(targetVal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* 4 & 5. Balanced 2-Column Scrollable: Recent Donations & Activities */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {t('sections.recentActivity')}
            </p>
            <div className="flex-1 h-px bg-slate-100" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Donations */}
            <motion.div variants={itemVariants} className="space-y-3 flex flex-col">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                  <Coins className="h-4 w-4 text-emerald-500" />
                  {t('sections.myRecentDonations')}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.MY_DONATIONS)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group cursor-pointer transition-colors duration-200"
                >
                  {t('viewAll')}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[380px]">
                {!data?.recentDonations || data.recentDonations.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-slate-400 text-sm p-8 text-center">
                    <p className="mb-2">
                      {currentLang === 'vi'
                        ? 'Bạn chưa thực hiện khoản quyên góp nào.'
                        : "You haven't made any donations yet."}
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate(ROUTES.CAMPAIGNS)}
                      className="text-blue-600 font-bold cursor-pointer hover:underline bg-transparent border-none p-0 inline text-left text-xs"
                    >
                      {t('browseCampaigns')}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-50 h-[330px] custom-scrollbar scroll-smooth">
                    {data.recentDonations.map((d) => (
                      <div
                        key={d.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-50/70 hover:translate-x-0.5 transition-all duration-200 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                              d.type === 'MONEY'
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100/30'
                                : 'bg-amber-50 text-amber-600 border-amber-100/30'
                            }`}
                          >
                            {d.type === 'MONEY' ? (
                              <Coins className="h-4.5 w-4.5" />
                            ) : (
                              <Gift className="h-4.5 w-4.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-700 truncate max-w-[150px] sm:max-w-xs group-hover:text-blue-600 transition-colors duration-200">
                              {d.campaignName}
                            </h4>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  d.status === 'SUCCESSFUL'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/10'
                                    : d.status === 'PENDING'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-100/10'
                                      : 'bg-red-50 text-red-700 border border-red-100/10'
                                }`}
                              >
                                {localizeDonationStatus(d.status, currentLang)}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium">
                                {localizeShortDate(d.createdAt, currentLang)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-extrabold text-slate-800">
                            {d.type === 'MONEY'
                              ? d.amount != null
                                ? formatVND(Number(d.amount))
                                : '*****'
                              : d.detail ||
                                (currentLang === 'vi' ? 'Quyên góp hiện vật' : 'Goods Donation')}
                          </p>
                          <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                            {d.type === 'MONEY'
                              ? localizePaymentMethod('Via Bank Transfer', currentLang)
                              : localizePaymentMethod('Hand delivered', currentLang)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="border-t border-slate-50 px-5 py-3 flex justify-between text-[9px] text-slate-400 font-bold shrink-0 bg-slate-50/30 rounded-b-2xl">
                  <span className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-emerald-500" />{' '}
                    {currentLang === 'vi' ? 'Quyên góp tiền' : 'Money Donation'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Gift className="h-3.5 w-3.5 text-amber-500" />{' '}
                    {currentLang === 'vi' ? 'Quyên góp hiện vật' : 'Goods Donation'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Recent Activities */}
            <motion.div variants={itemVariants} className="space-y-3 flex flex-col">
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-bold text-slate-600">
                  {t('sections.recentActivity')}
                </span>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between h-[380px]">
                {!data?.recentActivities || data.recentActivities.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-slate-400 text-sm py-12">
                    {currentLang === 'vi'
                      ? 'Chưa có hoạt động gần đây.'
                      : 'No recent activities recorded.'}
                  </div>
                ) : (
                  <div className="overflow-y-auto flex-1 divide-y divide-slate-50 h-[330px] custom-scrollbar scroll-smooth">
                    {data.recentActivities.map((act) => {
                      const { icon, style } = getActivityIconAndStyle(act);

                      return (
                        // biome-ignore lint/a11y/noStaticElementInteractions: Interactive list item element
                        // biome-ignore lint/a11y/useKeyWithClickEvents: Click handler is handled appropriately via cursor style
                        <div
                          key={act.id}
                          onClick={() => act.linkUrl && navigate(act.linkUrl)}
                          className={`p-4 flex items-start gap-3 hover:bg-slate-50/70 hover:translate-x-0.5 transition-all duration-200 group relative overflow-hidden ${
                            act.linkUrl ? 'cursor-pointer' : ''
                          }`}
                        >
                          {/* Type indicator vertical bar */}
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-[2.5px] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center ${
                              act.type === 'DONATION'
                                ? 'bg-rose-400'
                                : act.type === 'ANNOUNCEMENT'
                                  ? 'bg-emerald-400'
                                  : 'bg-amber-400'
                            }`}
                          />
                          <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 ${style}`}
                          >
                            {icon}
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex justify-between items-baseline gap-4">
                              <h4 className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors duration-200">
                                {localizeNotificationTitle(act.title, currentLang)}
                              </h4>
                              <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                                {localizeTimeAgo(act.createdAt, currentLang)}
                              </span>
                            </div>

                            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 font-medium">
                              {localizeNotificationMessage(act.message, currentLang)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="border-t border-slate-50 px-5 py-3 flex justify-between text-[9px] text-slate-400 font-bold shrink-0 bg-slate-50/30 rounded-b-2xl">
                  <span className="flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-amber-500" />{' '}
                    {currentLang === 'vi' ? 'Thông báo' : 'Notification'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />{' '}
                    {currentLang === 'vi' ? 'Quyên góp' : 'Donation'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Megaphone className="h-3.5 w-3.5 text-emerald-500" />{' '}
                    {currentLang === 'vi' ? 'Thông báo' : 'Announcement'}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
