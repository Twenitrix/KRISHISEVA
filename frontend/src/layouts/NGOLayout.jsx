import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { t } from '../i18n';
import { useToast } from '../components/ui/Toast';
import authService from '../services/authService';
import { LayoutDashboard, ClipboardCheck, LogOut } from 'lucide-react';

export default function NGOLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const handleLogout = async () => {
    await authService.signOut();
    toast.success(t('toast.logoutSuccess'));
    navigate('/');
  };

  const navItems = [
    { path: '/ngo', label: t('ngo.nav.dashboard'), icon: LayoutDashboard },
    { path: '/ngo/verifications', label: t('ngo.nav.verifications'), icon: ClipboardCheck },
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col md:flex-row pb-16 md:pb-0">

      {/* Subtle warm orbs */}
      <div className="fixed top-0 right-0 w-80 h-80 bg-[var(--color-accent)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar — warm dark brown, NOT cold slate */}
      <aside className="hidden md:flex flex-col w-64 bg-[var(--color-base-dark)] border-r border-[var(--color-earth)] text-[var(--color-earth-light)] shrink-0 sticky top-0 h-screen shadow-xl z-20">
        <div className="h-16 flex items-center px-6 border-b border-[var(--color-earth)] gap-3">
          <span className="font-bold bg-[var(--color-turmeric)] text-[var(--color-base-dark)] px-2.5 py-0.5 rounded-lg text-lg">K</span>
          <span className="font-extrabold text-white text-base tracking-tight font-heading">
            Krishi<span className="text-[var(--color-turmeric)]">Seva</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent)]/10 text-[var(--color-accent-light)] border border-[var(--color-accent)]/20 px-2 py-0.5 rounded-full">
            {t('roles.ngo')}
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
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[var(--color-border-default)] z-30 shadow-sm md:hidden">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="font-bold bg-[var(--color-turmeric)] text-[var(--color-base-dark)] px-2 py-0.5 rounded-md text-sm">K</span>
              <span className="font-extrabold text-[var(--color-base-dark)] text-sm font-heading">
                Krishi<span className="text-[var(--color-accent)]">Seva</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 px-2 py-0.5 rounded-full">
                {t('roles.ngo')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-status-rejected)] rounded-md transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto overflow-y-auto relative z-10">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-[var(--color-border-default)] shadow-[var(--shadow-modal)] rounded-2xl z-30 md:hidden">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = isActivePath(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-bold tracking-tight gap-1 transition-all rounded-xl ${
                  isActive
                    ? 'text-[var(--color-accent)] bg-[var(--color-accent-light)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.5]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
