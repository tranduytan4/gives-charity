import { Navigate } from 'react-router-dom';
import { useAuthUser } from '@/features/auth/hooks';
import { ROUTES } from '@/shared/constants/routes';
import NotFoundPage from '@/shared/layouts/NotFoundPage';

export default function RootNotFoundRedirect() {
  const { data: user, isLoading } = useAuthUser();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50">
        <div className="text-muted-foreground font-medium animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (user) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin/not-found" replace />;
    }
    return <Navigate to="/not-found" replace />;
  }

  // Guest users (not logged in) get the standalone NotFoundPage pointing to the login page
  return <NotFoundPage backTo={ROUTES.LOGIN} backToText="Back to Login" />;
}
