import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { t } from '../i18n';
import { useToast } from '../components/ui/Toast';
import authService from '../services/authService';

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
    {
      path: '/farmer',
      label: t('farmer.nav.myClaims'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      path: '/farmer/new-claim',
      label: t('farmer.nav.newClaim'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    {
      path: '/farmer/help',
      label: 'Help & FAQ',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      path: '/farmer/profile',
      label: t('farmer.nav.profile'),
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col pb-16 sm:pb-0">
      
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-border-default z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-2.5 py-0.5 rounded-lg text-lg shadow-sm">K</span>
            <span className="font-extrabold text-text-primary text-base tracking-tight font-heading">
              Krishi<span className="text-accent">Seva</span>
            </span>
            <span className="text-[10px] uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/50 font-bold px-2 py-0.5 rounded-full">
              {t('roles.farmer')}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-text-secondary hover:text-status-rejected transition-colors flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">{t('common.logout')}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 relative z-10">
        <Outlet />
      </main>

      {/* Bottom Nav (Farmer: floating glass bar style on mobile) */}
      <nav className="fixed bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md border border-border-default shadow-lg rounded-2xl z-30 sm:hidden">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full text-[10px] font-bold tracking-tight gap-1 transition-all rounded-xl ${
                  isActive 
                    ? 'text-emerald-700 bg-emerald-50/50' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'text-emerald-600' : 'text-text-muted'}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
