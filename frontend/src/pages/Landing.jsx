import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';
import { api } from '../api';
import { 
  Sprout, ShieldAlert, MapPin, ChevronRight, Smartphone, 
  Cpu, ShieldCheck, UserCheck, ArrowRight, Play, CheckCircle2,
  FileText, Activity, Camera, Users, ChevronUp, Clock, AlertTriangle, Inbox
} from 'lucide-react';

// Custom hook for scroll reveal animation
function useScrollReveal(options = { threshold: 0.2 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, options);
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [options.threshold]);

  return [ref, isVisible];
}

// Live Stat Counter Component
function StatCounter({ endValue, label, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, isVisible] = useScrollReveal();

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const increment = endValue / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= endValue) {
        setCount(endValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [endValue, isVisible]);

  return (
    <div ref={ref} className="text-center md:text-left md:px-6">
      <div className="text-2xl md:text-4xl font-extrabold text-[var(--color-marigold)] font-heading mb-1 flex items-center justify-center md:justify-start gap-1">
        <Activity className="w-5 h-5 text-[var(--color-marigold)] shrink-0 animate-pulse hidden md:inline" />
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs md:text-sm text-slate-300 font-medium tracking-wide uppercase">{label}</div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const toast = useToast();

  const [claimSearchId, setClaimSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Reveal Refs
  const [problemRef, problemVisible] = useScrollReveal();
  const [transitionRef, transitionVisible] = useScrollReveal({ threshold: 0.5 });
  const [solutionRef, solutionVisible] = useScrollReveal();
  const [howItWorksRef, howItWorksVisible] = useScrollReveal();

  const handleTrackClaim = async (e) => {
    e.preventDefault();
    if (!claimSearchId.trim()) {
      toast.error("Please enter a Claim ID to track.");
      return;
    }
    toast.info(`Claim tracking details for #${claimSearchId.toUpperCase()} moved to the secure portal. Redirecting to Farmer Login...`);
    setTimeout(() => {
      navigate('/farmer/login');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[var(--color-paper)] flex flex-col relative overflow-x-hidden font-sans text-[var(--color-text-primary)]">
      
      {/* ─── HEADER ─── */}
      <header className="absolute top-0 w-full z-50 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-bold bg-[var(--color-marigold)] text-slate-900 px-3 py-1.5 rounded-lg text-xl shadow-md font-heading">K</span>
            <span className="font-extrabold text-white text-2xl tracking-tight font-heading drop-shadow-md">
              Krishi<span className="text-[var(--color-turmeric)]">Seva</span>
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <select className="bg-white/10 text-white border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none backdrop-blur-md font-semibold">
              <option className="text-slate-900 font-medium" value="en">English</option>
              <option className="text-slate-900 font-medium" value="hi">हिन्दी</option>
            </select>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[95vh] lg:min-h-[90vh] flex flex-col justify-between overflow-hidden pt-28 pb-16">
        {/* Animated Gradient Mesh / Background Image Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 ease-out scale-105"
          style={{ backgroundImage: "url('/hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#241812]/95 via-[#241812]/85 to-transparent mix-blend-multiply" />
        <div className="absolute inset-0 opacity-30 bg-[linear-gradient(45deg,#241812,#D98E2A,#5D4037)] animate-slow-pan mix-blend-overlay" />

        <div className="relative z-20 max-w-4xl w-full mx-auto px-4 my-auto text-center flex flex-col items-center justify-center space-y-8 animate-fade-in-up">
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white font-heading leading-tight drop-shadow-md">
            Jab Fasal Barbaad Ho, <br/>
            <span className="text-[var(--color-marigold)]">System Nahi Honi Chahiye</span>
          </h1>
          
          <p className="text-base md:text-lg text-slate-200 font-medium max-w-3xl drop-shadow-sm leading-relaxed mx-auto">
            <span className="text-white font-extrabold">KrishiSeva</span> replaces slow, paper-based crop damage claims with a <span className="text-[var(--color-marigold)] font-bold">mobile-first flow</span>: take a <span className="text-white font-bold underline decoration-[var(--color-marigold)] decoration-2">geotagged photo</span> → AI <span className="text-white font-bold">cross-checks land records</span> → payouts in <span className="text-[var(--color-marigold)] font-bold">days</span>, not months.
          </p>

          {/* Storing data differently: Premium Glassmorphic Stats Grid instead of Bottom Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full pt-6 max-w-3xl">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center hover:bg-white/15 transition-all">
              <StatCounter endValue={12450} label="Claims Processed" />
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center hover:bg-white/15 transition-all">
              <StatCounter endValue={85} label="Avg. Time Saved" suffix="%" />
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center hover:bg-white/15 transition-all">
              <StatCounter endValue={4230} label="Farmers Served" suffix="+" />
            </div>
          </div>
          
        </div>
      </section>

      {/* ─── PROBLEM NARRATIVE (The Old Way) ─── */}
      <section className="py-24 bg-[var(--color-paper)] border-b border-[var(--color-border-default)]">
        <div 
          ref={problemRef}
          className={`max-w-6xl mx-auto px-4 transition-all duration-1000 ${problemVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-status-rejected)] mb-2 block">System Bottlenecks</span>
            <h2 className="text-4xl font-extrabold text-[var(--color-base-dark)] font-heading mb-4">The Old Way</h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto text-lg font-medium">A system built on distrust, friction, and endless paperwork.</p>
          </div>

          <div className="relative">
            {/* Timeline Line (Dashed Rejected/Rust red line) */}
            <div className="hidden md:block absolute top-[44px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-[var(--color-status-rejected)]/20" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { title: 'Paper Trail', desc: 'File physical forms at block office', icon: FileText },
                { title: 'Weeks of Waiting', desc: 'Wait for Patwari inspection', icon: Clock },
                { title: 'Manual Data Entry', desc: 'Files pile up on desks', icon: Inbox },
                { title: 'Uncertainty', desc: 'Months pass without a payout', icon: AlertTriangle },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div 
                    key={i} 
                    className="relative z-10 bg-white p-6 rounded-2xl border border-[var(--color-border-default)] hover:border-[var(--color-status-rejected)]/20 shadow-[var(--shadow-card)] hover:shadow-md transition-all text-center flex flex-col justify-between items-center group overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-[var(--color-status-rejected)]/60 grayscale-[15%] hover:grayscale-0"
                  >
                    <div className="w-full flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-status-rejected)]/70">Obstacle {i+1}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-status-rejected)]/40" />
                    </div>
                    <div className="w-12 h-12 bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected)] border border-[var(--color-status-rejected)]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                      <Icon className="w-5 h-5 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-[var(--color-base-dark)] text-base font-heading mb-2 group-hover:text-[var(--color-status-rejected)] transition-colors">{step.title}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRANSITION MOMENT ─── */}
      <section className="py-32 bg-[#3E2723] text-center px-4 overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10" />
        <div 
          ref={transitionRef}
          className={`relative z-10 max-w-4xl mx-auto transition-all duration-1000 ease-out ${transitionVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          <h2 className="text-3xl md:text-5xl font-heading font-medium text-white leading-tight">
            It's not the Farmer.<br/> 
            <span className="text-slate-400">It's not the NGO.</span><br/> 
            <span className="text-slate-500">It's not the Administrator.</span><br/>
            <span className="block mt-6 text-[var(--color-marigold)] font-extrabold text-5xl md:text-7xl">
              It's the process.
            </span>
          </h2>
        </div>
      </section>

      {/* ─── THE KRISHISEVA WAY (Solution) ─── */}
      <section className="py-24 bg-white border-b border-[var(--color-border-default)] relative">
        <div 
          ref={solutionRef}
          className={`max-w-6xl mx-auto px-4 transition-all duration-1000 delay-100 ${solutionVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[var(--color-earth-dark)] font-heading mb-4">The KrishiSeva Way</h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto text-lg">Trust verified by data. Approvals driven by AI. Payouts in days.</p>
          </div>

          <div className="relative">
            {/* Visual connecting timeline gradient background */}
            <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-1 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-turmeric)] to-[var(--color-accent-hover)] rounded" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {[
                { title: 'Snap Photo', desc: 'Farmer captures geotagged crop damage photo', icon: Camera, stepBg: 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]/20' },
                { title: 'Geotag Verified', desc: 'Coordinates verified automatically against land record database', icon: MapPin, stepBg: 'bg-[var(--color-turmeric-light)] text-[var(--color-turmeric)] border-[var(--color-turmeric-border)]/30' },
                { title: 'NGO Check', desc: 'Assigned NGO local representative audits physical validation', icon: Users, stepBg: 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]/20' },
                { title: 'AI Confidence Score', desc: 'NVIDIA Vision models scan crop stress and estimate damage', icon: Cpu, stepBg: 'bg-[var(--color-turmeric-light)] text-[var(--color-turmeric)] border-[var(--color-turmeric-border)]/30' },
                { title: 'Officer Approval', desc: 'Government SDM verifies claims and initiates disbursal', icon: CheckCircle2, stepBg: 'bg-[var(--color-accent-light)] text-[var(--color-accent)] border-[var(--color-accent)]/20' },
              ].map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={i} className="relative z-10 bg-white p-5 rounded-2xl shadow-[var(--shadow-card)] border border-[var(--color-border-default)] hover:border-[var(--color-accent)]/30 hover:shadow-[var(--shadow-premium)] transition-all flex flex-col justify-between items-center text-center hover-lift group">
                    <div className="w-full flex justify-between items-center mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Step {i+1}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] group-hover:scale-155 transition-all" />
                    </div>
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl border ${step.stepBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-extrabold text-[var(--color-base-dark)] text-base font-heading group-hover:text-[var(--color-accent)] transition-colors">{step.title}</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed font-medium">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS (Mobile UI Focus) ─── */}
      <section id="how-it-works" className="py-24 bg-[var(--color-paper)] border-y border-[var(--color-border-default)] overflow-hidden">
        <div 
          ref={howItWorksRef}
          className={`max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center transition-all duration-1000 ${howItWorksVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}
        >
          {/* Phone Mockup */}
          <div className="relative mx-auto w-full max-w-[320px]">
            {/* Glow behind phone */}
            <div className="absolute inset-0 bg-[var(--color-marigold)] blur-[80px] opacity-20 rounded-full" />
            <div className="relative bg-black rounded-[3rem] p-3 shadow-2xl border-[4px] border-slate-800 aspect-[9/19]">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-slate-800 rounded-b-2xl z-20" />
              <div className="bg-white w-full h-full rounded-[2.25rem] overflow-hidden flex flex-col relative">
                {/* Fake App UI */}
                <div className="bg-[var(--color-accent)] text-white p-6 pt-10 text-center">
                  <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3"><Camera className="w-7 h-7 text-white" /></div>
                  <h3 className="font-bold text-lg font-heading">Upload Damage</h3>
                </div>
                <div className="p-6 flex-1 bg-[var(--color-paper)] flex flex-col gap-4">
                  <div className="h-24 bg-[var(--color-border-default)]/30 rounded-xl animate-pulse"></div>
                  <div className="h-10 bg-[var(--color-border-default)]/30 rounded-xl animate-pulse w-3/4"></div>
                  <div className="h-12 bg-[var(--color-marigold)] rounded-xl mt-auto shadow-md"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Steps Description */}
          <div>
            <h2 className="text-4xl font-bold text-[var(--color-base-dark)] font-heading mb-8">Designed for the Field</h2>
            
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-turmeric)] text-[#3E2723] flex items-center justify-center font-bold text-lg">1</div>
                <div>
                  <h4 className="text-xl font-bold text-[var(--color-base-dark)] mb-1">Capture Reality</h4>
                  <p className="text-[var(--color-text-secondary)]">The farmer takes a photo. We auto-capture the GPS and timestamp.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-turmeric)] text-[#3E2723] flex items-center justify-center font-bold text-lg">2</div>
                <div>
                  <h4 className="text-xl font-bold text-[var(--color-base-dark)] mb-1">Local Context</h4>
                  <p className="text-[var(--color-text-secondary)]">An NGO partner quickly verifies the ground reality.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--color-turmeric)] text-[#3E2723] flex items-center justify-center font-bold text-lg">3</div>
                <div>
                  <h4 className="text-xl font-bold text-[var(--color-base-dark)] mb-1">AI Cross-check</h4>
                  <p className="text-[var(--color-text-secondary)]">Vision models match the image against satellite data to generate a confidence score.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-5 bg-white border border-[var(--color-border-default)] rounded-2xl shadow-[var(--shadow-card)] inline-block">
              <p className="text-lg font-heading font-semibold text-[var(--color-base-dark)]">
                <span className="text-[var(--color-marigold)] mr-2">✦</span>
                AI assists. Humans decide. Always.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOR WHOM (Pathways) ─── */}
      <section className="py-24 bg-[var(--color-paper)]/30 border-t border-[var(--color-border-default)] relative">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-accent)] mb-2 block">KrishiSeva Gateways</span>
            <h2 className="text-4xl font-extrabold text-[var(--color-base-dark)] font-heading mb-4">Choose Your Portal</h2>
            <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto text-sm font-medium">Access secure dashboards designed for verified Indian crop insurance claims</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Farmer Card */}
            <Card className="relative p-8 border border-[var(--color-border-default)] hover:border-[var(--color-accent)]/30 hover:shadow-[var(--shadow-premium)] transition-all bg-white rounded-2xl flex flex-col justify-between group overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-1.5 before:bg-[var(--color-accent)]">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)]/20 flex items-center justify-center mb-6 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  <Sprout className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="text-2xl font-extrabold text-[var(--color-base-dark)] mb-3 font-heading">I'm a Farmer</h3>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed font-medium">
                  Report crop damage directly from your field. Log in seamlessly using your Aadhaar card with secure OTP verification. No passwords needed.
                </p>
              </div>
              <Button 
                variant="primary"
                onClick={() => navigate('/farmer/login')}
                className="w-full py-4 flex items-center justify-center gap-2 font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <span>Enter Farmer Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>

            {/* Officer / NGO Card */}
            <Card className="relative p-8 border border-[var(--color-border-default)] hover:border-[var(--color-turmeric)]/30 hover:shadow-[var(--shadow-premium)] transition-all bg-white rounded-2xl flex flex-col justify-between group overflow-hidden before:absolute before:top-0 before:left-0 before:w-full before:h-1.5 before:bg-[var(--color-turmeric)]">
              <div className="mb-8">
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-turmeric-light)] text-[var(--color-turmeric)] border border-[var(--color-turmeric-border)]/20 flex items-center justify-center mb-6 shadow-inner group-hover:scale-105 transition-transform duration-300">
                  <ShieldCheck className="w-7 h-7 stroke-[2]" />
                </div>
                <h3 className="text-2xl font-extrabold text-[var(--color-base-dark)] mb-3 font-heading">I'm an NGO / Officer</h3>
                <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed font-medium">
                  Verify claims, submit ground truth reports, review satellite crop health indices, and authorize direct-to-bank payouts.
                </p>
              </div>
              <div className="flex gap-4 w-full">
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/ngo/login')}
                  className="flex-1 py-4 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)] font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                >
                  <Users className="w-4 h-4" />
                  <span>NGO Login</span>
                </Button>
                <Button 
                  variant="secondary"
                  onClick={() => navigate('/official/login')}
                  className="flex-1 py-4 border-[var(--color-border-default)] text-[var(--color-base-dark)] hover:bg-[var(--color-paper)] font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 shadow-sm hover:shadow-md"
                >
                  <FileText className="w-4 h-4" />
                  <span>Officer Login</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#3E2723] text-center text-white">
        <div className="max-w-4xl mx-auto px-4">
          <blockquote className="text-2xl md:text-3xl font-heading italic text-slate-200 mb-8 leading-relaxed">
            "For the first time, I didn't have to wait three months to know if someone believed my crops were ruined. The proof was in the photo."
          </blockquote>
          <p className="text-[var(--color-marigold)] font-bold">— Devendra, Wardha District</p>
        </div>
      </section>

      {/* ─── FOOTER CTA ─── */}
      <section className="py-24 bg-[var(--color-marigold)] text-center px-4 border-b-4 border-[var(--color-base-dark)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-[var(--color-base-dark)] font-heading mb-6">Ready to fix the system?</h2>
          <p className="text-xl text-[var(--color-base-dark)]/70 mb-10 font-medium">Transparency and trust for India's farmers.</p>
          <Button 
            onClick={() => navigate('/farmer/login')}
            className="px-10 py-4 bg-[var(--color-base-dark)] hover:bg-[var(--color-base-dark)]/85 text-white font-bold text-lg rounded-xl shadow-2xl transition-all"
          >
            File Your First Claim
          </Button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white py-8 border-t border-[var(--color-border-default)]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[var(--color-text-secondary)] font-medium">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-[var(--color-marigold)] text-[var(--color-base-dark)] px-2 py-0.5 rounded-md text-sm">K</span>
            <span className="font-bold text-[var(--color-base-dark)]">KrishiSeva © 2026</span>
          </div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[var(--color-accent)] transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-[var(--color-accent)] transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-[var(--color-accent)] transition-colors">English / हिन्दी</a>
          </div>
        </div>
      </footer>

      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white shadow-lg transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center border border-[var(--color-accent)]/20 cursor-pointer animate-fade-in"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </div>
  );
}
