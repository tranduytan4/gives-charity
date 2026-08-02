import { useQueryClient } from '@tanstack/react-query';
import {
  // Bell,
  FileText,
  Grid,
  Heart,
  LayoutDashboard,
  Megaphone,
  // Search,
  Users,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
// import { Input } from '@/shared/components/ui/Input';
import { Toaster } from 'sonner';
import { useDashboardSocket } from '@/features/dashboard/hooks/useDashboardSocket';
import { Header } from '@/shared/components/ui';
import { Badge } from '@/shared/components/ui/Badge';
import { Logo } from '@/shared/components/ui/Logo';
import { cn } from '@/shared/utils/cn';

const navItems = [
  { name: 'Overview', to: '/admin/overview', icon: LayoutDashboard },
  { name: 'Users & Roles', to: '/admin/users', icon: Users },
  { name: 'Categories', to: '/admin/categories', icon: Grid },
  { name: 'Campaigns', to: '/admin/campaigns', icon: Megaphone },
  { name: 'Donations', to: '/admin/donations', icon: Heart },
  { name: 'Reports', to: '/admin/reports', icon: FileText },
];

export default function AdminLayout() {
  const queryClient = useQueryClient();

  // Subscribe ở layout level để luôn lắng nghe dù đang ở trang admin nào.
  // Khi nhận WebSocket event → invalidate cache → dashboard sẽ refetch khi mount lại.
  useDashboardSocket(() => {
    void queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
  });

  return (
    <div className="flex h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r bg-white h-full shrink-0">
        <div className="h-16 flex items-center px-6 border-b shrink-0">
          <Logo className="h-8" />
        </div>

        <div className="px-6 py-4">
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-md py-1"
          >
            <span className="flex items-center gap-1.5 font-medium">
              <svg
                aria-hidden="true"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 16L16 12L12 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 12H16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Admin
            </span>
          </Badge>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                )
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header isAdmin={true} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
