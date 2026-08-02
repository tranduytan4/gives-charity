import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Join mgmGives"
      subtitle="Create your internal account to start giving with your colleagues."
      allowScroll
    >
      <RegisterForm />
    </AuthLayout>
  );
}
