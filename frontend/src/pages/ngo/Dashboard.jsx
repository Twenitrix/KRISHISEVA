import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import FileUpload from '../../components/ui/FileUpload';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { Search, Filter, CheckCircle2, MapPin, Image as ImageIcon } from 'lucide-react';

export default function Dashboard() {
  const toast = useToast();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    verification_type: 'field_visit',
    remarks: '',
    file: null,
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const villageId = 'v1-uuid-wardha';
      const res = await api.ngo.dashboard(villageId);
      if (res.success) setClaims(res.data.items);
      else toast.error(res.message || t('common.errorGeneric'));
    } catch (err) {
      toast.error(t('common.errorNetwork'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleOpenVerify = (claim) => {
    setSelectedClaim(claim);
    setVerificationForm({ verification_type: 'field_visit', remarks: '', file: null });
    setFormErrors({});
    setVerifyModalOpen(true);
  };

  const handleFileChange = (file) => setVerificationForm(prev => ({ ...prev, file }));
  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setVerificationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitVerification = async (e) => {
    e.preventDefault();
    setFormErrors({});
    const errors = {};
    if (!verificationForm.remarks.trim()) errors.remarks = t('common.requiredField');
    if (verificationForm.verification_type === 'field_visit' && !verificationForm.file) {
      errors.file = 'Photo evidence required for field visits';
    }
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setVerifying(true);
    try {
      const submitData = new FormData();
      submitData.append('claim_id', selectedClaim.id);
      submitData.append('farmer_id', selectedClaim.farmer_id);
      submitData.append('verification_type', verificationForm.verification_type);
      submitData.append('remarks', verificationForm.remarks);
      if (verificationForm.file) submitData.append('file', verificationForm.file);

      const res = await api.ngo.verifications.submit(submitData);
      if (res.success) {
        toast.success(t('toast.evidenceSubmitted'));
        setVerifyModalOpen(false);
        fetchClaims();
      } else {
        toast.error(res.message || t('common.errorGeneric'));
      }
    } catch (err) {
      toast.error(t('common.errorNetwork'));
    } finally {
      setVerifying(false);
    }
  };

  const filteredClaims = claims.filter(c => {
    const matchesSearch =
      c.farmer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.survey_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === '' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-base-dark)] font-heading tracking-tight">
          {t('ngo.dashboard.title')}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Verify submitted farmer claims in Wardha village
        </p>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row gap-3 justify-between items-center bg-white border border-[var(--color-border-default)] shadow-[var(--shadow-card)] rounded-2xl">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            placeholder={t('ngo.dashboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-paper)] border border-[var(--color-border-default)] rounded-xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-[var(--color-border-default)] rounded-xl px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] focus:outline-none"
          >
            <option value="">All Claims</option>
            <option value="filed">Filed</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified</option>
          </select>
        </div>
      </Card>

      {/* Claims Table */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-16 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">{t('common.loading')}</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <Card className="text-center py-16 border border-[var(--color-border-default)] bg-white rounded-2xl">
          <p className="text-[var(--color-text-secondary)] font-bold font-heading text-lg">{t('common.noResults')}</p>
          <p className="text-[var(--color-text-muted)] text-xs mt-1">{t('common.noResultsHint')}</p>
        </Card>
      ) : (
        <div className="bg-white border border-[var(--color-border-default)] rounded-2xl overflow-hidden shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--color-border-default)]">
              <thead className="bg-[var(--color-surface-alt)]">
                <tr>
                  {['Farmer', 'Survey No', 'Crop', 'Disaster Event', 'Status', 'Action'].map(h => (
                    <th key={h} scope="col" className="px-6 py-4 text-left text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[var(--color-border-default)]/60">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-[var(--color-paper)] transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[var(--color-base-dark)] font-heading">{claim.farmer_name}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">ID: {claim.id.split('-')[0].toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold font-mono text-[var(--color-text-primary)]">
                      {claim.survey_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-secondary)] font-medium">
                      {claim.ai_identified_crop || 'Pending analysis'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="font-semibold capitalize text-[var(--color-base-dark)] block">{claim.claimed_event_type}</span>
                      <span className="block text-[10px] text-[var(--color-text-muted)] mt-0.5">
                        {new Date(claim.claimed_event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge status={claim.status}>
                        {t(`status.${claim.status}`) || claim.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                      {claim.status !== 'verified' && claim.status !== 'approved' && claim.status !== 'payout_completed' ? (
                        <button
                          onClick={() => handleOpenVerify(claim)}
                          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                        >
                          Verify Claim
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                          Verified
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      <Modal
        open={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Submit Verification Evidence"
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setVerifyModalOpen(false)}
              disabled={verifying}
              className="text-sm font-bold text-[var(--color-text-secondary)] border border-[var(--color-border-default)] px-5 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmitVerification}
              disabled={verifying}
              className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {verifying && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
              {t('ngo.verification.submitEvidence')}
            </button>
          </div>
        }
      >
        {selectedClaim && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
            {/* Left: Farmer Submission Reference */}
            <div className="space-y-5 border-b md:border-b-0 md:border-r border-[var(--color-border-default)] pb-6 md:pb-0 md:pr-8">
              <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider font-heading">
                Farmer Submission Reference
              </h3>
              <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border-default)] p-4 rounded-2xl text-xs space-y-2 text-[var(--color-text-secondary)]">
                <p><span className="font-semibold text-[var(--color-base-dark)]">Farmer:</span> {selectedClaim.farmer_name}</p>
                <p><span className="font-semibold text-[var(--color-base-dark)]">Survey:</span> {selectedClaim.survey_number}</p>
                <p><span className="font-semibold text-[var(--color-base-dark)]">Event:</span> <span className="capitalize font-bold text-[var(--color-base-dark)]">{selectedClaim.claimed_event_type}</span></p>
                <p><span className="font-semibold text-[var(--color-base-dark)]">Date:</span> {new Date(selectedClaim.claimed_event_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="space-y-2">
                <span className="text-xs text-[var(--color-text-secondary)] font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[var(--color-turmeric)]" />
                  Farmer's Field Photograph
                </span>
                <div className="border border-[var(--color-border-default)] rounded-2xl overflow-hidden aspect-video bg-[var(--color-surface-alt)] relative group">
                  <img
                    src={selectedClaim.photo_url}
                    alt="Farmer crop damage"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600';
                    }}
                  />
                </div>
                {selectedClaim.photo_latitude && (
                  <p className="text-[10px] text-[var(--color-text-muted)] font-mono tracking-tight bg-[var(--color-surface-alt)] p-2 rounded-xl border border-[var(--color-border-default)] flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-[var(--color-turmeric)]" />
                    {selectedClaim.photo_latitude.toFixed(5)}, {selectedClaim.photo_longitude.toFixed(5)}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Verification Form */}
            <form onSubmit={handleSubmitVerification} className="space-y-5">
              <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider font-heading">
                Verification Inputs
              </h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {t('ngo.verification.verificationType')}
                </label>
                <select
                  name="verification_type"
                  value={verificationForm.verification_type}
                  onChange={handleTextChange}
                  disabled={verifying}
                  className="w-full bg-white border border-[var(--color-border-default)] rounded-xl px-4 py-3 text-base text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                >
                  <option value="field_visit">{t('ngo.verification.fieldVisit')}</option>
                  <option value="documentary_proof">{t('ngo.verification.documentaryProof')}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                  {t('ngo.verification.remarks')}
                </label>
                <textarea
                  name="remarks"
                  placeholder={t('ngo.verification.remarksPlaceholder')}
                  value={verificationForm.remarks}
                  onChange={handleTextChange}
                  disabled={verifying}
                  className="w-full bg-white border border-[var(--color-border-default)] rounded-xl px-4 py-3 text-base text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] min-h-[100px] resize-none"
                />
                {formErrors.remarks && (
                  <p className="text-xs font-medium text-[var(--color-status-rejected)]">{formErrors.remarks}</p>
                )}
              </div>
              <FileUpload
                label={t('ngo.verification.uploadPhoto')}
                hint="Provide photo taken at the site to corroborate the loss"
                onChange={handleFileChange}
                error={formErrors.file}
                disabled={verifying}
              />
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}
