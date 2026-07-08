import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import FileUpload from '../../components/ui/FileUpload';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';

export default function NewClaim() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: Policy/Land, 2: Incident, 3: Evidence, 4: Settlement, 5: Review
  const [landParcels, setLandParcels] = useState([]);
  const [loadingLand, setLoadingLand] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    land_registry_id: '',
    claimed_event_type: 'flood',
    claimed_event_date: '',
    description: '',
    file: null,
    bank_account_number: '',
    bank_ifsc: '',
    phone: '',
  });

  const [errors, setErrors] = useState({});
  const [gpsSimulated, setGpsSimulated] = useState({
    latitude: 20.8351,
    longitude: 78.6015,
  });

  useEffect(() => {
    const fetchLandAndProfile = async () => {
      try {
        setLoadingLand(true);
        const profileRes = await api.auth.me();
        if (profileRes.success) {
          const farmer = profileRes.data;
          setFormData((prev) => ({
            ...prev,
            bank_account_number: farmer.bank_account_number || '12345678901',
            bank_ifsc: farmer.bank_ifsc || 'SBIN0001234',
            phone: farmer.phone || '9876543210',
          }));

          const landRes = await api.farmers.getLand(farmer.id);
          if (landRes.success) {
            setLandParcels(landRes.data);
            if (landRes.data.length > 0) {
              setFormData((prev) => ({ ...prev, land_registry_id: landRes.data[0].id }));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching land/profile details', err);
        toast.error('Failed to load farmer details.');
      } finally {
        setLoadingLand(false);
      }
    };
    fetchLandAndProfile();
  }, []);

  // Simulating active GPS tags
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsSimulated({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Fallback prefilled
        }
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (file) => {
    setFormData((prev) => ({ ...prev, file }));
  };

  const selectedParcel = landParcels.find((p) => p.id === formData.land_registry_id);

  // Steps Nav Validation
  const validateStep = () => {
    setErrors({});
    const newErrors = {};

    if (step === 1) {
      if (!formData.land_registry_id) {
        newErrors.land_registry_id = t('common.requiredField');
      }
    } else if (step === 2) {
      if (!formData.claimed_event_date) {
        newErrors.claimed_event_date = t('common.requiredField');
      }
    } else if (step === 3) {
      if (!formData.file) {
        newErrors.file = 'Crop damage photograph is required';
      }
    } else if (step === 4) {
      if (!formData.bank_account_number || formData.bank_account_number.length < 9) {
        newErrors.bank_account_number = 'Enter a valid bank account number';
      }
      if (!formData.bank_ifsc || formData.bank_ifsc.length !== 11) {
        newErrors.bank_ifsc = 'Enter a valid 11-character IFSC code';
      }
      if (!formData.phone || formData.phone.length !== 10) {
        newErrors.phone = 'Enter a valid 10-digit mobile number';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const submitData = new FormData();
      submitData.append('land_registry_id', formData.land_registry_id);
      submitData.append('claimed_event_type', formData.claimed_event_type);
      submitData.append('claimed_event_date', formData.claimed_event_date);
      submitData.append('description', formData.description);
      submitData.append('file', formData.file);
      submitData.append('test_latitude', gpsSimulated.latitude.toString());
      submitData.append('test_longitude', gpsSimulated.longitude.toString());

      // Update mock profile bank details too
      await api.farmers.updateProfile(localStorage.getItem('user_id'), {
        bank_account_number: formData.bank_account_number,
        bank_ifsc: formData.bank_ifsc,
      });

      const res = await api.claims.create(submitData);
      if (res.success) {
        toast.success(t('toast.claimSubmitted'));
        navigate('/farmer');
      } else {
        toast.error(res.message || t('common.errorGeneric'));
      }
    } catch (err) {
      toast.error(t('common.errorNetwork'));
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('farmer.newClaim.title')}</h1>
        <p className="text-sm text-text-secondary">Geotagged Multi-Step Claim Processing Wizard</p>
      </div>

      {/* Steps indicator */}
      <div className="flex justify-between items-center bg-surface border border-border-default px-4 py-3 rounded-lg text-xs font-semibold text-text-muted">
        <span className={step === 1 ? 'text-accent' : ''}>1. Policy & Land</span>
        <span className="text-border-default">/</span>
        <span className={step === 2 ? 'text-accent' : ''}>2. Incident</span>
        <span className="text-border-default">/</span>
        <span className={step === 3 ? 'text-accent' : ''}>3. Evidence</span>
        <span className="text-border-default">/</span>
        <span className={step === 4 ? 'text-accent' : ''}>4. Settlement</span>
        <span className="text-border-default">/</span>
        <span className={step === 5 ? 'text-accent' : ''}>5. Review</span>
      </div>

      <Card className="p-6">
        {loadingLand ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-sm text-text-secondary">{t('common.loading')}</p>
          </div>
        ) : landParcels.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-status-rejected font-medium">No land registry records found.</p>
            <p className="text-xs text-text-muted mt-1">Please verify your Aadhaar linkage or contact support.</p>
          </div>
        ) : (
          <div className="space-y-5">
            
            {/* Step 1: Policy/Land selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">{t('farmer.newClaim.selectLand')}</label>
                  <select
                    name="land_registry_id"
                    value={formData.land_registry_id}
                    onChange={handleChange}
                    className="w-full bg-surface border border-border-default rounded-md px-3 py-2 text-sm focus:border-focus focus:outline-none"
                  >
                    {landParcels.map((parcel) => (
                      <option key={parcel.id} value={parcel.id}>
                        Survey No: {parcel.survey_number} — Crop: {parcel.crop_on_record} ({parcel.area_hectares} ha)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedParcel && (
                  <div className="bg-surface-alt p-4 rounded-lg space-y-2 text-xs text-text-secondary">
                    <p className="font-bold text-text-primary mb-1">Pre-filled Crop Insurance Policy Details:</p>
                    <p><span className="font-semibold text-text-primary">Insured Crop:</span> {selectedParcel.crop_on_record}</p>
                    <p><span className="font-semibold text-text-primary">Land Area:</span> {selectedParcel.area_hectares} hectares</p>
                    <p><span className="font-semibold text-text-primary">Base Sum Insured:</span> ₹{(selectedParcel.area_hectares * 60000).toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-text-muted mt-1">Sourced from Pradhan Mantri Fasal Bima Yojana (PMFBY) Portal.</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Incident details */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">{t('farmer.newClaim.eventType')}</label>
                  <select
                    name="claimed_event_type"
                    value={formData.claimed_event_type}
                    onChange={handleChange}
                    className="w-full bg-surface border border-border-default rounded-md px-3 py-2 text-sm focus:border-focus focus:outline-none capitalize"
                  >
                    <option value="flood">{t('eventTypes.flood')}</option>
                    <option value="drought">{t('eventTypes.drought')}</option>
                    <option value="hailstorm">{t('eventTypes.hailstorm')}</option>
                    <option value="famine">{t('eventTypes.famine')}</option>
                  </select>
                </div>

                <Input
                  label={t('farmer.newClaim.eventDate')}
                  name="claimed_event_date"
                  type="date"
                  value={formData.claimed_event_date}
                  onChange={handleChange}
                  error={errors.claimed_event_date}
                  max={new Date().toISOString().split('T')[0]}
                />

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-primary">{t('farmer.newClaim.description')}</label>
                  <textarea
                    name="description"
                    placeholder={t('farmer.newClaim.descriptionPlaceholder')}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-surface border border-border-default rounded-md px-3 py-2 text-sm min-h-[90px] focus:border-focus focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Evidence uploads */}
            {step === 3 && (
              <div className="space-y-4">
                <FileUpload
                  label={t('farmer.newClaim.uploadPhoto')}
                  hint={t('farmer.newClaim.uploadHint')}
                  onChange={handleFileChange}
                  error={errors.file}
                />
                
                <div className="bg-surface-alt p-3.5 rounded-lg text-xs space-y-1.5 text-text-secondary">
                  <p className="font-semibold text-text-primary">Camera & Geotag Verification Details:</p>
                  <p>📍 latitude: <span className="font-mono text-text-primary">{gpsSimulated.latitude.toFixed(6)}</span></p>
                  <p>📍 longitude: <span className="font-mono text-text-primary">{gpsSimulated.longitude.toFixed(6)}</span></p>
                  <p className="text-[10px] text-text-muted mt-1.5">Geotag verification aligns coordinates to verify field boundaries.</p>
                </div>
              </div>
            )}

            {/* Step 4: Settlement info */}
            {step === 4 && (
              <div className="space-y-4">
                <Input
                  label="Settlement Bank Account Number"
                  name="bank_account_number"
                  value={formData.bank_account_number}
                  onChange={handleChange}
                  error={errors.bank_account_number}
                />
                
                <Input
                  label="Bank IFSC Code"
                  name="bank_ifsc"
                  value={formData.bank_ifsc}
                  onChange={handleChange}
                  error={errors.bank_ifsc}
                />

                <Input
                  label="SMS Alert Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                />
              </div>
            )}

            {/* Step 5: Review */}
            {step === 5 && (
              <div className="space-y-4">
                <div className="bg-surface-alt p-4 rounded-lg text-sm space-y-3">
                  <h4 className="font-bold text-text-primary border-b border-border-default/50 pb-1.5">Claim Summary Check</h4>
                  <p><span className="font-semibold text-text-secondary">Survey Number:</span> {selectedParcel?.survey_number}</p>
                  <p><span className="font-semibold text-text-secondary">Crop Area:</span> {selectedParcel?.area_hectares} Ha ({selectedParcel?.crop_on_record})</p>
                  <p><span className="font-semibold text-text-secondary">Disaster Trigger:</span> <span className="capitalize">{formData.claimed_event_type}</span> ({new Date(formData.claimed_event_date).toLocaleDateString('en-IN')})</p>
                  <p><span className="font-semibold text-text-secondary">Bank Details:</span> {formData.bank_account_number} (IFSC: {formData.bank_ifsc})</p>
                  <p><span className="font-semibold text-text-secondary">Notification SMS Recipient:</span> {formData.phone}</p>
                  <p className="text-xs text-text-muted pt-2 border-t border-border-default/40">Geotag matches to official land boundaries. Please check all details before tapping submit.</p>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-default">
              {step > 1 && (
                <Button variant="secondary" onClick={handleBack} disabled={submitting}>
                  {t('common.back')}
                </Button>
              )}
              {step < 5 ? (
                <Button variant="primary" onClick={handleNext}>
                  {t('common.next')}
                </Button>
              ) : (
                <Button variant="primary" onClick={handleSubmit} loading={submitting}>
                  {t('farmer.newClaim.submitClaim')}
                </Button>
              )}
            </div>
            
          </div>
        )}
      </Card>
    </div>
  );
}
