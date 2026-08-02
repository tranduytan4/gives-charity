import type { CampaignResponse } from '@/features/campaign';
import type { DonationResponseData, StandardApiResponse } from '@/features/donations/api';
import apiClient from '@/lib/apiClient';

export interface Activity {
  id: string;
  type: 'NOTIFICATION' | 'ANNOUNCEMENT' | 'DONATION';
  title: string;
  message: string;
  linkUrl?: string;
  createdAt: string;
}

export interface DashboardOverviewData {
  totalDonatedAmount: number;
  followedCampaignsCount: number;
  completedCampaignsCount: number;
  recommendedCampaigns: CampaignResponse[];
  recentDonations: DonationResponseData[];
  recentActivities: Activity[];
}

export async function getDashboardOverview(): Promise<StandardApiResponse<DashboardOverviewData>> {
  const response =
    await apiClient.get<StandardApiResponse<DashboardOverviewData>>('/dashboard/overview');
  return response.data;
}
