import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { ErrorResponse } from '@/shared/types';
import { resendActivationEmail } from '../api';

export function useResendActivationMutation(
  options?: UseMutationOptions<void, ErrorResponse, string | undefined>,
) {
  return useMutation<void, ErrorResponse, string | undefined>({
    mutationFn: (email?: string | undefined) =>
      resendActivationEmail(typeof email === 'string' ? email : undefined),
    ...options,
  });
}
