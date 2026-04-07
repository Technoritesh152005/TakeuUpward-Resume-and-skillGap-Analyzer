import { FileText, Target, Clock, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const RecentActivity = ({ activities = [], loading = false }) => {
  const navigate = useNavigate();

  const getActivityIcon = (type) => {
    switch (type) {
      case 'resume_upload':
        return FileText;
      case 'analysis_complete':
        return Target;
      default:
        return Clock;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'resume_upload':
        return 'text-blue-400 bg-blue-600/10 border-blue-500/20';
      case 'analysis_complete':
        return 'text-success-400 bg-success-600/10 border-success-500/20';
      default:
        return 'text-neutral-400 bg-neutral-600/10 border-neutral-500/20';
    }
  };

  const handleActivityClick = (activity) => {
    if (activity.type === 'resume_upload' && activity.id) {
      navigate(`/resumes/${activity.id}`);
      return;
    }
    if (activity.type === 'analysis_complete') {
      navigate(`/analysis/${activity.id}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/4 backdrop-blur-xl rounded-[32px] p-7 border border-white/8 animate-pulse">
        <div className="h-4 w-32 bg-white/10 rounded-full mb-8" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded-full w-3/4" />
                <div className="h-2 bg-white/5 rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/4 backdrop-blur-xl rounded-[32px] p-7 border border-white/8 shadow-2xl h-full flex flex-col group overflow-hidden">
      
      {/* Background Flare */}
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent-500/5 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      <div className="flex items-center justify-between mb-8 relative z-10">
        <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-neutral-800/50 border border-white/5 flex items-center justify-center">
            <Clock className="w-4 h-4 text-neutral-400" />
          </div>
          Live Activity
        </h2>
        <button
          onClick={() => navigate('/analysis')}
          className="text-[10px] font-black text-primary-400 uppercase tracking-widest hover:text-primary-300 transition-colors"
        >
          View All
        </button>
      </div>

      {!activities || activities.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
            <Clock className="w-7 h-7 text-neutral-600" />
          </div>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-tight">
            No active nodes. Start by uploading a profile.
          </p>
        </div>
      ) : (
        <div className="space-y-2 relative z-10 overflow-y-auto no-scrollbar pr-1">
          {activities.slice(0, 5).map((activity, index) => {
            const Icon = getActivityIcon(activity.type);
            const colorClass = getActivityColor(activity.type);
            
            return (
              <div 
                key={activity.id || index} 
                onClick={() => handleActivityClick(activity)}
                className="flex gap-4 items-center group/item hover:bg-white/5 p-3 rounded-2xl transition-all duration-300 cursor-pointer border border-transparent hover:border-white/5"
              >
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all duration-500 group-hover/item:scale-110 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white mb-0.5 truncate tracking-tight uppercase">
                    {activity.title}
                  </p>
                  <p className="text-[10px] text-neutral-500 font-bold truncate tracking-tight">
                    {activity.description}
                  </p>
                </div>

                {/* Meta */}
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-[9px] text-neutral-600 font-bold uppercase whitespace-nowrap">
                    {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Just now'}
                  </p>
                  <ChevronRight className="w-3 h-3 text-neutral-800 group-hover/item:text-neutral-500 group-hover/item:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </div>
  );
};

export default RecentActivity;