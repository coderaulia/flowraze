import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Megaphone,
  UserCircle,
  Settings,
  LogOut,
  Shield,
  Plus,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/useAuthStore';

export function Layout() {
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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#f2f4f6] lg:static'
        )}
      >
        <div className="flex items-center gap-3 px-6 pt-6 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#2A3BB0] flex items-center justify-center text-white shadow-md">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-primary tracking-tighter leading-none">FlowRaze</h1>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Growth Engine</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
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

        <div className="px-4 py-4">
          <button className="w-full py-3 px-4 bg-gradient-to-br from-primary to-[#2A3BB0] text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-2">
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
        </div>

        <div className="mt-auto px-3 py-4 space-y-1 border-t border-slate-200/50">
          <NavLink
            to="/settings"
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
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-200/50 hover:translate-x-1 transition-all duration-300"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="fixed top-0 left-64 right-0 h-16 bg-[#f7f9fb] border-b border-slate-200 flex justify-between items-center px-8 z-40">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                className="bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 w-64 focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                placeholder="Search leads, deals, campaigns..."
                type="text"
              />
            </div>
            <div className="hidden lg:flex items-center gap-6">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(
                    'text-sm font-semibold pb-1 transition-colors',
                    isActive ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/leads"
                className={({ isActive }) =>
                  cn(
                    'text-sm font-semibold pb-1 transition-colors',
                    isActive ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                Leads
              </NavLink>
              <NavLink
                to="/deals"
                className={({ isActive }) =>
                  cn(
                    'text-sm font-semibold pb-1 transition-colors',
                    isActive ? 'text-primary border-b-2 border-primary' : 'text-slate-500 hover:text-slate-900'
                  )
                }
              >
                Deals
              </NavLink>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-surface p-8 pt-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
