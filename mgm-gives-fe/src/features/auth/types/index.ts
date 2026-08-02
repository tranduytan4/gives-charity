export type RegisterPayload = {
  email: string;
  fullName: string;
  password: string;
};

export type RegisterResponse = {
  success: boolean;
  code: number;
  message: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refreshToken?: string;
};

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string | null;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
};

export type VerifyEmailResponse = {
  success: boolean;
  code: number;
  message: string;
};

export type ForgotPasswordPayload = {
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  newPassword: string;
  confirmNewPassword: string;
};

export type UpdateProfilePayload = {
  fullName: string;
  phone: string;
};

export type ChangePasswordPayload = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};
