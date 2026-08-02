export interface SpendingPhoto {
  id: number;
  url: string;
  mediaType: string;
  isCover: boolean;
  caption?: string | null;
  displayOrder?: number | null;
  context: string;
}

export interface SpendingUser {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
}

export interface CampaignSpendingResponse {
  id: number;
  campaignId: number;
  amount: number;
  description: string;
  spentAt: string;
  createdBy: SpendingUser | null;
  photos: SpendingPhoto[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CampaignSpendingListResponse {
  items: CampaignSpendingResponse[];
  totalRaised: number;
  totalSpent: number;
  remainingFunds: number;
}

export interface Spending {
  id: number;
  campaignId: number;
  amount: number;
  description: string;
  spentAt: string;
  createdBy: SpendingUser | null;
  photos: SpendingPhoto[];
  createdAt: string;
  updatedAt: string | null;
  isEdited: boolean;
}

export interface CreateCampaignSpendingRequest {
  amount: number;
  description: string;
  spentAt: string;
}

export interface UpdateCampaignSpendingRequest {
  amount?: number;
  description?: string;
  spentAt?: string;
}

export const toSpending = (response: CampaignSpendingResponse): Spending => ({
  ...response,
  isEdited: response.updatedAt != null,
});
