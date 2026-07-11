import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';

export default function OfficialDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const res = await api.official.dashboard();
        if (res.success) {
          setData(res.data);
        } else {
          toast.error(res.message || t('common.errorGeneric'));
        }
      } catch (err) {
        toast.error(t('common.errorNetwork'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="text-sm text-text-secondary">{t('common.loading')}</p>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      label: t('official.dashboard.totalClaims'),
      value: data.counts.total_claims,
      color: 'text-slate-900',
      bgColor: 'bg-slate-100',
      borderColor: 'border-slate-200',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
    },
    {
      label: t('official.dashboard.underReview'),
      value: data.counts.under_review,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200/60',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      label: t('official.dashboard.approved'),
      value: (data.counts.verified || 0) + (data.counts.approved || 0),
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200/60',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      label: t('official.dashboard.rejected'),
      value: data.counts.rejected || 0,
      color: 'text-rose-700',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200/60',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-heading tracking-tight">
            {t('official.dashboard.title')}
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Village Assignment: <span className="font-bold text-text-primary">{data.village_name}</span>
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.label} className={`relative overflow-hidden border ${stat.borderColor} bg-white hover-lift rounded-2xl p-6`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-4xl font-extrabold font-heading ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-text-secondary mt-1.5 font-bold uppercase tracking-wider">{stat.label}</p>
              </div>
              <div className={`${stat.bgColor} ${stat.color} p-2.5 rounded-xl border border-current/10 shadow-sm`}>
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-amber-200/60 bg-gradient-to-br from-white to-amber-50/10 hover-lift rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-amber-50 text-amber-700 p-3.5 rounded-2xl border border-amber-200/50 shadow-inner shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">{t('official.dashboard.totalSuggestedPayout')}</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1 font-heading">
                ₹{data.total_suggested_payout.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-emerald-200/60 bg-gradient-to-br from-white to-emerald-50/10 hover-lift rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 text-emerald-700 p-3.5 rounded-2xl border border-emerald-200/50 shadow-inner shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-text-secondary font-bold uppercase tracking-wider">Total Disbursed</p>
              <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-heading">
                ₹{data.total_disbursed_payout.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
