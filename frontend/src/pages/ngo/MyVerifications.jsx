import React, { useState, useEffect } from 'react';
import { t } from '../../i18n';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ClaimDetail from '../../components/ClaimDetail';
import { api } from '../../api';
import { useToast } from '../../components/ui/Toast';
import { Search, CheckCircle2 } from 'lucide-react';

export default function MyVerifications() {
  const toast = useToast();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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
        if (res.success) setVerifications(res.data.items);
        else toast.error(res.message || t('common.errorGeneric'));
      } catch (err) {
        toast.error(t('common.errorNetwork'));
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
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-base-dark)] font-heading tracking-tight">
          {t('ngo.myVerifications.title')}
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Records of all field verifications you have submitted</p>
      </div>

      {/* Search */}
      {verifications.length > 0 && (
        <Card className="p-4 bg-white border border-[var(--color-border-default)] shadow-[var(--shadow-card)] rounded-2xl">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              placeholder="Search by farmer name or remarks"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--color-paper)] border border-[var(--color-border-default)] rounded-xl text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
            />
          </div>
        </Card>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col justify-center items-center py-16 gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">{t('common.loading')}</p>
        </div>
      ) : verifications.length === 0 ? (
        <Card className="text-center py-16 border border-[var(--color-border-default)] bg-white rounded-2xl shadow-[var(--shadow-card)]">
          <div className="w-12 h-12 bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--color-border-default)]">
            <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
          </div>
          <p className="text-[var(--color-text-secondary)] font-bold font-heading text-lg">{t('ngo.myVerifications.empty')}</p>
          <p className="text-[var(--color-text-muted)] text-xs mt-1">Verify claims from the Dashboard to see them here.</p>
        </Card>
      ) : filtered.length === 0 ? (
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
                  {['Farmer', 'Type', 'Remarks', 'Claim Status', 'Date'].map(h => (
                    <th key={h} scope="col" className={`px-6 py-4 text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider ${h === 'Date' ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[var(--color-border-default)]/60">
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-[var(--color-paper)] transition-all duration-200 cursor-pointer"
                    onClick={() => handleRowClick(v)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[var(--color-base-dark)] font-heading">{v.farmer_name}</div>
                      <div className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">ID: {v.id.split('-').slice(0, 2).join('-').toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)] font-semibold capitalize">
                      {v.verification_type === 'field_visit' ? t('ngo.verification.fieldVisit') : t('ngo.verification.documentaryProof')}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)] max-w-[250px]">
                      <p className="truncate font-medium" title={v.remarks}>{v.remarks || '—'}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Badge status={v.claim_status}>
                        {t(`status.${v.claim_status}`) || v.claim_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-[var(--color-text-muted)] font-mono font-semibold">
                      {new Date(v.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
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
