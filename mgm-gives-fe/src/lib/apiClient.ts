import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { queryClient } from '@/app/providers';
import { AUTH_PUBLIC_ROUTES } from '@/features/auth/routes';
import { API_ENDPOINTS } from '@/shared/constants/api';
import { ROUTES } from '@/shared/constants/routes';

const API_URL = import.meta.env.VITE_API_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

let refreshPromise: Promise<void> | null = null;

const isAuthPublicRoute = () =>
  AUTH_PUBLIC_ROUTES.has(window.location.pathname) ||
  /^\/public\/campaigns\/[^/]+$/.test(window.location.pathname);

const handleLogoutRedirect = () => {
  const currentAuthUser = queryClient.getQueryData(['authUser']);
  if (currentAuthUser !== undefined && currentAuthUser !== null) {
    queryClient.setQueryData(['authUser'], null);
  }
  if (!isAuthPublicRoute()) {
    window.location.href = ROUTES.LOGIN;
  }
};

interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

const getRefreshPromise = (): Promise<void> => {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .get(API_ENDPOINTS.AUTH.REFRESH)
      .then(() => undefined)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

//Handle global errors and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as CustomAxiosRequestConfig;

    // Check if the error is 401 or 403 and not already retried
    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuthRefresh &&
      !isAuthPublicRoute()
    ) {
      // Errors from the auth endpoints themselves must never trigger a refresh
      if (
        originalRequest.url?.includes(API_ENDPOINTS.AUTH.REFRESH) ||
        originalRequest.url?.includes(API_ENDPOINTS.AUTH.LOGIN)
      ) {
        return Promise.reject(error.response?.data ?? error);
      }

      originalRequest._retry = true;

      try {
        await getRefreshPromise();
        return apiClient(originalRequest);
      } catch (refreshError) {
        handleLogoutRedirect();
        const axiosError = refreshError as { response?: { data?: unknown } };
        return Promise.reject(axiosError.response?.data ?? refreshError);
      }
    }

    return Promise.reject(error.response?.data ?? error);
  },
);

export default apiClient;
