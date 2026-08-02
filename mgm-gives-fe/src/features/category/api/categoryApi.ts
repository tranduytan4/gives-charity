import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type { ApiResponse } from '@/shared/types';
import type { Category } from '../types';

/**
 * Fetches all categories sorted alphabetically by name.
 *
 * Public endpoint — no Authorization header required.
 * Mapped from: GET /api/categories (DANANG-1764)
 *
 * @returns Promise resolving to an array of categories.
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<ApiResponse<Category[]>>(API_ENDPOINTS.CATEGORY.LIST);
  return response.data.result;
};

/**
 * Grouped object export for consumers who prefer object-style access.
 * Usage: categoryApi.getCategories()
 */
export const categoryApi = {
  getCategories,
};
