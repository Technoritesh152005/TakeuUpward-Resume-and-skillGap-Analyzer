import { ArrowUp, ArrowDown } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = 'increase', 
  icon: Icon, 
  color = 'primary',
  loading = false 
}) => {
  const colorGlows = {
    primary: 'group-hover:shadow-primary-500/20 group-hover:border-primary-500/30',
    blue: 'group-hover:shadow-blue-500/20 group-hover:border-blue-500/30',
    green: 'group-hover:shadow-green-500/20 group-hover:border-green-500/30',
    amber: 'group-hover:shadow-amber-500/20 group-hover:border-amber-500/30',
    purple: 'group-hover:shadow-purple-500/20 group-hover:border-purple-500/30',
  };

  const iconColors = {
    primary: 'text-primary-400 bg-primary-600/10',
    blue: 'text-blue-400 bg-blue-600/10',
    green: 'text-success-400 bg-success-600/10',
    amber: 'text-amber-400 bg-amber-600/10',
    purple: 'text-accent-400 bg-accent-600/10',
  };

  if (loading) {
    return (
      <div className="bg-white/4 backdrop-blur-xl rounded-3xl p-6 border border-white/8 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-3 w-20 bg-white/10 rounded-full" />
          <div className="w-10 h-10 bg-white/10 rounded-xl" />
        </div>
        <div className="h-8 w-16 bg-white/15 rounded-lg mb-3" />
        <div className="h-3 w-24 bg-white/5 rounded-full" />
      </div>
    );
  }

  return (
    <div className={`group relative bg-white/4 backdrop-blur-xl rounded-[28px] p-6 border border-white/8 transition-all duration-500 hover:-translate-y-1.5 hover:bg-white/6 ${colorGlows[color]} shadow-2xl`}>
      
      {/* Background glow pulse on hover */}
      <div className="absolute inset-0 rounded-[28px] bg-white/[0.01] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
            {title}
          </p>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border border-white/5 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${iconColors[color]}`}>
            {Icon && <Icon className="w-5 h-5 shadow-sm" />}
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-3xl font-black text-white tracking-tighter">
            {value}
          </h3>

          {change && (
            <div className="flex items-center gap-1.5 pt-1">
              <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                changeType === 'increase' 
                  ? 'bg-success-500/10 text-success-400 border border-success-500/20' 
                  : 'bg-danger-500/10 text-danger-400 border border-danger-500/20'
              }`}>
                {changeType === 'increase' ? (
                  <ArrowUp className="w-2.5 h-2.5" />
                ) : (
                  <ArrowDown className="w-2.5 h-2.5" />
                )}
                <span>{change}</span>
              </div>
              <span className="text-[10px] text-neutral-600 font-black uppercase tracking-widest">Recent Activity</span>
            </div>
          )}
        </div>
      </div>

      {/* Subtle corner detail */}
      <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-20 transition-opacity duration-500">
        <div className="w-1.5 h-1.5 rounded-full bg-white" />
      </div>
    </div>
  );
};

export default StatsCard;