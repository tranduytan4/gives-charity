import type { ApiResponse } from '@/shared/types';
import type {
  AdminCategoryResponse,
  AdminCreateCategoryRequest,
  AdminUpdateCategoryRequest,
  PageResponse,
} from '../../admin/types';

const mockCategories: AdminCategoryResponse[] = [
  {
    id: 1,
    name: 'Education',
    description: 'Books, scholarships, school supplies, mentoring.',
    campaignsCount: 0,
  },
  {
    id: 2,
    name: 'Health',
    description: 'Medical treatment, health camps, equipment.',
    campaignsCount: 0,
  },
  {
    id: 3,
    name: 'Environment',
    description: 'Reforestation, cleanups, climate action.',
    campaignsCount: 0,
  },
  {
    id: 4,
    name: 'Community',
    description: 'Local outreach, shelters, family support.',
    campaignsCount: 0,
  },
  {
    id: 5,
    name: 'Disaster Relief',
    description: 'Emergency response for floods, storms, fires.',
    deletedAt: '2026-06-30T10:41:28',
    campaignsCount: 0,
  },
];

export const getCategoriesMock = (params?: {
  showDeleted?: boolean;
  page?: number;
  size?: number;
}): Promise<ApiResponse<PageResponse<AdminCategoryResponse>>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const page = params?.page ?? 0;
      const size = params?.size ?? 10;
      const showDeleted = params?.showDeleted ?? false;

      let filtered = mockCategories;
      if (showDeleted) {
        filtered = filtered.filter((c) => c.deletedAt !== undefined);
      } else {
        filtered = filtered.filter((c) => c.deletedAt === undefined);
      }

      const totalElements = filtered.length;
      const totalPages = Math.ceil(totalElements / size);
      const start = page * size;
      const end = start + size;
      const content = filtered.slice(start, end);

      resolve({
        success: true,
        result: {
          content,
          page,
          size,
          totalElements,
          totalPages,
          last: page >= totalPages - 1,
        },
      });
    }, 500);
  });
};

export const createCategoryMock = (
  payload: AdminCreateCategoryRequest,
): Promise<ApiResponse<AdminCategoryResponse>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newCategory: AdminCategoryResponse = {
        id: Math.floor(Math.random() * 10000) + 100,
        name: payload.name,
        description: payload.description || '',
        campaignsCount: 0,
      };
      mockCategories.push(newCategory);
      resolve({
        success: true,
        result: newCategory,
        message: 'Category Created Successfully',
      });
    }, 500);
  });
};

export const updateCategoryMock = (
  id: number,
  payload: AdminUpdateCategoryRequest,
): Promise<ApiResponse<AdminCategoryResponse>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockCategories.findIndex((c) => c.id === id);
      const category = mockCategories[index];
      if (index === -1 || !category) {
        reject(new Error('Category not found'));
        return;
      }
      const updated: AdminCategoryResponse = {
        ...category,
        name: payload.name,
        description: payload.description || '',
      };
      mockCategories[index] = updated;
      resolve({
        success: true,
        result: updated,
      });
    }, 500);
  });
};

export const deleteCategoryMock = (id: number): Promise<ApiResponse<void>> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = mockCategories.findIndex((c) => c.id === id);
      const category = mockCategories[index];
      if (index === -1 || !category) {
        reject(new Error('Category not found'));
        return;
      }
      category.deletedAt = new Date().toISOString();
      resolve({
        success: true,
        result: undefined,
      });
    }, 500);
  });
};
