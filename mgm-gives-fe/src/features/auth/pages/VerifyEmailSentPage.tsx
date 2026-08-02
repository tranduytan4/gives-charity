import { Mail } from 'lucide-react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { AuthLayout } from '../components/AuthLayout';

export default function VerifyEmailSentPage() {
  const location = useLocation();
  const state = location.state as { email?: string; redirect?: string | null } | null;
  const loginPath = state?.redirect
    ? `${ROUTES.LOGIN}?redirect=${encodeURIComponent(state.redirect)}`
    : ROUTES.LOGIN;

  if (!state?.email) {
    return <Navigate to={ROUTES.REGISTER} replace />;
  }

  return (
    <AuthLayout title="" subtitle="">
      <div className="flex flex-col items-center text-center space-y-6 py-2">
        {/* Icon */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Mail className="h-7 w-7" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary"></span>
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Check your inbox
          </h1>
          <p className="text-sm text-muted-foreground">We sent a verification link to</p>
          <p className="font-semibold text-foreground bg-muted/40 px-3 py-1.5 rounded-lg inline-block border border-muted-foreground/10 text-sm">
            {state.email}
          </p>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
          Click the link in the email to activate your account. Don't forget to check your spam
          folder.
        </p>

        {/* Hint */}
        <div className="w-full rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground text-left space-y-0.5">
          <p className="font-medium text-foreground text-xs uppercase tracking-wide mb-1">
            Didn't receive the email?
          </p>
          <p>
            <Link to={loginPath} className="font-medium text-primary hover:underline">
              Log in
            </Link>{' '}
            and request a new verification email from your dashboard.
          </p>
        </div>

        {/* Back to login */}
        <Link to={loginPath} className="text-sm font-medium text-primary hover:underline">
          Back to login
        </Link>
      </div>
    </AuthLayout>
  );
}
