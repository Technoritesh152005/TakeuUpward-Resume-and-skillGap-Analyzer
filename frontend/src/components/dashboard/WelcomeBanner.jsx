import { useEffect, useState } from 'react';
import { Sparkles, Target, Rocket, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../services/authStore.js'

const WelcomeBanner = () => {
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const displayName = user?.fullName || user?.name || '';
  const firstName = displayName.split(' ')[0] || 'Ritesh';

  return (
    <div className="relative overflow-hidden group">
      <div className="relative z-10 p-7 xl:p-9 rounded-[32px] border border-white/8 bg-white/4 backdrop-blur-xl transition-all duration-500 hover:bg-white/6 hover:border-white/12 shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent opacity-60" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-5 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-primary-600/20 border border-primary-500/30 text-[10px] font-black text-primary-400 uppercase tracking-widest">
                Profile Active
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-600/20 border border-success-500/30 text-[10px] font-black text-success-400 uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" />
                Verified
              </div>
            </div>

            <div className="space-y-1">
              <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
                {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">{firstName}</span>.
              </h1>
              <p className="text-neutral-400 text-sm xl:text-base font-medium leading-relaxed">
                Here’s a quick view of your resume activity, analysis progress, and current career readiness.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                <Target className="w-4 h-4 text-accent-400" />
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Track skill gaps</span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white/5 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                <Rocket className="w-4 h-4 text-fresh-400" />
                <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">Build your next roadmap</span>
              </div>
            </div>
          </div>

          <div className="lg:w-px lg:h-24 bg-white/10 hidden lg:block" />

          <div className="flex items-center gap-6">
            <div className="text-center px-6 py-4 bg-primary-600/10 rounded-3xl border border-primary-600/20 min-w-[120px]">
              <div className="text-[10px] font-black text-primary-400 uppercase tracking-widest mb-1.5 opacity-70">Readiness</div>
              <div className="text-3xl font-black text-white leading-none tracking-tighter">84<span className="text-sm font-normal text-neutral-500 ml-0.5">%</span></div>
            </div>
            
            <div className="text-center px-6 py-4 bg-accent-600/10 rounded-3xl border border-accent-600/20 min-w-[120px]">
              <div className="text-[10px] font-black text-accent-400 uppercase tracking-widest mb-1.5 opacity-70">Impact</div>
              <div className="text-3xl font-black text-white leading-none tracking-tighter">Gold</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 right-0 -translate-y-1/2 opacity-[0.03] pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-700">
        <Sparkles className="w-64 h-64 text-white" />
      </div>
    </div>
  );
};

export default WelcomeBanner;
