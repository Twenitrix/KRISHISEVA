import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ClaimDetail from '../../components/ClaimDetail';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';

export default function ClaimsList() {
  const toast = useToast();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Review Modal State
  const [reviewModalOpen, setModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [report, setReport] = useState(null);
  const [ngoVerification, setNgoVerification] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Review Form State
  const [decision, setDecision] = useState('approved');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.claims.list();
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

  const handleOpenReview = async (claim) => {
    setSelectedClaim(claim);
    setReport(null);
    setNgoVerification(null);
    setStatusLogs([]);
    setDecision('approved');
    setApprovedAmount(claim.suggested_payout_amount || '');
    setRemarks('');
    setFormErrors({});
    setModalOpen(true);
    setLoadingReport(true);

    try {
      const [reportRes, ngoRes, logsRes] = await Promise.all([
        api.claims.getReport(claim.id),
        api.referenceData.getNgoVerificationForClaim(claim.id),
        api.claims.getStatusLog(claim.id)
      ]);

      if (reportRes.success) {
        setReport(reportRes.data);
        setApprovedAmount(reportRes.data.payout.suggested_payout_amount || '');
      }
      if (ngoRes.success) {
        setNgoVerification(ngoRes.data);
      }
      if (logsRes.success) {
        setStatusLogs(logsRes.data);
      }
    } catch (err) {
      console.error('Error fetching claim report details', err);
      toast.error('Failed to load claim report');
    } finally {
      setLoadingReport(false);
    }
  };

  const handleTriggerPayout = async (claimId) => {
    try {
      const res = await api.claims.triggerPayout(claimId);
      if (res.success) {
        toast.success('Payout transferred successfully!');
        fetchClaims();
      } else {
        toast.error(res.message || t('common.errorGeneric'));
      }
    } catch (err) {
      toast.error(t('common.errorNetwork'));
      console.error(err);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormErrors({});

    const errors = {};
    if (decision === 'approved') {
      const amt = parseFloat(approvedAmount);
      if (isNaN(amt) || amt < 0) {
        errors.approvedAmount = 'Please enter a valid payout amount';
      }
    }
    if (!remarks.trim() && decision === 'denied') {
      errors.remarks = 'Remarks are required when denying a claim';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await api.claims.review(selectedClaim.id, {
        decision,
        approved_amount: decision === 'approved' ? parseFloat(approvedAmount) : 0,
        remarks
      });

      if (res.success) {
        toast.success(decision === 'approved' ? t('toast.claimApproved') : t('toast.claimDenied'));
        setModalOpen(false);
        fetchClaims();
      } else {
        toast.error(res.message || t('common.errorGeneric'));
      }
    } catch (err) {
      toast.error(t('common.errorNetwork'));
      console.error(err);
    } finally {
      setSubmittingReview(false);
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
        <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-heading tracking-tight">
          {t('official.claims.title')}
        </h1>
        <p className="text-sm text-text-secondary mt-1">Verify and disburse pending insurance claims for your village</p>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-border-default shadow-sm rounded-2xl">
        <div className="w-full md:max-w-sm">
          <Input
            placeholder="Search by farmer, survey, or ID"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-border-default rounded-xl px-4 py-2.5 text-sm font-semibold text-text-secondary focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none shadow-sm"
          >
            <option value="">All Statuses</option>
            <option value="filed">Filed</option>
            <option value="under_review">Under Review</option>
            <option value="verified">Verified by NGO</option>
            <option value="approved">Approved</option>
            <option value="payout_completed">Paid</option>
            <option value="denied">Denied</option>
          </select>
        </div>
      </Card>

      {/* Claims List Table */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-16 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="text-sm text-text-secondary">{t('common.loading')}</p>
        </div>
      ) : filteredClaims.length === 0 ? (
        <Card className="text-center py-16 border border-border-default bg-white rounded-2xl">
          <p className="text-text-secondary font-bold font-heading text-lg">{t('common.noResults')}</p>
          <p className="text-text-muted text-xs mt-1">{t('common.noResultsHint')}</p>
        </Card>
      ) : (
        <div className="bg-white border border-border-default rounded-2xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border-default">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Farmer</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Survey No</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Disaster / Crop</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">AI Score</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Suggested Payout</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border-default/60">
                {filteredClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-text-primary font-heading">{claim.farmer_name}</div>
                      <div className="text-[10px] text-text-muted font-mono tracking-wider mt-0.5">ID: {claim.id.split('-')[0].toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-semibold font-mono">
                      {claim.survey_number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary">
                      <span className="capitalize font-semibold text-text-primary block">{claim.claimed_event_type}</span>
                      <span className="block text-xs text-text-muted mt-0.5 font-medium">
                        {claim.ai_identified_crop || 'Pending analysis'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {claim.overall_score !== undefined ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                          claim.overall_score >= 80 ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/50' :
                          claim.overall_score >= 50 ? 'text-amber-700 bg-amber-50 border border-amber-200/50' :
                          'text-rose-700 bg-rose-50 border border-rose-200/50'
                        }`}>
                          {claim.overall_score}%
                        </span>
                      ) : (
                        <span className="text-text-muted text-xs font-medium">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-bold">
                      {claim.suggested_payout_amount ? (
                        <span>₹{claim.suggested_payout_amount.toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-text-muted text-xs font-medium">AI review pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge status={claim.status}>
                        {t(`status.${claim.status}`) || claim.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                      <div className="flex justify-end gap-2">
                        {claim.status === 'verified' ? (
                          <Button variant="primary" size="sm" onClick={() => handleOpenReview(claim)}>
                            Review Claim
                          </Button>
                        ) : claim.status === 'approved' ? (
                          <Button variant="primary" size="sm" onClick={() => handleTriggerPayout(claim.id)} className="pulse-glow">
                            Trigger Payout
                          </Button>
                        ) : claim.status === 'payout_completed' ? (
                          <span className="text-xs text-emerald-700 font-bold bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full inline-flex items-center gap-1 shadow-sm">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Disbursed
                          </span>
                        ) : (
                          <Button variant="secondary" size="sm" onClick={() => handleOpenReview(claim)}>
                            View Report
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review & Details Modal */}
      <Modal
        open={reviewModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedClaim?.status === 'verified' ? t('official.review.title') : 'Claim Detailed Report'}
        size="lg"
        footer={
          selectedClaim?.status === 'verified' ? (
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submittingReview}>
                {t('common.cancel')}
              </Button>
              <Button
                variant={decision === 'approved' ? 'primary' : 'danger'}
                onClick={handleSubmitReview}
                loading={submittingReview}
              >
                {decision === 'approved' ? 'Approve & Save' : 'Deny Claim'}
              </Button>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.close')}
            </Button>
          )
        }
      >
        {loadingReport ? (
          <div className="flex flex-col justify-center items-center py-12 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            <p className="text-sm text-text-secondary">{t('common.loading')}</p>
          </div>
        ) : report ? (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
            <ClaimDetail
              claim={selectedClaim}
              report={report}
              ngoVerification={ngoVerification}
              statusLogs={statusLogs}
              viewerRole="official"
              loading={loadingReport}
            />

            {/* Review Decision Form */}
            {selectedClaim.status === 'verified' && (
              <form onSubmit={handleSubmitReview} className="border-t border-border-default pt-6 space-y-5 max-w-xl mx-auto">
                <h3 className="text-sm font-bold text-text-primary font-heading">Official Review & Final Decision</h3>
                
                {/* Radio Group */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm font-bold text-text-primary cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approved"
                      checked={decision === 'approved'}
                      onChange={() => {
                        setDecision('approved');
                        setApprovedAmount(report.payout.suggested_payout_amount);
                      }}
                      className="accent-accent w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                    />
                    Approve Claim
                  </label>
                  <label className="flex items-center gap-2 text-sm font-bold text-text-primary cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="denied"
                      checked={decision === 'denied'}
                      onChange={() => setDecision('denied')}
                      className="accent-accent w-4 h-4 text-rose-600 focus:ring-rose-500"
                    />
                    Reject Claim
                  </label>
                </div>

                {/* Approved Amount */}
                {decision === 'approved' && (
                  <div className="flex flex-col gap-1.5 animate-slide-in">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">{t('official.review.approvedAmount')}</label>
                    <Input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      className="w-full font-bold text-lg text-emerald-700 bg-slate-50"
                      error={formErrors.approvedAmount}
                    />
                  </div>
                )}

                {/* Remarks */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Remarks {decision === 'denied' && <span className="text-status-rejected">*</span>}
                  </label>
                  <textarea
                    placeholder="Add review audit notes..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-white border border-border-default rounded-xl px-4 py-3 text-base text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm min-h-[100px] resize-none"
                  />
                  {formErrors.remarks && (
                    <p className="text-xs font-medium text-status-rejected mt-0.5" role="alert">{formErrors.remarks}</p>
                  )}
                </div>
              </form>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Failed to load report data.</p>
        )}
      </Modal>
    </div>
  );
}
