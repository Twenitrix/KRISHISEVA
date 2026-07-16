import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ClaimDetail from '../../components/ClaimDetail';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { Search, Filter, CheckCircle2, BanknoteIcon, Eye } from 'lucide-react';

// AI Confidence Gauge (SVG radial)
function AIConfidenceGauge({ score }) {
  const pct = Math.min(Math.max(score ?? 0, 0), 100);
  const radius = 40;
  const stroke = 8;
  const norm = radius - stroke / 2;
  const circ = 2 * Math.PI * norm;
  const arc = circ * 0.75; // 3/4 arc
  const filled = (pct / 100) * arc;

  const color = pct >= 75 ? '#1F8A5C' : pct >= 45 ? '#D98E2A' : '#C0392B';
  const bgArc = `M ${40 + norm * Math.cos(Math.PI * 0.75)} ${40 + norm * Math.sin(Math.PI * 0.75)}`;

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-[135deg]">
          {/* Background arc */}
          <circle
            cx="40" cy="40" r={norm}
            fill="none"
            stroke="#E5D9C8"
            strokeWidth={stroke}
            strokeDasharray={`${arc} ${circ - arc}`}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <circle
            cx="40" cy="40" r={norm}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${filled} ${circ - filled}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold font-heading" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <span className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">AI Confidence</span>
    </div>
  );
}

