export const campaignSpendingQueryKeys = {
  all: ['campaign-spendings'] as const,
  campaign: (campaignId: number) => ['campaign-spendings', campaignId] as const,
};
