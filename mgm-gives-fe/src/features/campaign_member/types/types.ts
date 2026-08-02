import type { Category } from '@/features/category';

export interface UnjoinRequestResponse {
  userId: number;
  userName: string;
  userAvatarUrl: string | null;
  requestedAt: string;
  activeTaskCount: number;
}

export type MemberListVisibility = 'MEMBERS_ONLY' | 'PUBLIC';

export interface CampaignRosterMember {
  userId: number;
  fullName: string;
  avatarUrl: string | null;
  joinedAt: string;
}

export interface CampaignRosterResponse {
  visibility: MemberListVisibility;
  totalVolunteers: number;
  membersVisible: boolean;
  members: CampaignRosterMember[];
  viewerIsAdmin: boolean;
  viewerIsMember: boolean;
  viewerHidden: boolean | null;
}

export interface JoinedCampaignResponse {
  campaignId: number;
  title: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  target: number;
  currentRaised?: number;
  donorsCount?: number;
  volunteersCount?: number;
  priority: string;
  role: string;
  joinedAt: string;
  coverImageUrl?: string | null;
  categories?: Category[];
  hasPendingUnjoinRequest?: boolean;
}
