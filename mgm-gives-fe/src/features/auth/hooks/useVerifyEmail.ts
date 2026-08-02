import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { verifyEmail } from '../api';

type VerifyState = 'loading' | 'success' | 'error';

export function useVerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { isSuccess, isError } = useQuery({
    queryKey: ['verify-email', token],
    queryFn: () => verifyEmail(token || ''),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  let verifyState: VerifyState = 'loading';

  if (!token || isError) {
    verifyState = 'error';
  } else if (isSuccess) {
    verifyState = 'success';
  }

  return { verifyState };
}
