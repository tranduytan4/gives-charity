import { zodResolver } from '@hookform/resolvers/zod';
import { Check, Circle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, GoogleIcon, Input, Label } from '@/shared/components/ui/';
import { ROUTES } from '@/shared/constants/routes';
import {
  isPasswordValid,
  passwordRequirements,
  type RegisterInput,
  registerSchema,
} from '@/shared/utils/validate';
import { getGoogleOAuthLoginUrl, setGoogleOAuthRedirectCookie } from '../api';
import { useRegisterMutation } from '../hooks/useRegisterMutation';

export function RegisterForm() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const redirectParam = searchParams.get('redirect');
  const storedRedirect = window.localStorage.getItem('mgmGivesAuthRedirect');
  const safeRedirect =
    redirectParam?.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : storedRedirect?.startsWith('/') && !storedRedirect.startsWith('//')
        ? storedRedirect
        : null;

  const { mutate, isPending } = useRegisterMutation({
    onSuccess: (_data, variables) => {
      navigate(ROUTES.VERIFY_EMAIL_SENT, {
        state: { email: variables.email, redirect: safeRedirect },
      });
    },
    onError: (err) => {
      setError(err.message ?? 'Something went wrong. Please try again.');
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password', '');
  const showPasswordRequirements = passwordValue.length > 0 && !isPasswordValid(passwordValue);

  const onSubmit = (formData: RegisterInput) => {
    setError(null);
    mutate({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
    });
  };

  const handleGoogleSignUp = () => {
    if (safeRedirect) {
      window.localStorage.setItem('mgmGivesAuthRedirect', safeRedirect);
      setGoogleOAuthRedirectCookie(safeRedirect);
    }
    window.location.assign(getGoogleOAuthLoginUrl());
  };

  return (
    <form className="w-full space-y-2 text-left" onSubmit={handleSubmit(onSubmit)}>
      {/* Full Name */}
      <div className="space-y-1.5">
        <Label htmlFor="fullName">{t('register.fullNameLabel')}</Label>
        <Input
          id="fullName"
          className="h-10 rounded-xl border-white/25 bg-white/14 text-white shadow-inner shadow-white/5 backdrop-blur placeholder:text-white/55 focus:bg-white/20"
          placeholder={t('register.fullNamePlaceholder')}
          error={!!errors.fullName}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p className="text-xs text-red-500 font-medium">{errors.fullName.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">{t('register.emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          className="h-10 rounded-xl border-white/25 bg-white/14 text-white shadow-inner shadow-white/5 backdrop-blur placeholder:text-white/55 focus:bg-white/20"
          placeholder={t('register.emailPlaceholder')}
          error={!!errors.email}
          {...register('email')}
        />
        {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">{t('register.passwordLabel')}</Label>
        <Input
          id="password"
          type="password"
          className="h-10 rounded-xl border-white/25 bg-white/14 text-white shadow-inner shadow-white/5 backdrop-blur placeholder:text-white/55 focus:bg-white/20"
          placeholder={t('register.passwordPlaceholder')}
          error={!!errors.password}
          {...register('password')}
        />
        {errors.password && (
          <p className="text-xs text-red-500 font-medium">
            {errors.password.message?.includes('required')
              ? errors.password.message
              : 'Please satisfy all password requirements.'}
          </p>
        )}
        {showPasswordRequirements && (
          <div className="mt-1 space-y-1 rounded-xl border border-white/20 bg-white/10 p-2 text-xs backdrop-blur dark:border-gray-800 dark:bg-gray-900/20">
            <p className="font-semibold text-white/65">Password must include:</p>
            <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {passwordRequirements.map(({ isMet, label }) => {
                const met = isMet(passwordValue);

                return (
                  <li
                    key={label}
                    className={`flex items-center gap-1.5 font-medium transition-colors duration-200 ${met ? 'text-emerald-300' : 'text-white/55'}`}
                  >
                    {met ? (
                      <Check className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-white/30 shrink-0" />
                    )}
                    {label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">{t('register.confirmPasswordLabel')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          className="h-10 rounded-xl border-white/25 bg-white/14 text-white shadow-inner shadow-white/5 backdrop-blur placeholder:text-white/55 focus:bg-white/20"
          placeholder={t('register.confirmPasswordPlaceholder')}
          error={!!errors.confirmPassword}
          {...register('confirmPassword')}
        />
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 font-medium text-center rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="h-10 w-full rounded-xl bg-primary text-base font-extrabold shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-primary/20 active:scale-[0.98] cursor-pointer"
      >
        {isPending ? t('register.submitting') : t('register.submit')}
      </Button>

      <div className="flex items-center gap-3" aria-hidden="true">
        <div className="h-px flex-1 bg-white/20" />
        <span className="text-xs font-bold uppercase text-white/60">or</span>
        <div className="h-px flex-1 bg-white/20" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full rounded-xl border-white/25 bg-white/12 text-base font-bold text-white backdrop-blur hover:bg-white/20"
        onClick={handleGoogleSignUp}
      >
        <GoogleIcon />
        Continue with Google
      </Button>

      <p className="text-center text-sm text-white/72">
        {t('register.hasAccount')}{' '}
        <Link
          to={
            safeRedirect
              ? `${ROUTES.LOGIN}?redirect=${encodeURIComponent(safeRedirect)}`
              : ROUTES.LOGIN
          }
          className="font-bold text-white hover:underline"
        >
          {t('register.loginLink')}
        </Link>
      </p>
    </form>
  );
}
