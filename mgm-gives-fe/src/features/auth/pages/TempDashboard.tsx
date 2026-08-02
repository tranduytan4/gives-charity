import { AlertTriangle, AtSign, CheckCircle2, Loader2, Mail, Shield, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { useAuthUser, useResendActivationMutation } from '../hooks';

const STATUS_CONFIG = {
  ACTIVE: {
    label: 'Active',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    dot: 'bg-green-500',
  },
  INACTIVE: {
    label: 'Inactive',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  BANNED: {
    label: 'Banned',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    dot: 'bg-red-500',
  },
};

export default function TempDashboard() {
  const { data: user } = useAuthUser();
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const resendMutation = useResendActivationMutation({
    onSuccess: () => {
      setResendSuccess(true);
      setResendError(null);
      setCountdown(5);
    },
    onError: (err) => {
      setResendError(err.message ?? 'Failed to resend. Please try again.');
      setResendSuccess(false);
    },
  });

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const isInactive = user?.status === 'INACTIVE';
  const statusCfg = STATUS_CONFIG[user?.status ?? 'INACTIVE'];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top nav */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 gap-5">
        {/* Inactive banner */}
        {isInactive && (
          <div className="w-full max-w-lg rounded-2xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/20 p-5 shadow-lg shadow-amber-100/50 dark:shadow-none">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                <Mail className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <h2 className="font-semibold text-amber-900 dark:text-amber-200 text-sm">
                    Account not yet activated
                  </h2>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-300/80 max-w-sm">
                  Check your inbox and click the verification link to activate your account.
                </p>
              </div>

              {resendSuccess && (
                <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2 w-full justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Verification email resent!
                </div>
              )}
              {resendError && (
                <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2 w-full text-center">
                  {resendError}
                </div>
              )}

              <Button
                onClick={() => resendMutation.mutate(user?.email || undefined)}
                disabled={resendMutation.isPending || countdown > 0}
                className="h-9 px-5 text-sm font-medium cursor-pointer bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 text-white border-0"
              >
                {resendMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Sending...
                  </>
                ) : countdown > 0 ? (
                  `Resend in ${countdown}s`
                ) : (
                  'Resend verification email'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Profile card */}
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border/60 bg-muted/20">
            <h1 className="font-bold text-base">Account Information</h1>
          </div>
          <div className="divide-y divide-border/50">
            {/* Full Name */}
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Full Name
                </p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.fullName ?? '—'}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <AtSign className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Email
                </p>
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.email ?? '—'}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <Shield className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Role
                </p>
                <p className="text-sm font-semibold text-foreground capitalize">
                  {user?.role?.toLowerCase() ?? '—'}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-3 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
                <span className={`h-2.5 w-2.5 rounded-full ${statusCfg.dot}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Status
                </p>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${statusCfg.className}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
