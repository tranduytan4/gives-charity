import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { approveCampaign, rejectCampaign } from '../api/adminCampaignApi';

interface UseAdminCampaignMutationsProps {
  onSuccess?: () => void;
}

export function useAdminCampaignMutations({ onSuccess }: UseAdminCampaignMutationsProps = {}) {
  const [isMutating, setIsMutating] = useState(false);
  const queryClient = useQueryClient();

  const invalidateDashboard = () => {
    void queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
  };

  const handleApprove = async (campaignId: number) => {
    setIsMutating(true);
    try {
      const response = await approveCampaign(campaignId);
      if (response.success) {
        toast.success('Campaign approved successfully');
        invalidateDashboard();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to approve campaign');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to approve campaign');
    } finally {
      setIsMutating(false);
    }
  };

  const handleReject = async (campaignId: number, reason: string) => {
    setIsMutating(true);
    try {
      const response = await rejectCampaign(campaignId, reason);
      if (response.success) {
        toast.success('Campaign rejected successfully');
        invalidateDashboard();
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to reject campaign');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to reject campaign');
    } finally {
      setIsMutating(false);
    }
  };
  return {
    isMutating,
    handleApprove,
    handleReject,
  };
}
