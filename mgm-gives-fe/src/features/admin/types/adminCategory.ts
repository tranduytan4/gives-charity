export interface AdminCategoryResponse {
  id: number;
  name: string;
  description: string;
  deletedAt?: string;
  campaignsCount?: number;
}

export interface AdminCreateCategoryRequest {
  name: string;
  description?: string;
}

export interface AdminUpdateCategoryRequest {
  name: string;
  description?: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
