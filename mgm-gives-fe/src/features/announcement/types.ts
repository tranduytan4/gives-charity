import type { CampaignMedia } from '@/features/campaign/types';

export interface AnnouncementUserSummary {
  id: number;
  name: string | null;
  email: string | null;
  avatarUrl?: string | null;
}

export interface Announcement {
  id: number;
  campaignId: number;
  title: string;
  content: string;
  createdBy: AnnouncementUserSummary | null;
  createdAt: string;
  updatedAt: string;
  media?: CampaignMedia[];
  likesCount: number;
  repliesCount: number;
  isLiked: boolean;
}

export interface AudienceFilter {
  includeMembers: boolean;
  includeFollowers: boolean;
  includeDonors: boolean;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  audienceFilter?: AudienceFilter | null;
  mediaIds?: number[];
}

export interface UpdateAnnouncementRequest {
  title: string;
  content: string;
  mediaIds?: number[];
}

export interface AnnouncementPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  empty: boolean;
}

export interface AnnouncementReplyResponse {
  id: number;
  announcementId: number;
  content: string;
  createdBy: AnnouncementUserSummary | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  inReplyTo: AnnouncementReplyReference | null;
}

export interface AnnouncementReplyReference {
  id: number;
  createdBy: AnnouncementUserSummary | null;
  content: string | null;
  isDeleted: boolean;
}

export interface ReplyPageResponse<T> {
  content: T[];
  nextCursor: number | null;
}

export interface ReplyContextResponse {
  content: AnnouncementReplyResponse[];
  anchorReplyId: number;
  newerCursor: number | null;
  olderCursor: number | null;
  hasNewer: boolean;
  hasOlder: boolean;
}

export type ReplyContextDirection = 'newer' | 'older';

export type ReplySort = 'asc' | 'desc';

export interface CreateReplyPayload {
  content: string;
  inReplyToReplyId?: number;
}

export interface UpdateReplyPayload {
  content: string;
}
