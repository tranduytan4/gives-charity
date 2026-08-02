export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';

export interface AdminUserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreateUserRequest {
  email: string;
  fullName: string;
  phone?: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
}

export interface AdminUpdateUserRequest {
  fullName: string;
  phone?: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
}

export interface AdminBulkImportUserError {
  row: number;
  field: string;
  message: string;
}

export interface AdminBulkImportUserResponse {
  createdCount: number;
  users: AdminUserResponse[];
  errors: AdminBulkImportUserError[];
}
