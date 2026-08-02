import { getAdminDonations } from '@/features/donations/api';
import type { DonationAdminResponseData } from '@/features/donations/types/types';
import { apiClient } from '@/lib/apiClient';
import type { ApiResponse } from '@/shared/types';
import { parseUTCDate } from '@/shared/utils/format';
import type {
  AdminCampaignResponse,
  AdminCategoryResponse,
  AdminDashboardOverview,
  CategoryMix,
  MonthlyActivity,
  PageResponse,
  RecentCampaignItem,
  RecentDonationItem,
} from '../types';
import type { GetCampaignsParams } from './adminCampaignApi';

const getCategoryColor = (index: number) => {
  // Golden-angle spacing keeps every category hue unique, even when the list is long.
  const hue = Math.round((index * 137.508) % 360);
  return `hsl(${hue} 68% 52%)`;
};

export async function getAdminDashboardData() {
  const overviewPromise = apiClient.get<ApiResponse<AdminDashboardOverview>>(
    'admin/dashboard/overview',
  );

  const campaignsPromise = apiClient.get<ApiResponse<PageResponse<AdminCampaignResponse>>>(
    'admin/campaigns',
    { params: { page: 0, size: 5, sort: 'createdAt,desc' } as GetCampaignsParams },
  );

  const donationsPromise = getAdminDonations({
    page: 0,
    size: 5,
    sort: 'createdAt,desc',
  });

  const categoriesPromise = apiClient.get<ApiResponse<PageResponse<AdminCategoryResponse>>>(
    'admin/categories',
    { params: { page: 0, size: 100 } },
  );

  const [overviewRes, campaignsRes, donationsRes, categoriesRes] = await Promise.all([
    overviewPromise,
    campaignsPromise,
    donationsPromise,
    categoriesPromise,
  ]);

  const overview = overviewRes.data.result || {
    totalEmployees: 0,
    campaignAdmins: 0,
    totalCampaigns: 0,
    pendingCampaigns: 0,
    activeCampaigns: 0,
    totalDonation: 0,
    newUsersThisMonth: 0,
  };

  const recentDonations: RecentDonationItem[] = (donationsRes.result?.content || []).map((d) => ({
    id: d.id,
    donorName: d.isAnonymous ? 'Anonymous' : d.userName || d.donorName || 'Unknown',
    donorEmail: d.isAnonymous ? '' : d.userEmail || '',
    campaignName: d.campaignName,
    amount: d.amount ?? null,
    detail: d.detail ?? null,
    type: d.type,
    status: d.status,
    isAnonymous: d.isAnonymous,
    createdAt: d.createdAt,
  }));

  const recentCampaigns: RecentCampaignItem[] = (campaignsRes.data.result?.content || []).map(
    (c) => ({
      id: c.id,
      title: c.title,
      categoryName: c.categories?.[0]?.name || 'Uncategorized',
      creatorName: c.creatorName,
      status: c.status,
      createdAt: c.createdAt,
    }),
  );

  const categories = categoriesRes.data.result?.content || [];
  const categoryMix: CategoryMix[] = categories
    .filter((cat) => (cat.campaignsCount ?? 0) > 0)
    .map((cat, index) => ({
      name: cat.name,
      count: cat.campaignsCount ?? 0,
      color: getCategoryColor(index),
    }));

  // Build monthly activity (from donations creation dates)
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const now = new Date();
  const monthlyActivity: MonthlyActivity[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyActivity.push({
      month: monthNames[date.getMonth()] ?? 'Unknown',
      count: 0,
    });
  }

  try {
    const allDonations = await apiClient.get<ApiResponse<PageResponse<DonationAdminResponseData>>>(
      'admin/donations',
      { params: { page: 0, size: 100, sort: 'createdAt,desc' } },
    );
    const donations = allDonations.data.result?.content || [];
    for (const d of donations) {
      const createdDate = parseUTCDate(d.createdAt);
      for (const ma of monthlyActivity) {
        const maDate = new Date(now.getFullYear(), monthNames.indexOf(ma.month), 1);
        if (
          createdDate.getMonth() === maDate.getMonth() &&
          createdDate.getFullYear() === maDate.getFullYear()
        ) {
          ma.count++;
        }
      }
    }
  } catch {}

  return {
    overview,
    recentDonations,
    recentCampaigns,
    categoryMix,
    monthlyActivity,
  };
}
