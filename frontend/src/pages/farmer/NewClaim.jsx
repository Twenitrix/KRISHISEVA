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
import {
  MapPin, Camera, CheckCircle2, Send, AlertTriangle, MapPinned,
  Sprout, CalendarDays, FileText, Banknote, ArrowLeft, ArrowRight
} from 'lucide-react';

const stepDefs = [
  { label: 'Land Selection', icon: Sprout },
  { label: 'Incident', icon: CalendarDays },
  { label: 'Evidence', icon: Camera },
  { label: 'Bank Details', icon: Banknote },
  { label: 'Review', icon: CheckCircle2 },
];

export default function NewClaim() {
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1);
  const [landParcels, setLandParcels] = useState([]);
  const [loadingLand, setLoadingLand] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
  const [gpsSimulated, setGpsSimulated] = useState({ latitude: 20.8351, longitude: 78.6015 });
  const [exifStatus, setExifStatus] = useState('');

  useEffect(() => {
    const fetchLandAndProfile = async () => {
      try {
        setLoadingLand(true);
        const profileRes = await api.auth.me();
        if (profileRes.success) {
          const farmer = profileRes.data;
          setFormData(prev => ({
            ...prev,
            bank_account_number: farmer.bank_account_number || '12345678901',
            bank_ifsc: farmer.bank_ifsc || 'SBIN0001234',
            phone: farmer.phone || '9876543210',
          }));
          const landRes = await api.farmers.getLand(farmer.id);
          if (landRes.success) {
            setLandParcels(landRes.data);
            if (landRes.data.length > 0) {
              setFormData(prev => ({ ...prev, land_registry_id: landRes.data[0].id }));
            }
          }
        }
      } catch (err) {
        toast.error('Failed to load farmer details.');
      } finally {
        setLoadingLand(false);
      }
    };
    fetchLandAndProfile();
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsSimulated({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        },
        () => {}
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (file) => {
    setFormData(prev => ({ ...prev, file }));
    if (!file) { setExifStatus(''); return; }
    setExifStatus('scanning');
    try {
      const gps = await extractExifGps(file);
      if (gps?.latitude && gps?.longitude) {
        setGpsSimulated({ latitude: gps.latitude, longitude: gps.longitude });
        setExifStatus('success');
        toast.success('Geotags extracted from photo!');
      } else {
        setExifStatus('fallback');
      }
    } catch (e) {
      setExifStatus('fallback');
    }
  };

  const selectedParcel = landParcels.find(p => p.id === formData.land_registry_id);

  const validateStep = () => {
    setErrors({});
    const newErrors = {};
    if (step === 1 && !formData.land_registry_id) newErrors.land_registry_id = t('common.requiredField');
    if (step === 2 && !formData.claimed_event_date) newErrors.claimed_event_date = t('common.requiredField');
    if (step === 3 && !formData.file) newErrors.file = 'Photo is required';
    if (step === 4) {
      if (!formData.bank_account_number || formData.bank_account_number.length < 9) newErrors.bank_account_number = 'Enter a valid account number';
      if (!formData.bank_ifsc || formData.bank_ifsc.length !== 11) newErrors.bank_ifsc = 'Enter a valid 11-char IFSC';
      if (!formData.phone || formData.phone.length !== 10) newErrors.phone = 'Enter a valid 10-digit number';
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return false; }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };
  const handleBack = () => setStep(s => s - 1);

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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--color-base-dark)] font-heading tracking-tight">
          {t('farmer.newClaim.title')}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Geotagged, AI-verified claim submission</p>
      </div>

      {/* Step Indicator */}
      <div className="bg-white border border-[var(--color-border-default)] p-4 rounded-2xl shadow-[var(--shadow-card)] flex items-center gap-2 overflow-x-auto">
        {stepDefs.map((s, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isDone = step > stepNum;
          const Icon = s.icon;
          return (
            <React.Fragment key={s.label}>
              {idx > 0 && (
                <div className={`flex-1 h-0.5 min-w-[10px] ${isDone ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-default)]'}`} />
              )}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border-2 ${
                  isActive ? 'bg-[var(--color-turmeric-light)] border-[var(--color-turmeric)] text-[var(--color-turmeric)]' :
                  isDone ? 'bg-[var(--color-accent)] border-[var(--color-accent)] text-white' :
                  'bg-white border-[var(--color-border-default)] text-[var(--color-text-muted)]'
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} /> : <Icon className="w-4 h-4" strokeWidth={2} />}
                </div>
                <span className={`text-[9px] font-bold mt-1 whitespace-nowrap ${isActive ? 'text-[var(--color-turmeric)]' : isDone ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'}`}>
                  {s.label}
                </span>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* Card */}
      <Card className="bg-white border border-[var(--color-border-default)] shadow-[var(--shadow-card)] rounded-2xl overflow-hidden">
        {/* Top turmeric accent line */}
        <div className="h-1 w-full bg-[var(--color-turmeric)]" />

        <div className="p-6 md:p-8">
          {loadingLand ? (
            <div className="flex flex-col justify-center items-center py-12 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
              <p className="text-sm text-[var(--color-text-secondary)]">{t('common.loading')}</p>
            </div>
          ) : landParcels.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6" strokeWidth={2} />
              </div>
              <p className="text-sm font-bold text-[var(--color-status-rejected)] font-heading">No land registry records found</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Please verify your Aadhaar linkage or contact support.</p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Step 1: Land Selection */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      {t('farmer.newClaim.selectLand')}
                    </label>
                    <select
                      name="land_registry_id"
                      value={formData.land_registry_id}
                      onChange={handleChange}
                      className="w-full bg-white border border-[var(--color-border-default)] rounded-xl px-4 py-3 text-base text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] shadow-sm"
                    >
                      {landParcels.map(parcel => (
                        <option key={parcel.id} value={parcel.id}>
                          Survey No: {parcel.survey_number} — Crop: {parcel.crop_on_record} ({parcel.area_hectares} ha)
                        </option>
                      ))}
                    </select>
                    {errors.land_registry_id && <p className="text-xs text-[var(--color-status-rejected)]">{errors.land_registry_id}</p>}
                  </div>

                  {selectedParcel && (
                    <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border-default)] p-5 rounded-2xl space-y-3 text-sm">
                      <p className="font-bold text-[var(--color-base-dark)] font-heading border-b border-[var(--color-border-default)] pb-2">
                        Crop Insurance Policy Details
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[var(--color-text-muted)] block">Insured Crop</span>
                          <span className="font-bold text-[var(--color-base-dark)] capitalize">{selectedParcel.crop_on_record}</span>
                        </div>
                        <div>
                          <span className="text-[var(--color-text-muted)] block">Land Area</span>
                          <span className="font-bold text-[var(--color-base-dark)]">{selectedParcel.area_hectares} hectares</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-[var(--color-border-default)]">
                          <span className="text-[var(--color-text-muted)] block">Base Sum Insured</span>
                          <span className="font-bold text-[var(--color-accent)] text-base">
                            ₹{(selectedParcel.area_hectares * 60000).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[var(--color-text-muted)] italic">
                        Sourced from PMFBY Portal.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Incident Details */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      {t('farmer.newClaim.eventType')}
                    </label>
                    <select
                      name="claimed_event_type"
                      value={formData.claimed_event_type}
                      onChange={handleChange}
                      className="w-full bg-white border border-[var(--color-border-default)] rounded-xl px-4 py-3 text-base text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] shadow-sm capitalize"
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
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      {t('farmer.newClaim.description')}
                    </label>
                    <textarea
                      name="description"
                      placeholder={t('farmer.newClaim.descriptionPlaceholder')}
                      value={formData.description}
                      onChange={handleChange}
                      className="w-full bg-white border border-[var(--color-border-default)] rounded-xl px-4 py-3 text-base text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] shadow-sm min-h-[110px] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Photo Evidence (Phone-like camera UI) */}
              {step === 3 && (
                <div className="space-y-5">
                  {/* Camera frame */}
                  <div className="bg-[var(--color-base-dark)] rounded-2xl p-4 text-white text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-sm font-bold text-[var(--color-turmeric)]">
                      <Camera className="w-4 h-4" />
                      <span>Field Photo Capture</span>
                    </div>
                    <FileUpload
                      label=""
                      hint="Tap to capture or upload your crop damage photo"
                      onChange={handleFileChange}
                      error={errors.file}
                    />
                  </div>

                  {/* EXIF Status */}
                  {exifStatus && exifStatus !== 'scanning' && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      exifStatus === 'success'
                        ? 'bg-[var(--color-status-verified-bg)] text-[var(--color-status-verified)] border border-[var(--color-accent)]/20'
                        : 'bg-[var(--color-turmeric-light)] text-[var(--color-turmeric)] border border-[var(--color-turmeric-border)]'
                    }`}>
                      {exifStatus === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
                      {exifStatus === 'success'
                        ? 'Photo geotags loaded successfully!'
                        : 'No GPS found in photo. Using device location.'}
                    </div>
                  )}

                  {/* GPS Panel */}
                  <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border-default)] p-5 rounded-2xl text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[var(--color-base-dark)] font-heading border-b border-[var(--color-border-default)] pb-2">
                      <MapPinned className="w-4 h-4 text-[var(--color-accent)]" />
                      Geotag Verification
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>
                        <span className="text-[10px] text-[var(--color-text-muted)] uppercase">Latitude</span>
                        <span className="block font-bold text-[var(--color-base-dark)]">{gpsSimulated.latitude.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--color-text-muted)] uppercase">Longitude</span>
                        <span className="block font-bold text-[var(--color-base-dark)]">{gpsSimulated.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Bank Details */}
              {step === 4 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--color-base-dark)] font-heading mb-2">
                    <Banknote className="w-5 h-5 text-[var(--color-accent)]" />
                    Direct Disbursal Account
                  </div>
                  <Input
                    label="Bank Account Number"
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
                  <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border-default)] p-5 rounded-2xl text-sm space-y-4">
                    <h4 className="font-bold text-[var(--color-base-dark)] border-b border-[var(--color-border-default)] pb-2 font-heading flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-accent)]" />
                      Claim Summary
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[var(--color-text-muted)] block uppercase">Survey Number</span>
                        <span className="font-bold text-[var(--color-base-dark)]">{selectedParcel?.survey_number}</span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-muted)] block uppercase">Crop Area</span>
                        <span className="font-bold text-[var(--color-base-dark)]">{selectedParcel?.area_hectares} Ha ({selectedParcel?.crop_on_record})</span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-muted)] block uppercase">Disaster Type</span>
                        <span className="font-bold text-[var(--color-base-dark)] capitalize">{formData.claimed_event_type}</span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-muted)] block uppercase">Date</span>
                        <span className="font-bold text-[var(--color-base-dark)]">
                          {new Date(formData.claimed_event_date).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-[var(--color-border-default)] pt-3">
                        <span className="text-[var(--color-text-muted)] block uppercase">Disbursal Account</span>
                        <span className="font-bold text-[var(--color-base-dark)]">
                          {formData.bank_account_number} (IFSC: {formData.bank_ifsc})
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] italic pt-1.5 border-t border-[var(--color-border-default)]">
                      Please verify all details before submitting. This claim will be digitally signed.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-default)]">
                <div>
                  {step > 1 && (
                    <button
                      onClick={handleBack}
                      disabled={submitting}
                      className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-base-dark)] transition-colors px-3 py-2 rounded-xl hover:bg-[var(--color-surface-alt)]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      {t('common.back')}
                    </button>
                  )}
                </div>
                <div>
                  {step < 5 ? (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold px-6 py-2.5 rounded-xl shadow-[var(--shadow-card)] transition-all"
                    >
                      {t('common.next')}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex items-center gap-2 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold px-8 py-2.5 rounded-xl shadow-[var(--shadow-card)] transition-all disabled:opacity-60 pulse-glow"
                    >
                      {submitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {t('farmer.newClaim.submitClaim')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
