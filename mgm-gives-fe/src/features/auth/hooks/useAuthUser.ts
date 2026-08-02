import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '../api';
import type { AuthUser } from '../types';

export function useAuthUser(options?: { enabled?: boolean }) {
  return useQuery<AuthUser, Error>({
    queryKey: ['authUser'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 1000 * 60 * 10,
    enabled: options?.enabled ?? true,
  });
}
