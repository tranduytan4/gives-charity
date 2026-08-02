import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuthUser } from '@/features/auth/hooks';
import type { ErrorResponse } from '@/shared/types';
import {
  type ChangePasswordInput,
  changePasswordSchema,
  type UpdateProfileInput,
  updateProfileSchema,
} from '@/shared/utils/validate';
import { useChangePasswordMutation } from './useChangePasswordMutation';
import { useUpdateProfileMutation } from './useUpdateProfileMutation';
import { useUploadAvatarMutation } from './useUploadAvatarMutation';

export function useProfileForm() {
  const { data: user, isLoading, isError, refetch } = useAuthUser();

  const updateProfileMutation = useUpdateProfileMutation();
  const changePasswordMutation = useChangePasswordMutation();
  const uploadAvatarMutation = useUploadAvatarMutation();

  const infoForm = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      phone: '',
    },
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Sync form when user data loads
  useEffect(() => {
    if (user) {
      infoForm.reset({
        fullName: user.fullName ?? '',
        phone: user.phone ?? '',
      });
    }
  }, [user, infoForm.reset]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        await uploadAvatarMutation.mutateAsync(file);
        toast.success('Avatar uploaded successfully.');
      } catch (err) {
        const errMsg = (err as ErrorResponse)?.message || 'Failed to upload avatar.';
        toast.error(errMsg);
      }
    },
    [uploadAvatarMutation],
  );

  const handleCancelInfo = useCallback(() => {
    infoForm.reset({
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? '',
    });
  }, [user, infoForm.reset]);

  const handleCancelPassword = useCallback(() => {
    passwordForm.reset();
  }, [passwordForm.reset]);

  const handleSaveInfo = infoForm.handleSubmit(async (data) => {
    try {
      const updatedUser = await updateProfileMutation.mutateAsync({
        fullName: data.fullName.trim(),
        phone: data.phone?.trim() ?? '',
      });
      toast.success('Personal information updated successfully.');
      infoForm.reset({
        fullName: updatedUser.fullName ?? '',
        phone: updatedUser.phone ?? '',
      });
    } catch (err) {
      const errMsg = (err as ErrorResponse)?.message || 'Failed to update personal information.';
      toast.error(errMsg);
    }
  });

  const handleSavePassword = passwordForm.handleSubmit(async (data) => {
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toast.success('Password updated successfully.');
      passwordForm.reset();
    } catch (err) {
      const errMsg = (err as ErrorResponse)?.message || 'Failed to update password.';
      toast.error(errMsg);
    }
  });

  const isSavingInfo = updateProfileMutation.isPending;
  const isSavingPassword = changePasswordMutation.isPending;
  const isUploadingAvatar = uploadAvatarMutation.isPending;

  const isInfoModified = infoForm.formState.isDirty;
  const isPasswordModified = passwordForm.formState.isDirty;

  return {
    user,
    isLoading,
    isSavingInfo,
    isSavingPassword,
    isUploadingAvatar,
    isInfoModified,
    isPasswordModified,
    isError,
    refetch,
    infoForm,
    passwordForm,
    handleFileSelect,
    handleCancelInfo,
    handleCancelPassword,
    handleSaveInfo,
    handleSavePassword,
  };
}
