export const donationQueryKeys = {
  myDonations: ['myDonations'] as const,
  adminDonations: ['adminDonations'] as const,
  campaignDonations: (campaignId: number) => ['campaignDonations', campaignId] as const,
};
