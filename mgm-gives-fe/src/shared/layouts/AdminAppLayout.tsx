import * as React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthUser } from '@/features/auth/hooks';
import { Header } from '@/shared/components/ui';
import { ROLES } from '@/shared/constants/role';
import { ROUTES } from '@/shared/constants/routes';
import AdminSidebar from './AdminSidebar';

export default function AdminAppLayout() {
  const { data: user, isLoading } = useAuthUser();
  const { pathname } = useLocation();
  const mainRef = React.useRef<HTMLElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger scroll reset on route change
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50/50">
        <div className="text-muted-foreground font-medium animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  // Only allow ADMIN or CAMPAIGN_ADMIN to access admin layout
  if (!user || (user.role !== ROLES.ADMIN && user.role !== ROLES.CAMPAIGN_ADMIN)) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="flex h-screen bg-gray-50/50 overflow-hidden">
      {/* Fixed Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Fixed Top Header (admin mode) */}
        <Header isAdmin={true} />

        {/* Scrollable Content Area */}
        <main ref={mainRef} className="flex-1 overflow-auto p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
