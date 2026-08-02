import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getCampaignDonations,
  hideDonationMessage,
  toggleDonationAmountVisibility,
} from '@/features/donations/api';
import { donationQueryKeys } from '@/features/donations/constants/queryKeys';

export const useCampaignDonations = (campaignIdStr: string | undefined, enabled = true) => {
  const campaignId = Number(campaignIdStr);
  const queryClient = useQueryClient();

  const [mainTab, setMainTab] = useState<'LEDGER' | 'WALL'>('LEDGER');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MONEY' | 'GOODS'>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const [wallPage, setWallPage] = useState(0);

  const { data: donations = [], isLoading: loadingDonations } = useQuery({
    queryKey: donationQueryKeys.campaignDonations(campaignId),
    queryFn: async () => {
      const res = await getCampaignDonations(campaignId);

      if (!res.success) {
        throw new Error(res.message || 'Failed to load donations.');
      }

      return (res.result || []).filter((donation) => donation.status === 'SUCCESSFUL');
    },
    enabled: enabled && !!campaignId,
  });

  const handleToggleMessageHide = async (donationId: number, currentHiddenStatus: boolean) => {
    try {
      const res = await hideDonationMessage(donationId, !currentHiddenStatus);
      if (res.success) {
        toast.success(`Message ${!currentHiddenStatus ? 'hidden' : 'unhidden'} successfully.`);
        queryClient.invalidateQueries({
          queryKey: donationQueryKeys.campaignDonations(campaignId),
        });
      } else {
        toast.error(res.message || 'Failed to update message visibility.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred.');
    }
  };

  const handleToggleAmountVisibility = async (donationId: number, currentHiddenStatus: boolean) => {
    try {
      const res = await toggleDonationAmountVisibility(donationId, !currentHiddenStatus);
      if (res.success) {
        toast.success(`Donation amount ${!currentHiddenStatus ? 'hidden' : 'shown'} successfully.`);
        queryClient.invalidateQueries({
          queryKey: donationQueryKeys.campaignDonations(campaignId),
        });
      } else {
        toast.error(res.message || 'Failed to update donation amount visibility.');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred.');
    }
  };

  const filteredDonations = donations.filter((d) => {
    if (typeFilter === 'ALL') return true;
    return d.type === typeFilter;
  });

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const paginatedDonations = filteredDonations.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage,
  );

  const wallDonations = donations.filter((d) => d.message || d.isMessageHidden);
  const wallTotalPages = Math.ceil(wallDonations.length / itemsPerPage);
  const paginatedWall = wallDonations.slice(wallPage * itemsPerPage, (wallPage + 1) * itemsPerPage);

  return {
    donations,
    loadingDonations,
    mainTab,
    setMainTab,
    typeFilter,
    setTypeFilter,
    currentPage,
    setCurrentPage,
    wallPage,
    setWallPage,
    itemsPerPage,
    handleToggleMessageHide,
    handleToggleAmountVisibility,
    filteredDonations,
    totalPages,
    paginatedDonations,
    wallDonations,
    wallTotalPages,
    paginatedWall,
  };
};
