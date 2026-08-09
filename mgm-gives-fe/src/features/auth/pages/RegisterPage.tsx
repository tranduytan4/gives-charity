import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  const { t } = useTranslation('auth');
  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      allowScroll
    >
      <RegisterForm />
    </AuthLayout>
  );
}
