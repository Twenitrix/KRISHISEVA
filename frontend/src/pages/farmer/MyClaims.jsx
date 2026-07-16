import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ClaimDetail from '../../components/ClaimDetail';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import {
  FileText, PlusCircle, CheckCircle2, Clock, Cpu, ShieldCheck, Banknote, ChevronRight
} from 'lucide-react';

// Claim status stepper steps in order
const CLAIM_STEPS = [
  { key: 'filed',           label: 'Submitted',        icon: FileText },
  { key: 'under_review',    label: 'NGO Review',       icon: ShieldCheck },
  { key: 'verified',        label: 'AI Scored',        icon: Cpu },
  { key: 'approved',        label: 'Officer Approved', icon: CheckCircle2 },
  { key: 'payout_completed',label: 'Paid Out',         icon: Banknote },
];

const STATUS_ORDER = ['filed', 'under_review', 'verified', 'approved', 'payout_completed'];

function ClaimStepper({ status }) {
  const denied = status === 'denied';
  const currentIdx = STATUS_ORDER.indexOf(status);

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto py-1">
      {CLAIM_STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = !denied && currentIdx > idx;
        const isActive = !denied && currentIdx === idx;
        const isFuture = denied ? true : currentIdx < idx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                denied ? 'border-[var(--color-status-rejected-bg)] bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected)]' :
                isDone ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' :
                isActive ? 'border-[var(--color-turmeric)] bg-[var(--color-turmeric-light)] text-[var(--color-turmeric)]' :
                'border-[var(--color-border-default)] bg-white text-[var(--color-text-muted)]'
              }`}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </div>
              <span className={`text-[9px] font-bold mt-1 whitespace-nowrap ${
                isDone ? 'text-[var(--color-accent)]' :
                isActive ? 'text-[var(--color-turmeric)]' :
                'text-[var(--color-text-muted)]'
              }`}>{step.label}</span>
            </div>
            {idx < CLAIM_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 min-w-[12px] mb-4 ${
                !denied && currentIdx > idx ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-default)]'
              }`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default function MyClaims() {
  const navigate = useNavigate();
  const toast = useToast();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [reportDetails, setReportDetails] = useState(null);
  const [ngoVerification, setNgoVerification] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleClaimClick = async (claim) => {
    setSelectedClaim(claim);
    setReportDetails(null);
    setNgoVerification(null);
    setStatusLogs([]);
    setModalOpen(true);
    setLoadingLogs(true);
    try {
      const [logsRes, reportRes, ngoRes] = await Promise.all([
        api.claims.getStatusLog(claim.id),
        api.claims.getReport(claim.id),
        api.referenceData.getNgoVerificationForClaim(claim.id),
      ]);
      if (logsRes.success) setStatusLogs(logsRes.data);
      if (reportRes.success) setReportDetails(reportRes.data);
      if (ngoRes.success) setNgoVerification(ngoRes.data);
    } catch (err) {
      console.error('Failed to fetch claim details', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-base-dark)] font-heading">{t('farmer.claims.title')}</h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">Track the progress of your submitted claims</p>
        </div>
        <Button
          size="md"
          onClick={() => navigate('/farmer/new-claim')}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-xl px-5 py-2.5 flex items-center gap-2 shadow-[var(--shadow-card)] transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          {t('farmer.claims.fileNew')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
        </div>
      ) : claims.length === 0 ? (
        <Card className="text-center py-16 bg-white border border-[var(--color-border-default)] rounded-2xl shadow-[var(--shadow-card)]">
          <div className="w-14 h-14 bg-[var(--color-surface-alt)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-[var(--color-text-muted)]" strokeWidth={1.5} />
          </div>
          <p className="text-[var(--color-text-secondary)] font-medium">{t('farmer.claims.empty')}</p>
          <p className="text-[var(--color-text-muted)] text-sm mt-1 mb-6">{t('farmer.claims.emptyHint')}</p>
          <Button
            variant="primary"
            onClick={() => navigate('/farmer/new-claim')}
            className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold rounded-xl px-6 py-2.5 mx-auto"
          >
            {t('farmer.claims.fileNew')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {claims.map((claim) => (
            <Card
              key={claim.id}
              className="cursor-pointer hover:border-[var(--color-accent)] hover:shadow-[var(--shadow-premium)] transition-all bg-white border border-[var(--color-border-default)] rounded-2xl overflow-hidden"
              onClick={() => handleClaimClick(claim)}
            >
              {/* Turmeric accent bar for pending/under_review */}
              <div className={`h-1 w-full ${
                claim.status === 'payout_completed' ? 'bg-[var(--color-accent)]' :
                claim.status === 'denied' ? 'bg-[var(--color-status-rejected)]' :
                'bg-[var(--color-turmeric)]'
              }`} />

              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="capitalize font-bold text-[var(--color-base-dark)] text-base font-heading">
                      {t(`eventTypes.${claim.claimed_event_type.toLowerCase()}`) || claim.claimed_event_type}
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 font-mono">
                      Survey: {claim.survey_number}
                    </p>
                  </div>
                  <Badge status={claim.status}>
                    {t(`status.${claim.status}`) || claim.status}
                  </Badge>
                </div>

                {/* Mini Stepper */}
                <ClaimStepper status={claim.status} />

                <div className="border-t border-[var(--color-border-default)] mt-4 pt-3 flex justify-between items-center">
                  <span className="text-[10px] text-[var(--color-text-muted)] font-mono uppercase">
                    {new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <div className="flex items-center gap-1">
                    {claim.status === 'payout_completed' && claim.official_approved_amount ? (
                      <span className="text-sm font-bold text-[var(--color-accent)]">
                        ₹{claim.official_approved_amount.toLocaleString('en-IN')}
                      </span>
                    ) : claim.suggested_payout_amount ? (
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        ₹{claim.suggested_payout_amount.toLocaleString('en-IN')}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-turmeric)] bg-[var(--color-turmeric-light)] px-2 py-0.5 rounded-full font-bold border border-[var(--color-turmeric-border)]">
                        AI Pending
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)]" />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Claim Detail Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Claim Details — #${selectedClaim?.id.split('-')[0].toUpperCase()}`}
        size="lg"
      >
        {selectedClaim && (
          <ClaimDetail
            claim={selectedClaim}
            report={reportDetails}
            ngoVerification={ngoVerification}
            statusLogs={statusLogs}
            viewerRole="farmer"
            onClose={() => setModalOpen(false)}
            loading={loadingLogs}
          />
        )}
      </Modal>
    </div>
  );
}
