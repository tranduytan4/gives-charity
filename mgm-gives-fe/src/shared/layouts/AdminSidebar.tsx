import { FolderHeart, HandCoins, LayoutGrid, ShieldCheck, Tag, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink } from 'react-router-dom';
import { Badge } from '@/shared/components/ui/Badge';
import { Logo } from '@/shared/components/ui/Logo';
import { ROUTES } from '@/shared/constants/routes';
import { useActiveRoleTheme } from '@/shared/hooks/useActiveRoleTheme';
import { cn } from '@/shared/utils/cn';

export default function AdminSidebar() {
  const { t } = useTranslation(['admin', 'common']);
  const activeRoleTheme = useActiveRoleTheme();

  const navItems = [
    { label: t('admin:overview'), to: ROUTES.ADMIN, icon: LayoutGrid, end: true },
    { label: t('admin:usersAndRoles'), to: ROUTES.ADMIN_USERS, icon: Users },
    { label: t('admin:categories'), to: ROUTES.ADMIN_CATEGORIES, icon: Tag },
    { label: t('admin:campaigns'), to: ROUTES.ADMIN_CAMPAIGNS, icon: FolderHeart },
    { label: t('admin:donations'), to: ROUTES.ADMIN_DONATIONS, icon: HandCoins },
  ];

  return (
    <aside
      className="w-64 flex flex-col bg-white border-r border-border h-full shrink-0"
      aria-label="Admin navigation"
    >
      {/* Logo Area */}
      <div className="h-16 flex items-center px-5 border-b border-border shrink-0">
        <Link
          to={ROUTES.ADMIN}
          className={`flex flex-col gap-0.5 outline-none ${activeRoleTheme.ringColor} rounded-md`}
          aria-label="Go to Admin Dashboard"
        >
          <Logo className="h-9 w-auto" />
          <span className="text-[10px] text-gray-400 font-medium tracking-wider uppercase pl-0.5">
            {t('common:nav.charityPlatform')}
          </span>
        </Link>
      </div>

      {/* Admin Badge with Role Theme */}
      <div className="px-5 py-3 border-b border-border/60">
        <Badge
          variant="secondary"
          className={`${activeRoleTheme.sidebarBadgeBg} rounded-full py-1.5 px-3 font-medium border shadow-none text-xs flex items-center gap-1.5 w-fit`}
        >
          <ShieldCheck className="h-4 w-4" />
          {activeRoleTheme.badgeLabel}
        </Badge>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Admin sidebar navigation">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2',
                    isActive
                      ? `${activeRoleTheme.sidebarActiveBg} ${activeRoleTheme.sidebarActiveShadow}`
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )
                }
                aria-label={item.label}
              >
                <item.icon
                  className={cn('h-5 w-5 shrink-0')}
                  style={{ color: 'inherit' }}
                  aria-hidden="true"
                />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
