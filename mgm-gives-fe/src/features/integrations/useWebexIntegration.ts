import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { webexIntegrationApi } from '@/features/integrations/webexIntegrationApi.ts';

export const webexIntegrationKeys = {
  status: ['webexIntegrationStatus'] as const,
};

export const WEBEX_RETURN_TO_STORAGE_KEY = 'webexIntegrationReturnTo';

interface ConnectWebexOptions {
  returnTo?: string;
}

const isSafeLocalPath = (value: string) => {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('://');
};

export const getStoredWebexReturnTo = () => {
  const returnTo = window.sessionStorage.getItem(WEBEX_RETURN_TO_STORAGE_KEY);
  window.sessionStorage.removeItem(WEBEX_RETURN_TO_STORAGE_KEY);

  if (!returnTo || !isSafeLocalPath(returnTo)) return null;

  return returnTo;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  if (!error) return fallback;

  if (typeof error === 'string' && error.trim()) return error;

  if (typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
  }

  if (typeof error === 'object' && 'response' in error) {
    const responseMessage = (error as { response?: { data?: { message?: unknown } } }).response
      ?.data?.message;
    if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage;
  }

  return fallback;
};

export const useWebexStatus = (enabled = true) => {
  return useQuery({
    queryKey: webexIntegrationKeys.status,
    queryFn: webexIntegrationApi.getWebexStatus,
    enabled,
  });
};

export const useConnectWebex = () => {
  return useMutation({
    mutationFn: (options?: ConnectWebexOptions) =>
      webexIntegrationApi.getWebexAuthorizeUrl(options),
    onSuccess: ({ authorizeUrl }, options) => {
      if (options?.returnTo && isSafeLocalPath(options.returnTo)) {
        window.sessionStorage.setItem(WEBEX_RETURN_TO_STORAGE_KEY, options.returnTo);
      } else {
        window.sessionStorage.removeItem(WEBEX_RETURN_TO_STORAGE_KEY);
      }

      window.location.assign(authorizeUrl);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Unable to start Webex connection.'));
    },
  });
};

export const useDisconnectWebex = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: webexIntegrationApi.disconnectWebex,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webexIntegrationKeys.status });
      toast.success('Webex disconnected successfully.');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Unable to disconnect Webex.'));
    },
  });
};
