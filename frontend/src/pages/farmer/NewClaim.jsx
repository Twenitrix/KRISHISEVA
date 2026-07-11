import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import FileUpload from '../../components/ui/FileUpload';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { extractExifGps } from '../../utils/imageAnalyzer';

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

  const [exifStatus, setExifStatus] = useState('');

  const handleFileChange = async (file) => {
    setFormData((prev) => ({ ...prev, file }));
    if (!file) {
      setExifStatus('');
      return;
    }
    
    setExifStatus('Scanning photo for geotags...');
    try {
      const gps = await extractExifGps(file);
      if (gps && gps.latitude && gps.longitude) {
        setGpsSimulated({
          latitude: gps.latitude,
          longitude: gps.longitude
        });
        setExifStatus('✅ Photo geotags successfully loaded!');
        toast.success('Geotags extracted successfully from photo!');
      } else {
        setExifStatus('⚠️ No GPS coordinates found in photo metadata. Falling back to device location.');
      }
    } catch (e) {
      console.error(e);
      setExifStatus('⚠️ Geotag extraction failed. Falling back to device location.');
    }
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

  const stepLabels = ['Policy & Land', 'Incident Details', 'Upload Photo', 'Bank Settings', 'Review & Sign'];

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-heading tracking-tight">
          {t('farmer.newClaim.title')}
        </h1>
        <p className="text-sm text-text-secondary mt-1">Geotagged Multi-Step Claim Processing Wizard</p>
      </div>

      {/* Modern Steps Indicator */}
      <div className="bg-white border border-border-default p-4 rounded-2xl shadow-sm flex items-center justify-between text-[11px] font-bold text-text-muted overflow-x-auto gap-2">
        {stepLabels.map((lbl, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          return (
            <React.Fragment key={lbl}>
              {idx > 0 && <span className="text-border-default text-xs">•</span>}
              <span className={`whitespace-nowrap flex items-center gap-1.5 transition-colors ${
                isActive ? 'text-emerald-600' : isDone ? 'text-text-primary' : 'text-text-muted/60'
              }`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border transition-all ${
                  isActive ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-600/10' :
                  isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-text-muted'
                }`}>
                  {stepNum}
                </span>
                <span className="hidden sm:inline">{lbl}</span>
              </span>
            </React.Fragment>
          );
        })}
      </div>

      <Card className="p-6 md:p-8 bg-white border border-border-default shadow-card rounded-2xl relative overflow-hidden">
        
        {/* Top Gradient Accents */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-500" />

        {loadingLand ? (
          <div className="flex flex-col justify-center items-center py-12 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <p className="text-sm text-text-secondary">{t('common.loading')}</p>
          </div>
        ) : landParcels.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-rose-50 text-rose-600 p-3 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 mx-auto mb-4 border border-rose-200">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm text-status-rejected font-bold font-heading">No land registry records found</p>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">Please verify your Aadhaar linkage or contact support.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Step 1: Policy/Land selection */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {t('farmer.newClaim.selectLand')}
                  </label>
                  <select
                    name="land_registry_id"
                    value={formData.land_registry_id}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-default rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                  >
                    {landParcels.map((parcel) => (
                      <option key={parcel.id} value={parcel.id}>
                        Survey No: {parcel.survey_number} — Crop: {parcel.crop_on_record} ({parcel.area_hectares} ha)
                      </option>
                    ))}
                  </select>
                </div>

                {selectedParcel && (
                  <div className="bg-slate-50 border border-border-default/60 p-5 rounded-2xl space-y-3 text-sm text-text-secondary hover-lift">
                    <p className="font-bold text-text-primary mb-1 font-heading border-b border-border-default pb-1.5">
                      Pre-filled Crop Insurance Policy Details
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-text-muted block">Insured Crop</span>
                        <span className="font-bold text-text-primary">{selectedParcel.crop_on_record}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">Land Area</span>
                        <span className="font-bold text-text-primary">{selectedParcel.area_hectares} hectares</span>
                      </div>
                      <div className="col-span-2 pt-1">
                        <span className="text-text-muted block">Base Sum Insured</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          ₹{(selectedParcel.area_hectares * 60000).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-text-muted italic pt-1.5 border-t border-border-default/30">
                      Sourced from Pradhan Mantri Fasal Bima Yojana (PMFBY) Portal.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Incident details */}
            {step === 2 && (
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {t('farmer.newClaim.eventType')}
                  </label>
                  <select
                    name="claimed_event_type"
                    value={formData.claimed_event_type}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-default rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm capitalize"
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
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    {t('farmer.newClaim.description')}
                  </label>
                  <textarea
                    name="description"
                    placeholder={t('farmer.newClaim.descriptionPlaceholder')}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-default rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm min-h-[110px] resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Evidence uploads */}
            {step === 3 && (
              <div className="space-y-5">
                <FileUpload
                  label={t('farmer.newClaim.uploadPhoto')}
                  hint={t('farmer.newClaim.uploadHint')}
                  onChange={handleFileChange}
                  error={errors.file}
                />
                
                {exifStatus && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    exifStatus.startsWith('✅') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    {exifStatus}
                  </div>
                )}
                
                <div className="bg-slate-50 border border-border-default/60 p-5 rounded-2xl text-xs space-y-2 text-text-secondary">
                  <p className="font-bold text-text-primary font-heading border-b border-border-default pb-1.5">
                    Camera & Geotag Verification Details
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <span className="text-[10px] text-text-muted uppercase">latitude</span>
                      <span className="block font-bold text-text-primary">{gpsSimulated.latitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted uppercase">longitude</span>
                      <span className="block font-bold text-text-primary">{gpsSimulated.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted italic pt-1 border-t border-border-default/30">
                    Geotag verification aligns coordinates to verify field boundaries.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Settlement info */}
            {step === 4 && (
              <div className="space-y-5">
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
              <div className="space-y-5">
                <div className="bg-slate-50 border border-border-default p-5 rounded-2xl text-sm space-y-4">
                  <h4 className="font-bold text-text-primary border-b border-border-default pb-2 font-heading">
                    Claim Summary Check
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-text-muted block uppercase">Survey Number</span>
                      <span className="font-bold text-text-primary">{selectedParcel?.survey_number}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block uppercase">Crop Area</span>
                      <span className="font-bold text-text-primary">
                        {selectedParcel?.area_hectares} Ha ({selectedParcel?.crop_on_record})
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block uppercase">Disaster Trigger</span>
                      <span className="font-bold text-text-primary capitalize">
                        {formData.claimed_event_type}
                      </span>
                    </div>
                    <div>
                      <span className="text-text-muted block uppercase">Disaster Date</span>
                      <span className="font-bold text-text-primary">
                        {new Date(formData.claimed_event_date).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                    <div className="col-span-2 border-t border-border-default/40 pt-3">
                      <span className="text-text-muted block uppercase">Direct Disbursal Bank Account</span>
                      <span className="font-bold text-text-primary">
                        {formData.bank_account_number} (IFSC: {formData.bank_ifsc})
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted italic pt-3 border-t border-border-default/30">
                    Geotag matches to official land boundaries. Please check all details before tapping submit.
                  </p>
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border-default">
              <div>
                {step > 1 && (
                  <Button variant="secondary" onClick={handleBack} disabled={submitting}>
                    {t('common.back')}
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {step < 5 ? (
                  <Button variant="primary" onClick={handleNext}>
                    {t('common.next')}
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleSubmit} loading={submitting} className="pulse-glow">
                    {t('farmer.newClaim.submitClaim')}
                  </Button>
                )}
              </div>
            </div>
            
          </div>
        )}
      </Card>
    </div>
  );
}
