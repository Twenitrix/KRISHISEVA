import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { api } from '../api';

export default function RoleSelect() {
  const navigate = useNavigate();
  const toast = useToast();

  const [claimSearchId, setClaimSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [trackedClaim, setTrackedClaim] = useState(null);
  const [trackedLogs, setTrackedLogs] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const handleLanguageChange = (e) => {
    console.log('Language changed:', e.target.value);
  };

  const handleTrackClaim = async (e) => {
    e.preventDefault();
    if (!claimSearchId.trim()) {
      toast.error('Please enter a valid Claim ID');
      return;
    }

    setSearching(true);
    try {
      const claimRes = await api.claims.get(claimSearchId.trim());
      const logsRes = await api.claims.getStatusLog(claimSearchId.trim());

      if (claimRes?.success && claimRes?.data) {
        setTrackedClaim(claimRes.data);
        setTrackedLogs(logsRes?.data || []);
        setShowModal(true);
      } else {
        toast.error('Claim ID not found. Try "claim-case-1" or "claim-case-3"');
      }
    } catch (err) {
      toast.error('Claim lookup failed. Make sure the ID is correct.');
    } finally {
      setSearching(false);
    }
  };

  const steps = [
    {
      num: '01',
      title: 'Damage Reported',
      desc: 'Farmers submit policy and geotagged crop photos directly on site through the web portal.',
      img: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&q=80&w=800',
    },
    {
      num: '02',
      title: 'NGO Verification',
      desc: 'Local NGOs perform quick field visits or examine documents to upload corroborating proof.',
      img: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?auto=format&fit=crop&q=80&w=800',
    },
    {
      num: '03',
      title: 'AI & Satellite Auditing',
      desc: 'NVIDIA Vision AI parses crop health, matched against satellite land records and GPS polygons.',
      img: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=800',
    },
    {
      num: '04',
      title: 'Direct Disbursement',
      desc: 'Sub-Divisional Magistrates review the unified report and instantly disburse payouts via Aadhaar.',
      img: 'https://images.unsplash.com/photo-1601597111158-2fceff270190?auto=format&fit=crop&q=80&w=800',
    },
  ];

  return (
    <div className="min-h-screen bg-paper flex flex-col relative overflow-hidden font-sans">
      
      {/* Decorative Blur Orbs */}
      <div className="absolute top-20 -left-20 w-80 h-80 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[600px] -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-3 py-1 rounded-lg text-xl shadow-md shadow-emerald-500/20">K</span>
            <span className="font-extrabold text-text-primary text-xl tracking-tight font-heading">
              Krishi<span className="text-accent">Seva</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              onChange={handleLanguageChange}
              className="bg-white border border-border-default rounded-lg px-3 py-1.5 text-sm text-text-secondary focus:border-focus focus:outline-none shadow-sm"
            >
              <option value="en">English</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="hi">हिन्दी (Hindi)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section 
        className="relative min-h-[560px] flex items-center bg-cover bg-center text-white" 
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1600')` 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 to-slate-900/40 z-10" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 z-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7">
            <span className="inline-block bg-emerald-500/20 text-emerald-400 font-semibold px-3 py-1 rounded-full text-xs mb-4 border border-emerald-400/20 tracking-wide uppercase">
              🚀 PS2 Hackathon MVP
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 font-heading leading-tight">
              AI-Powered Crop Insurance Claims <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300">Verification</span>
            </h1>
            <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed">
              KrishiSeva bridges farmers, field NGOs, and district officials using independent satellite cross-checks, computer vision models, and transparent audit trails for fast, honest relief.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/farmer/login')}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-bold py-3 px-4 rounded-xl transition-all text-center text-sm shadow-lg shadow-emerald-600/30 transform hover:-translate-y-0.5"
              >
                Farmer Portal
              </button>
              <button 
                onClick={() => navigate('/ngo/login')}
                className="bg-white hover:bg-slate-100 text-text-primary font-bold py-3 px-4 rounded-xl transition-all text-center text-sm shadow-md transform hover:-translate-y-0.5"
              >
                NGO Partner Portal
              </button>
              <button 
                onClick={() => navigate('/official/login')}
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-xl transition-all border border-white/20 text-center text-sm transform hover:-translate-y-0.5"
              >
                Officer Portal
              </button>
            </div>
          </div>

          {/* Hero Right: Claim Tracker Search */}
          <div className="lg:col-span-5">
            <Card className="glass-panel p-6 border border-white/10 shadow-2xl rounded-2xl">
              <h3 className="text-lg font-bold text-white mb-2 font-heading">🔍 Public Claim Tracker</h3>
              <p className="text-xs text-slate-300 mb-6">Verify claim progress and timeline status logs instantly without logging in.</p>
              
              <form onSubmit={handleTrackClaim} className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter Claim ID (e.g. claim-case-1)"
                  value={claimSearchId}
                  onChange={(e) => setClaimSearchId(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder-slate-400 focus:border-emerald-400"
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold shadow-lg"
                  loading={searching}
                >
                  Track Claim Status
                </Button>
              </form>
              <div className="mt-4 flex flex-wrap gap-2 justify-center text-[10px] text-slate-400">
                <span>Try IDs:</span>
                <button type="button" onClick={() => setClaimSearchId('claim-case-1')} className="hover:text-emerald-400 underline">claim-case-1</button>
                <span>•</span>
                <button type="button" onClick={() => setClaimSearchId('claim-case-3')} className="hover:text-emerald-400 underline">claim-case-3</button>
                <span>•</span>
                <button type="button" onClick={() => setClaimSearchId('claim-case-5')} className="hover:text-emerald-400 underline">claim-case-5</button>
              </div>
            </Card>
          </div>

        </div>
      </section>

      {/* Trust Factors */}
      <section className="bg-white py-14 shadow-sm border-b border-border-default">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="bg-accent-light text-accent p-3 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m-4-3h9m-9 3h9m-9 3h3m-12 1a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-lg mb-2 font-heading">Independent Weather Check</h3>
                <p className="text-sm text-text-secondary leading-relaxed">Every crop damage report is cross-referenced with regional satellite observations and verified rain/drought indexes.</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="bg-accent-light text-accent p-3 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-lg mb-2 font-heading">Multi-Party Verification</h3>
                <p className="text-sm text-text-secondary leading-relaxed">Eliminates single-point bribery or bias by combining farmer input, independent NGO reports, and official audits.</p>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
              <div className="bg-accent-light text-accent p-3 h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-lg mb-2 font-heading">Audit-Ready Integrity</h3>
                <p className="text-sm text-text-secondary leading-relaxed">Immutable status logs ensure every single decision is transparently signed and traceable to the official who approved it.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it Works Flow */}
      <section className="py-16 max-w-6xl mx-auto px-4 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-3 font-heading">Structured, Accountable Workflow</h2>
          <p className="text-sm text-text-secondary">How KrishiSeva turns filed crop damage into direct bank transfer payouts.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <Card key={step.num} className="overflow-hidden flex flex-col h-full hover-lift border border-border-default bg-white">
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                <img src={step.img} alt={step.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 bg-accent text-white font-bold text-xs px-2.5 py-1 rounded-md shadow-sm">
                  {step.num}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-text-primary text-base mb-2 font-heading">{step.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Stakeholders Portal Section */}
      <section className="bg-slate-100 py-16 border-t border-b border-border-default w-full">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-text-primary mb-3 font-heading">Dedicated Portals</h2>
            <p className="text-sm text-text-secondary">Select your entry point to manage claims or verification files.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 bg-white flex flex-col justify-between h-full border border-border-default hover-lift">
              <div>
                <h3 className="font-bold text-xl text-text-primary mb-3 font-heading">Farmer Portal</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  File multi-step crop loss reports, configure your payout bank credentials, upload geotagged photos, and trace NGO & officer reviews on your claim.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/farmer/login')}
                className="w-full bg-accent text-white hover:bg-accent-hover font-semibold py-2.5 rounded-xl shadow-sm"
              >
                Go to Farmer Portal
              </Button>
            </Card>

            <Card className="p-6 bg-white flex flex-col justify-between h-full border border-border-default hover-lift">
              <div>
                <h3 className="font-bold text-xl text-text-primary mb-3 font-heading">NGO Partner Portal</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  Register your organization, search village land records, and upload corroborated crop field inspections to secure payouts for eligible farmers.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/ngo/login')}
                className="w-full bg-accent text-white hover:bg-accent-hover font-semibold py-2.5 rounded-xl shadow-sm"
              >
                Go to NGO Portal
              </Button>
            </Card>

            <Card className="p-6 bg-white flex flex-col justify-between h-full border border-border-default hover-lift">
              <div>
                <h3 className="font-bold text-xl text-text-primary mb-3 font-heading">Government Official Portal</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  Monitor crop damage statistics on the village dashboard, evaluate unified report evidence, adjust payout sizes, and trigger secure disbursals.
                </p>
              </div>
              <Button 
                onClick={() => navigate('/official/login')}
                className="w-full bg-accent text-white hover:bg-accent-hover font-semibold py-2.5 rounded-xl shadow-sm"
              >
                Go to Officer Portal
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 border-t border-border-default mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-secondary">
          <p>© 2026 KrishiSeva Crop Insurance. Proudly designed for PS2.</p>
          <div className="flex gap-6">
            <a href="#about" className="hover:text-emerald-600 transition-colors">About Platform</a>
            <a href="#help" className="hover:text-emerald-600 transition-colors">Contact Helpdesk</a>
            <a href="#privacy" className="hover:text-emerald-600 transition-colors">Security & Privacy</a>
          </div>
        </div>
      </footer>

      {/* public Claim Tracker Modal */}
      {showModal && trackedClaim && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl bg-white p-6 shadow-2xl rounded-2xl max-h-[85vh] overflow-y-auto toast-slide border border-border-default">
            
            <div className="flex items-center justify-between border-b border-border-default pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-text-primary font-heading">Claim Tracking Status</h3>
                <p className="text-xs text-text-secondary mt-0.5">ID: {trackedClaim.id}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-text-muted hover:text-text-primary text-xl font-semibold p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-text-muted">Farmer Name</span>
                <p className="font-semibold text-text-primary">{trackedClaim.farmer_name}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-text-muted">Survey Number</span>
                <p className="font-semibold text-text-primary">{trackedClaim.survey_number}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-text-muted">Claimed Event</span>
                <p className="font-semibold text-text-primary">{trackedClaim.claimed_event_type} ({trackedClaim.claimed_event_date})</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-xs text-text-muted">Current Status</span>
                <span className={`inline-block ml-2 px-2.5 py-0.5 text-xs font-bold rounded-full ${
                  trackedClaim.status === 'payout_completed' ? 'bg-status-verified-bg text-status-verified' :
                  trackedClaim.status === 'denied' ? 'bg-status-rejected-bg text-status-rejected' :
                  'bg-status-pending-bg text-status-pending'
                }`}>
                  {trackedClaim.status.toUpperCase()}
                </span>
              </div>
            </div>

            <h4 className="font-bold text-text-primary mb-3 font-heading">Timeline Audit Logs</h4>
            <div className="space-y-4 border-l-2 border-slate-200 ml-3 pl-6">
              {trackedLogs.length > 0 ? (
                trackedLogs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Timeline Node dot */}
                    <div className="absolute -left-[31px] top-1.5 w-3 h-3 bg-emerald-500 rounded-full ring-4 ring-white" />
                    <div>
                      <span className="text-[10px] text-text-muted">{new Date(log.timestamp).toLocaleString()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-text-primary">
                          {log.new_status.toUpperCase()}
                        </span>
                        <span className="text-xs bg-slate-100 text-text-secondary px-2 py-0.5 rounded-full capitalize">
                          By: {log.changed_by_role}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{log.remarks}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-text-muted">No timeline logs found for this claim.</p>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={() => setShowModal(false)} className="bg-slate-900 text-white font-semibold">
                Close Tracker
              </Button>
            </div>

          </Card>
        </div>
      )}

    </div>
  );
}
