import { useEffect, useState, type FormEvent } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/hooks/useAuthStore';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isSuperadmin, clearAuth, user } = useAuthStore();
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setGlobalSearch(location.pathname === '/search' ? params.get('q') ?? '' : '');
  }, [location.pathname, location.search]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const handleGlobalSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = globalSearch.trim();
    navigate(query ? `/search?q=${encodeURIComponent(query)}` : '/search');
  };

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/deals', icon: Briefcase, label: 'Deals' },
    { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { to: '/team', icon: UserCircle, label: 'Team' },
    ...(isSuperadmin() ? [{ to: '/users', icon: Shield, label: 'Users' }] : []),
  ];

  return (
    <div className="flex min-h-full">
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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#f2f4f6] transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-[#2A3BB0] flex items-center justify-center text-white shadow-md">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-primary tracking-tighter leading-none">FlowRaze</h1>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">Growth Engine</p>
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
          <button 
            className="w-full py-3 px-4 bg-gradient-to-br from-primary to-[#2A3BB0] text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-2"
            onClick={() => {
              setIsSidebarOpen(false);
              navigate('/leads?new=true');
            }}
          >
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

      <div className="flex min-w-0 flex-1 flex-col">
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

            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <span className="text-sm font-medium text-slate-700">{user?.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-surface px-4 pb-8 pt-32 sm:px-6 sm:pt-24 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
