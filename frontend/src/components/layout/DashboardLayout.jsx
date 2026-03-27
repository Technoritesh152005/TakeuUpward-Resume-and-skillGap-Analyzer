import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Target,
  Map,
  Briefcase,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import useAuthStore from '../../services/authStore.js';
import ThemeToggle from '../common components/themeToggle.jsx';

const DashboardLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'My Resumes', path: '/resumes', icon: FileText },
    { name: 'Analysis', path: '/analysis', icon: Target },
    { name: 'Roadmap', path: '/roadmap', icon: Map },
    { name: 'Job Roles', path: '/job-roles', icon: Briefcase },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  const isActivePath = (path) => {
    if (path === '/resumes') {
      return (
        location.pathname === '/resumes' ||
        /^\/resumes\/[^/]+/.test(location.pathname)
      );
    }

    if (path === '/analysis') {
      return location.pathname === '/analysis' || location.pathname.startsWith('/analysis/');
    }

    if (path === '/roadmap') {
      return location.pathname === '/roadmap' || location.pathname.startsWith('/roadmap/');
    }

    return location.pathname === path;
  };

  const desktopSidebarWidth = isDesktopSidebarCollapsed ? 'lg:w-24' : 'lg:w-72';
  const desktopContentOffset = isDesktopSidebarCollapsed ? 'lg:pl-24' : 'lg:pl-72';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col ${desktopSidebarWidth}`}>
        <div className="flex flex-grow flex-col overflow-y-auto border-r border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <div className={`flex items-center border-b border-neutral-200 px-6 py-6 dark:border-neutral-700 ${isDesktopSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700">
              <FileText className="h-6 w-6 text-white" />
            </div>
            {!isDesktopSidebarCollapsed ? (
              <span className="text-xl font-bold text-neutral-900 dark:text-white">
                TakeU<span className="text-primary-600 dark:text-primary-500">Upward</span>
              </span>
            ) : null}
          </div>

          <nav className="flex-1 space-y-1 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isDesktopSidebarCollapsed ? item.name : undefined}
                  className={`flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isDesktopSidebarCollapsed ? 'justify-center' : 'gap-3'
                  } ${
                    active
                      ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-500'
                      : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isDesktopSidebarCollapsed ? <span>{item.name}</span> : null}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
            <div className={`rounded-xl bg-neutral-50 px-4 py-3 dark:bg-neutral-700/50 ${isDesktopSidebarCollapsed ? 'flex justify-center' : 'flex items-center gap-3'}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-blue-600">
                <span className="text-sm font-semibold text-white">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              {!isDesktopSidebarCollapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-3 space-y-1">
              <Link
                to="/settings"
                title={isDesktopSidebarCollapsed ? 'Settings' : undefined}
                className={`flex rounded-lg px-4 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 ${
                  isDesktopSidebarCollapsed ? 'justify-center' : 'items-center gap-3'
                }`}
              >
                <Settings className="h-4 w-4" />
                {!isDesktopSidebarCollapsed ? <span>Settings</span> : null}
              </Link>
              <button
                onClick={handleLogout}
                title={isDesktopSidebarCollapsed ? 'Logout' : undefined}
                className={`flex w-full rounded-lg px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-500 dark:hover:bg-red-900/20 ${
                  isDesktopSidebarCollapsed ? 'justify-center' : 'items-center gap-3'
                }`}
              >
                <LogOut className="h-4 w-4" />
                {!isDesktopSidebarCollapsed ? <span>Logout</span> : null}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {isSidebarOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto border-r border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 lg:hidden">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-6 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-700">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xl font-bold text-neutral-900 dark:text-white">
                    TakeU<span className="text-primary-600">Upward</span>
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1 px-4 py-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(item.path);

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                        active
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-500'
                          : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-neutral-200 p-4 dark:border-neutral-700">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}

      <div className={desktopContentOffset}>
        <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>

              <button
                onClick={() => setIsDesktopSidebarCollapsed((current) => !current)}
                className="hidden rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 lg:flex"
                title={isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isDesktopSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
              </button>

              <div className="hidden max-w-md items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2 dark:bg-neutral-700 sm:flex">
                <Search className="h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search resumes, analyses..."
                  className="w-full border-none bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle />

              <button className="relative rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                <Bell className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-blue-600 lg:hidden">
                <span className="text-sm font-semibold text-white">
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
