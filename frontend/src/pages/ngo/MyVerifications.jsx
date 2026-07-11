import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import ClaimDetail from '../../components/ClaimDetail';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';

export default function MyVerifications() {
  const toast = useToast();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Detail States
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);
  const [ngoVerification, setNgoVerification] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    const fetchVerifications = async () => {
      try {
        setLoading(true);
        const res = await api.ngo.verifications.list();
        if (res.success) {
          setVerifications(res.data.items);
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
    fetchVerifications();
  }, []);

  const handleRowClick = async (v) => {
    setModalOpen(true);
    setLoadingLogs(true);
    setSelectedClaim(null);
    setReportDetails(null);
    setNgoVerification(null);
    setStatusLogs([]);

    try {
      const [claimRes, reportRes, ngoRes, logsRes] = await Promise.all([
        api.claims.get(v.claim_id),
        api.claims.getReport(v.claim_id),
        api.referenceData.getNgoVerificationForClaim(v.claim_id),
        api.claims.getStatusLog(v.claim_id),
      ]);

      if (claimRes.success) setSelectedClaim(claimRes.data);
      if (reportRes.success) setReportDetails(reportRes.data);
      if (ngoRes.success) setNgoVerification(ngoRes.data);
      if (logsRes.success) setStatusLogs(logsRes.data);
    } catch (err) {
      console.error('Error fetching verification details', err);
      toast.error('Failed to load verification report');
    } finally {
      setLoadingLogs(false);
    }
  };

  const filtered = verifications.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      v.farmer_name?.toLowerCase().includes(q) ||
      v.remarks?.toLowerCase().includes(q) ||
      v.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary font-heading tracking-tight">
            {t('ngo.myVerifications.title')}
          </h1>
          <p className="text-sm text-text-secondary mt-1">Records of all field verifications you have submitted</p>
        </div>
      </div>

      {/* Search */}
      {verifications.length > 0 && (
        <Card className="p-4 bg-white border border-border-default shadow-sm rounded-2xl">
          <div className="w-full md:max-w-sm">
            <Input
              placeholder="Search by farmer name or remarks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-16 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          <p className="text-sm text-text-secondary">{t('common.loading')}</p>
        </div>
      ) : verifications.length === 0 ? (
        <Card className="text-center py-16 border border-border-default bg-white rounded-2xl">
          <div className="bg-slate-50 text-text-muted p-3 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 mx-auto mb-4 border border-slate-200">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-text-secondary font-bold font-heading text-lg">{t('ngo.myVerifications.empty')}</p>
          <p className="text-text-muted text-xs mt-1">Verify claims from the Dashboard to see them here.</p>
        </Card>
      ) : filtered.length === 0 ? (
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
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Remarks</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-text-secondary uppercase tracking-wider">Claim Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-text-secondary uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-border-default/60">
                {filtered.map((v) => (
                  <tr 
                    key={v.id} 
                    className="hover:bg-slate-50/50 transition-all duration-200 cursor-pointer"
                    onClick={() => handleRowClick(v)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-text-primary font-heading">{v.farmer_name}</div>
                      <div className="text-[10px] text-text-muted font-mono tracking-wider mt-0.5">ID: {v.id.split('-').slice(0, 2).join('-').toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-primary font-semibold capitalize">
                      {v.verification_type === 'field_visit' ? t('ngo.verification.fieldVisit') : t('ngo.verification.documentaryProof')}
                    </td>
                    <td className="px-6 py-4 text-sm text-text-secondary max-w-[250px]">
                      <p className="truncate font-medium" title={v.remarks}>{v.remarks || '—'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge status={v.claim_status}>
                        {t(`status.${v.claim_status}`) || v.claim_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-text-muted font-mono font-semibold">
                      {new Date(v.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claim Detail Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Verification Report Details"
        size="lg"
      >
        {selectedClaim && (
          <div className="max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
            <ClaimDetail
              claim={selectedClaim}
              report={reportDetails}
              ngoVerification={ngoVerification}
              statusLogs={statusLogs}
              viewerRole="ngo"
              onClose={() => setModalOpen(false)}
              loading={loadingLogs}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
