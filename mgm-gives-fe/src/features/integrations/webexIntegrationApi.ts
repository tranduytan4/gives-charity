import type {
  WebexAuthorizeApiResult,
  WebexAuthorizeResponse,
  WebexConnectionStatus,
} from '@/features/integrations/types.ts';
import { apiClient } from '@/lib/apiClient';
import type { ApiResponse } from '@/shared/types';

const WEBEX_BASE = 'integrations/webex';

export const getWebexStatus = async (): Promise<WebexConnectionStatus> => {
  const response = await apiClient.get<ApiResponse<WebexConnectionStatus>>(`${WEBEX_BASE}/status`);
  return response.data.result;
};

interface WebexAuthorizeOptions {
  returnTo?: string;
}

export const getWebexAuthorizeUrl = async (
  options?: WebexAuthorizeOptions,
): Promise<WebexAuthorizeResponse> => {
  const response = await apiClient.get<ApiResponse<WebexAuthorizeApiResult>>(
    `${WEBEX_BASE}/oauth/authorize`,
    { params: options?.returnTo ? { returnTo: options.returnTo } : undefined },
  );
  const result = response.data.result;

  if (typeof result === 'string' && result.trim()) {
    return { authorizeUrl: result };
  }

  if (typeof result === 'object' && result?.authorizeUrl?.trim()) {
    return result;
  }

  throw new Error(response.data.message || 'Webex authorization URL was not returned.');
};

export const disconnectWebex = async (): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(WEBEX_BASE);
};

export const webexIntegrationApi = {
  getWebexStatus,
  getWebexAuthorizeUrl,
  disconnectWebex,
};
