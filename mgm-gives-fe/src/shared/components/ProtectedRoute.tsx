import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthUser } from '@/features/auth/hooks';
import { NotificationSocketProvider } from '@/features/notification/components/NotificationSocketProvider.tsx';
import { ROUTES } from '@/shared/constants/routes';

type ProtectedRouteProps = {
  adminOnly?: boolean;
};

const ProtectedRoute = ({ adminOnly = false }: ProtectedRouteProps) => {
  const { data: user, isLoading } = useAuthUser();
  const location = useLocation();
  const storedRedirect = window.localStorage.getItem('mgmGivesAuthRedirect');
  const safeStoredRedirect =
    storedRedirect?.startsWith('/') && !storedRedirect.startsWith('//') ? storedRedirect : null;

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="text-muted-foreground font-medium animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    const redirectTarget = `${location.pathname}${location.search}`;
    return (
      <Navigate to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(redirectTarget)}`} replace />
    );
  }

  if (user.status === 'BANNED') {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (safeStoredRedirect && user.role !== 'ADMIN' && location.pathname !== safeStoredRedirect) {
    window.localStorage.removeItem('mgmGivesAuthRedirect');
    return <Navigate to={safeStoredRedirect} replace />;
  }

  if (adminOnly && user.role !== 'ADMIN') {
    return <Navigate to={ROUTES.DEFAULT} replace />;
  }

  return (
    <NotificationSocketProvider>
      <Outlet />
    </NotificationSocketProvider>
  );
};

export default ProtectedRoute;
