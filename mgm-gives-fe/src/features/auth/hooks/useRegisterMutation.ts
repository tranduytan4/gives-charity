import { type UseMutationOptions, useMutation } from '@tanstack/react-query';
import type { ErrorResponse } from '@/shared/types';
import { registerUser } from '../api';
import type { RegisterPayload, RegisterResponse } from '../types';

export function useRegisterMutation(
  options?: UseMutationOptions<RegisterResponse, ErrorResponse, RegisterPayload>,
) {
  return useMutation<RegisterResponse, ErrorResponse, RegisterPayload>({
    mutationFn: (payload: RegisterPayload) => registerUser(payload),
    ...options,
  });
}
