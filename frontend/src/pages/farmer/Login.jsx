import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import authService from '../../services/authService';

export default function FarmerLogin() {
  const navigate = useNavigate();
  const toast = useToast();
  const isSupabase = authService.isConfigured();

  // State for Aadhaar & OTP wizard
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Aadhaar, 2: OTP
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleRequestOtp = (e) => {
    e.preventDefault();
    setErrors({});
    if (!aadhaar || aadhaar.length !== 12 || !/^\d+$/.test(aadhaar)) {
      setErrors({ aadhaar: t('auth.aadhaarInvalid') });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      toast.info(`Mock OTP sent for Aadhaar verification. Enter code: 123456`);
    }, 800);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
      setErrors({ otp: t('auth.otpRequired') });
      return;
    }

    setLoading(true);
    try {
      const res = await authService.signInFarmerAadhaar(aadhaar, otp);
      if (res.success) {
        toast.success(t('toast.loginSuccess'));
        navigate('/farmer');
      }
    } catch (err) {
      toast.error(err.message || 'OTP verification failed');
      setErrors({ otp: err.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <span 
          onClick={() => navigate('/')} 
          className="inline-block p-3 bg-accent-light rounded-full text-accent mb-4 font-bold text-xl cursor-pointer hover:scale-105 transition-transform"
        >
          K
        </span>
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t('auth.farmerLoginTitle')}</h1>
        <p className="mt-2 text-sm text-text-secondary">{t('common.tagline')}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-6 py-8 relative overflow-hidden">
          
          {/* Supabase status header banner */}
          {!isSupabase ? (
            <div className="bg-status-pending-bg text-status-pending text-[11px] font-semibold px-4 py-2 border-b border-border-default -mx-6 -mt-8 mb-6 text-center">
              ⚠️ Running in local demonstration mode (Supabase not configured)
            </div>
          ) : (
            <div className="bg-status-verified-bg text-status-verified text-[11px] font-semibold px-4 py-2 border-b border-border-default -mx-6 -mt-8 mb-6 text-center">
              ✅ Secure Supabase Aadhaar Mode active
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestOtp} className="space-y-6">
              <Input
                label="Aadhaar Number"
                placeholder={t('auth.aadhaarPlaceholder')}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, '').slice(0, 12))}
                error={errors.aadhaar}
                helperText="Try 123456789012, 987654321098, or 987654329012 (Suresh)"
                maxLength={12}
                disabled={loading}
              />
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" size="md" loading={loading}>
                  {t('auth.requestOtp')}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/')}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <Input
                label="Enter OTP"
                placeholder={t('auth.otpPlaceholder')}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                error={errors.otp}
                helperText="Enter mock OTP: 123456"
                maxLength={6}
                disabled={loading}
              />
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full" size="md" loading={loading}>
                  {t('auth.verifyOtp')}
                </Button>
                <Button variant="ghost" onClick={() => setStep(1)} disabled={loading}>
                  {t('common.back')}
                </Button>
              </div>
            </form>
          )}

        </Card>
      </div>
    </div>
  );
}
