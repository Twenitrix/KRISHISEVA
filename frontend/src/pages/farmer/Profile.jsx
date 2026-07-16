import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { User, ShieldCheck, Banknote, Save } from 'lucide-react';

export default function Profile() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bankDetails, setBankDetails] = useState({
    bank_account_number: '',
    bank_ifsc: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const meRes = await api.auth.me();
        if (meRes.success) {
          setProfile(meRes.data);
          const farmerRes = await api.farmers.get(meRes.data.id);
          if (farmerRes.success) {
            setBankDetails({
              bank_account_number: farmerRes.data.bank_account_number || '',
              bank_ifsc: farmerRes.data.bank_ifsc || '',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching farmer profile', err);
        toast.error('Failed to load profile details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prev) => ({ ...prev, [name]: value.toUpperCase().trim() }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});

    const newErrors = {};
    if (!bankDetails.bank_account_number) newErrors.bank_account_number = t('common.requiredField');
    if (!bankDetails.bank_ifsc) newErrors.bank_ifsc = t('common.requiredField');
    if (bankDetails.bank_account_number && bankDetails.bank_account_number.length < 9) {
      newErrors.bank_account_number = 'Enter a valid account number';
    }
    if (bankDetails.bank_ifsc && bankDetails.bank_ifsc.length !== 11) {
      newErrors.bank_ifsc = 'IFSC must be exactly 11 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await api.farmers.updateProfile(profile.id, bankDetails);
      if (res.success) {
        toast.success(t('toast.profileUpdated'));
      } else {
        toast.error(res.message || t('common.errorGeneric'));
      }
    } catch (err) {
      toast.error(t('common.errorNetwork'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-base-dark)] font-heading">{t('farmer.profile.title')}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">Manage your identity and bank details for claim payouts</p>
      </div>

      {profile && (
        <div className="space-y-6">
          {/* Identity Info Card */}
          <Card className="bg-white border border-[var(--color-border-default)] rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
            <div className="h-1 w-full bg-[var(--color-turmeric)]" />
            <div className="p-6 space-y-4">
              <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-turmeric)]" strokeWidth={2} />
                Identity Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[var(--color-text-muted)] font-medium text-xs uppercase">Full Name</p>
                  <p className="text-[var(--color-base-dark)] font-bold mt-0.5">{profile.name}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)] font-medium text-xs uppercase">Aadhaar Number</p>
                  <p className="text-[var(--color-base-dark)] font-mono mt-0.5">XXXX-XXXX-9012</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)] font-medium text-xs uppercase">Phone Number</p>
                  <p className="text-[var(--color-base-dark)] mt-0.5">+91 {profile.phone}</p>
                </div>
                <div>
                  <p className="text-[var(--color-text-muted)] font-medium text-xs uppercase">Verification Status</p>
                  <div className="mt-1">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-[var(--color-status-verified-bg)] text-[var(--color-status-verified)] px-2.5 py-0.5 rounded-full border border-[var(--color-accent)]/20">
                      <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2.5} />
                      Aadhaar Linked
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Bank Details Form */}
          <Card className="bg-white border border-[var(--color-border-default)] rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
            <div className="h-1 w-full bg-[var(--color-accent)]" />
            <div className="p-6">
              <h2 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-[var(--color-accent)]" strokeWidth={2} />
                {t('farmer.profile.bankDetails')}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label={t('farmer.profile.bankAccount')}
                  name="bank_account_number"
                  value={bankDetails.bank_account_number}
                  onChange={(e) => setBankDetails(prev => ({ ...prev, bank_account_number: e.target.value.replace(/\D/g, '') }))}
                  error={errors.bank_account_number}
                  disabled={saving}
                  placeholder="e.g. 12345678901"
                />
                <Input
                  label={t('farmer.profile.bankIfsc')}
                  name="bank_ifsc"
                  value={bankDetails.bank_ifsc}
                  onChange={handleChange}
                  error={errors.bank_ifsc}
                  disabled={saving}
                  placeholder="e.g. SBIN0001234"
                  maxLength={11}
                />
                <div className="flex justify-end pt-3 border-t border-[var(--color-border-default)]">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold px-6 py-2.5 rounded-xl shadow-[var(--shadow-card)] transition-all flex items-center gap-2 disabled:opacity-60"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {t('farmer.profile.updateProfile')}
                  </button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
