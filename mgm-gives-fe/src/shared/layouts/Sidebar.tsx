import { Compass, LayoutDashboard, Plus, Sparkles, Star, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuthUser } from '@/features/auth/hooks';
import { useCampaignDetails } from '@/features/campaign/hooks';
import { Logo } from '@/shared/components/ui/Logo';
import { ROUTES } from '@/shared/constants/routes';
import { useActiveRoleTheme } from '@/shared/hooks/useActiveRoleTheme';
import { cn } from '@/shared/utils/cn';

export default function Sidebar() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  const { data: user } = useAuthUser();
  const activeRoleTheme = useActiveRoleTheme();

  const navItems = [
    { label: t('nav.dashboard'), to: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: t('nav.browseCampaigns'), to: ROUTES.CAMPAIGNS, icon: Compass },
    { label: t('nav.myCampaigns'), to: ROUTES.MY_CAMPAIGNS, icon: Star },
    { label: t('nav.joinedCampaigns'), to: ROUTES.JOINED_CAMPAIGNS, icon: Users },
  ];

  // Extract campaign ID if we are on a campaign subroute
  const campaignMatch = pathname.match(/^\/campaigns\/(\d+)/);
  const campaignId = campaignMatch ? campaignMatch[1] : null;

  // Detect if we navigated here from the Joined / My / Browse Campaigns page
  const navigationFrom = (state as { from?: string } | null)?.from;
  const fromJoined = navigationFrom === 'joined';
  const fromMyCampaigns = navigationFrom === 'my-campaigns';
  const fromBrowse = navigationFrom === 'browse';

  // Fetch campaign details and check creator ownership
  const { data: campaignResponse } = useCampaignDetails(campaignId || '');
  const campaignData = campaignResponse?.result;
  const isOwnCampaignDetail = campaignData?.creatorId && user?.id === campaignData.creatorId;

  const isItemActive = (to: string) => {
    if (to === ROUTES.DASHBOARD) {
      return pathname === ROUTES.DASHBOARD || pathname === '/';
    }

    if (campaignId) {
      if (fromJoined) return to === ROUTES.JOINED_CAMPAIGNS;
      if (fromMyCampaigns) return to === ROUTES.MY_CAMPAIGNS;
      if (fromBrowse) return to === ROUTES.CAMPAIGNS;

      if (isOwnCampaignDetail) return to === ROUTES.MY_CAMPAIGNS;
      if (campaignData?.isJoined) return to === ROUTES.JOINED_CAMPAIGNS;
      return to === ROUTES.CAMPAIGNS;
    }

    if (to === ROUTES.CAMPAIGNS) {
      return pathname === ROUTES.CAMPAIGNS;
    }
    return pathname.startsWith(to);
  };

  return (
    <aside
      className="w-64 flex flex-col bg-white border-r border-border h-full shrink-0"
      aria-label="Main navigation"
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <Link
          to={ROUTES.DASHBOARD}
          className={`flex flex-col gap-0.5 outline-none ${activeRoleTheme.ringColor} rounded-md`}
          aria-label="Go to Dashboard"
        >
          <Logo className="h-9 w-auto" />
          <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase pl-0.5">
            {t('nav.charityPlatform')}
          </span>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Sidebar navigation">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={() =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    isItemActive(item.to)
                      ? `${activeRoleTheme.sidebarActiveBg} ${activeRoleTheme.sidebarActiveShadow}`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )
                }
                aria-label={item.label}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom CTA Card */}
      <div className="px-3 pb-4 shrink-0">
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-4 shadow-lg shadow-blue-200/60">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
          {/* Sparkle icon */}
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-4 w-4 text-white/80" aria-hidden="true" />
            <span className="text-xs font-medium text-white/80">{t('cta.makeImpact')}</span>
          </div>
          <p className="text-sm font-bold text-white mb-3 leading-snug">{t('cta.startCampaign')}</p>
          <button
            id="sidebar-new-campaign-btn"
            type="button"
            onClick={() => navigate(ROUTES.CREATE_CAMPAIGN)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 shadow-sm"
            aria-label={t('cta.newCampaign')}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('cta.newCampaign')}
          </button>
        </div>
      </div>
    </aside>
  );
}
