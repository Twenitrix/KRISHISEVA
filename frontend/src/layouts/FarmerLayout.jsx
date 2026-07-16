import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { t } from '../i18n';
import { useToast } from '../components/ui/Toast';
import authService from '../services/authService';
import {
  FileText, PlusCircle, HelpCircle, User, LogOut, Sprout
} from 'lucide-react';

export default function FarmerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const handleLogout = async () => {
    await authService.signOut();
    toast.success(t('toast.logoutSuccess'));
    navigate('/');
  };

  const navItems = [
    { path: '/farmer', label: t('farmer.nav.myClaims'), icon: FileText },
    { path: '/farmer/new-claim', label: t('farmer.nav.newClaim'), icon: PlusCircle },
    { path: '/farmer/help', label: 'Help', icon: HelpCircle },
    { path: '/farmer/profile', label: t('farmer.nav.profile'), icon: User },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col pb-20 sm:pb-0">
      
      {/* Subtle warm orbs */}
      <div className="fixed top-0 right-0 w-72 h-72 bg-[var(--color-turmeric)]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-24 left-0 w-80 h-80 bg-[var(--color-accent)]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-[var(--color-border-default)] z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold bg-[var(--color-turmeric)] text-[var(--color-base-dark)] px-2.5 py-0.5 rounded-lg text-lg shadow-sm">K</span>
            <span className="font-extrabold text-[var(--color-base-dark)] text-base tracking-tight font-heading">
              Krishi<span className="text-[var(--color-accent)]">Seva</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 font-bold px-2 py-0.5 rounded-full">
              {t('roles.farmer')}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-status-rejected)] transition-colors flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-xl hover:bg-[var(--color-status-rejected-bg)] border border-transparent hover:border-[var(--color-status-rejected)]/20"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.logout')}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 relative z-10">
        <Outlet />
      </main>

      {/* Bottom Nav — glass floating bar on mobile */}
      <nav className="fixed bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md border border-[var(--color-border-default)] shadow-[var(--shadow-modal)] rounded-2xl z-30 sm:hidden">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
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
