import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/index';
import { AuthLayout } from './AuthLayout';

interface VerifyEmailSentProps {
  email: string;
  onResend: () => void;
  onBack: () => void;
  title?: string;
  subtitle?: string;
  backText?: string;
  isResending?: boolean;
  resendError?: string | null;
  resendSuccess?: boolean;
}

export function VerifyEmailSent({
  email,
  onResend,
  onBack,
  title = 'Verify your email',
  subtitle = 'We sent a verification link to your inbox.',
  backText = 'Back to registration',
  isResending = false,
  resendError = null,
  resendSuccess = false,
}: VerifyEmailSentProps) {
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (resendSuccess) {
      setCountdown(5);
    }
  }, [resendSuccess]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  return (
    <AuthLayout title="" subtitle="">
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Centered title and subtitle */}
          <div className="space-y-1.5 mb-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>

          {/* Icon mail */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Mail className="h-7 w-7" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary"></span>
            </span>
          </div>
          {/* content email */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">We have sent a verification email to:</p>
            <p className="font-semibold text-foreground bg-muted/40 px-3 py-1.5 rounded-lg inline-block border border-muted-foreground/10 text-sm">
              {email}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm pt-2">
              Please check your inbox (and spam folder) and click the link to activate your account.
            </p>
          </div>
        </div>

        {/* action button */}
        <div className="space-y-3 pt-2">
          {resendSuccess && (
            <p className="text-sm text-green-600 font-medium text-center rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2">
              Verification email resent successfully!
            </p>
          )}

          {resendError && (
            <p className="text-sm text-red-500 font-medium text-center rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
              {resendError}
            </p>
          )}

          <Button
            onClick={onResend}
            disabled={isResending || countdown > 0}
            className="h-11 w-full text-base font-medium flex items-center justify-center gap-2 cursor-pointer"
          >
            {isResending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Resending...
              </>
            ) : countdown > 0 ? (
              `Resend in ${countdown}s`
            ) : (
              'Resend verification email'
            )}
          </Button>
        </div>
        {/* back button */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> {backText}
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
