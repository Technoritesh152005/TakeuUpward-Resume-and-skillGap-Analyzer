import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Target,
  Map,
  Briefcase,
  User,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import useAuthStore from '../../services/authStore.js';
import Logo from '../common components/Logo.jsx';

const DashboardLayout = ({
  children,
  contentContainerClassName = 'max-w-[1600px] mx-auto',
  contentClassName = 'p-6 sm:p-8 lg:p-10',
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }
    const stored = window.localStorage.getItem('dashboard.desktopSidebarCollapsed');
    return stored === null ? true : stored === 'true';
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const displayName = user?.fullName || user?.name || 'User';
  const initial = displayName.charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    window.localStorage.setItem('dashboard.desktopSidebarCollapsed', String(isDesktopSidebarCollapsed));
  }, [isDesktopSidebarCollapsed]);

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

  const desktopSidebarWidth = isDesktopSidebarCollapsed ? 'lg:w-[88px]' : 'lg:w-[280px]';
  const desktopContentOffset = isDesktopSidebarCollapsed ? 'lg:pl-[88px]' : 'lg:pl-[280px]';

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-inter overflow-hidden flex">

      <style>{`
        @keyframes aurora1 {
          0%,100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, -5%) scale(1.1); }
        }
        .animate-aurora-1 { animation: aurora1 20s ease-in-out infinite; }
        .glass-panel {
          backdrop-filter: blur(24px);
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .active-glow {
          box-shadow: 0 0 20px rgba(124, 58, 237, 0.25);
        }
      `}</style>
      
      {/* ── Background Aurora ─────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-primary-900/10 rounded-full blur-[120px] animate-aurora-1" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] bg-accent-900/5 rounded-full blur-[100px] animate-aurora-1" style={{ animationDelay: '-10s' }} />
      </div>

      {/* ── Desktop Sidebar ───────────────── */}
      <aside className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col ${desktopSidebarWidth} transition-all duration-500 ease-in-out z-40`}>
        <div className="flex flex-grow flex-col overflow-y-auto glass-panel border-r">
          
          {/* Sidebar Header / Logo */}
          <div
            className={`px-4 py-8 ${
              isDesktopSidebarCollapsed
                ? 'flex flex-col items-center gap-4'
                : 'flex flex-col items-start gap-4 px-6'
            }`}
          >
            <Logo 
              size={isDesktopSidebarCollapsed ? 'sm' : 'md'} 
              showText={!isDesktopSidebarCollapsed} 
            />
            <button
              onClick={() => setIsDesktopSidebarCollapsed((current) => !current)}
              className={`rounded-xl text-neutral-400 hover:bg-white/5 hover:text-white transition-all duration-300 ${
                isDesktopSidebarCollapsed ? 'p-2' : 'p-2.5'
              }`}
              aria-label={isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={isDesktopSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isDesktopSidebarCollapsed ? (
                <PanelLeftOpen className="h-4 w-4" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 px-4 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isDesktopSidebarCollapsed ? item.name : undefined}
                  className={`relative group flex items-center rounded-xl px-4 py-3.5 text-sm font-bold transition-all duration-300 overflow-hidden ${
                    isDesktopSidebarCollapsed ? 'justify-center' : 'gap-4'
                  } ${
                    active
                      ? 'bg-white/10 text-white active-glow border border-white/10'
                      : 'text-neutral-500 hover:text-neutral-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {active && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-400 to-accent-400" />
                  )}
                  <Icon className={`h-5 w-5 shrink-0 transition-colors duration-300 ${active ? 'text-primary-400' : 'group-hover:text-primary-400'}`} />
                  {!isDesktopSidebarCollapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer User Section */}
          <div className="border-t border-white/8 p-4">
            <div className={`rounded-2xl bg-white/5 border border-white/5 p-3 transition-all duration-300 ${isDesktopSidebarCollapsed ? 'flex justify-center p-2' : 'flex items-center gap-3'}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 border border-white/10 shadow-inner">
                <span className="text-sm font-black text-white">
                  {initial}
                </span>
              </div>
              {!isDesktopSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-black text-white uppercase tracking-wider">
                    {displayName}
                  </p>
                  <p className="truncate text-[10px] text-neutral-500 font-bold tracking-tight">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile Sidebar Header ─────────── */}
      {isSidebarOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 overflow-y-auto glass-panel border-r lg:hidden">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/8 px-6 py-8">
                <Logo size="md" />
                <button onClick={() => setIsSidebarOpen(false)} className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-2 px-4 py-6">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-4 rounded-xl px-4 py-4 text-sm font-bold transition-all ${
                        active ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
        </>
      )}

      {/* ── Main Content Container ────────── */}
      <div className={`flex-1 flex flex-col relative z-10 transition-all duration-500 ${desktopContentOffset}`}>
        
        {/* Header / Top Nav */}
        <header className="sticky top-0 z-30 glass-panel border-b border-white/8">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl p-2.5 text-neutral-400 hover:bg-white/5 transition-colors lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="hidden rounded-xl border border-danger-500/20 bg-danger-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-danger-400 transition-colors hover:bg-danger-500/20 lg:inline-flex lg:items-center lg:gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-accent-600 shadow-xl shadow-primary-900/40 lg:hidden focus-within:ring-2 ring-primary-500/50 cursor-pointer">
                <span className="text-sm font-black text-white">
                  {initial}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className={`flex-1 flex flex-col h-[calc(100vh-80px)] overflow-hidden ${contentClassName}`}>
          <div className={`${contentContainerClassName} w-full flex-1 flex flex-col h-full bg-transparent no-scrollbar overflow-y-auto`}>
             <style>{`
               .no-scrollbar::-webkit-scrollbar { display: none; }
               .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
             `}</style>
             {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
