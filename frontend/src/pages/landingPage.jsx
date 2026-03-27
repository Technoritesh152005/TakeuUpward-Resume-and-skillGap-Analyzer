import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  Brain, Map, Shield, Upload, Search, BarChart3, Rocket,
  CheckCircle, ArrowRight, Zap, Target, ChevronRight, Sparkles,
  TrendingUp, FileText
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
  const phrases = ['Dream Job', 'Tech Career', 'Next Role', 'Dream Salary'];
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
      title: 'AI-Powered Gap Analysis',
      desc: 'Claude AI dissects your resume against real job requirements, exposing exactly what\'s holding you back — with pinpoint precision.',
      bullets: ['Critical vs nice-to-have gaps', 'Strength identification', 'Keyword density analysis'],
      grad: 'from-primary-600/20 to-transparent',
      border: 'border-primary-600/25 hover:border-primary-500/50',
      iconBg: 'bg-primary-600/20',
      iconCol: 'text-primary-400',
    },
    {
      icon: Map,
      title: '90-Day Learning Roadmap',
      desc: 'No more guessing what to study. Get a structured week-by-week plan with curated resources, hands-on projects, and milestones.',
      bullets: ['Curated resources per skill', 'Week-by-week schedule', 'Progress milestone tracking'],
      grad: 'from-fresh-600/20 to-transparent',
      border: 'border-fresh-600/25 hover:border-fresh-500/50',
      iconBg: 'bg-fresh-600/20',
      iconCol: 'text-fresh-400',
    },
    {
      icon: Shield,
      title: 'ATS Score Optimizer',
      desc: 'Beat the bots. Know your ATS compatibility score and get keyword recommendations to pass automated screening systems.',
      bullets: ['ATS compatibility score', 'Missing keyword detection', 'Format optimization tips'],
      grad: 'from-energy-600/20 to-transparent',
      border: 'border-energy-600/25 hover:border-energy-500/50',
      iconBg: 'bg-energy-600/20',
      iconCol: 'text-energy-400',
    },
  ];

  const steps = [
    { num: '01', icon: Upload, title: 'Upload Resume', desc: 'Drop your PDF or DOCX. Skills, experience, and education — extracted instantly.', col: 'text-primary-400', bg: 'bg-primary-600/15' },
    { num: '02', icon: Search, title: 'Pick Target Role', desc: 'Choose from 50+ curated job roles or search for your exact dream position.', col: 'text-fresh-400', bg: 'bg-fresh-600/15' },
    { num: '03', icon: BarChart3, title: 'AI Analysis', desc: 'Match score, skill gaps, strengths, and ATS score revealed in seconds.', col: 'text-energy-400', bg: 'bg-energy-600/15' },
    { num: '04', icon: Rocket, title: 'Follow Roadmap', desc: 'Execute your 90-day plan with resources, projects, and progress tracking.', col: 'text-accent-400', bg: 'bg-accent-600/15' },
  ];

  const marquee = [
    '⚡ AI-Powered Analysis', '🎯 Skill Gap Detection', '🗺️ 90-Day Roadmap',
    '📊 ATS Optimization', '🤖 Claude AI Inside', '📄 PDF & DOCX Support',
    '50+ Job Roles', '🔐 Secure Auth', '100% Free', '⚙️ Built with React',
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

      {/* ════════════════════════════════════════
          HERO
      ════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center pt-20 pb-16 overflow-hidden">
        {/* Aurora blobs */}
        <div className="absolute inset-0 bg-neutral-950 pointer-events-none">
          <div className="absolute -top-40 -left-32 w-[650px] h-[650px] bg-primary-700/30 rounded-full blur-[130px] animate-aurora-1" />
          <div className="absolute top-20 -right-40 w-[550px] h-[550px] bg-fresh-600/20 rounded-full blur-[110px] animate-aurora-2" />
          <div className="absolute -bottom-32 left-[25%] w-[700px] h-[700px] bg-energy-600/15 rounded-full blur-[150px] animate-aurora-3" />
          <div className="absolute top-[45%] left-[2%] w-[380px] h-[380px] bg-accent-600/18 rounded-full blur-[90px] animate-aurora-4" />
        </div>

        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(139,92,246,0.055) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,0.055) 1px,transparent 1px)',
          backgroundSize: '64px 64px'
        }} />

        <div className="container-custom relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/12 border border-primary-500/30 mb-8 backdrop-blur-sm animate-fade-in">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-primary-300">Powered by Claude AI · 100% Free for Students</span>
              </div>

              {/* Headline */}
              <h1 className="text-5xl md:text-6xl xl:text-[4.5rem] font-extrabold leading-[1.06] mb-6 tracking-tight animate-slide-up">
                <span className="text-white">Land Your</span>
                <br />
                <span className="text-grad-anim min-h-[1.1em] block">
                  {typed}<span className="cursor-blink text-primary-400">|</span>
                </span>
                <span className="text-white">With AI Precision</span>
              </h1>

              {/* Sub */}
              <p className="text-lg md:text-xl text-neutral-400 mb-10 max-w-[480px] mx-auto lg:mx-0 leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Upload your resume. Get an AI analysis in{' '}
                <span className="text-white font-semibold">60 seconds</span>. Bridge skill gaps with a personal{' '}
                <span className="text-primary-400 font-semibold">90-day roadmap</span>.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <button
                  onClick={() => navigate('/signup')}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-white overflow-hidden transition-all duration-300 hover:scale-105"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 0 48px rgba(124,58,237,0.45),0 4px 20px rgba(0,0,0,0.35)' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <Zap className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10">Analyze My Resume Free</span>
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base text-neutral-200 border border-neutral-700 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-neutral-500 transition-all duration-300 hover:scale-105"
                >
                  Sign In <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              {/* Trust */}
              <div className="flex flex-wrap items-center gap-5 justify-center lg:justify-start text-sm text-neutral-500 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                {['No credit card', 'Results in 60s', 'Privacy protected'].map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-success-400" />
                    <span>{t}</span>
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
          MARQUEE
      ════════════════════════════════════════ */}
      <div className="relative py-4 border-y border-neutral-800/70 bg-neutral-900/40 backdrop-blur-sm overflow-hidden select-none">
        <div className="flex">
          <div className="marquee-track flex whitespace-nowrap">
            {[...marquee, ...marquee].map((item, i) => (
              <span key={i} className="mx-8 text-sm font-medium text-neutral-500">
                {item} <span className="mx-6 text-neutral-700">◆</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════ */}
      <section id="features" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-neutral-950 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-primary-700/8 rounded-full blur-[180px]" />
        </div>

        <div className="container-custom relative">
          {/* Header */}
          <div ref={featRef} className={`reveal ${featVis ? 'vis' : ''} text-center mb-16`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-600/10 border border-primary-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-semibold text-primary-300">Core Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              Everything to Get You{' '}
              <span className="text-grad-anim">Job-Ready</span>
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Stop sending generic resumes. Get AI-powered insights that tell you exactly what to fix.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className={`reveal ${featVis ? 'vis' : ''} rev-d${i + 1} group relative rounded-2xl bg-gradient-to-br ${f.grad} border ${f.border} p-8 hover:-translate-y-2 transition-all duration-500 cursor-default overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10 bg-white pointer-events-none" />
                <div className={`w-14 h-14 ${f.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/8`}>
                  <f.icon className={`w-7 h-7 ${f.iconCol}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed mb-5">{f.desc}</p>
                <ul className="space-y-2">
                  {f.bullets.map((b, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-neutral-300">
                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${f.iconCol}`} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════ */}
      <section id="how-it-works" className="section-padding relative overflow-hidden" style={{
        background: 'linear-gradient(180deg, #080e1a 0%, #0c1220 50%, #080e1a 100%)'
      }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 55%)'
        }} />

        <div className="container-custom relative">
          <div ref={stepsRef} className={`reveal ${stepsVis ? 'vis' : ''} text-center mb-16`}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fresh-600/10 border border-fresh-500/20 mb-6">
              <Zap className="w-4 h-4 text-fresh-400" />
              <span className="text-sm font-semibold text-fresh-300">Simple Process</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              From Upload to Job-Ready
            </h2>
            <p className="text-neutral-500 text-xl font-semibold">in 4 Simple Steps</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-[52px] left-[13%] right-[13%] h-px glow-bar" style={{
              background: 'linear-gradient(90deg,#7c3aed40,#06b6d440,#d946ef40,#3b82f640)'
            }} />

            {steps.map((s, i) => (
              <div
                key={i}
                className={`reveal ${stepsVis ? 'vis' : ''} rev-d${i + 1} group relative bg-neutral-900/60 backdrop-blur-sm rounded-2xl p-6 border border-neutral-800 hover:border-primary-600/40 hover:-translate-y-2 transition-all duration-500 cursor-default`}
              >
                <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 relative z-10 border border-white/8`}>
                  <s.icon className={`w-6 h-6 ${s.col}`} />
                </div>
                <div className="absolute top-5 right-5 text-5xl font-black text-neutral-800/60 select-none group-hover:text-neutral-700/60 transition-colors">{s.num}</div>
                <h3 className="text-base font-bold text-white mb-2 relative z-10">{s.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed relative z-10">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <button
              onClick={() => navigate('/signup')}
              className="group inline-flex items-center gap-3 px-9 py-4 rounded-2xl font-bold text-white text-base transition-all duration-300 hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow: '0 0 48px rgba(124,58,237,0.35)' }}
            >
              <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
              Start Your Journey — It's Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
            <p className="text-sm text-neutral-600 mt-4">Takes less than 2 minutes to get started</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          ANALYSIS PREVIEW
      ════════════════════════════════════════ */}
      <section ref={previewRef} className={`reveal ${previewVis ? 'vis' : ''} section-padding relative overflow-hidden`}>
        <div className="absolute inset-0 bg-neutral-950 pointer-events-none">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-energy-600/10 rounded-full blur-[120px] animate-blob" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent-600/10 rounded-full blur-[120px] animate-blob-delay-2" />
        </div>

        <div className="container-custom relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-energy-600/10 border border-energy-500/20 mb-6">
              <BarChart3 className="w-4 h-4 text-energy-400" />
              <span className="text-sm font-semibold text-energy-300">Live Preview</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-5 tracking-tight">
              See What You'll Get
            </h2>
            <p className="text-lg text-neutral-400 max-w-2xl mx-auto">
              Within 60 seconds, you'll have a complete breakdown — strengths, gaps, and your roadmap.
            </p>
          </div>

          {/* Mock Dashboard Card */}
          <div className="max-w-4xl mx-auto bg-neutral-900/70 backdrop-blur-xl rounded-3xl border border-white/8 overflow-hidden shadow-dark-lg">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5 bg-neutral-950/60">
              <div className="w-3 h-3 rounded-full bg-danger-600/60" />
              <div className="w-3 h-3 rounded-full bg-warning-600/60" />
              <div className="w-3 h-3 rounded-full bg-success-600/60" />
              <div className="flex-1 mx-4 max-w-xs mx-auto">
                <div className="h-5 bg-neutral-800 rounded-full flex items-center px-3">
                  <span className="text-[10px] text-neutral-600">resumeanalyzer.app/analysis/r7k9...</span>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              {/* Role row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
                <div>
                  <div className="text-xs text-neutral-500 mb-1">Analyzing for</div>
                  <div className="text-2xl font-bold text-white">Senior Frontend Engineer</div>
                  <div className="text-sm text-neutral-500 mt-1">React · TypeScript · 5+ yrs experience</div>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <div className="px-5 py-3 bg-success-600/15 border border-success-600/25 rounded-xl text-center">
                    <div className="text-3xl font-black text-success-400">73%</div>
                    <div className="text-xs text-neutral-500">Match</div>
                  </div>
                  <div className="px-5 py-3 bg-accent-600/15 border border-accent-600/25 rounded-xl text-center">
                    <div className="text-3xl font-black text-accent-400">82</div>
                    <div className="text-xs text-neutral-500">ATS</div>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-success-300 mb-3">
                    <CheckCircle className="w-4 h-4" /> Your Strengths
                  </div>
                  <div className="space-y-2">
                    {['React & Component Architecture', 'CSS & Tailwind Expertise', 'REST API Integration', 'Git & Team Collaboration'].map((s, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-success-600/8 border border-success-600/10 rounded-xl">
                        <div className="w-2 h-2 bg-success-400 rounded-full flex-shrink-0" />
                        <span className="text-sm text-neutral-200">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-danger-300 mb-3">
                    <Target className="w-4 h-4" /> Skill Gaps to Bridge
                  </div>
                  <div className="space-y-2">
                    {[
                      { s: 'TypeScript (Advanced)', l: 'Critical', cls: 'bg-danger-600/20 text-danger-300 border-danger-600/20' },
                      { s: 'System Design', l: 'Critical', cls: 'bg-danger-600/20 text-danger-300 border-danger-600/20' },
                      { s: 'Testing (Jest/Cypress)', l: 'Important', cls: 'bg-warning-600/20 text-warning-300 border-warning-600/20' },
                      { s: 'Performance Optimization', l: 'Nice-to-have', cls: 'bg-neutral-700/40 text-neutral-400 border-neutral-700' },
                    ].map((g, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-danger-600/6 border border-danger-600/10 rounded-xl gap-3">
                        <span className="text-sm text-neutral-200 truncate">{g.s}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border flex-shrink-0 ${g.cls}`}>{g.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Roadmap teaser */}
              <div className="mt-6 p-4 bg-primary-600/10 border border-primary-600/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Map className="w-8 h-8 text-primary-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-white">90-Day Roadmap is ready</div>
                    <div className="text-xs text-neutral-500">Start with TypeScript Advanced · Week 1–2</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 rounded-xl text-sm font-semibold text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  Get Yours <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          STATS
      ════════════════════════════════════════ */}
      <section ref={statsRef} className={`reveal ${statsVis ? 'vis' : ''} py-24 relative overflow-hidden`} style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(6,182,212,0.08) 50%, rgba(217,70,239,0.08) 100%)'
      }}>
        <div className="absolute inset-0 border-y border-white/5 pointer-events-none" />
        <div className="container-custom relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
            <StatCounter target={50} suffix="+" label="Job Roles" sub="Tech, design, product" colorClass="text-primary-400" />
            <StatCounter target={90} suffix=" Days" label="Roadmap" sub="Structured learning path" colorClass="text-fresh-400" />
            <StatCounter target={60} suffix="s" label="Analysis Time" sub="Instant AI insights" colorClass="text-energy-400" />
            <StatCounter target={100} suffix="%" label="Always Free" sub="For students & grads" colorClass="text-accent-400" />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════ */}
      <section ref={ctaRef} className={`reveal ${ctaVis ? 'vis' : ''} section-padding relative overflow-hidden`}>
        <div className="absolute inset-0 bg-neutral-950 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.18) 0%, transparent 60%)'
          }} />
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-primary-600/20 to-transparent" />
          <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-fresh-600/20 to-transparent" />
        </div>

        <div className="container-custom relative text-center">
          <div className="max-w-3xl mx-auto">
            {/* Icons */}
            <div className="flex justify-center gap-4 mb-10">
              {[
                { icon: Brain, bg: 'bg-primary-600/20', col: 'text-primary-400', d: '0s' },
                { icon: Map, bg: 'bg-fresh-600/20', col: 'text-fresh-400', d: '0.25s' },
                { icon: Rocket, bg: 'bg-energy-600/20', col: 'text-energy-400', d: '0.5s' },
              ].map((ic, i) => (
                <div key={i} className={`w-16 h-16 ${ic.bg} border border-white/10 rounded-2xl flex items-center justify-center animate-float`} style={{ animationDelay: ic.d }}>
                  <ic.icon className={`w-8 h-8 ${ic.col}`} />
                </div>
              ))}
            </div>

            <h2 className="text-5xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Your Dream Job Is<br />
              <span className="text-grad-anim">Closer Than You Think</span>
            </h2>

            <p className="text-xl text-neutral-400 mb-10 max-w-xl mx-auto">
              Stop guessing. Start analyzing. Land your role with AI-powered clarity and a roadmap built just for you.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <button
                onClick={() => navigate('/signup')}
                className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg text-white overflow-hidden transition-all duration-300 hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 0 60px rgba(124,58,237,0.5),0 4px 24px rgba(0,0,0,0.4)' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Zap className="w-6 h-6 relative z-10 group-hover:rotate-12 transition-transform" />
                <span className="relative z-10">Analyze My Resume Free</span>
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 px-9 py-5 rounded-2xl font-bold text-lg text-neutral-300 border border-neutral-700 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-neutral-600 transition-all duration-300 hover:scale-105"
              >
                Sign In <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-sm text-neutral-600">
              {['No credit card required', '100% free for students', 'Results in 60 seconds', 'Privacy protected'].map((t, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-neutral-700" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;