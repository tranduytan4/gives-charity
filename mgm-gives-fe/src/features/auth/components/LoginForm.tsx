import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLoginMutation } from '@/features/auth';
import { Button, GoogleIcon, Input, Label } from '@/shared/components/ui';
import { ROUTES } from '@/shared/constants/routes';
import { type LoginInput, loginSchema } from '@/shared/utils/validate';
import { getGoogleOAuthLoginUrl, setGoogleOAuthRedirectCookie } from '../api';
import { useAuthUser, useResendActivationMutation } from '../hooks';

export function LoginForm() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refetch: refetchUser } = useAuthUser();
  const loginMutation = useLoginMutation();
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const resendMutation = useResendActivationMutation({
    onSuccess: () => {
      setResendSuccess(true);
      setResendError(null);
    },
    onError: (err) => {
      setResendError(err.message ?? 'Failed to resend. Please try again.');
      setResendSuccess(false);
    },
  });

  const redirectParam = searchParams.get('redirect');
  const storedRedirect = window.localStorage.getItem('mgmGivesAuthRedirect');
  const safeRedirect =
    redirectParam?.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : storedRedirect?.startsWith('/') && !storedRedirect.startsWith('//')
        ? storedRedirect
        : null;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (formData: LoginInput) => {
    setResendSuccess(false);
    setResendError(null);
    const result = await loginMutation.mutateAsync(formData).catch(() => null);
    if (result !== null) {
      const { data: user } = await refetchUser();
      if (safeRedirect && user?.role !== 'ADMIN') {
        window.localStorage.removeItem('mgmGivesAuthRedirect');
        navigate(safeRedirect);
        return;
      }
      navigate(user?.role === 'ADMIN' ? ROUTES.ADMIN : ROUTES.DASHBOARD);
    }
  };

  const errorMessage =
    loginMutation.error?.message ||
    (searchParams.get('oauthError') === 'true' ? 'Google sign-in failed. Please try again.' : null);

  const isInactiveError =
    errorMessage?.toLowerCase().includes('inactive') ||
    errorMessage?.toLowerCase().includes('activated');

  const handleGoogleLogin = () => {
    if (safeRedirect) {
      window.localStorage.setItem('mgmGivesAuthRedirect', safeRedirect);
      setGoogleOAuthRedirectCookie(safeRedirect);
    }
    window.location.assign(getGoogleOAuthLoginUrl());
  };

  return (
    <form className="w-full space-y-4 text-left" onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 space-y-2"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="m-0 font-medium leading-5">{errorMessage}</p>
          </div>
          {isInactiveError && (
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={resendMutation.isPending}
                onClick={() => {
                  const emailInput = watch('email')?.trim();
                  if (emailInput) {
                    resendMutation.mutate(emailInput);
                  }
                }}
                className="text-xs bg-white text-red-700 border-red-300 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
              >
                {resendMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {resendMutation.isPending ? 'Sending...' : 'Resend verification email'}
              </Button>
            </div>
          )}
        </div>
      )}

      {resendSuccess && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="m-0 font-medium leading-5">
            Verification email resent! Please check your inbox.
          </p>
        </div>
      )}

      {resendError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="m-0 font-medium leading-5">{resendError}</p>
        </div>
      )}

      {loginMutation.isSuccess && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="m-0 font-medium leading-5">Logged in successfully! Redirecting...</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">{t('login.emailLabel')}</Label>
        <Input
          id="email"
          type="text"
          className="h-12 rounded-xl border-white/25 bg-white/14 text-white shadow-inner shadow-white/5 backdrop-blur placeholder:text-white/55 focus:bg-white/20"
          placeholder={t('login.emailPlaceholder')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-xs text-red-500 font-medium">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="mb-0">
            {t('login.passwordLabel')}
          </Label>
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-blue-100 hover:text-white hover:underline"
          >
            {t('login.forgotPassword')}
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          className="h-12 rounded-xl border-white/25 bg-white/14 text-white shadow-inner shadow-white/5 backdrop-blur placeholder:text-white/55 focus:bg-white/20"
          placeholder={t('login.passwordPlaceholder')}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-xs text-red-500 font-medium">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={loginMutation.isPending}
        className="h-12 w-full rounded-xl bg-primary text-base font-extrabold shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-primary/20 active:scale-[0.98] cursor-pointer"
      >
        {loginMutation.isPending ? t('login.submitting') : t('login.submit')}
      </Button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-xs font-bold uppercase text-white/60">or</span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-xl border-white/25 bg-white/12 text-base font-bold text-white backdrop-blur hover:bg-white/20"
        onClick={handleGoogleLogin}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <p className="mt-4 text-center text-sm text-white/72">
        {t('login.noAccount')}{' '}
        <Link
          to={
            safeRedirect
              ? `${ROUTES.REGISTER}?redirect=${encodeURIComponent(safeRedirect)}`
              : ROUTES.REGISTER
          }
          className="font-bold text-white hover:underline"
        >
          {t('login.registerLink')}
        </Link>
      </p>
    </form>
  );
}
