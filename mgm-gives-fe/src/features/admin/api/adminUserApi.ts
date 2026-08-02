import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type { ApiResponse } from '@/shared/types';
import type {
  AdminBulkImportUserResponse,
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUserResponse,
  PageResponse,
} from '../types';

export interface GetUsersParams {
  roles?: string;
  statuses?: string;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export const getUsers = async (params?: GetUsersParams) => {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminUserResponse>>>(
    API_ENDPOINTS.ADMIN_USERS.BASE,
    { params },
  );
  return response.data;
};

export const getUserById = async (id: number) => {
  const response = await apiClient.get<ApiResponse<AdminUserResponse>>(
    `${API_ENDPOINTS.ADMIN_USERS.BASE}/${id}`,
  );
  return response.data;
};

export const createUser = async (payload: AdminCreateUserRequest) => {
  const response = await apiClient.post<ApiResponse<AdminUserResponse>>(
    API_ENDPOINTS.ADMIN_USERS.BASE,
    payload,
  );
  return response.data;
};

export const importUsersFromCsv = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ApiResponse<AdminBulkImportUserResponse>>(
    API_ENDPOINTS.ADMIN_USERS.IMPORT_CSV,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data;
};

export const updateUser = async (id: number, payload: AdminUpdateUserRequest) => {
  const response = await apiClient.put<ApiResponse<AdminUserResponse>>(
    `${API_ENDPOINTS.ADMIN_USERS.BASE}/${id}`,
    payload,
  );
  return response.data;
};
