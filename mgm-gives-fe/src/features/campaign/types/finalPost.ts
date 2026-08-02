import type { CampaignSpendingResponse } from './campaignSpending';
import type { CampaignMedia } from './index';

export interface CampaignResult {
  campaignId: number;
  resultSummary: string;
  finalAmountRaised: number | null;
  itemsSummary: string | null;
  acknowledgements: string | null;
  taskSummary: string | null;
  publishedByName: string | null;
  publishedAt: string | null;
  media: CampaignMedia[];
  totalRaised: number;
  donorCount: number;
  volunteerCount: number;
  goalPercent: number;
  taskCount: number;
  completedTaskCount: number;
  spendingItems: CampaignSpendingResponse[];
  totalSpent: number;
  remainingFunds: number;
}

export interface CampaignResultRequest {
  resultSummary: string;
  finalAmountRaised?: number | null;
  itemsSummary?: string | null;
  acknowledgements?: string | null;
  taskSummary?: string | null;
  mediaIds?: number[];
}

export interface CampaignResultGenerateResponse {
  resultSummary: string;
  itemsSummary: string;
  acknowledgements: string;
  taskSummary: string;
}
