import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to continue supporting internal donation campaigns and make a real impact."
    >
      <LoginForm />
    </AuthLayout>
  );
}
