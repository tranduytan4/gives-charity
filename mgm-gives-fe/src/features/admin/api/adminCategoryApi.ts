import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type { ApiResponse } from '@/shared/types';
import type {
  AdminCategoryResponse,
  AdminCreateCategoryRequest,
  AdminUpdateCategoryRequest,
  PageResponse,
} from '../types';

export interface GetCategoriesParams {
  search?: string;
  status?: string;
  page?: number;
  size?: number;
}

export const getCategories = async (params?: GetCategoriesParams) => {
  const response = await apiClient.get<ApiResponse<PageResponse<AdminCategoryResponse>>>(
    API_ENDPOINTS.ADMIN_CATEGORIES.BASE,
    { params },
  );
  return response.data;
};

export const createCategory = async (payload: AdminCreateCategoryRequest) => {
  const response = await apiClient.post<ApiResponse<AdminCategoryResponse>>(
    API_ENDPOINTS.ADMIN_CATEGORIES.BASE,
    payload,
  );
  return response.data;
};

export const updateCategory = async (id: number, payload: AdminUpdateCategoryRequest) => {
  const response = await apiClient.put<ApiResponse<AdminCategoryResponse>>(
    `${API_ENDPOINTS.ADMIN_CATEGORIES.BASE}/${id}`,
    payload,
  );
  return response.data;
};

export const deleteCategory = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<void>>(
    `${API_ENDPOINTS.ADMIN_CATEGORIES.BASE}/${id}`,
  );
  return response.data;
};

export const restoreCategory = async (id: number) => {
  const response = await apiClient.post<ApiResponse<AdminCategoryResponse>>(
    `${API_ENDPOINTS.ADMIN_CATEGORIES.BASE}/${id}/restore`,
  );
  return response.data;
};

export const checkCategoryDeletion = async (id: number) => {
  const response = await apiClient.get<
    ApiResponse<{
      assignedCampaignsCount: number;
      onlyCategoryCampaignsCount: number;
    }>
  >(`${API_ENDPOINTS.ADMIN_CATEGORIES.BASE}/${id}/delete-check`);
  return response.data;
};

export const permanentDeleteCategory = async (id: number) => {
  const response = await apiClient.delete<ApiResponse<void>>(
    `${API_ENDPOINTS.ADMIN_CATEGORIES.BASE}/${id}/permanent`,
  );
  return response.data;
};
