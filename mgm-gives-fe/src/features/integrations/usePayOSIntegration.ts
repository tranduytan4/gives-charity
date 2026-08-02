import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { payOSIntegrationApi } from '@/features/integrations/payOSIntegrationApi.ts';

export const payOSIntegrationKeys = {
  status: ['payOSIntegrationStatus'] as const,
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  const responseMessage = (error as { response?: { data?: { message?: unknown } } })?.response?.data
    ?.message;
  return typeof responseMessage === 'string' && responseMessage.trim() ? responseMessage : fallback;
};

export const usePayOSStatus = (enabled = true) => {
  return useQuery({
    queryKey: payOSIntegrationKeys.status,
    queryFn: payOSIntegrationApi.getPayOSStatus,
    enabled,
  });
};

export const useConnectPayOS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payOSIntegrationApi.connectPayOS,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payOSIntegrationKeys.status });
      toast.success('PayOS connected successfully.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Unable to connect to PayOS.'));
    },
  });
};

export const useDisconnectPayOS = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: payOSIntegrationApi.disconnectPayOS,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payOSIntegrationKeys.status });
      toast.success('PayOS disconnected successfully.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Unable to disconnect PayOS.'));
    },
  });
};
