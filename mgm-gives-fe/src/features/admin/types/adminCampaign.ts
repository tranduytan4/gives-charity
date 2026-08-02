export type CampaignStatus = 'PENDING' | 'APPROVED' | 'IN_PROGRESS' | 'REJECTED' | 'COMPLETED';
export type CampaignPriority = 'NORMAL' | 'HIGH' | 'URGENT';

export interface CategoryResponse {
  id: number;
  name: string;
  description?: string;
}

export interface CampaignMediaResponse {
  id: number;
  url: string;
  mediaType: string;
}

export interface AdminCampaignResponse {
  id: number;
  title: string;
  description: string;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  target: number;
  currentRaised?: number;
  priority: CampaignPriority;
  creatorId: number;
  creatorName: string;
  creatorEmail: string;
  rejectionReason: string | null;
  approvedAt: string | null;
  approvedById: number | null;
  approvedByName: string | null;
  categories: CategoryResponse[];
  medias?: CampaignMediaResponse[];
  createdAt: string;
  updatedAt: string;
}
