import type {
  PayOSConnectionRequest,
  PayOSConnectionStatus,
} from '@/features/integrations/types.ts';
import { apiClient } from '@/lib/apiClient';
import type { ApiResponse } from '@/shared/types';

const PAYOS_BASE = 'integrations/payos';

export const getPayOSStatus = async (): Promise<PayOSConnectionStatus> => {
  const response = await apiClient.get<ApiResponse<PayOSConnectionStatus>>(`${PAYOS_BASE}/status`);
  return response.data.result;
};

export const connectPayOS = async (data: PayOSConnectionRequest): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(`${PAYOS_BASE}/connect`, data);
};

export const disconnectPayOS = async (): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(`${PAYOS_BASE}/disconnect`);
};

export const payOSIntegrationApi = {
  getPayOSStatus,
  connectPayOS,
  disconnectPayOS,
};
