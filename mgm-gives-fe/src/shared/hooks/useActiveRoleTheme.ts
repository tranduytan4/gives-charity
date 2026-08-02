import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthUser } from '@/features/auth/hooks';
import { campaignApi } from '@/features/campaign/api/campaignApi';
import { ROLES } from '@/shared/constants/role';

export type RoleThemeKey = 'USER' | 'CAMPAIGN_ADMIN' | 'SYSTEM_ADMIN';

export interface RoleThemeConfig {
  key: RoleThemeKey;
  label: string;
  badgeLabel: string;
  // Header styles
  headerBorder: string;
  headerBadgeBg: string;
  headerBadgeText: string;
  // Sidebar & Navigation styles
  sidebarActiveBg: string;
  sidebarActiveText: string;
  sidebarActiveShadow: string;
  sidebarBadgeBg: string;
  sidebarBadgeText: string;
  // Accent elements
  accentText: string;
  accentBg: string;
  ringColor: string;
}

export const ROLE_THEMES: Record<RoleThemeKey, RoleThemeConfig> = {
  USER: {
    key: 'USER',
    label: 'User Portal',
    badgeLabel: 'User',
    headerBorder: 'border-blue-100',
    headerBadgeBg: 'bg-blue-50 text-blue-700 border-blue-200/80',
    headerBadgeText: 'text-blue-700',
    sidebarActiveBg: 'bg-blue-600 text-white',
    sidebarActiveText: 'text-white',
    sidebarActiveShadow: 'shadow-sm shadow-blue-200',
    sidebarBadgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
    sidebarBadgeText: 'text-blue-700',
    accentText: 'text-blue-600 hover:text-blue-700',
    accentBg: 'bg-blue-600',
    ringColor: 'focus-visible:ring-blue-500',
  },
  CAMPAIGN_ADMIN: {
    key: 'CAMPAIGN_ADMIN',
    label: 'Campaign Management',
    badgeLabel: 'Campaign Admin',
    headerBorder: 'border-emerald-200',
    headerBadgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    headerBadgeText: 'text-emerald-700',
    sidebarActiveBg: 'bg-emerald-600 text-white',
    sidebarActiveText: 'text-white',
    sidebarActiveShadow: 'shadow-sm shadow-emerald-200',
    sidebarBadgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sidebarBadgeText: 'text-emerald-700',
    accentText: 'text-emerald-600 hover:text-emerald-700',
    accentBg: 'bg-emerald-600',
    ringColor: 'focus-visible:ring-emerald-500',
  },
  SYSTEM_ADMIN: {
    key: 'SYSTEM_ADMIN',
    label: 'System Administration',
    badgeLabel: 'System Admin',
    headerBorder: 'border-indigo-200',
    headerBadgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    headerBadgeText: 'text-indigo-700',
    sidebarActiveBg: 'bg-indigo-600 text-white',
    sidebarActiveText: 'text-white',
    sidebarActiveShadow: 'shadow-sm shadow-indigo-200',
    sidebarBadgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    sidebarBadgeText: 'text-indigo-700',
    accentText: 'text-indigo-600 hover:text-indigo-700',
    accentBg: 'bg-indigo-600',
    ringColor: 'focus-visible:ring-indigo-500',
  },
};

export function useActiveRoleTheme(): RoleThemeConfig {
  const { data: user } = useAuthUser();
  const { pathname } = useLocation();

  // Query user's campaigns to check if they own an APPROVED, IN_PROGRESS, or COMPLETED campaign
  const { data: userCampaignsData } = useQuery({
    queryKey: ['user-my-campaigns-status-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await campaignApi.getCampaigns({ userId: user.id, size: 50 });
      return res.result;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const hasApprovedOrActiveCampaign = useMemo(() => {
    const list = userCampaignsData?.content || [];
    return list.some(
      (c) => c.status === 'APPROVED' || c.status === 'IN_PROGRESS' || c.status === 'COMPLETED',
    );
  }, [userCampaignsData]);

  const userRole = user?.role;

  // 1. System Admin routes (/admin/*)
  if (pathname.startsWith('/admin')) {
    if (userRole === ROLES.CAMPAIGN_ADMIN) {
      return ROLE_THEMES.CAMPAIGN_ADMIN;
    }
    if (userRole === ROLES.ADMIN) {
      return ROLE_THEMES.SYSTEM_ADMIN;
    }
  }

  // 2. Campaign Admin context:
  // Active if user has explicitly CAMPAIGN_ADMIN role OR has a campaign with status APPROVED, IN_PROGRESS, or COMPLETED
  if (userRole === ROLES.CAMPAIGN_ADMIN || hasApprovedOrActiveCampaign) {
    return ROLE_THEMES.CAMPAIGN_ADMIN;
  }

  // 3. Default User context
  return ROLE_THEMES.USER;
}
