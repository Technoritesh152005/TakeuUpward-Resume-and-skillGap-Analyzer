import { TrendingUp, Target as TargetIcon } from 'lucide-react';

const SkillProgressChart = ({ skills = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white/4 backdrop-blur-xl rounded-[32px] p-7 border border-white/8 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded-full mb-8" />
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-3 w-24 bg-white/10 rounded-full mb-3" />
              <div className="h-2 w-full bg-white/5 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!skills || skills.length === 0) {         
    return null;
  }

  return (
    <div className="bg-white/4 backdrop-blur-xl rounded-[32px] p-7 border border-white/8 shadow-2xl relative overflow-hidden group">
      {/* Background flare */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-600/20 border border-primary-500/30 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-400" />
          </div>
          Skill Trajectory
        </h2>
        <div className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-tight">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-[0_0_8px_rgba(124,58,237,0.4)]" />
            <span className="text-neutral-400">Current</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full border-2 border-accent-500 opacity-60" />
            <span className="text-neutral-400">Projected</span>
          </div>
        </div>
      </div>

      <div className="space-y-7 relative z-10">
        {skills.map((skill, index) => {
          const percentage = (skill.current / skill.target) * 100;
          const isNearTarget = percentage >= 80;
          
          return (
            <div key={index} className="group/item">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-neutral-200 tracking-tight uppercase">
                    {skill.name}
                  </span>
                  {isNearTarget && (
                    <span className="px-2 py-0.5 bg-success-500/10 border border-success-500/20 text-success-400 text-[9px] font-black uppercase rounded-full tracking-widest animate-pulse">
                      Peak State
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold">
                  <span className="text-neutral-500 tracking-tighter uppercase">
                    {skill.current} <span className="text-neutral-700">/</span> {skill.target} pts
                  </span>
                  {skill.gap > 0 && (
                    <span className="text-accent-400 bg-accent-500/10 px-1.5 py-0.5 rounded border border-accent-500/20">
                      -{skill.gap} Gap
                    </span>
                  )}
                </div>
              </div>
              
              {/* Progress bar container */}
              <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
                {/* Current progress */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000 ease-out group-hover/item:from-primary-400 group-hover/item:to-primary-500 shadow-[0_0_12px_rgba(124,58,237,0.2)]"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                >
                  {/* Subtle shimmer */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/item:translate-x-full transition-transform duration-1000" />
                </div>

                {/* Target indicator is implicit in the full bar width, but we can add a subtle marker */}
                {skill.target > skill.current && (
                  <div
                    className="absolute top-0 bottom-0 w-[1px] bg-accent-500/40"
                    style={{ left: '99%' }}
                  />
                )}
              </div>

              {/* Progress context */}
              <div className="mt-2 flex items-center justify-between opacity-0 group-hover/item:opacity-100 transition-opacity duration-500">
                <div className="flex items-center gap-1.5 text-[9px] text-neutral-600 font-bold uppercase tracking-widest">
                  <TargetIcon className="w-2.5 h-2.5" />
                  <span>Market Target Acquired</span>
                </div>
                <span className="text-[9px] text-primary-400 font-black tracking-widest uppercase">
                  {Math.round(percentage)}% Synergy
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillProgressChart;