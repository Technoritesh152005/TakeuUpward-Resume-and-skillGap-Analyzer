import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Brain, Map, Shield, Upload, Search, BarChart3, Rocket,
  CheckCircle, ArrowRight, Zap, Target, ChevronRight, Sparkles,
  TrendingUp, FileText, Database
} from 'lucide-react';
import Navbar from '../components/layout/navbar.jsx';
import Footer from '../components/layout/footer.jsx';

/* ─────────────────────────────────────────────
   Hooks
───────────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect(); }
    }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/* ─────────────────────────────────────────────
   Stat Counter
───────────────────────────────────────────── */
function StatCounter({ target, suffix, label, sub, colorClass }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = null;
      const tick = (ts) => {
        if (!start) start = ts;
        const p = Math.min((ts - start) / 1800, 1);
        setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return (
    <div ref={ref} className="text-center group cursor-default">
      <div className={`text-5xl md:text-6xl font-black ${colorClass} mb-2 group-hover:scale-110 transition-transform duration-300`}>
        {val}{suffix}
      </div>
      <div className="text-base font-bold text-white mb-1">{label}</div>
      <div className="text-sm text-neutral-500">{sub}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();

  // Typewriter
  const phrases = ['Parse Complex Resumes', 'Detect Critical Skill Gaps', 'Optimize ATS Compatibility', 'Generate Technical Roadmaps'];
  const [typed, setTyped] = useState('');
  const [pIdx, setPIdx] = useState(0);
  const [cIdx, setCIdx] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const p = phrases[pIdx];
    let t;
    if (!del && cIdx < p.length) {
      t = setTimeout(() => { setTyped(p.slice(0, cIdx + 1)); setCIdx(c => c + 1); }, 100);
    } else if (!del && cIdx === p.length) {
      t = setTimeout(() => setDel(true), 2200);
    } else if (del && cIdx > 0) {
      t = setTimeout(() => { setTyped(p.slice(0, cIdx - 1)); setCIdx(c => c - 1); }, 55);
    } else {
      setDel(false);
      setPIdx(i => (i + 1) % phrases.length);
    }
    return () => clearTimeout(t);
  }, [cIdx, del, pIdx]);

  // Section reveals
  const [featRef, featVis] = useInView();
  const [stepsRef, stepsVis] = useInView();
  const [previewRef, previewVis] = useInView();
  const [statsRef, statsVis] = useInView();
  const [ctaRef, ctaVis] = useInView();

  const features = [
    {
      icon: Brain,
      title: 'Neural Skill Extraction',
      desc: 'Our inference engine dissects your resume against real-world job requirements, identifying structural and semantic gaps with high precision.',
      bullets: ['Semantic entity recognition', 'Cross-role gap analysis', 'Contextual skill weighting'],
      grad: 'from-primary-600/20 to-transparent',
      border: 'border-primary-600/25 hover:border-primary-500/50',
      iconBg: 'bg-primary-600/20',
      iconCol: 'text-primary-400',
    },
    {
      icon: Map,
      title: 'Adaptive Learning Logic',
      desc: 'Generates an algorithmic roadmap based on detected gaps. Each plan is structured into digestible technical sprints with validated resources.',
      bullets: ['Sprint-based learning paths', 'Validated resource mapping', 'Milestone-based tracking'],
      grad: 'from-fresh-600/20 to-transparent',
      border: 'border-fresh-600/25 hover:border-fresh-500/50',
      iconBg: 'bg-fresh-600/20',
      iconCol: 'text-fresh-400',
    },
    {
      icon: Shield,
      title: 'ATS Engine Optimization',
      desc: 'Simulates modern Applicant Tracking Systems (ATS) to identify missing keywords and formatting issues that block automated screening.',
      bullets: ['ATS compatibility scoring', 'Keyword density simulation', 'Structural validation'],
      grad: 'from-energy-600/20 to-transparent',
      border: 'border-energy-600/25 hover:border-energy-500/50',
      iconBg: 'bg-energy-600/20',
      iconCol: 'text-energy-400',
    },
  ];

  const steps = [
    { num: '01', icon: Upload, title: 'Data Ingestion', desc: 'Securely upload PDF/DOCX. Our parser extracts experience and technical headers.', col: 'text-primary-400', bg: 'bg-primary-600/15' },
    { num: '02', icon: Search, title: 'Role Mapping', desc: 'Select target job clusters or specific roles from our 50+ technical role database.', col: 'text-fresh-400', bg: 'bg-fresh-600/15' },
    { num: '03', icon: BarChart3, title: 'AI Inference', desc: 'Deep analysis of skill alignment, readiness levels, and critical technical deficits.', col: 'text-energy-400', bg: 'bg-energy-600/15' },
    { num: '04', icon: Rocket, title: 'Roadmap Execution', desc: 'Initialize your 90-day learning pipeline with curated technical resources.', col: 'text-accent-400', bg: 'bg-accent-600/15' },
  ];

  const marquee = [
    '\u26a1 AI-Powered Intelligence', '\ud83c\udfaf Neural Gap Detection', '\ud83d\uddfa\ufe0f Adaptive Roadmap',
    '\ud83d\udcca ATS Engine Optimization', '\ud83e\udd16 LLM-Driven Insights', '\ud83d\udcc4 Multi-Format Extraction',
    '50+ Technical Roles', '\ud83d\udd10 Secure Authentication', '⚙\ufe0f Built with React & Vite',
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-x-hidden">

      {/* ── Extra CSS ─────────────────────────── */}
      <style>{`
        @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .marquee-track { animation: marquee 32s linear infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor-blink { animation: blink 1s step-end infinite; }
        @keyframes grad-shift {
          0%,100%{background-position:0% 50%}
          50%{background-position:100% 50%}
        }
        .text-grad-anim {
          background: linear-gradient(270deg,#8b5cf6,#06b6d4,#d946ef,#3b82f6,#8b5cf6);
          background-size: 400% 400%;
          animation: grad-shift 5s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        @keyframes float-a {
          0%,100%{transform:translateY(0px) rotate(0deg)}
          40%{transform:translateY(-10px) rotate(0.6deg)}
          70%{transform:translateY(-4px) rotate(-0.4deg)}
        }
        @keyframes float-b {
          0%,100%{transform:translateY(0px) rotate(0deg)}
          50%{transform:translateY(-14px) rotate(-0.8deg)}
        }
        .float-a { animation: float-a 7s ease-in-out infinite; }
        .float-b { animation: float-b 8s ease-in-out 1.5s infinite; }
        .float-c { animation: float-a 9s ease-in-out 3s infinite; }
        @keyframes arc-draw {
          from { stroke-dashoffset: 220; }
          to   { stroke-dashoffset: 58; }
        }
        .arc { animation: arc-draw 2s ease-out 0.4s forwards; }
        .reveal {
          opacity: 0;
          transform: translateY(28px);
          transition: opacity 0.65s ease, transform 0.65s ease;
        }
        .reveal.vis { opacity: 1; transform: translateY(0); }
        .rev-d1 { transition-delay: 0.10s; }
        .rev-d2 { transition-delay: 0.20s; }
        .rev-d3 { transition-delay: 0.30s; }
        .rev-d4 { transition-delay: 0.40s; }
        @keyframes glow-pulse {
          0%,100%{opacity:.5} 50%{opacity:.9}
        }
        .glow-bar { animation: glow-pulse 3s ease-in-out infinite; }
      `}</style>

      <Navbar />
      <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
        {/* Aurora blobs */}
        <div className="absolute inset-0 bg-neutral-950 pointer-events-none">
          <div className="absolute -top-40 -left-32 w-[650px] h-[650px] bg-primary-700/20 rounded-full blur-[130px]" />
          <div className="absolute top-20 -right-40 w-[550px] h-[550px] bg-fresh-600/15 rounded-full blur-[110px]" />
          <div className="absolute -bottom-32 left-[25%] w-[700px] h-[700px] bg-energy-600/10 rounded-full blur-[150px]" />
        </div>

        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.04) 1px,transparent 1px)',
          backgroundSize: '64px 64px'
        }} />

        <div className="container-custom relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <div className="text-center lg:text-left">
              {/* Headline */}
              <h1 className="text-5xl md:text-6xl xl:text-[4.5rem] font-extrabold leading-[1.06] mb-6 tracking-tight animate-slide-up">
                <span className="text-white font-black italic">TakeU</span><span className="text-white">Upward</span>
                <br />
                <span className="text-grad-anim min-h-[1.1em] block">
                  {typed}<span className="cursor-blink text-primary-400">|</span>
                </span>
                <span className="text-white">Career Engine</span>
              </h1>

              {/* Sub */}
              <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-[520px] mx-auto lg:mx-0 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Systematically bridge the gap between your professional experience and technical benchmarks. 
                Identify <span className="text-white font-semibold">structural skill deficits</span> and 
                verify <span className="text-primary-400 font-semibold">ATS index performance</span> through semantic analysis.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <button
                  onClick={() => navigate('/signup')}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white overflow-hidden transition-all duration-300 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 0 48px rgba(124,58,237,0.45)' }}
                >
                  <Rocket className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10">Analyze Profile Readiness</span>
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-neutral-200 border border-neutral-700 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-neutral-500 transition-all duration-300 hover:scale-105"
                >
                  Access Dashboard <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Key Trust Points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:justify-start text-xs font-bold text-neutral-500 uppercase tracking-widest animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {[
                  { t: 'Enterprise Parsing', d: 'PDF/DOCX Recovery' },
                  { t: 'ATS Indexing', d: 'Semantic Validation' },
                  { t: 'Growth Pipelines', d: 'Deterministic Paths' },
                ].map((p, i) => (
                  <div key={i} className="flex flex-col gap-1 border-l border-neutral-800 pl-4 py-1">
                    <span className="text-white">{p.t}</span>
                    <span className="text-[10px] text-neutral-600">{p.d}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Floating UI Cards */}
            <div className="relative h-[540px] hidden lg:flex items-center justify-center">

              {/* Main Analysis Card */}
              <div className="float-a absolute top-4 right-0 w-[340px] bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-dark-lg">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-[11px] text-neutral-500 mb-0.5">Resume Analysis</div>
                    <div className="text-sm font-semibold text-white">Software Engineer Role</div>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-success-600/20 border border-success-600/30 rounded-full">
                    <div className="w-1.5 h-1.5 bg-success-400 rounded-full animate-pulse" />
                    <span className="text-[11px] text-success-300 font-medium">Complete</span>
                  </div>
                </div>

                {/* Score Ring */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                      <circle cx="40" cy="40" r="32" fill="none" stroke="url(#sg)" strokeWidth="6"
                        strokeLinecap="round" strokeDasharray="201" strokeDashoffset="220" className="arc" />
                      <defs>
                        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold text-white">73</span>
                      <span className="text-[10px] text-neutral-500">match</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[
                      { l: 'Technical', v: 80, c: 'bg-primary-500' },
                      { l: 'Soft Skills', v: 65, c: 'bg-fresh-500' },
                      { l: 'Experience', v: 70, c: 'bg-energy-500' },
                    ].map(b => (
                      <div key={b.l}>
                        <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                          <span>{b.l}</span><span>{b.v}%</span>
                        </div>
                        <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                          <div className={`h-full ${b.c} rounded-full`} style={{ width: `${b.v}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                <div>
                  <div className="text-[11px] text-neutral-500 font-medium mb-2">Critical Gaps</div>
                  <div className="flex flex-wrap gap-1.5">
                    {['System Design', 'Kubernetes', 'GraphQL', 'Redis', 'AWS'].map(s => (
                      <span key={s} className="px-2 py-0.5 bg-danger-600/20 border border-danger-600/25 text-danger-300 text-[11px] rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ATS Card */}
              <div className="float-b absolute bottom-16 left-2 w-[190px] bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-dark-lg">
                <div className="text-[11px] text-neutral-500 mb-1">ATS Score</div>
                <div className="text-4xl font-black text-white">82<span className="text-base text-neutral-500">/100</span></div>
                <div className="flex items-center gap-1 text-success-400 text-xs mt-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12 pts possible</span>
                </div>
                <div className="mt-3 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full glow-bar" style={{
                    width: '82%',
                    background: 'linear-gradient(90deg,#7c3aed,#06b6d4)'
                  }} />
                </div>
              </div>

              {/* Roadmap Card */}
              <div className="float-c absolute top-[42%] -left-4 w-[175px] bg-neutral-900/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-dark-lg">
                <div className="text-[11px] text-neutral-500 mb-1">Your Roadmap</div>
                <div className="text-3xl font-black text-white">90<span className="text-sm text-neutral-400"> days</span></div>
                <div className="space-y-2 mt-3">
                  {[
                    { w: 'Wk 1–2', s: 'System Design', done: false },
                    { w: 'Wk 3–4', s: 'Kubernetes', done: false },
                    { w: 'Wk 5–6', s: 'GraphQL', done: false },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${r.done ? 'bg-success-400' : 'bg-neutral-700'}`} />
                      <div>
                        <div className="text-[9px] text-neutral-600">{r.w}</div>
                        <div className="text-[11px] text-neutral-300 font-medium">{r.s}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
      </section>

      {/* ════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════ */}
      <section id="features" className="section-padding relative overflow-hidden bg-neutral-950">
        <div className="container-custom relative">
          {/* Header */}
          <div ref={featRef} className={`reveal ${featVis ? 'vis' : ''} text-center mb-16`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/10 border border-primary-500/20 mb-6">
              <Brain className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-primary-300">Core Capabilities</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Strategic <span className="text-grad-anim">Professional</span> Alignment
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Our system leverages semantic extraction and adaptive benchmarks to reconcile profile data with industry standards.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className={`reveal ${featVis ? 'vis' : ''} rev-d1 group relative rounded-2xl bg-gradient-to-br from-primary-600/20 to-transparent border border-primary-600/25 p-8 transition-all duration-500 cursor-default`}>
              <div className="w-14 h-14 bg-primary-600/20 rounded-2xl flex items-center justify-center mb-6 border border-white/8">
                <Brain className="w-7 h-7 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Automated Technical Indexing</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-5">High-fidelity profile extraction mapping semantic entities against verifiable role benchmarks.</p>
              <ul className="space-y-2">
                {['Role-aware entity extraction', 'Semantic skill correlation', 'Competency hierarchy mapping'].map((b, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-neutral-300">
                    <ChevronRight className="w-4 h-4 text-primary-400" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`reveal ${featVis ? 'vis' : ''} rev-d2 group relative rounded-2xl bg-gradient-to-br from-fresh-600/20 to-transparent border border-fresh-600/25 p-8 transition-all duration-500 cursor-default`}>
              <div className="w-14 h-14 bg-fresh-600/20 rounded-2xl flex items-center justify-center mb-6 border border-white/8">
                <Map className="w-7 h-7 text-fresh-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Strategic Competency Benchmarking</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-5">Generates precise deficit roadmaps structured into execution-ready technical sprints.</p>
              <ul className="space-y-2">
                {['Gap-to-Goal alignment', 'Validated resource indexing', 'Targeted learning pathways'].map((b, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-neutral-300">
                    <ChevronRight className="w-4 h-4 text-fresh-400" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`reveal ${featVis ? 'vis' : ''} rev-d3 group relative rounded-2xl bg-gradient-to-br from-energy-600/20 to-transparent border border-energy-600/25 p-8 transition-all duration-500 cursor-default`}>
              <div className="w-14 h-14 bg-energy-600/20 rounded-2xl flex items-center justify-center mb-6 border border-white/8">
                <Shield className="w-7 h-7 text-energy-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Algorithmic Screening Simulation</h3>
              <p className="text-sm text-neutral-400 leading-relaxed mb-5">Predictive scoring that simulates modern screening systems to detect structural and keyword indexing issues.</p>
              <ul className="space-y-2">
                {['ATS syntax validation', 'Keyword density indexing', 'Structural barrier detection'].map((b, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-neutral-300">
                    <ChevronRight className="w-4 h-4 text-energy-400" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SYSTEMATIC PIPELINE
      ════════════════════════════════════════ */}
      <section id="workflow" className="section-padding bg-neutral-900/50">
        <div className="container-custom">
          <div ref={stepsRef} className={`reveal ${stepsVis ? 'vis' : ''} text-center mb-16`}>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">
              Systematic <span className="text-grad-anim">Processing</span> Pipeline
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              A 5-step deterministic flow designed to align professional profiles with high-growth technical trajectories.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 relative">
            {[
              { t: 'Profile Ingestion', d: 'Semantic extraction of experience data from unstructured documents.', i: FileText, c: 'text-primary-400' },
              { t: 'Goal Definition', d: 'Benchmarking against specific roles and enterprise-level requirements.', i: Target, c: 'text-fresh-400' },
              { t: 'Gap Analysis', d: 'Identifying structural deficits in skills, keywords, and syntax.', i: Search, c: 'text-energy-400' },
              { t: 'Benchmarking', d: 'Ranking profile readiness against verified industry datasets.', i: BarChart3, c: 'text-accent-400' },
              { t: 'Execution Roadmap', d: 'Generating a sprint-based plan to resolve identified deficits.', i: Map, c: 'text-primary-400' }
            ].map((s, i) => (
              <div key={i} className={`reveal ${stepsVis ? 'vis' : ''} rev-d${i+1} flex flex-col items-center text-center p-6 rounded-2xl bg-neutral-950 border border-neutral-800 transition-all duration-300 hover:border-neutral-600`}>
                <div className={`w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center mb-4 border border-white/5`}>
                  <s.i className={`w-6 h-6 ${s.c}`} />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">{s.t}</h4>
                <p className="text-xs text-neutral-500 leading-relaxed">{s.d}</p>
                {i < 4 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 translate-x-1/2 -translate-y-1/2 z-20">
                    <ArrowRight className="w-4 h-4 text-neutral-800" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-10 py-4 rounded-2xl font-bold text-white transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 0 40px rgba(124,58,237,0.3)' }}
            >
              Initialize Profile Scan
            </button>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          ANALYSIS PREVIEW
      ════════════════════════════════════════ */}
      <section ref={previewRef} className={`reveal ${previewVis ? 'vis' : ''} section-padding relative overflow-hidden bg-neutral-950`}>
        <div className="container-custom relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg- energy-600/10 border border-energy-500/20 mb-6">
              <BarChart3 className="w-4 h-4 text-energy-400" />
              <span className="text-sm font-semibold text-energy-300">Data Points & Insights</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Comprehensive <span className="text-grad-anim">Recruiter</span> Output
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Our system generates multi-dimensional metrics across technical readiness and ATS compatibility.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-neutral-900/70 backdrop-blur-xl rounded-3xl border border-white/8 overflow-hidden shadow-dark-lg">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-neutral-950/60">
              <div className="w-3 h-3 rounded-full bg-danger-600/60" />
              <div className="w-3 h-3 rounded-full bg-warning-600/60" />
              <div className="w-3 h-3 rounded-full bg-success-600/60" />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Inference Context</div>
                  <div className="text-2xl font-bold text-white">Fullstack Engineering Lead</div>
                  <div className="text-sm text-neutral-500 mt-1">Node.js \u00b7 System Design \u00b7 Leadership</div>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <div className="px-5 py-3 bg-success-600/15 border border-success-600/25 rounded-xl text-center">
                    <div className="text-3xl font-black text-success-400">92%</div>
                    <div className="text-xs text-neutral-500">Role Fit</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-success-300 mb-3">
                    <CheckCircle className="w-4 h-4" /> Technical Strengths
                  </div>
                  <div className="space-y-2">
                    {['Distributed Systems Design', 'Microservices Orchestration', 'Strategic Team Leadership'].map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-neutral-900/50 border border-white/5 rounded-xl">
                        <div className="w-2 h-2 bg-success-400 rounded-full flex-shrink-0" />
                        <span className="text-sm text-neutral-300">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-danger-300 mb-3">
                    <Target className="w-4 h-4" /> Structural Deficits
                  </div>
                  <div className="space-y-2">
                    {[
                      { s: 'Go/Golang Efficiency', l: 'Critical' },
                      { s: 'GCP Data Pipeline', l: 'Important' },
                      { s: 'Kubernetes Auth Patterns', l: 'Important' }
                    ].map((g, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-neutral-900/50 border border-white/5 rounded-xl">
                        <span className="text-sm text-neutral-300">{g.s}</span>
                        <span className="text-[10px] font-bold text-danger-400 uppercase">{g.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          ARCHITECTURE
      ════════════════════════════════════════ */}
      <section className="section-padding relative overflow-hidden bg-neutral-950 border-t border-neutral-900/50">
        <div className="container-custom relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-600/10 border border-primary-500/20 mb-6 font-mono text-[10px] text-primary-400 uppercase font-bold tracking-widest">
                Internal Architecture
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-8 tracking-tight">
                Built for <span className="text-grad-anim">Reliable</span> Technical Intelligence
              </h2>
              
              <div className="space-y-6">
                {[
                  { t: 'Asynchronous Workflow', d: 'Queue-based processing via BullMQ and Redis ensures 100% job reliability even under high structural load.', i: Shield },
                  { t: 'Heuristic Mapping', d: 'Proprietary mapping logic that reconciles non-standard job titles with international technical standards.', i: Zap },
                  { t: 'Semantic Signal Recovery', d: 'Advanced LLM context windowing to recover implicit skills from resume bullet points.', i: Brain }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-5 group">
                    <div className="w-12 h-12 rounded-xl bg-neutral-900 flex-shrink-0 flex items-center justify-center border border-white/5 group-hover:bg-primary-600/20 transition-colors">
                      <item.i className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white mb-1">{item.t}</h4>
                      <p className="text-neutral-500 text-sm leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-primary-600/20 blur-[120px] rounded-full" />
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-neutral-900/50 backdrop-blur-xl p-8 flex flex-col justify-center items-center text-center">
                <div className="w-24 h-24 rounded-full bg-primary-500/10 flex items-center justify-center mb-8">
                  <Database className="w-12 h-12 text-primary-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Account-Based Security</h3>
                <p className="text-neutral-400 max-w-sm mb-8 leading-relaxed">
                  Your professional data is encrypted in transit and at rest. We implement secure access controls to protect your career records.
                </p>
                <div className="flex gap-4">
                  <div className="px-4 py-2 rounded-lg bg-neutral-800 border border-white/5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">AES-256</div>
                  <div className="px-4 py-2 rounded-lg bg-neutral-800 border border-white/5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">TLS 1.3</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="section-padding relative overflow-hidden">
        <div className="container-custom relative text-center">
          <div className="max-w-3xl mx-auto py-20 px-10 rounded-[3rem] bg-gradient-to-br from-primary-600 to-indigo-900 relative overflow-hidden">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 relative z-10 italic">TakeUUpward</h2>
            <p className="text-lg text-white/80 mb-10 relative z-10 max-w-xl mx-auto">
              Align your technical profile with industry standards today. Experience precision career strategy.
            </p>
            <button
              onClick={() => navigate('/signup')}
              className="px-10 py-5 rounded-2xl bg-white text-primary-600 font-bold text-lg hover:scale-105 transition-transform shadow-2xl relative z-10"
            >
              Analyze Profile Now
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
