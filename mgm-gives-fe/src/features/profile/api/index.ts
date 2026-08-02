import type { AuthUser, ChangePasswordPayload, UpdateProfilePayload } from '@/features/auth/types';
import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';

type ApiResponse<T> = {
  success: boolean;
  result: T;
  message?: string;
};

export const updateProfile = async (payload: UpdateProfilePayload): Promise<AuthUser> => {
  const response = await apiClient.put<ApiResponse<AuthUser>>(
    API_ENDPOINTS.AUTH.UPDATE_PROFILE,
    payload,
  );
  return response.data.result;
};

export const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
  await apiClient.put(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, payload);
};

export const uploadAvatar = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<string>>('media/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.result;
};
