import React from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '../i18n';
import Card from '../components/ui/Card';

export default function RoleSelect() {
  const navigate = useNavigate();

  const handleLanguageChange = (e) => {
    // Basic language toggle for demo purpose
    console.log('Language changed:', e.target.value);
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
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Top Header */}
      <header className="bg-surface border-b border-border-default sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-accent text-2xl tracking-tight">K</span>
            <span className="font-bold text-text-primary text-lg tracking-tight">{t('common.appName')}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              onChange={handleLanguageChange}
              className="bg-surface border border-border-default rounded-md px-2.5 py-1 text-sm focus:border-focus focus:outline-none"
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
        className="relative min-h-[500px] flex items-center bg-cover bg-center text-white" 
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=1600')` 
        }}
      >
        <div className="absolute inset-0 bg-black/60 z-10" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 z-20 w-full">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              AI-Powered Crop Insurance Claims Verification
            </h1>
            <p className="text-lg text-gray-200 mb-8 leading-relaxed">
              KrishiSeva bridges farmers, field NGOs, and district officials using independent satellite cross-checks, computer vision models, and transparent audit trails for fast, honest relief.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/farmer/login')}
                className="bg-accent hover:bg-accent-hover text-white font-semibold py-3 px-4 rounded-md transition-colors text-center text-sm shadow-sm"
              >
                Farmer Portal
              </button>
              <button 
                onClick={() => navigate('/ngo/login')}
                className="bg-surface hover:bg-surface-alt text-text-primary font-semibold py-3 px-4 rounded-md transition-colors text-center text-sm shadow-sm"
              >
                NGO Partner Portal
              </button>
              <button 
                onClick={() => navigate('/official/login')}
                className="bg-surface/15 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-md transition-colors border border-white/30 text-center text-sm"
              >
                Officer Portal
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Factors */}
      <section className="bg-surface border-b border-border-default py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex gap-4">
              <div className="bg-accent-light text-accent p-3 h-12 w-12 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m-4-3h9m-9 3h9m-9 3h3m-12 1a9 9 0 1118 0 9 9 0 01-18 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-base mb-1">Independent Weather Check</h3>
                <p className="text-sm text-text-secondary">Every crop damage report is cross-referenced with regional satellite observations and verified rain/drought indexes.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-accent-light text-accent p-3 h-12 w-12 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-base mb-1">Multi-Party Verification</h3>
                <p className="text-sm text-text-secondary">Eliminates single-point bribery or bias by combining farmer input, independent NGO reports, and official audits.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-accent-light text-accent p-3 h-12 w-12 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary text-base mb-1">Audit-Ready Integrity</h3>
                <p className="text-sm text-text-secondary">Immutable status logs ensure every single decision is transparently signed and traceable to the official who approved it.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Flow */}
      <section className="py-16 max-w-6xl mx-auto px-4 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-3">Structured, Accountable Workflow</h2>
          <p className="text-sm text-text-secondary">How KrishiSeva turns filed crop damage into direct bank transfer payouts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <Card key={step.num} className="overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="h-40 bg-surface-alt relative overflow-hidden">
                <img src={step.img} alt={step.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 bg-accent text-white font-bold text-sm px-2 py-0.5 rounded">
                  {step.num}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-text-primary mb-1">{step.title}</h4>
                  <p className="text-xs text-text-secondary leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Stakeholders Portal Section */}
      <section className="bg-surface-alt py-16 border-t border-b border-border-default w-full">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Dedicated Stakeholder Portals</h2>
            <p className="text-xs text-text-secondary">Select your entry point to manage claims or verification files.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-surface flex flex-col justify-between h-full">
              <div>
                <h3 className="font-bold text-lg text-text-primary mb-2">Farmer</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  File multi-step crop loss reports, configure your payout bank credentials, upload geotagged photos, and trace NGO & officer reviews on your claim.
                </p>
              </div>
              <button 
                onClick={() => navigate('/farmer/login')}
                className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded text-sm font-medium transition-colors"
              >
                Go to Farmer Portal
              </button>
            </Card>

            <Card className="p-6 bg-surface flex flex-col justify-between h-full">
              <div>
                <h3 className="font-bold text-lg text-text-primary mb-2">NGO Partner</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  Register your organization, search village land records, and upload corroborated crop field inspections to secure payouts for eligible farmers.
                </p>
              </div>
              <button 
                onClick={() => navigate('/ngo/login')}
                className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded text-sm font-medium transition-colors"
              >
                Go to NGO Portal
              </button>
            </Card>

            <Card className="p-6 bg-surface flex flex-col justify-between h-full">
              <div>
                <h3 className="font-bold text-lg text-text-primary mb-2">Government Official</h3>
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  Monitor crop damage statistics on the village dashboard, evaluate unified report evidence, adjust payout sizes, and trigger secure disbursals.
                </p>
              </div>
              <button 
                onClick={() => navigate('/official/login')}
                className="w-full bg-accent hover:bg-accent-hover text-white py-2 rounded text-sm font-medium transition-colors"
              >
                Go to Officer Portal
              </button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-surface py-8 border-t border-border-default mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-secondary">
          <p>© 2026 KrishiSeva Crop Insurance. Proudly designed for PS2.</p>
          <div className="flex gap-6">
            <a href="#about" className="hover:text-text-primary">About Platform</a>
            <a href="#help" className="hover:text-text-primary">Contact Helpdesk</a>
            <a href="#privacy" className="hover:text-text-primary">Security & Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
