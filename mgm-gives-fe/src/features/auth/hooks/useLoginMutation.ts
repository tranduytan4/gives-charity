import { type UseMutationOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ErrorResponse } from '@/shared/types';
import { loginUser } from '../api';
import type { LoginPayload } from '../types';

export function useLoginMutation(options?: UseMutationOptions<void, ErrorResponse, LoginPayload>) {
  const queryClient = useQueryClient();

  return useMutation<void, ErrorResponse, LoginPayload>({
    mutationFn: (payload: LoginPayload) => loginUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
    ...options,
  });
}
