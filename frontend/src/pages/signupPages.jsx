import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, Brain, Zap, Shield, Map, Target,
  CheckCircle, BarChart3, Rocket, ChevronRight, FileText
} from 'lucide-react';
import SignupForm from '../components/auth/signupForm.jsx';

/* ─────────────────────────────────────────
   Mini floating card component
───────────────────────────────────────── */
function FloatBadge({ children, className = '', style = {} }) {
  return (
    <div
      className={`absolute backdrop-blur-xl bg-white/6 border border-white/12 rounded-2xl shadow-dark-lg ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

const SignupPage = () => {
  /* Typing animation for the left-panel headline */
  const roles = ['React Developer', 'Data Scientist', 'Product Manager', 'ML Engineer', 'Backend Engineer'];
  const [typed, setTyped] = useState('');
  const [rIdx, setRIdx] = useState(0);
  const [cIdx, setCIdx] = useState(0);
  const [del, setDel] = useState(false);

  useEffect(() => {
    const r = roles[rIdx];
    let t;
    if (!del && cIdx < r.length) {
      t = setTimeout(() => { setTyped(r.slice(0, cIdx + 1)); setCIdx(c => c + 1); }, 90);
    } else if (!del && cIdx === r.length) {
      t = setTimeout(() => setDel(true), 2000);
    } else if (del && cIdx > 0) {
      t = setTimeout(() => { setTyped(r.slice(0, cIdx - 1)); setCIdx(c => c - 1); }, 45);
    } else {
      setDel(false);
      setRIdx(i => (i + 1) % roles.length);
    }
    return () => clearTimeout(t);
  }, [cIdx, del, rIdx]);

  /* Skill gap mock progress bars — animate on mount */
  const [barsMounted, setBarsMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBarsMounted(true), 600);
    return () => clearTimeout(t);
  }, []);

  const skills = [
    { name: 'React / TypeScript', match: 85, col: 'from-primary-500 to-accent-500' },
    { name: 'System Design', match: 42, col: 'from-danger-500 to-warning-500' },
    { name: 'AWS / Cloud', match: 30, col: 'from-danger-600 to-energy-500' },
    { name: 'Testing (Jest)', match: 60, col: 'from-fresh-500 to-accent-500' },
  ];

  const perks = [
    { icon: Zap, label: 'AI analysis in 60 seconds', col: 'text-primary-400', bg: 'bg-primary-600/15' },
    { icon: Map, label: 'Personalized 90-day roadmap', col: 'text-fresh-400', bg: 'bg-fresh-600/15' },
    { icon: Target, label: 'Skill gap visibility & ATS score', col: 'text-energy-400', bg: 'bg-energy-600/15' },
  ];

  return (
    <div className="h-screen bg-neutral-950 flex overflow-hidden font-inter">

      {/* ══════════════════════════════════
          LEFT — Visual Showcase Panel
      ══════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] relative overflow-hidden flex-col justify-center px-12 xl:px-16 border-r border-white/5 bg-[#080d1a]">

        {/* Aurora bg */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-24 w-[560px] h-[560px] bg-primary-700/30 rounded-full blur-[130px] animate-aurora-1" />
          <div className="absolute top-[30%] right-[-10%] w-[480px] h-[480px] bg-fresh-600/15 rounded-full blur-[110px] animate-aurora-2" />
          <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-energy-600/10 rounded-full blur-[140px] animate-aurora-3" />
        </div>

        {/* Match score card — top right */}
        <FloatBadge className="top-12 right-6 w-44 p-4 animate-float" style={{ animationDelay: '0s' }}>
          <div className="text-[10px] text-neutral-500 mb-1 tracking-widest uppercase font-bold">Match Score</div>
          <div className="text-3xl font-black text-white leading-none">73<span className="text-base text-neutral-400">%</span></div>
          <div className="flex items-center gap-1 text-success-400 text-[10px] mt-1.5 font-bold">
            <CheckCircle className="w-3 h-3" />
            <span>Senior FE Role</span>
          </div>
          <div className="mt-3 h-1 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full rounded-full" style={{
              width: barsMounted ? '73%' : '0%',
              background: 'linear-gradient(90deg,#7c3aed,#06b6d4)',
              transition: 'width 1.4s ease'
            }} />
          </div>
        </FloatBadge>

        {/* ATS card — bottom center-ish (Elegant balance) */}
        <FloatBadge className="bottom-12 right-12 w-44 p-4 animate-float" style={{ animationDelay: '1.2s' }}>
          <div className="text-[10px] text-neutral-500 mb-1 tracking-widest uppercase font-bold">System Rating</div>
          <div className="text-3xl font-black text-white leading-none">8.2<span className="text-sm text-neutral-500 font-normal ml-1">/10</span></div>
          <div className="text-[10px] text-success-400 mt-1.5 font-bold">Market Ready</div>
        </FloatBadge>

        <div className="relative z-10 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              boxShadow: '0 0 24px rgba(124,58,237,0.4)'
            }}>
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-widest uppercase">
              TakeU<span className="text-primary-400">Upward</span>
            </span>
          </div>

          <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.05] mb-6 tracking-tight">
            Elevate to a<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-accent-400 to-fresh-400">
              {typed}<span className="text-primary-500 animate-pulse">|</span>
            </span>
            <br />Today
          </h2>

          <p className="text-neutral-400 text-sm xl:text-base leading-relaxed mb-10 max-w-sm">
            AI-powered skill gap analysis and personalized roadmaps to bridge the gap between where you are and where you want to be.
          </p>

          <ul className="space-y-3.5 mb-10">
            {perks.map((p, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className={`w-8 h-8 ${p.bg} rounded-lg flex items-center justify-center flex-shrink-0 border border-white/5`}>
                  <p.icon className={`w-4 h-4 ${p.col}`} />
                </div>
                <span className="text-sm font-medium text-neutral-300">{p.label}</span>
              </li>
            ))}
          </ul>

          <div className="bg-white/4 border border-white/8 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-primary-400" />
              <span className="text-[11px] font-black text-neutral-400 uppercase tracking-widest">Market Analysis Check</span>
            </div>
            <div className="space-y-4">
              {skills.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] mb-1.5 font-bold uppercase tracking-wide">
                    <span className="text-neutral-500">{s.name}</span>
                    <span className={s.match >= 70 ? 'text-success-400' : 'text-danger-400'}>{s.match}%</span>
                  </div>
                  <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${s.col}`}
                      style={{ width: barsMounted ? `${s.match}%` : '0%', transition: `width 1.6s ease ${i * 0.1}s` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          RIGHT — Form Panel
      ══════════════════════════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative overflow-y-auto no-scrollbar bg-neutral-950">
        
        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 60% 40%, rgba(124,58,237,0.06) 0%, transparent 55%)'
        }} />

        <Link to="/" className="absolute top-6 left-6 text-neutral-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold tracking-tight">
          <ArrowLeft className="w-4 h-4" /> BACK TO PORTAL
        </Link>

        <div className="w-full max-w-[460px] relative z-10 py-8">
          <div className="mb-8 text-center sm:text-left">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Initialize Journey.</h1>
            <p className="text-neutral-500 text-sm font-medium tracking-tight">Create your account to unlock AI-driven career acceleration.</p>
          </div>

          <div className="bg-white/4 border border-white/8 rounded-[32px] p-7 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
             <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/30 to-transparent opacity-50" />
             <SignupForm />
          </div>

          <div className="mt-8 bg-primary-600/8 border border-primary-600/15 rounded-[24px] p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                <Rocket className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-xs font-black text-white uppercase tracking-widest mb-0.5">Automated Lifecycle</p>
                <p className="text-[11px] text-neutral-500 font-medium">Upload ➔ Analyze ➔ Target ➔ Roadmap ➔ Success</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;