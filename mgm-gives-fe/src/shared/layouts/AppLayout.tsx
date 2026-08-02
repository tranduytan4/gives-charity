import * as React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthUser } from '@/features/auth/hooks';
import { Header } from '@/shared/components/ui';

export default function AppLayout() {
  const { data: user } = useAuthUser();
  const { pathname } = useLocation();
  const isInactive = user?.status === 'INACTIVE';
  const isCampaignDetailRoute = /^\/campaigns\/[^/]+/.test(pathname);
  const mainRef = React.useRef<HTMLElement>(null);
  const [isHeaderScrolled, setIsHeaderScrolled] = React.useState(false);

  React.useEffect(() => {
    // Dynamically lock document root to prevent double outer scrollbars in the app dashboard
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: trigger scroll reset on route change
  React.useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
    setIsHeaderScrolled(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#eef5ff] text-slate-950">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Fixed Top Header */}
        <Header isAdmin={false} isScrolled={isHeaderScrolled} />

        {/* Scrollable Content Area */}
        <main
          ref={mainRef}
          onScroll={(event) => setIsHeaderScrolled(event.currentTarget.scrollTop > 8)}
          className={
            isCampaignDetailRoute
              ? 'flex-1 overflow-auto bg-[#eef5ff] px-5 pb-5 pt-28 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8'
              : isInactive
                ? 'flex-1 overflow-auto bg-[#eef5ff] px-6 pb-6 pt-28 lg:px-8 lg:pb-8'
                : 'flex-1 overflow-auto bg-[#eef5ff] px-5 pb-5 pt-28 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8'
          }
        >
          <Outlet />
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
