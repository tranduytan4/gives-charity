import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  return (
    <AuthLayout
      title={t('forgotPassword.title')}
      subtitle={t('forgotPassword.subtitle')}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
