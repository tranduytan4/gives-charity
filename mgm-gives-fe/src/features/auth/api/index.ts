import { apiClient } from '@/lib/apiClient';
import { API_ENDPOINTS } from '@/shared/constants/api';
import type {
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  RegisterResponse,
  ResetPasswordPayload,
  VerifyEmailResponse,
} from '../types';

export const registerUser = async (payload: RegisterPayload) => {
  const response = await apiClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, payload);
  return response.data;
};

export const loginUser = async (payload: LoginPayload): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, payload);
};

const getBackendOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
};

export const getGoogleOAuthLoginUrl = () =>
  `${getBackendOrigin()}/${API_ENDPOINTS.AUTH.OAUTH2_GOOGLE}`;

export const setGoogleOAuthRedirectCookie = (redirectPath: string | null) => {
  if (!redirectPath?.startsWith('/') || redirectPath.startsWith('//')) return;

  document.cookie = `mgm_gives_oauth_redirect=${encodeURIComponent(
    redirectPath,
  )}; Max-Age=600; Path=/; SameSite=Lax`;
};

type ApiResponse<T> = {
  success: boolean;
  result: T;
  message?: string;
};

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<ApiResponse<AuthUser>>(API_ENDPOINTS.AUTH.ME);
  return response.data.result;
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
  const response = await apiClient.get<VerifyEmailResponse>(API_ENDPOINTS.AUTH.VERIFY_EMAIL, {
    params: { token },
  });
  return response.data;
}

export const logoutUser = async (): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
};

export const resendActivationEmail = async (email?: string): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.AUTH.RESEND_ACTIVATION, email ? { email } : {});
};

export const forgotPassword = async (payload: ForgotPasswordPayload): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, payload);
};

export const resetPassword = async (payload: ResetPasswordPayload): Promise<void> => {
  await apiClient.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload);
};
