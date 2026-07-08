import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import authService from '../../services/authService';

export default function NGORegister() {
  const navigate = useNavigate();
  const toast = useToast();
  const isSupabase = authService.isConfigured();

  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    contactPerson: '',
    phone: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrors({});
    const newErrors = {};
    if (!formData.name) newErrors.name = t('common.requiredField');
    if (!formData.licenseNumber) newErrors.licenseNumber = t('common.requiredField');
    if (!formData.contactPerson) newErrors.contactPerson = t('common.requiredField');
    if (!formData.phone || formData.phone.length < 10) newErrors.phone = 'Invalid phone number';
    if (!formData.email) newErrors.email = t('common.requiredField');
    if (!formData.password || formData.password.length < 8) newErrors.password = 'Must be at least 8 characters';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await authService.signUp(formData.email, formData.password, 'ngo', {
        name: formData.name,
        license_number: formData.licenseNumber,
        contact_person: formData.contactPerson,
        phone: formData.phone,
      });

      if (res.success) {
        toast.success(t('toast.registrationSuccess'));
        // Automatically sign in the registered user
        await authService.signIn(formData.email, formData.password);
        navigate('/ngo');
      }
    } catch (err) {
      toast.error(err.message || 'Registration failed');
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
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">{t('auth.ngoRegisterTitle')}</h1>
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
              ✅ Secure Supabase Authenticated registration active
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label={t('auth.ngoName')}
              name="name"
              placeholder={t('auth.ngoNamePlaceholder')}
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              disabled={loading}
            />
            <Input
              label={t('auth.licenseNumber')}
              name="licenseNumber"
              placeholder={t('auth.licensePlaceholder')}
              value={formData.licenseNumber}
              onChange={handleChange}
              error={errors.licenseNumber}
              disabled={loading}
            />
            <Input
              label={t('auth.contactPerson')}
              name="contactPerson"
              placeholder={t('auth.contactPersonPlaceholder')}
              value={formData.contactPerson}
              onChange={handleChange}
              error={errors.contactPerson}
              disabled={loading}
            />
            <Input
              label={t('auth.phone')}
              name="phone"
              placeholder={t('auth.phonePlaceholder')}
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 15) }))}
              error={errors.phone}
              disabled={loading}
            />
            <Input
              label={t('auth.email')}
              name="email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              disabled={loading}
            />
            <Input
              label={t('auth.password')}
              name="password"
              type="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              disabled={loading}
            />
            <Button type="submit" className="w-full mt-2" size="md" loading={loading}>
              {t('auth.registerButton')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-text-secondary">{t('auth.hasAccount')} </span>
            <Link to="/ngo/login" className="font-medium text-accent hover:text-accent-hover">
              {t('auth.loginLink')}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
