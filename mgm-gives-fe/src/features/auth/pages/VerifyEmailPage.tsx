import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { AuthLayout } from '../components/AuthLayout';
import { useVerifyEmail } from '../hooks/useVerifyEmail';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { verifyState } = useVerifyEmail();

  useEffect(() => {
    if (verifyState === 'success') {
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      const timer = setTimeout(() => navigate(ROUTES.LOGIN), 1500);
      return () => clearTimeout(timer);
    }
  }, [verifyState, navigate, queryClient]);

  const config = {
    loading: {
      icon: <Loader2 className="h-8 w-8 animate-spin" />,
      iconClass: 'bg-primary/10 text-primary',
      title: 'Verifying your email…',
      description: 'Please wait a moment.',
    },
    success: {
      icon: <CheckCircle2 className="h-8 w-8" />,
      iconClass: 'bg-green-500/10 text-green-500',
      title: 'Email verified!',
      description: 'Your account is now active. Redirecting you to sign in...',
    },
    error: {
      icon: <XCircle className="h-8 w-8" />,
      iconClass: 'bg-destructive/10 text-destructive',
      title: 'Verification failed',
      description: 'The verification link is invalid or has expired. Please try again.',
    },
  };

  const current = config[verifyState];

  return (
    <AuthLayout title="" subtitle="">
      <div className="flex flex-col items-center text-center space-y-6 py-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full ${current.iconClass}`}
        >
          {current.icon}
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {current.title}
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">{current.description}</p>
        </div>

        {verifyState === 'success' && (
          <p className="text-sm text-muted-foreground animate-pulse">Redirecting to sign in…</p>
        )}

        {verifyState === 'error' && (
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <Button
              className="h-11 w-full text-base font-medium"
              onClick={() => navigate(ROUTES.REGISTER)}
            >
              Register again
            </Button>

            <Link to={ROUTES.LOGIN} className="text-sm font-medium text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
