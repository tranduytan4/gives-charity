import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Mail } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { Button, Input, Label } from '@/shared/components/ui/';
import { type ForgotPasswordInput, forgotPasswordSchema } from '@/shared/utils/validate';
import { useForgotPasswordMutation } from '../hooks/useForgotPasswordMutation';

const COOLDOWN_SECONDS = 5;

export function ForgotPasswordForm() {
  const forgotPasswordMutation = useForgotPasswordMutation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
    defaultValues: { email: '' },
  });

  const onSubmit = async (formData: ForgotPasswordInput) => {
    // Always show success banner regardless of whether the email exists —
    // prevents leaking which emails are registered in the system.
    await forgotPasswordMutation.mutateAsync(formData).catch(() => null);
    setIsSubmitted(true);
    startCooldown();
  };

  const isDisabled = forgotPasswordMutation.isPending || cooldown > 0;

  return (
    <form className="w-full space-y-4 text-left" onSubmit={handleSubmit(onSubmit)}>
      {isSubmitted && (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900/30 dark:bg-green-950/20 dark:text-green-400"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="m-0 font-medium leading-5">
            If this email is registered, a reset link has been sent. Please check your inbox.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email" required>
          Corporate email
        </Label>

        <Input
          id="email"
          type="email"
          className="h-11"
          placeholder="bao.nguyen@mgm-tp.com"
          startAdornment={<Mail />}
          error={!!errors.email}
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

      <Button
        type="submit"
        disabled={isDisabled}
        className="h-11 w-full cursor-pointer bg-gradient-to-r from-primary to-[oklch(0.5_0.22_265)] text-base font-semibold shadow-md transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {forgotPasswordMutation.isPending
          ? 'Sending...'
          : cooldown > 0
            ? `Resend in ${cooldown}s`
            : 'Send reset link'}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
