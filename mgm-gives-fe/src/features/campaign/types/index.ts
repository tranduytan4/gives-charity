import type { Category } from '@/features/category';

export * from './finalPost';

export type CampaignStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'REJECTED'
  | 'COMPLETED';

export interface Campaign {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  categories?: { id: number; name: string }[];
  target: number;
  currentRaised: number;
  status: CampaignStatus;
  priority?: CampaignPriority;
  createdAt: string;
  endDate: string;
  donorsCount: number;
  volunteersCount?: number;
  creatorId?: number;
  creatorName?: string;
  creatorAvatarUrl?: string | null;
  isFollowed?: boolean;
  isJoined?: boolean;
  roleInCampaign?: 'CAMPAIGN_ADMIN' | 'VOLUNTEER' | string | null;
}

export type CampaignPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export type UnjoinCampaignStatus = 'LEFT' | 'PENDING_APPROVAL';

export interface UnjoinCampaignResponse {
  status: UnjoinCampaignStatus;
}

export interface CampaignMedia {
  id: number;
  url: string;
  mediaType: string;
  isCover: boolean;
  caption?: string | null;
  displayOrder?: number;
}

export interface CampaignResponse {
  id: number;
  title: string;
  description: string | null;
  target?: number;
  currentRaised?: number;
  status: CampaignStatus;
  priority?: CampaignPriority;
  categoryId?: number;
  categoryName?: string;
  startDate: string | null;
  endDate: string | null;
  acceptsMoney: boolean;
  acceptsGoods: boolean;
  rejectionReason: string | null;
  creatorId: number;
  creatorName: string;
  creatorAvatarUrl?: string | null;
  categories: Category[];
  media?: CampaignMedia[];
  coverImageUrl: string | null;
  isEditable: boolean;
  createdAt: string;
  dueDate?: string;
  donorsCount?: number;
  isFollowed?: boolean;
  updatedAt?: string;
  isJoined?: boolean;
  hasPendingUnjoinRequest?: boolean;
  volunteersCount?: number;
  medias?: CampaignMediaResponse[];
  slug?: string;
  shortDescription?: string;
  roleInCampaign?: 'CAMPAIGN_ADMIN' | 'VOLUNTEER' | string | null;
  campaignAdmin?: boolean;
  resultPosted?: boolean;
  resultPublishedAt?: string | null;
  resultPublishedByName?: string | null;
  donationMethod?: DonationMethod;
  qrImageUrl?: string | null;
  qrBankInfo?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  bankBin?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolderName?: string | null;
  creatorHasPayOS?: boolean;
}

export type DonationMethod = 'MANUAL_QR' | 'PAYOS' | 'HYBRID';

export interface CampaignMediaResponse {
  id: number;
  campaignId: number;
  mediaUrl?: string;
  url?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  type?: string;
  isCover?: boolean;
  updatedAt: string;
}

export interface CampaignQueryParams {
  status?: CampaignStatus;
  priority?: CampaignPriority;
  categoryId?: number | string | number[];
  userId?: number;
  keyword?: string;
  page?: number;
  size?: number;
  sort?: string;
  isFollowing?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  code?: number;
  message?: string;
  result: T;
  timestamp?: string;
  path?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
export interface CampaignRequest {
  title: string;
  description?: string | null;
  categories?: number[] | null;
  acceptsMoney?: boolean;
  acceptsGoods?: boolean;
  target?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: CampaignStatus;
  priority?: CampaignPriority;
  donationMethod?: DonationMethod;
  qrImageUrl?: string | null;
  qrBankInfo?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  bankBin?: string | null;
  bankAccountNumber?: string | null;
  bankAccountHolderName?: string | null;
}

export interface CampaignMeeting {
  id: number;
  campaignId: number;
  createdById: number;
  createdByName: string;
  webexMeetingId: string | null;
  title: string;
  description: string | null;
  meetingUrl: string | null;
  meetingType: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  location: string | null;
  startTime: string;
  endTime: string;
  status: string;
  notifyAll: boolean;
  invitedCount: number;
  invitedUserIds?: number[];
  displayStatus: 'UPCOMING' | 'IN_PROGRESS' | 'ENDED' | 'CANCELLED' | 'EXPIRED' | string;
  canManage: boolean;
  canUpdate: boolean;
  canCancel: boolean;
  canEditNotes: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMeetingRecipient {
  userId: number;
  fullName: string;
  email: string;
  roleInCampaign: string | null;
}

export interface CreateCampaignMeetingRequest {
  title: string;
  description?: string | null;
  meetingType?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  location?: string | null;
  meetingUrl?: string | null;
  startTime: string;
  endTime: string;
  notifyAll: boolean;
  recipientUserIds: number[];
}

export type CampaignMeetingView = 'upcoming' | 'in-progress' | 'past' | 'all';

export interface UpdateCampaignMeetingRequest {
  title: string;
  description?: string | null;
  meetingType?: 'ONLINE' | 'OFFLINE' | 'HYBRID';
  location?: string | null;
  startTime: string;
  endTime: string;
}

export interface CampaignMeetingNotes {
  meetingId: number;
  content: string | null;
  updatedAt: string | null;
  updatedById: number | null;
  updatedByName: string | null;
  canEdit: boolean;
}

export interface UpdateCampaignMeetingNotesRequest {
  content: string;
}

export interface CampaignMeetingActivity {
  type: string;
  message: string;
  actorId: number | null;
  actorName: string | null;
  timestamp: string;
}

export interface CampaignMeetingAttachment {
  id: number;
  url: string;
  mediaType: 'IMAGE' | 'VIDEO' | string;
  isCover: boolean;
}
