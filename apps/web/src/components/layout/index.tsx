import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Megaphone,
  UserCircle,
  Settings,
  LogOut,
  Building2,
  CreditCard,
  Plus,
  Search,
  Menu,
  X,
  Target,
  Activity,
  Shield,
  TrendingUp,
  Workflow,
  LifeBuoy,
  Bell,
  CheckCheck,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/useAuthStore';
import { COMPANY_ROUTES } from '@/lib/routes';
import { get, put } from '@/lib/api';
import type { Notification } from '@/types';

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    const response = await get<NotificationsResponse>('/notifications');
    if (response.success && response.data) {
      setNotifications(response.data.notifications.slice(0, 10));
      setUnreadCount(response.data.unreadCount);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await put('/notifications/read-all', {});
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleMarkRead = async (notification: Notification) => {
    if (notification.isRead) return;
    await put(`/notifications/${notification.id}/read`, {});
    setNotifications((prev) => prev.map((n) => n.id === notification.id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Notifications"
        className="relative rounded-lg p-2 text-slate-600 hover:bg-surface-container transition-colors"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl bg-white shadow-xl border border-slate-200 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={cn(
                    'w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors',
                    !notification.isRead && 'bg-primary/5'
                  )}
                  onClick={() => handleMarkRead(notification)}
                >
                  <div className="flex items-start gap-2">
                    {!notification.isRead && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                    <div className={cn('min-w-0', notification.isRead && 'pl-4')}>
                      <p className="text-sm font-medium text-slate-800 truncate">{notification.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperadmin, isAdmin, clearAuth, user, hasFeature } = useAuthStore();
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const superadmin = isSuperadmin();
  const admin = isAdmin();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setGlobalSearch(location.pathname === COMPANY_ROUTES.search ? params.get('q') ?? '' : '');
  }, [location.pathname, location.search]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const scrollLockClass = 'flowraze-app-shell-scroll-lock';
    document.documentElement.classList.add(scrollLockClass);
    document.body.classList.add(scrollLockClass);

    return () => {
      document.documentElement.classList.remove(scrollLockClass);
      document.body.classList.remove(scrollLockClass);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleGlobalSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = globalSearch.trim();
    navigate(query ? `${COMPANY_ROUTES.search}?q=${encodeURIComponent(query)}` : COMPANY_ROUTES.search);
  };

  const superadminNavItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Platform' },
    { to: '/admin/companies', icon: Building2, label: 'Companies' },
    { to: '/admin/users', icon: Users, label: 'All Users' },
    { to: '/admin/billing', icon: CreditCard, label: 'Billing' },
  ];

  const companyNavItems = [
    { to: COMPANY_ROUTES.dashboard, icon: LayoutDashboard, label: 'Dashboard' },
    ...(hasFeature('analytics') ? [{ to: COMPANY_ROUTES.analytics, icon: TrendingUp, label: 'Analytics' }] : []),
    ...(admin && hasFeature('automation') ? [{ to: COMPANY_ROUTES.automations, icon: Workflow, label: 'Automations' }] : []),
    ...(hasFeature('targets') ? [{ to: COMPANY_ROUTES.targets, icon: Target, label: 'Targets' }] : []),
    { to: COMPANY_ROUTES.leads, icon: Users, label: 'Leads' },
    { to: COMPANY_ROUTES.deals, icon: Briefcase, label: user?.entitlements?.dealLabel ?? 'Deals' },
    ...(hasFeature('campaigns') ? [{ to: COMPANY_ROUTES.campaigns, icon: Megaphone, label: 'Campaigns' }] : []),
    { to: COMPANY_ROUTES.activities, icon: Activity, label: 'Activities' },
    ...(hasFeature('teamPerformance') ? [{ to: COMPANY_ROUTES.team, icon: UserCircle, label: 'Team' }] : []),
    ...(admin ? [{ to: COMPANY_ROUTES.users, icon: Shield, label: 'Users' }] : []),
  ];

  const navItems = superadmin ? superadminNavItems : companyNavItems;

  return (
    <div className="flex h-screen h-dvh min-h-0 overflow-hidden">
      {isSidebarOpen && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-surface/60 backdrop-blur-sm lg:hidden"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-64 min-h-0 flex-col bg-[#f2f4f6] transition-transform duration-300 lg:relative lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex shrink-0 items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#2A3BB0] flex items-center justify-center text-white shadow-md">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-primary tracking-tighter leading-none">FlowRaze</h1>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">
                {superadmin ? 'Superadmin' : 'Growth Engine'}
              </p>
            </div>
          </div>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/70 lg:hidden"
            type="button"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain px-3 py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin' || to === COMPANY_ROUTES.dashboard}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
                  isActive
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:translate-x-1'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto shrink-0">
          <div className="px-3 py-4 space-y-1 border-t border-slate-200/50">
            {admin && (
              <NavLink
                to={COMPANY_ROUTES.subscription}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:translate-x-1'
                  )
                }
              >
                <CreditCard className="h-5 w-5" />
                Subscription
              </NavLink>
            )}
            {admin && (
              <NavLink
                to={COMPANY_ROUTES.settings}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:translate-x-1'
                  )
                }
              >
                <Settings className="h-5 w-5" />
                Settings
              </NavLink>
            )}
            {!superadmin && (
              <NavLink
                to={COMPANY_ROUTES.support}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-slate-600 hover:bg-slate-200/50 hover:translate-x-1'
                  )
                }
              >
                <LifeBuoy className="h-5 w-5" />
                Support
              </NavLink>
            )}
            <button
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-200/50 hover:translate-x-1 transition-all duration-300"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="fixed left-0 right-0 top-0 z-30 min-h-16 bg-[#f7f9fb] border-b border-slate-200 px-4 py-3 lg:left-64 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3 sm:gap-6">
              <button
                aria-label="Open navigation"
                className="rounded-lg p-2 text-primary hover:bg-surface-container lg:hidden"
                type="button"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              {!superadmin && (
                <form className="relative group min-w-0 flex-1 sm:flex-none" onSubmit={handleGlobalSearch}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    className="w-full rounded-full border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm transition-all focus:ring-2 focus:ring-primary/20 sm:w-64"
                    placeholder="Search CRM..."
                    type="text"
                    value={globalSearch}
                    onChange={(event) => setGlobalSearch(event.target.value)}
                  />
                </form>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              {!superadmin && <NotificationBell />}
              <span className="text-sm font-medium text-slate-700">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-surface px-4 pb-8 pt-32 sm:px-6 sm:pt-24 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* FAB — hidden for superadmin */}
      {!superadmin && (
        <div className="fixed bottom-6 right-6 z-40 sm:bottom-8 sm:right-8">
          <button
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#2A3BB0] text-white shadow-2xl shadow-primary/40 transition-all duration-300 hover:scale-110 hover:rotate-90 active:scale-95 group"
            onClick={() => navigate(`${COMPANY_ROUTES.leads}?new=true`)}
            title="Add Lead"
          >
            <Plus className="h-7 w-7 transition-transform group-hover:scale-110" />
          </button>
        </div>
      )}
    </div>
  );
}
