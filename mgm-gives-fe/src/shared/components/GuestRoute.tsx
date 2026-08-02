import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthUser } from '@/features/auth/hooks';
import { ROUTES } from '@/shared/constants/routes';

// GuestRoute: only accessible when NOT authenticated.
// Renders immediately — redirects after auth check resolves if user is logged in.
const GuestRoute = () => {
  const { data: user } = useAuthUser();
  const location = useLocation();

  if (user) {
    const searchParams = new URLSearchParams(location.search);
    const redirectParam = searchParams.get('redirect');
    const storedRedirect = window.localStorage.getItem('mgmGivesAuthRedirect');
    const safeRedirect =
      redirectParam?.startsWith('/') && !redirectParam.startsWith('//')
        ? redirectParam
        : storedRedirect?.startsWith('/') && !storedRedirect.startsWith('//')
          ? storedRedirect
          : null;
    const redirectTo =
      safeRedirect && user.role !== 'ADMIN'
        ? safeRedirect
        : user.role === 'ADMIN'
          ? ROUTES.ADMIN
          : ROUTES.DASHBOARD;
    if (safeRedirect) {
      window.localStorage.removeItem('mgmGivesAuthRedirect');
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
};

export default GuestRoute;
