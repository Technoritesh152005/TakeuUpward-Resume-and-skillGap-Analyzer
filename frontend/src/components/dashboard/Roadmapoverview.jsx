import { Map, CheckCircle, Clock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const RoadmapPreview = ({ roadmap, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white/4 backdrop-blur-xl rounded-[32px] p-7 border border-white/8 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded-full mb-8" />
        <div className="h-2.5 w-full bg-white/5 rounded-full mb-8" />
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 bg-white/5 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <div className="bg-white/4 backdrop-blur-xl rounded-[32px] p-7 border border-white/8 shadow-2xl relative group overflow-hidden flex flex-col h-full">
      
      {/* Background Flare */}
      <div className="absolute top-0 right-0 h-48 w-48 bg-primary-500/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-accent-600/20 border border-accent-500/30 flex items-center justify-center">
            <Map className="w-4 h-4 text-accent-400" />
          </div>
          Strategic Roadmap
        </h2>
        <button className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-all flex items-center gap-1 group/btn">
          Full Access 
          <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </div>

      {/* Progress Section */}
      <div className="mb-8 relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black text-neutral-300 uppercase tracking-tight">
            {roadmap.title}
          </span>
          <span className="text-sm font-black text-primary-400 tracking-tighter">
            {roadmap.progress}%
          </span>
        </div>
        
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(124,58,237,0.3)]"
            style={{ width: `${roadmap.progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-3 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3 text-success-500" /> {roadmap.completedItems} Nodes Hit</span>
          <span>{roadmap.totalItems} Total</span>
        </div>
      </div>

      {/* Content Grid - Scrollable area */}
      <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-1 relative z-10">
        
        {/* Upcoming items */}
        {roadmap.upcomingItems && roadmap.upcomingItems.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock className="w-3 h-3 text-amber-500" />
              Immediate Next Steps
            </h3>
            <div className="space-y-3">
              {roadmap.upcomingItems.slice(0, 2).map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-start gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/8 transition-all hover:scale-[1.02] duration-300"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-black text-amber-500">
                      I{index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-white truncate uppercase tracking-tight">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                        {item.phase}
                      </span>
                      {item.estimatedHours && (
                        <span className="text-[9px] font-black text-primary-400 bg-primary-500/10 px-1.5 rounded uppercase">
                          {item.estimatedHours}H
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently completed */}
        {roadmap.recentCompleted && roadmap.recentCompleted.length > 0 && (
          <div>
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-success-500" />
              Recent Conquests
            </h3>
            <div className="space-y-2 opacity-70 hover:opacity-100 transition-opacity">
              {roadmap.recentCompleted.slice(0, 2).map((item, index) => (
                <div
                  key={item.id || index}
                  className="flex items-center gap-4 px-4 py-3 bg-white/[0.02] border border-white/[0.05] rounded-xl"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-success-500" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-neutral-300 truncate tracking-tight uppercase">
                      {item.title}
                    </p>
                  </div>
                  <span className="text-[9px] font-black text-neutral-600 uppercase">
                    Done
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default RoadmapPreview;