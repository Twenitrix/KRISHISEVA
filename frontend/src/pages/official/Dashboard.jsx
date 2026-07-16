import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { FileText, Clock, CheckCircle2, XCircle, Banknote, BadgeCheck } from 'lucide-react';

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
      color: 'text-[var(--color-base-dark)]',
      bgColor: 'bg-[var(--color-surface-alt)]',
      borderColor: 'border-[var(--color-border-default)]',
      icon: <FileText className="w-5 h-5" strokeWidth={2} />,
    },
    {
      label: t('official.dashboard.underReview'),
      value: data.counts.under_review,
      color: 'text-[var(--color-turmeric)]',
      bgColor: 'bg-[var(--color-turmeric-light)]',
      borderColor: 'border-[var(--color-turmeric-border)]',
      icon: <Clock className="w-5 h-5" strokeWidth={2} />,
    },
    {
      label: t('official.dashboard.approved'),
      value: (data.counts.verified || 0) + (data.counts.approved || 0),
      color: 'text-[var(--color-accent)]',
      bgColor: 'bg-[var(--color-accent-light)]',
      borderColor: 'border-[var(--color-accent)]/30',
      icon: <CheckCircle2 className="w-5 h-5" strokeWidth={2} />,
    },
    {
      label: t('official.dashboard.rejected'),
      value: data.counts.rejected || 0,
      color: 'text-[var(--color-status-rejected)]',
      bgColor: 'bg-[var(--color-status-rejected-bg)]',
      borderColor: 'border-[var(--color-status-rejected)]/20',
      icon: <XCircle className="w-5 h-5" strokeWidth={2} />,
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
                <p className="text-xs text-[var(--color-text-secondary)] mt-1.5 font-bold uppercase tracking-wider">{stat.label}</p>
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
        <Card className="border border-[var(--color-turmeric-border)] bg-white hover-lift rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-[var(--color-turmeric-light)] text-[var(--color-turmeric)] p-3.5 rounded-2xl border border-[var(--color-turmeric-border)] shadow-inner shrink-0">
              <Banknote className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">{t('official.dashboard.totalSuggestedPayout')}</p>
              <p className="text-2xl font-extrabold text-[var(--color-base-dark)] mt-1 font-heading">
                ₹{data.total_suggested_payout.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="border border-[var(--color-accent)]/30 bg-white hover-lift rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-[var(--color-accent-light)] text-[var(--color-accent)] p-3.5 rounded-2xl border border-[var(--color-accent)]/20 shadow-inner shrink-0">
              <BadgeCheck className="w-6 h-6" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider">Total Disbursed</p>
              <p className="text-2xl font-extrabold text-[var(--color-accent)] mt-1 font-heading">
                ₹{data.total_disbursed_payout.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
