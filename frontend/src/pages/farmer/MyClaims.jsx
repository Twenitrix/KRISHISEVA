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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

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
      
      if (logsRes.success) {
        setStatusLogs(logsRes.data);
      }
      if (reportRes.success) {
        setReportDetails(reportRes.data);
      }
      if (ngoRes.success) {
        setNgoVerification(ngoRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch claim status details', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{t('farmer.claims.title')}</h1>
          <p className="text-sm text-text-secondary">Track the progress of your submitted claims</p>
        </div>
        <Button size="md" onClick={() => navigate('/farmer/new-claim')}>
          {t('farmer.claims.fileNew')}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <p className="text-text-secondary">{t('common.loading')}</p>
        </div>
      ) : claims.length === 0 ? (
        <Card className="text-center py-16">
          <svg className="w-12 h-12 text-text-muted mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
          </svg>
          <p className="text-text-secondary font-medium">{t('farmer.claims.empty')}</p>
          <p className="text-text-muted text-sm mt-1 mb-6">{t('farmer.claims.emptyHint')}</p>
          <Button variant="primary" size="md" onClick={() => navigate('/farmer/new-claim')}>
            {t('farmer.claims.fileNew')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {claims.map((claim) => (
            <Card
              key={claim.id}
              className="cursor-pointer hover:border-accent hover:shadow-card transition-all flex flex-col justify-between"
              onClick={() => handleClaimClick(claim)}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="capitalize font-semibold text-text-primary text-base">
                    {t(`eventTypes.${claim.claimed_event_type.toLowerCase()}`) || claim.claimed_event_type}
                  </div>
                  <Badge status={claim.status}>
                    {t(`status.${claim.status}`) || claim.status}
                  </Badge>
                </div>
                
                <p className="text-sm text-text-secondary mb-1">
                  <span className="font-medium">Survey Number:</span> {claim.survey_number}
                </p>
                <p className="text-xs text-text-muted">
                  Filed: {new Date(claim.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="border-t border-border-default mt-4 pt-3 flex justify-between items-center">
                <span className="text-xs text-text-muted font-mono uppercase truncate max-w-[120px]">
                  ID: {claim.id.split('-')[0]}
                </span>
                
                {claim.official_approved_amount !== undefined && claim.official_approved_amount !== null && claim.status === 'payout_completed' ? (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-status-verified">₹{claim.official_approved_amount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-text-muted font-medium">Disbursed</p>
                  </div>
                ) : claim.suggested_payout_amount ? (
                  <div className="text-right">
                    <p className="text-sm font-medium text-text-primary">₹{claim.suggested_payout_amount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-text-muted">Suggested Payout</p>
                  </div>
                ) : (
                  <span className="text-xs text-accent bg-accent-light px-2 py-0.5 rounded-full font-medium">
                    AI Review Pending
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Claim Detail Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Claim Details - #${selectedClaim?.id.split('-')[0].toUpperCase()}`}
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
