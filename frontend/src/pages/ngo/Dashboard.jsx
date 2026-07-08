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

export default function Dashboard() {
  const toast = useToast();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Verification Modal State
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    verification_type: 'field_visit',
    remarks: '',
    file: null
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchClaims = async () => {
    try {
      setLoading(true);
      // For demo, we use the default village ID 'v1-uuid-wardha'
      const villageId = 'v1-uuid-wardha';
      const res = await api.ngo.dashboard(villageId);
      if (res.success) {
        setClaims(res.data.items);
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

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleOpenVerify = (claim) => {
    setSelectedClaim(claim);
    setVerificationForm({
      verification_type: 'field_visit',
      remarks: '',
      file: null
    });
    setFormErrors({});
    setVerifyModalOpen(true);
  };

  const handleFileChange = (file) => {
    setVerificationForm(prev => ({ ...prev, file }));
  };

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
      errors.file = 'Photo evidence is required for field visits';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setVerifying(true);
    try {
      const submitData = new FormData();
      submitData.append('claim_id', selectedClaim.id);
      submitData.append('farmer_id', selectedClaim.farmer_id);
      submitData.append('verification_type', verificationForm.verification_type);
      submitData.append('remarks', verificationForm.remarks);
      if (verificationForm.file) {
        submitData.append('file', verificationForm.file);
      }

      const res = await api.ngo.verifications.submit(submitData);
      if (res.success) {
        toast.success(t('toast.evidenceSubmitted'));
        setVerifyModalOpen(false);
        fetchClaims(); // reload dashboard list
      } else {
        toast.error(res.message || t('common.errorGeneric'));
      }
    } catch (err) {
      toast.error(t('common.errorNetwork'));
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  // Search & Filter Logic
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
      <div>
        <h1 className="text-2xl font-bold text-text-primary">{t('ngo.dashboard.title')}</h1>
        <p className="text-sm text-text-secondary">Verify submitted farmer claims in Wardha village</p>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between items-center bg-surface">
        <div className="w-full sm:max-w-xs">
          <Input
            placeholder={t('ngo.dashboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-surface border border-border-default rounded-md px-3 py-2 text-sm focus:border-focus focus:outline-none"
          >
            <option value="">All Claims</option>
            <option value="filed">Filed</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified</option>
          </select>
        </div>
      </Card>

      {/* Claims List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-text-secondary">{t('common.loading')}</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-secondary font-medium">{t('common.noResults')}</p>
          <p className="text-text-muted text-sm mt-1">{t('common.noResultsHint')}</p>
        </Card>
      ) : (
        <div className="bg-surface border border-border-default rounded-lg overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-default">
              <thead className="bg-surface-alt">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Farmer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Survey No</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Crop Details</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Disaster Event</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border-default">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-surface-alt/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-text-primary">{claim.farmer_name}</div>
                      <div className="text-xs text-text-muted font-mono">{claim.id.split('-')[0]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-mono">
                      {claim.survey_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      {claim.ai_identified_crop || 'Pending analysis'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary capitalize">
                      {claim.claimed_event_type}
                      <span className="block text-xs text-text-muted">
                        {new Date(claim.claimed_event_date).toLocaleDateString('en-IN')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge status={claim.status}>
                        {t(`status.${claim.status}`) || claim.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {claim.status !== 'verified' && claim.status !== 'approved' && claim.status !== 'payout_completed' ? (
                        <Button variant="primary" size="sm" onClick={() => handleOpenVerify(claim)}>
                          Verify Claim
                        </Button>
                      ) : (
                        <span className="text-xs text-status-verified font-medium flex items-center justify-end gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
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

      {/* Verification Dialog */}
      <Modal
        open={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Submit Verification Evidence"
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setVerifyModalOpen(false)} disabled={verifying}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmitVerification} loading={verifying}>
              {t('ngo.verification.submitEvidence')}
            </Button>
          </div>
        }
      >
        {selectedClaim && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: Farmer Submission Reference */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Farmer Submission Reference</h3>
              
              <div className="bg-surface-alt p-3.5 rounded-lg text-sm space-y-1.5 text-text-secondary">
                <p><span className="font-semibold text-text-primary">Farmer Name:</span> {selectedClaim.farmer_name}</p>
                <p><span className="font-semibold text-text-primary">Survey Number:</span> {selectedClaim.survey_number}</p>
                <p><span className="font-semibold text-text-primary">Loss Event:</span> <span className="capitalize">{selectedClaim.claimed_event_type}</span></p>
                <p><span className="font-semibold text-text-primary">Reported Date:</span> {new Date(selectedClaim.claimed_event_date).toLocaleDateString('en-IN')}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-text-secondary font-medium">Farmer's field photograph:</span>
                <div className="border border-border-default rounded overflow-hidden aspect-video bg-surface-alt">
                  <img 
                    src={selectedClaim.photo_url} 
                    alt="Farmer crop damage" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600';
                    }}
                  />
                </div>
                {selectedClaim.photo_latitude && (
                  <p className="text-[10px] text-text-muted font-mono">
                    Geotags: {selectedClaim.photo_latitude.toFixed(5)}, {selectedClaim.photo_longitude.toFixed(5)}
                  </p>
                )}
              </div>
            </div>

            {/* Right side: NGO Verification Form */}
            <form onSubmit={handleSubmitVerification} className="space-y-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">Verification Inputs</h3>

              {/* Verification Type */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">{t('ngo.verification.verificationType')}</label>
                <select
                  name="verification_type"
                  value={verificationForm.verification_type}
                  onChange={handleTextChange}
                  disabled={verifying}
                  className="w-full bg-surface border border-border-default rounded-md px-3 py-2 text-sm focus:border-focus focus:outline-none"
                >
                  <option value="field_visit">{t('ngo.verification.fieldVisit')}</option>
                  <option value="documentary_proof">{t('ngo.verification.documentaryProof')}</option>
                </select>
              </div>

              {/* Remarks */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-text-primary">{t('ngo.verification.remarks')}</label>
                <textarea
                  name="remarks"
                  placeholder={t('ngo.verification.remarksPlaceholder')}
                  value={verificationForm.remarks}
                  onChange={handleTextChange}
                  disabled={verifying}
                  className="w-full bg-surface border border-border-default rounded-md px-3 py-2 text-sm min-h-[90px] focus:border-focus focus:outline-none resize-none"
                />
                {formErrors.remarks && (
                  <p className="text-xs text-status-rejected" role="alert">{formErrors.remarks}</p>
                )}
              </div>

              {/* Photo Upload */}
              <FileUpload
                label={t('ngo.verification.uploadPhoto')}
                hint="Provide actual crop photo taken at the site to corroborate the loss"
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
