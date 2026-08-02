/**
 * Generic API response wrapper matching the backend ApiResponse<T> shape.
 * All backend endpoints return this envelope.
 */
export interface ApiResponse<T> {
  success: boolean;
  code?: number;
  message?: string;
  result: T;
  timestamp?: string;
  path?: string;
}
