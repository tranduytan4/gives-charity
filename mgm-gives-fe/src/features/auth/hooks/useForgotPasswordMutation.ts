import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { ErrorResponse } from '@/shared/types';
import { forgotPassword } from '../api';
import type { ForgotPasswordPayload } from '../types';

export function useForgotPasswordMutation(
  options?: UseMutationOptions<void, ErrorResponse, ForgotPasswordPayload>,
) {
  return useMutation<void, ErrorResponse, ForgotPasswordPayload>({
    mutationFn: (payload: ForgotPasswordPayload) => forgotPassword(payload),
    ...options,
  });
}
