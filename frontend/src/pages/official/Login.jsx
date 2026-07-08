import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import authService from '../../services/authService';

export default function OfficialLogin() {
  const navigate = useNavigate();
  const toast = useToast();
  const isSupabase = authService.isConfigured();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};
    if (!email) newErrors.email = t('common.requiredField');
    if (!password) newErrors.password = t('common.requiredField');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await authService.signIn(email, password);
      if (res.success) {
        toast.success(t('toast.loginSuccess'));
        navigate('/official');
      }
    } catch (err) {
      toast.error(err.message || 'Login failed. Check your credentials.');
      setErrors({ form: err.message });
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
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t('auth.officialLoginTitle')}</h1>
        <p className="mt-2 text-sm text-text-secondary">{t('common.tagline')}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="px-6 py-8 relative overflow-hidden">
          
          {/* Supabase status banner */}
          {!isSupabase ? (
            <div className="bg-status-pending-bg text-status-pending text-[11px] font-semibold px-4 py-2 border-b border-border-default -mx-6 -mt-8 mb-6 text-center">
              ⚠️ Running in local demonstration mode (Supabase not configured)
            </div>
          ) : (
            <div className="bg-status-verified-bg text-status-verified text-[11px] font-semibold px-4 py-2 border-b border-border-default -mx-6 -mt-8 mb-6 text-center">
              ✅ Secure Supabase Authenticated mode active
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label={t('auth.staffId')}
              type="email"
              placeholder={t('auth.staffIdPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              disabled={loading}
            />
            <Input
              label={t('auth.password')}
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={loading}
            />
            
            <div className="flex flex-col gap-3">
              <Button type="submit" className="w-full" size="md" loading={loading}>
                {t('auth.loginButton')}
              </Button>
              <Button variant="ghost" onClick={() => navigate('/')}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
