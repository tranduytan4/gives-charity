import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { ErrorResponse } from '@/shared/types';
import { resetPassword } from '../api';
import type { ResetPasswordPayload } from '../types';

export function useResetPasswordMutation(
  options?: UseMutationOptions<void, ErrorResponse, ResetPasswordPayload>,
) {
  return useMutation<void, ErrorResponse, ResetPasswordPayload>({
    mutationFn: (payload: ResetPasswordPayload) => resetPassword(payload),
    ...options,
  });
}
