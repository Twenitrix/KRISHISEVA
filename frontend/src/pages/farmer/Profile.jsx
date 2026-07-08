import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';

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
          
          // Get additional farmer details (including bank info)
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
    // Basic validations
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
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-text-secondary">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('farmer.profile.title')}</h1>
        <p className="text-sm text-text-secondary">Manage your identity and bank details for claim payouts</p>
      </div>

      {profile && (
        <div className="space-y-6">
          {/* Identity Info Card */}
          <Card className="p-6 space-y-4">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider">Identity Details</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-text-secondary font-medium">Full Name</p>
                <p className="text-text-primary font-semibold mt-0.5">{profile.name}</p>
              </div>
              
              <div>
                <p className="text-text-secondary font-medium">Aadhaar Number</p>
                <p className="text-text-primary font-mono mt-0.5">XXXX-XXXX-9012</p>
              </div>

              <div>
                <p className="text-text-secondary font-medium">Phone Number</p>
                <p className="text-text-primary mt-0.5">+91 {profile.phone}</p>
              </div>

              <div>
                <p className="text-text-secondary font-medium">Verification Status</p>
                <div className="mt-1">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold bg-status-verified-bg text-status-verified px-2.5 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Aadhaar Linked
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Bank Details Form */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-4">
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

              <div className="flex justify-end pt-3 border-t border-border-default">
                <Button
                  variant="primary"
                  type="submit"
                  loading={saving}
                >
                  {t('farmer.profile.updateProfile')}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
