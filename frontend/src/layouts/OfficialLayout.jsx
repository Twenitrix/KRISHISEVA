import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { t } from '../i18n';
import { useToast } from '../components/ui/Toast';
import authService from '../services/authService';
import { LayoutDashboard, FileText, LogOut, Menu, X } from 'lucide-react';

export default function OfficialLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await authService.signOut();
    toast.success(t('toast.logoutSuccess'));
    navigate('/');
  };

  const navItems = [
    { path: '/official', label: t('official.nav.dashboard'), icon: LayoutDashboard },
    { path: '/official/claims', label: t('official.nav.claims'), icon: FileText },
  ];

  const isActivePath = (path) => {
    if (path === '/official') return location.pathname === '/official';
    return location.pathname.startsWith(path);
  };

  const SidebarContent = ({ onNav }) => (
    <>
      <div className="h-16 flex items-center px-6 border-b border-[var(--color-earth)] gap-3">
        <span className="font-bold bg-[var(--color-turmeric)] text-[var(--color-base-dark)] px-2.5 py-0.5 rounded-lg text-lg">K</span>
        <span className="font-extrabold text-white text-base tracking-tight font-heading">
          Krishi<span className="text-[var(--color-turmeric)]">Seva</span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] border border-[var(--color-accent)]/20 px-2 py-0.5 rounded-full">
          {t('roles.official')}
        </span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {navItems.map((item) => {
          const isActive = isActivePath(item.path);
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNav}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent-light)] border-l-4 border-[var(--color-accent)]'
                  : 'text-[var(--color-earth-light)] hover:bg-[var(--color-earth)]/40 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--color-earth)]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold text-[var(--color-earth-light)] hover:bg-[var(--color-status-rejected)]/15 hover:text-[var(--color-status-rejected-bg)] border border-transparent hover:border-[var(--color-status-rejected)]/20 transition-all"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          {t('common.logout')}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col md:flex-row">

      {/* Subtle warm orbs */}
      <div className="fixed top-0 right-0 w-80 h-80 bg-[var(--color-accent)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--color-base-dark)] border-r border-[var(--color-earth)] text-[var(--color-earth-light)] shrink-0 sticky top-0 h-screen shadow-xl z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-[var(--color-base-dark)]/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-[var(--color-base-dark)] border-r border-[var(--color-earth)] flex flex-col z-50 animate-slide-in">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-[var(--color-earth-light)] hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
            <SidebarContent onNav={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[var(--color-border-default)] z-30 shadow-sm md:hidden">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" strokeWidth={2} />
              </button>
              <span className="font-extrabold text-[var(--color-base-dark)] text-sm font-heading">
                Krishi<span className="text-[var(--color-accent)]">Seva</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 px-2 py-0.5 rounded-full">
                {t('roles.official')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-status-rejected)] rounded-lg transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 w-full overflow-y-auto relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
