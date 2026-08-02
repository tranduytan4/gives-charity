import { useState } from 'react';
import { toast } from 'sonner';
import { createUser, importUsersFromCsv, updateUser } from '../api';
import type {
  AdminBulkImportUserError,
  AdminBulkImportUserResponse,
  AdminCreateUserRequest,
  AdminUpdateUserRequest,
  AdminUserResponse,
} from '../types';

interface UseUserMutationsProps {
  onSuccess?: () => void;
}

export function useUserMutations({ onSuccess }: UseUserMutationsProps = {}) {
  const [isMutating, setIsMutating] = useState(false);
  const [importErrors, setImportErrors] = useState<AdminBulkImportUserError[]>([]);

  const handleDeleteConfirm = async (user: AdminUserResponse) => {
    setIsMutating(true);
    try {
      const updatePayload: AdminUpdateUserRequest = {
        fullName: user.fullName,
        phone: user.phone || undefined,
        role: user.role,
        status: 'BANNED',
      };
      const response = await updateUser(user.id, updatePayload);
      if (response.success) {
        toast.success('User banned successfully');
        onSuccess?.();
      } else {
        toast.error(response.message || 'Failed to ban user');
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Failed to ban user');
    } finally {
      setIsMutating(false);
    }
  };

  const handleSaveUser = async (
    editingUser: AdminUserResponse | null,
    data: AdminCreateUserRequest | AdminUpdateUserRequest,
  ): Promise<{ success: boolean; message?: string }> => {
    setIsMutating(true);
    try {
      if (editingUser) {
        // Update user
        const updatePayload: AdminUpdateUserRequest = {
          fullName: data.fullName,
          phone: data.phone,
          role: data.role,
          status: data.status,
          password: data.password || undefined,
        };
        const response = await updateUser(editingUser.id, updatePayload);
        if (response.success) {
          toast.success('User updated successfully');
          onSuccess?.();
          return { success: true };
        }
        return { success: false, message: response.message || 'Failed to update user' };
      } else {
        // Create user
        const createPayload = data as AdminCreateUserRequest;
        const response = await createUser(createPayload);
        if (response.success) {
          toast.success('User created successfully');
          onSuccess?.();
          return { success: true };
        }
        return { success: false, message: response.message || 'Failed to create user' };
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errMsg = err.response?.data?.message || err.message || 'Failed to save user';
      return { success: false, message: errMsg };
    } finally {
      setIsMutating(false);
    }
  };

  const handleImportUsers = async (file: File) => {
    setIsMutating(true);
    setImportErrors([]);
    try {
      const response = await importUsersFromCsv(file);
      if (response.success) {
        const createdCount = response.result?.createdCount ?? 0;
        toast.success(`${createdCount} user${createdCount === 1 ? '' : 's'} imported successfully`);
        onSuccess?.();
        return true;
      }

      setImportErrors(response.result?.errors || []);
      toast.error(response.message || 'Failed to import users');
      return false;
    } catch (error) {
      const err = error as {
        message?: string;
        result?: AdminBulkImportUserResponse;
        response?: { data?: { message?: string; result?: AdminBulkImportUserResponse } };
      };
      const result = err.result || err.response?.data?.result;
      setImportErrors(result?.errors || []);
      toast.error(err.message || err.response?.data?.message || 'Failed to import users');
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  return {
    isMutating,
    importErrors,
    setImportErrors,
    handleDeleteConfirm,
    handleImportUsers,
    handleSaveUser,
  };
}
