import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Megaphone,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/hooks/useAuthStore';

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { isSuperadmin, clearAuth, user } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/deals', icon: Briefcase, label: 'Deals' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/team', icon: UserCircle, label: 'Team' },
    ...(isSuperadmin() ? [{ to: '/users', icon: Shield, label: 'Users' }] : []),
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-full">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-surface-container transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-primary tracking-tight">
            Flow<span className="text-secondary">Raze</span>
          </h1>
          <button
            className="lg:hidden text-on-surface-variant hover:text-primary"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-round-eight px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-container text-primary'
                    : 'text-on_surface_variant hover:bg-surface-container-high hover:text-primary'
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-outline-variant/15 p-3">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-primary truncate">{user?.name}</p>
            <p className="text-xs text-on_surface_variant truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-on_surface_variant hover:text-error"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-outline-variant/15 bg-surface px-6 lg:hidden">
          <button
            className="text-on_surface_variant hover:text-primary"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold text-primary">
            Flow<span className="text-secondary">Raze</span>
          </h1>
        </header>

        <main className="flex-1 overflow-auto bg-surface p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
