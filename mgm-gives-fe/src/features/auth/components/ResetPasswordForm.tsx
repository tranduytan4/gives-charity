import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, CheckCircle2, Circle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router-dom';

import { Button, Input, Label } from '@/shared/components/ui/';
import {
  isPasswordValid,
  passwordRequirements,
  type ResetPasswordInput,
  resetPasswordSchema,
} from '@/shared/utils/validate';
import { useResetPasswordMutation } from '../hooks/useResetPasswordMutation';

export function ResetPasswordForm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const resetPasswordMutation = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onBlur',
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  });

  const password = watch('newPassword');
  const showPasswordRequirements = password.length > 0 && !isPasswordValid(password);

  const onSubmit = async (formData: ResetPasswordInput) => {
    if (!token) return;
    await resetPasswordMutation.mutateAsync({ token, ...formData }).catch(() => null);
  };

  const errorMessage = resetPasswordMutation.error?.message ?? null;

  // Token missing guard
  if (!token) {
    return (
      <div className="w-full rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-red-500 text-red-600">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h2 className="mb-3 text-2xl font-bold text-foreground">Invalid reset link</h2>
        <p className="mb-7 text-muted-foreground">
          This password reset link is missing a token. Please request a new one.
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-12 w-full text-base font-semibold"
          asChild
        >
          <Link to="/forgot-password">Request new link</Link>
        </Button>
      </div>
    );
  }

  if (resetPasswordMutation.isSuccess) {
    return (
      <div className="w-full rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border-4 border-green-500 text-green-600">
          <CheckCircle2 className="h-7 w-7" />
        </div>

        <h2 className="mb-3 text-2xl font-bold text-foreground">Password updated</h2>

        <p className="mb-7 text-muted-foreground">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>

        <Button
          type="button"
          className="h-12 w-full text-base font-semibold bg-gradient-to-r from-primary to-[oklch(0.5_0.22_265)] shadow-md transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
          asChild
        >
          <Link to="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  return (
    <form className="w-full space-y-4 text-left" onSubmit={handleSubmit(onSubmit)}>
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="m-0 font-medium leading-5">{errorMessage}</p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="newPassword" required>
          New password
        </Label>
        <Input
          id="newPassword"
          type="password"
          className="h-11"
          placeholder="••••••••"
          error={!!errors.newPassword}
          aria-invalid={!!errors.newPassword}
          aria-describedby={errors.newPassword ? 'newPassword-error' : undefined}
          {...register('newPassword')}
        />
        {errors.newPassword && (
          <p id="newPassword-error" className="text-xs text-red-500 font-medium">
            {errors.newPassword.message}
          </p>
        )}
        {showPasswordRequirements && (
          <div className="mt-1.5 rounded-lg border border-gray-100 bg-gray-50/50 p-2.5 space-y-1.5 text-xs dark:border-gray-800 dark:bg-gray-900/20">
            <p className="font-semibold text-muted-foreground">Password must include:</p>
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {passwordRequirements.map(({ isMet, label }) => {
                const met = isMet(password);

                return (
                  <li
                    key={label}
                    className={`flex items-center gap-1.5 font-medium transition-colors duration-200 ${met ? 'text-green-600' : 'text-muted-foreground'}`}
                  >
                    {met ? (
                      <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                    )}
                    {label}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmNewPassword" required>
          Confirm new password
        </Label>
        <Input
          id="confirmNewPassword"
          type="password"
          className="h-11"
          placeholder="••••••••"
          error={!!errors.confirmNewPassword}
          aria-invalid={!!errors.confirmNewPassword}
          aria-describedby={errors.confirmNewPassword ? 'confirmNewPassword-error' : undefined}
          {...register('confirmNewPassword')}
        />
        {errors.confirmNewPassword && (
          <p id="confirmNewPassword-error" className="text-xs text-red-500 font-medium">
            {errors.confirmNewPassword.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={resetPasswordMutation.isPending}
        className="h-11 w-full cursor-pointer bg-gradient-to-r from-primary to-[oklch(0.5_0.22_265)] text-base font-semibold shadow-md transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98]"
      >
        {resetPasswordMutation.isPending ? 'Saving...' : 'Set new password'}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