export default function ClaimsList() {
  const toast = useToast();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [reviewModalOpen, setModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [report, setReport] = useState(null);
  const [ngoVerification, setNgoVerification] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [loadingReport, setLoadingReport] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [decision, setDecision] = useState('approved');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.claims.list();
      if (res.success) setClaims(res.data.items);
      else toast.error(res.message || t('common.errorGeneric'));
    } catch (err) {
      toast.error(t('common.errorNetwork'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

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
        api.claims.getStatusLog(claim.id),
      ]);
      if (reportRes.success) {
        setReport(reportRes.data);
        setApprovedAmount(reportRes.data.payout.suggested_payout_amount || '');
      }
      if (ngoRes.success) setNgoVerification(ngoRes.data);
      if (logsRes.success) setStatusLogs(logsRes.data);
    } catch (err) {
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
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setFormErrors({});
    const errors = {};
    if (decision === 'approved') {
      const amt = parseFloat(approvedAmount);
      if (isNaN(amt) || amt < 0) errors.approvedAmount = 'Enter a valid amount';
    }
    if (!remarks.trim() && decision === 'denied') errors.remarks = 'Remarks required when denying';
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

    setSubmittingReview(true);
    try {
      const res = await api.claims.review(selectedClaim.id, {
        decision,
        approved_amount: decision === 'approved' ? parseFloat(approvedAmount) : 0,
        remarks,
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
    } finally {
      setSubmittingReview(false);
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
          {t('official.claims.title')}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Verify and disburse pending insurance claims</p>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 flex flex-col md:flex-row gap-3 justify-between items-center bg-white border border-[var(--color-border-default)] shadow-[var(--shadow-card)] rounded-2xl">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            placeholder="Search by farmer, survey, or ID"
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

      {/* Table */}
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
                  {['Farmer', 'Survey No', 'Event / Crop', 'AI Score', 'Suggested Payout', 'Status', 'Action'].map(h => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="capitalize font-semibold text-[var(--color-base-dark)] block">{claim.claimed_event_type}</span>
                      <span className="block text-xs text-[var(--color-text-muted)] mt-0.5">{claim.ai_identified_crop || 'Pending'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {claim.overall_score !== undefined ? (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${
                          claim.overall_score >= 75
                            ? 'text-[var(--color-accent)] bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20'
                            : claim.overall_score >= 45
                            ? 'text-[var(--color-turmeric)] bg-[var(--color-turmeric-light)] border border-[var(--color-turmeric-border)]'
                            : 'text-[var(--color-status-rejected)] bg-[var(--color-status-rejected-bg)] border border-[var(--color-status-rejected)]/20'
                        }`}>
                          {claim.overall_score}%
                        </span>
                      ) : (
                        <span className="text-[var(--color-text-muted)] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-base-dark)]">
                      {claim.suggested_payout_amount
                        ? <span>₹{claim.suggested_payout_amount.toLocaleString('en-IN')}</span>
                        : <span className="text-[var(--color-text-muted)] text-xs font-medium">AI review pending</span>
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge status={claim.status}>
                        {t(`status.${claim.status}`) || claim.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                      {claim.status === 'verified' ? (
                        <button
                          onClick={() => handleOpenReview(claim)}
                          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                        >
                          Review Claim
                        </button>
                      ) : claim.status === 'approved' ? (
                        <button
                          onClick={() => handleTriggerPayout(claim.id)}
                          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm pulse-glow flex items-center gap-1.5"
                        >
                          <BanknoteIcon className="w-3.5 h-3.5" />
                          Trigger Payout
                        </button>
                      ) : claim.status === 'payout_completed' ? (
                        <span className="text-xs font-bold text-[var(--color-accent)] bg-[var(--color-accent-light)] border border-[var(--color-accent)]/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                          Disbursed
                        </span>
                      ) : (
                        <button
                          onClick={() => handleOpenReview(claim)}
                          className="text-xs font-bold text-[var(--color-text-secondary)] border border-[var(--color-border-default)] px-4 py-2 rounded-xl hover:bg-[var(--color-surface-alt)] transition-all flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Report
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal
        open={reviewModalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedClaim?.status === 'verified' ? t('official.review.title') : 'Claim Detailed Report'}
        size="lg"
        footer={
          selectedClaim?.status === 'verified' ? (
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                disabled={submittingReview}
                className="text-sm font-bold text-[var(--color-text-secondary)] border border-[var(--color-border-default)] px-5 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmitReview}
                disabled={submittingReview}
                className={`text-sm font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-60 ${
                  decision === 'approved'
                    ? 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white'
                    : 'bg-[var(--color-status-rejected)] hover:bg-[var(--color-status-rejected)]/90 text-white'
                }`}
              >
                {submittingReview && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                {decision === 'approved' ? 'Approve & Save' : 'Deny Claim'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModalOpen(false)}
              className="text-sm font-bold text-[var(--color-text-secondary)] border border-[var(--color-border-default)] px-5 py-2.5 rounded-xl hover:bg-[var(--color-surface-alt)] transition-colors"
            >
              {t('common.close')}
            </button>
          )
        }
      >
        {loadingReport ? (
          <div className="flex flex-col justify-center items-center py-12 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
            <p className="text-sm text-[var(--color-text-secondary)]">{t('common.loading')}</p>
          </div>
        ) : report ? (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
            {/* AI Confidence Gauge — prominent, above the detail view */}
            {report?.overall_score !== undefined && (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-[var(--color-surface-alt)] border border-[var(--color-border-default)] rounded-2xl">
                <AIConfidenceGauge score={report.overall_score} />
                <div className="flex-1 space-y-2">
                  <h3 className="font-bold text-[var(--color-base-dark)] font-heading text-base">
                    AI Damage Assessment
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {report.summary || 'AI cross-checked field photo against satellite data and land records.'}
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    {report.overall_score >= 75 && (
                      <span className="px-2.5 py-1 bg-[var(--color-accent-light)] text-[var(--color-accent)] rounded-full border border-[var(--color-accent)]/20">
                        High Confidence — Recommend Approval
                      </span>
                    )}
                    {report.overall_score >= 45 && report.overall_score < 75 && (
                      <span className="px-2.5 py-1 bg-[var(--color-turmeric-light)] text-[var(--color-turmeric)] rounded-full border border-[var(--color-turmeric-border)]">
                        Moderate Confidence — Review Evidence
                      </span>
                    )}
                    {report.overall_score < 45 && (
                      <span className="px-2.5 py-1 bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected)] rounded-full border border-[var(--color-status-rejected)]/20">
                        Low Confidence — Manual Review Required
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

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
              <form onSubmit={handleSubmitReview} className="border-t border-[var(--color-border-default)] pt-6 space-y-5 max-w-xl mx-auto">
                <h3 className="text-sm font-bold text-[var(--color-base-dark)] font-heading">Official Review & Final Decision</h3>

                {/* Decision Toggle */}
                <div className="flex gap-4">
                  {[
                    { value: 'approved', label: 'Approve Claim', color: 'var(--color-accent)' },
                    { value: 'denied', label: 'Reject Claim', color: 'var(--color-status-rejected)' },
                  ].map(opt => (
                    <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                      <div
                        onClick={() => {
                          setDecision(opt.value);
                          if (opt.value === 'approved' && report) setApprovedAmount(report.payout.suggested_payout_amount);
                        }}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          decision === opt.value ? 'border-transparent' : 'border-[var(--color-border-default)]'
                        }`}
                        style={decision === opt.value ? { backgroundColor: `var(--color-${opt.value === 'approved' ? 'accent' : 'status-rejected'})` } : {}}
                      >
                        {decision === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-bold text-[var(--color-base-dark)] group-hover:text-[var(--color-text-primary)]">{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Amount */}
                {decision === 'approved' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">{t('official.review.approvedAmount')}</label>
                    <input
                      type="number"
                      value={approvedAmount}
                      onChange={(e) => setApprovedAmount(e.target.value)}
                      className="w-full bg-white border border-[var(--color-border-default)] rounded-xl px-4 py-3 text-lg font-bold text-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
                    />
                    {formErrors.approvedAmount && <p className="text-xs text-[var(--color-status-rejected)]">{formErrors.approvedAmount}</p>}
                  </div>
                )}

                {/* Remarks */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
                    Remarks {decision === 'denied' && <span className="text-[var(--color-status-rejected)]">*</span>}
                  </label>
                  <textarea
                    placeholder="Add review audit notes..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-white border border-[var(--color-border-default)] rounded-xl px-4 py-3 text-base text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] min-h-[90px] resize-none"
                  />
                  {formErrors.remarks && <p className="text-xs text-[var(--color-status-rejected)]">{formErrors.remarks}</p>}
                </div>
              </form>
            )}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)]">Failed to load report data.</p>
        )}
      </Modal>
    </div>
  );
}
