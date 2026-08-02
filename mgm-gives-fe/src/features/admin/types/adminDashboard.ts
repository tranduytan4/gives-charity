import type { DonationStatus } from '@/features/donations/types/types';

export interface AdminDashboardOverview {
  totalEmployees: number;
  campaignAdmins: number;
  totalCampaigns: number;
  pendingCampaigns: number;
  activeCampaigns: number;
  totalDonation: number;
  newUsersThisMonth: number;
}

export interface MonthlyActivity {
  month: string;
  count: number;
}

export interface CategoryMix {
  name: string;
  count: number;
  color: string;
}

export interface RecentDonationItem {
  id: number;
  donorName: string;
  donorEmail: string;
  campaignName: string;
  amount: number | string | null;
  detail: string | null;
  type: 'MONEY' | 'GOODS';
  status: DonationStatus;
  isAnonymous: boolean;
  createdAt: string;
}

export interface RecentCampaignItem {
  id: number;
  title: string;
  categoryName: string;
  creatorName: string;
  status: string;
  createdAt: string;
}
