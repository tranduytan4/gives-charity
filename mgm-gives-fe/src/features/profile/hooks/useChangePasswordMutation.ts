import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { ChangePasswordPayload } from '@/features/auth/types';
import type { ErrorResponse } from '@/shared/types';
import { changePassword } from '../api';

export function useChangePasswordMutation(
  options?: UseMutationOptions<void, ErrorResponse, ChangePasswordPayload>,
) {
  return useMutation<void, ErrorResponse, ChangePasswordPayload>({
    mutationFn: (payload: ChangePasswordPayload) => changePassword(payload),
    ...options,
  });
}
