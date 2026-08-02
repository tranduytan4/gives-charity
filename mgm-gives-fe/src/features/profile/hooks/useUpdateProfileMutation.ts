import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuthUser, UpdateProfilePayload } from '@/features/auth/types';
import type { ErrorResponse } from '@/shared/types';
import { updateProfile } from '../api';

export function useUpdateProfileMutation(
  options?: UseMutationOptions<AuthUser, ErrorResponse, UpdateProfilePayload>,
) {
  const queryClient = useQueryClient();

  return useMutation<AuthUser, ErrorResponse, UpdateProfilePayload>({
    mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(['authUser'], data);
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
    ...options,
  });
}
