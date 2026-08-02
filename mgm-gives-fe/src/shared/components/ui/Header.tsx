import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Compass, Gift, LayoutDashboard, LogOut, Settings, Star, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuthUser, useLogoutMutation } from '@/features/auth/hooks';
import { NotificationDropdown } from '@/features/notification/components/NotificationDropdown';
import { useUnreadNotificationsCountQuery } from '@/features/notification/hooks';
import { LanguageSelector } from '@/shared/components/LanguageSelector';
import { ROLES } from '@/shared/constants/role';
import { ROUTES } from '@/shared/constants/routes';
import { useActiveRoleTheme } from '@/shared/hooks/useActiveRoleTheme';
import { getAvatarUrl } from '@/shared/utils/media';
import { Logo } from './Logo';

interface HeaderProps {
  isAdmin?: boolean;
  isScrolled?: boolean;
}

export default function Header({ isAdmin = false, isScrolled = true }: HeaderProps) {
  const { t } = useTranslation('common');
  const { data: user } = useAuthUser();
  const logoutMutation = useLogoutMutation();
  const { pathname } = useLocation();
  const activeRoleTheme = useActiveRoleTheme();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const isInactive = user?.status === 'INACTIVE';
  const { data: unreadCount = 0 } = useUnreadNotificationsCountQuery({
    enabled: !isInactive && !!user,
  });

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    const first = parts[0] ?? '';
    const last = parts[parts.length - 1] ?? '';
    if (parts.length === 1) return first.charAt(0).toUpperCase();
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  };

  const appNavItems = [
    { label: t('nav.dashboard'), to: ROUTES.DASHBOARD },
    { label: t('nav.campaigns'), to: ROUTES.CAMPAIGNS },
    { label: t('nav.joinedCampaigns'), to: ROUTES.JOINED_CAMPAIGNS },
  ];

  const isAppNavActive = (to: string) => {
    if (to === ROUTES.DASHBOARD) return pathname === ROUTES.DASHBOARD || pathname === '/';
    if (to === ROUTES.CAMPAIGNS) return pathname.startsWith(ROUTES.CAMPAIGNS);
    if (to === ROUTES.JOINED_CAMPAIGNS) {
      return pathname.startsWith(ROUTES.JOINED_CAMPAIGNS);
    }
    if (to === ROUTES.MY_CAMPAIGNS) return pathname.startsWith(ROUTES.MY_CAMPAIGNS);
    if (to === ROUTES.MY_DONATIONS) return pathname.startsWith(ROUTES.MY_DONATIONS);
    return pathname.startsWith(to);
  };

  const getLocalizedRoleLabel = (role?: string) => {
    if (activeRoleTheme.key === 'SYSTEM_ADMIN' || role === ROLES.ADMIN) return t('roles.admin');
    if (activeRoleTheme.key === 'CAMPAIGN_ADMIN' || role === ROLES.CAMPAIGN_ADMIN)
      return t('roles.campaignAdmin');
    return t('roles.user');
  };

  if (isAdmin) {
    return (
      <header
        className={`h-16 flex items-center justify-end px-8 border-b ${activeRoleTheme.headerBorder} bg-white shrink-0 z-50 relative transition-colors duration-200`}
      >
        <div className="flex items-center gap-6">
          {!isInactive && (
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotificationOpen((prev) => !prev);
                  setIsDropdownOpen(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 cursor-pointer"
                aria-label={t('nav.notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <NotificationDropdown onClose={() => setIsNotificationOpen(false)} />
              )}
            </div>
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen((prev) => !prev);
                setIsNotificationOpen(false);
              }}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity focus:outline-none cursor-pointer"
            >
              {user?.avatarUrl ? (
                <img
                  src={getAvatarUrl(user.avatarUrl) || undefined}
                  alt={user.fullName ?? 'User avatar'}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div
                  className={`h-9 w-9 rounded-full ${activeRoleTheme.accentBg} text-white flex items-center justify-center font-semibold text-sm`}
                >
                  {getInitials(user?.fullName)}
                </div>
              )}
              <div className="hidden md:block text-left">
                <div className="text-sm font-semibold text-gray-900 leading-none">
                  {user?.fullName}
                </div>
                <div className="text-xs text-gray-500 mt-1.5 leading-none">
                  {getLocalizedRoleLabel(user?.role)}
                </div>
              </div>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-xl border border-slate-100 shadow-xl shadow-blue-950/5 p-1 z-50"
                >
                  <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl mb-1 text-left">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-800 leading-none">
                        {user?.fullName}
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${activeRoleTheme.headerBadgeBg}`}
                      >
                        {activeRoleTheme.badgeLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-1.5 font-medium">
                      {user?.email}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    {!isInactive ? (
                      <>
                        {(user?.role === ROLES.ADMIN || user?.role === ROLES.CAMPAIGN_ADMIN) && (
                          <>
                            <Link
                              to={ROUTES.DASHBOARD}
                              onClick={() => setIsDropdownOpen(false)}
                              className="group flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-colors cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                            >
                              <Compass className="h-4 w-4 text-blue-500 group-hover:text-blue-600 transition-colors" />
                              {t('nav.userPortal')}
                            </Link>
                            <div className="border-t border-slate-100 my-1 mx-2"></div>
                          </>
                        )}

                        <Link
                          to={ROUTES.ADMIN_PROFILE}
                          onClick={() => setIsDropdownOpen(false)}
                          className="group flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors cursor-pointer rounded-lg"
                        >
                          <User className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                          {t('nav.profile')}
                        </Link>
                        <div className="border-t border-slate-100 my-1 mx-2"></div>
                      </>
                    ) : null}

                    {/* Language Selector inside Avatar Dropdown */}
                    <LanguageSelector />
                    <div className="border-t border-slate-100 my-1 mx-2"></div>

                    <button
                      type="button"
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="group w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50/50 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50 rounded-lg"
                    >
                      <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
                      {logoutMutation.isPending ? t('nav.signingOut') : t('nav.signOut')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        isScrolled
          ? `${activeRoleTheme.headerBorder} bg-white/95 shadow-sm backdrop-blur`
          : 'border-transparent bg-[#eef5ff]'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to={isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD}
          className={`flex shrink-0 items-center rounded-md outline-none ${activeRoleTheme.ringColor}`}
          aria-label={isAdmin ? 'Go to Admin Dashboard' : 'Go to Dashboard'}
        >
          <Logo className="h-10 w-40" />
        </Link>

        {!isInactive && !isAdmin && (
          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-3 text-sm font-semibold text-slate-600 md:flex lg:gap-7">
            {appNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={() =>
                  `whitespace-nowrap rounded-full px-2 py-1 transition-colors hover:text-primary ${
                    isAppNavActive(item.to) ? 'text-primary font-bold' : ''
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2 text-sm font-bold">
          {/* Notification Bell */}
          {!isInactive && (
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotificationOpen((prev) => !prev);
                  setIsDropdownOpen(false);
                }}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-white/70 hover:text-primary cursor-pointer"
                aria-label={t('nav.notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <NotificationDropdown onClose={() => setIsNotificationOpen(false)} />
              )}
            </div>
          )}

          {/* Profile Dropdown Trigger */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen((prev) => !prev);
                setIsNotificationOpen(false);
              }}
              className={`flex items-center gap-2 rounded-full ${activeRoleTheme.accentBg} px-3 py-2 text-white shadow-sm transition-colors hover:opacity-90 focus:outline-none ${activeRoleTheme.ringColor} cursor-pointer`}
            >
              {user?.avatarUrl ? (
                <img
                  src={getAvatarUrl(user.avatarUrl) || undefined}
                  alt={user.fullName ?? 'User avatar'}
                  className="h-6 w-6 rounded-full border border-white/40 object-cover"
                />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-semibold text-white">
                  {getInitials(user?.fullName)}
                </div>
              )}
              <span className="hidden max-w-36 truncate sm:inline">{user?.fullName}</span>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 mt-3 w-64 origin-top-right bg-white rounded-xl border border-slate-100 shadow-xl shadow-blue-950/5 p-1 z-50"
                >
                  {/* User Identity Section */}
                  <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/50 rounded-t-xl mb-1 text-left">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-bold text-slate-800 leading-none">
                        {user?.fullName}
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${activeRoleTheme.headerBadgeBg}`}
                      >
                        {activeRoleTheme.badgeLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate mt-1.5 font-medium">
                      {user?.email}
                    </div>
                  </div>

                  {/* Navigation Options */}
                  <div className="space-y-0.5">
                    {!isInactive ? (
                      <>
                        {/* Portal Switch Option in Dropdown */}
                        {(user?.role === ROLES.ADMIN || user?.role === ROLES.CAMPAIGN_ADMIN) && (
                          <>
                            <Link
                              to={isAdmin ? ROUTES.DASHBOARD : ROUTES.ADMIN}
                              onClick={() => setIsDropdownOpen(false)}
                              className="group flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-colors cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                            >
                              {isAdmin ? (
                                <>
                                  <Compass className="h-4 w-4 text-blue-500 group-hover:text-blue-600 transition-colors" />
                                  {t('nav.userPortal')}
                                </>
                              ) : (
                                <>
                                  <LayoutDashboard className="h-4 w-4 text-blue-500 group-hover:text-blue-600 transition-colors" />
                                  {t('nav.adminPortal')}
                                </>
                              )}
                            </Link>
                            <div className="border-t border-slate-100 my-1 mx-2"></div>
                          </>
                        )}

                        {isAdmin ? (
                          <Link
                            to={ROUTES.ADMIN_PROFILE}
                            onClick={() => setIsDropdownOpen(false)}
                            className="group flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors cursor-pointer rounded-lg"
                          >
                            <User className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                            {t('nav.profile')}
                          </Link>
                        ) : (
                          <>
                            <Link
                              to={ROUTES.PROFILE}
                              onClick={() => setIsDropdownOpen(false)}
                              className="group flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors cursor-pointer rounded-lg"
                            >
                              <User className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                              {t('nav.profile')}
                            </Link>
                            <Link
                              to={ROUTES.MY_CAMPAIGNS}
                              onClick={() => setIsDropdownOpen(false)}
                              className="group flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors cursor-pointer rounded-lg"
                            >
                              <Star className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                              {t('nav.myCampaigns')}
                            </Link>
                            <Link
                              to={ROUTES.MY_DONATIONS}
                              onClick={() => setIsDropdownOpen(false)}
                              className="group flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors cursor-pointer rounded-lg"
                            >
                              <Gift className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                              {t('nav.myDonations')}
                            </Link>
                            <Link
                              to={ROUTES.SETTINGS}
                              onClick={() => setIsDropdownOpen(false)}
                              className="group flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-primary hover:bg-slate-50 transition-colors cursor-pointer rounded-lg"
                            >
                              <Settings className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                              {t('nav.settings')}
                            </Link>
                          </>
                        )}
                        <div className="border-t border-slate-100 my-1 mx-2"></div>
                      </>
                    ) : null}

                    {/* Language Selector inside Avatar Dropdown */}
                    <LanguageSelector />
                    <div className="border-t border-slate-100 my-1 mx-2"></div>

                    <button
                      type="button"
                      onClick={() => logoutMutation.mutate()}
                      disabled={logoutMutation.isPending}
                      className="group w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50/50 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-50 rounded-lg"
                    >
                      <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-600 transition-colors" />
                      {logoutMutation.isPending ? t('nav.signingOut') : t('nav.signOut')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
