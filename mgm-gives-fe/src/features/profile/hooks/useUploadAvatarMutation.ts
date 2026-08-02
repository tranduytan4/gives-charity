import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuthUser } from '@/features/auth/types';
import type { ErrorResponse } from '@/shared/types';
import { uploadAvatar } from '../api';

export function useUploadAvatarMutation(options?: UseMutationOptions<string, ErrorResponse, File>) {
  const queryClient = useQueryClient();

  return useMutation<string, ErrorResponse, File>({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: (filename) => {
      queryClient.setQueryData<AuthUser>(['authUser'], (old) => {
        if (!old) return old;
        return {
          ...old,
          avatarUrl: filename,
        };
      });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
    ...options,
  });
}
