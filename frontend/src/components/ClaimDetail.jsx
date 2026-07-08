import React from 'react';
import { t } from '../i18n';
import Card from './ui/Card';
import Badge from './ui/Badge';
import Button from './ui/Button';
import StatusTimeline from './ui/StatusTimeline';

export default function ClaimDetail({
  claim,
  report,
  ngoVerification,
  statusLogs,
  viewerRole = 'farmer',
  onClose,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        <p className="ml-3 text-sm text-text-secondary">{t('common.loading')}</p>
      </div>
    );
  }

  if (!claim || !report) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-text-secondary">Failed to load claim details.</p>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-status-verified';
    if (score >= 50) return 'text-status-pending';
    return 'text-status-rejected';
  };

  return (
    <div className="space-y-6 claim-detail-container">
      {/* Inline styles for clean PDF printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-report, .printable-report * {
            visibility: visible;
          }
          .printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Action Header */}
      <div className="flex justify-between items-center no-print">
        <div>
          <span className="text-xs text-text-muted font-mono uppercase">Claim Ref ID: {claim.id}</span>
          <h2 className="text-lg font-bold text-text-primary mt-1">Unified Audit Report</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handlePrint} className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Download PDF
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('common.close')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Printable Document */}
        <div className="lg:col-span-2 space-y-6 printable-report">
          <Card className="p-6 md:p-8 space-y-6 bg-surface border border-border-default shadow-sm rounded-lg">
            
            {/* Report Header (Print ready) */}
            <div className="border-b border-border-default pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-accent tracking-tight">KRISHISEVA</h1>
                <p className="text-xs text-text-secondary mt-0.5">Government Crop Insurance Verification Protocol (PS2)</p>
              </div>
              <div className="text-right">
                <Badge status={claim.status}>
                  {t(`status.${claim.status}`) || claim.status}
                </Badge>
                <p className="text-[10px] text-text-muted mt-1">Generated: {new Date().toLocaleDateString('en-IN')}</p>
              </div>
            </div>

            {/* Section 1: Applicant & Land Summary */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-default/50 pb-1">
                1. Applicant & Land Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-text-secondary">Farmer Name</p>
                  <p className="font-semibold text-text-primary mt-0.5">{report.submission.farmer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Village & District</p>
                  <p className="font-semibold text-text-primary mt-0.5">{report.submission.village_name}, Maharashtra</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Insured Land Survey Number</p>
                  <p className="font-mono font-semibold text-text-primary mt-0.5">{report.submission.survey_number}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary">Claimed Loss Trigger Event</p>
                  <p className="font-semibold text-text-primary mt-0.5 capitalize">
                    {report.submission.claimed_event_type} ({new Date(report.submission.claimed_event_date).toLocaleDateString('en-IN')})
                  </p>
                </div>
              </div>
              {report.submission.description && (
                <div className="bg-surface-alt p-3 rounded mt-2">
                  <p className="text-xs text-text-secondary font-medium">Farmer description:</p>
                  <p className="text-xs text-text-secondary italic mt-1">"{report.submission.description}"</p>
                </div>
              )}
            </div>

            {/* Section 2: Evidence Summary */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-default/50 pb-1">
                2. Field Verification Evidence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Farmer Photo */}
                <div className="space-y-1.5">
                  <span className="text-xs text-text-secondary font-medium">Farmer Crop Submission photo</span>
                  <div className="border border-border-default rounded overflow-hidden aspect-video bg-surface-alt">
                    <img 
                      src={report.submission.photo_url} 
                      alt="Farmer crop submission evidence" 
                      className="w-full h-full object-cover" 
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=600';
                      }}
                    />
                  </div>
                  {claim.photo_latitude && (
                    <p className="text-[10px] text-text-muted font-mono">
                      GPS: {claim.photo_latitude.toFixed(5)}, {claim.photo_longitude.toFixed(5)} | Timestamp: {new Date(claim.photo_timestamp || claim.created_at).toLocaleString('en-IN')}
                    </p>
                  )}
                </div>

                {/* NGO Field Verification */}
                <div className="space-y-1.5">
                  <span className="text-xs text-text-secondary font-medium">NGO Verification evidence</span>
                  {ngoVerification ? (
                    <div className="space-y-2">
                      <div className="border border-border-default rounded overflow-hidden aspect-video bg-surface-alt">
                        <img 
                          src={ngoVerification.photo_url} 
                          alt="NGO verification evidence" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="bg-surface-alt p-3 rounded text-xs space-y-1.5">
                        <p><span className="font-semibold text-text-primary">NGO:</span> {ngoVerification.ngo_name}</p>
                        <p><span className="font-semibold text-text-primary">Type:</span> <span className="capitalize">{ngoVerification.verification_type.replace('_', ' ')}</span></p>
                        <p><span className="font-semibold text-text-primary">Remarks:</span> "{ngoVerification.remarks}"</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-border-default border-dashed rounded aspect-video flex flex-col justify-center items-center text-center p-4 bg-surface-alt text-text-muted">
                      <svg className="w-6 h-6 text-text-muted/60 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-xs italic font-medium">{t('official.review.noEvidence')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Verification Score Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-default/50 pb-1">
                3. Verification Score Breakdown
              </h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-start border-b border-border-default/30 pb-2">
                  <div>
                    <span className="font-semibold text-text-primary">Land Match Score</span>
                    <span className="block text-xs text-text-secondary mt-0.5">Compares farmer survey number boundary with coordinate polygon logs.</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(report.rules_scores.land_match_score)}`}>
                    {report.rules_scores.land_match_score}%
                  </span>
                </div>

                <div className="flex justify-between items-start border-b border-border-default/30 pb-2">
                  <div>
                    <span className="font-semibold text-text-primary">GPS Match Score</span>
                    <span className="block text-xs text-text-secondary mt-0.5">Calculates photo metadata coordinate distance from land registry center.</span>
                  </div>
                  <span className={`font-bold ${getScoreColor(report.rules_scores.gps_match_score)}`}>
                    {report.rules_scores.gps_match_score}%
                  </span>
                </div>

                <div className="flex justify-between items-start border-b border-border-default/30 pb-2">
                  <div>
                    <span className="font-semibold text-text-primary">Crop Matching Analysis</span>
                    <span className="block text-xs text-text-secondary mt-0.5">NVIDIA AI model parses crop type versus official Land Record registry.</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider ${
                    report.rules_scores.crop_match === 'MATCH' ? 'text-status-verified bg-status-verified-bg' : 'text-status-rejected bg-status-rejected-bg'
                  }`}>
                    {report.rules_scores.crop_match}
                  </span>
                </div>

                <div className="flex justify-between items-start border-b border-border-default/30 pb-2">
                  <div>
                    <span className="font-semibold text-text-primary">Weather & Duplicate Control</span>
                    <span className="block text-xs text-text-secondary mt-0.5">Cross-validates with regional rainfall datasets and checks duplicate photos.</span>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-semibold text-text-primary">{report.rules_scores.duplicate_check}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">Fraud Flags: {report.rules_scores.fraud_flags}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-text-primary text-base">{t('official.review.overallScore')}</span>
                  <span className={`text-xl font-bold ${getScoreColor(report.rules_scores.overall_score)}`}>
                    {report.rules_scores.overall_score}%
                  </span>
                </div>
              </div>
            </div>

            {/* Section 4: AI Crop/Damage Justification */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-default/50 pb-1">
                4. AI Computer Vision Diagnostic
              </h3>
              <div className="bg-accent-light/30 border border-accent/20 p-4 rounded-lg text-sm text-text-primary">
                <div className="flex justify-between font-semibold border-b border-border-default/40 pb-2 mb-2">
                  <span>AI Crop Identified: {report.ai_vision.crop_identified}</span>
                  <span className="text-status-rejected">AI Severity Level: {report.ai_vision.damage_percentage}%</span>
                </div>
                <p className="text-xs text-text-secondary italic leading-relaxed">
                  "{report.ai_vision.justification}"
                </p>
              </div>
            </div>

            {/* Section 5: Payout Formula & Sums */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-default/50 pb-1">
                5. Insurance Payout Formula
              </h3>
              <div className="bg-surface-alt p-4 rounded-lg space-y-3 text-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="border-r border-border-default/60">
                    <p className="text-xs text-text-secondary font-medium">Sown Area</p>
                    <p className="font-bold text-text-primary mt-0.5">{report.payout.area_hectares} Ha</p>
                  </div>
                  <div className="border-r border-border-default/60">
                    <p className="text-xs text-text-secondary font-medium">Insured Sum / Ha</p>
                    <p className="font-bold text-text-primary mt-0.5">₹{report.payout.crop_insured_sum_per_hectare.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="border-r border-border-default/60">
                    <p className="text-xs text-text-secondary font-medium">AI Damage %</p>
                    <p className="font-bold text-status-rejected mt-0.5">{report.ai_vision.damage_percentage}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary font-medium">Suggested Payout</p>
                    <p className="font-bold text-accent mt-0.5">₹{report.payout.suggested_payout_amount.toLocaleString('en-IN')}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-default/60 text-xs text-center text-text-secondary italic">
                  Formula: Area ({report.payout.area_hectares} ha) × Insured Sum (₹{report.payout.crop_insured_sum_per_hectare}) × AI Severity ({report.ai_vision.damage_percentage}%) = Suggested Payout (₹{report.payout.suggested_payout_amount})
                </div>
              </div>
            </div>

            {/* Section 6: Official Disbursal Log & Sign Block */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider border-b border-border-default/50 pb-1">
                6. Official Disbursal Protocol
              </h3>
              
              {claim.status === 'approved' || claim.status === 'payout_completed' ? (
                <div className="border border-status-verified/20 bg-status-verified-bg/50 p-4 rounded-lg space-y-4">
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-bold text-status-verified">Insurance Disbursal Approved</p>
                      <p className="text-xs text-text-secondary mt-1">Official Remarks: "{claim.official_remarks || 'Claim approved based on corroborating data.'}"</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-text-secondary">Approved Payout</p>
                      <p className="text-lg font-bold text-status-verified">₹{claim.official_approved_amount?.toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  {/* Mock Signature block */}
                  <div className="pt-4 border-t border-border-default/40 flex justify-between items-center text-xs text-text-secondary">
                    <div>
                      <p className="font-medium text-text-primary">Shri. Rajesh Deshmukh</p>
                      <p>Sub-Divisional Magistrate, Wardha</p>
                    </div>
                    <div className="text-right">
                      <p className="italic text-accent font-mono text-[10px] uppercase tracking-wider">Signed via Aadhaar e-KYC</p>
                      <p>Date: {new Date(claim.updated_at).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              ) : claim.status === 'denied' || claim.status === 'rejected' ? (
                <div className="border border-status-rejected/20 bg-status-rejected-bg/40 p-4 rounded-lg text-sm">
                  <p className="font-bold text-status-rejected">Insurance Claim Denied</p>
                  <p className="text-xs text-text-secondary mt-1">Remarks: "{claim.official_remarks || 'Verification parameters failed.'}"</p>
                </div>
              ) : (
                <div className="bg-surface-alt p-4 rounded-lg text-center text-xs text-text-muted italic">
                  Claim review pending. Government official evaluation required.
                </div>
              )}
            </div>

          </Card>
        </div>

        {/* Right Column: Status Logs & Timeline (Visible only on UI) */}
        <div className="no-print space-y-6">
          <Card className="p-4 bg-surface border border-border-default shadow-sm rounded-lg">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-4">
              Real-time Processing Tracker
            </h3>
            <StatusTimeline currentStatus={claim.status} statusLogs={statusLogs} />
          </Card>

          {viewerRole === 'farmer' && (
            <Card className="p-4 bg-surface border border-border-default shadow-sm rounded-lg space-y-3">
              <h4 className="font-bold text-sm text-text-primary">What happens next?</h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                Your submitted claim has been run through computer vision severity scoring. An assigned field worker or NGO will soon verify crop conditions on-site, followed by SDM approval and digital bank disbursal.
              </p>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}
