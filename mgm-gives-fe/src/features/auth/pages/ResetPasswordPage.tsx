import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <AuthLayout title="Set new password" subtitle="Choose a new password for your account.">
      <ResetPasswordForm />
    </AuthLayout>
  );
}
