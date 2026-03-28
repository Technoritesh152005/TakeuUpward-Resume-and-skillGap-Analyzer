import { Upload, Target, Map, Briefcase, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {
    // here r the list of actions shown in dashboard where it redirects to the action route
  const navigate = useNavigate();

  const actions = [
    {
      icon: Upload,
      title: 'Upload Profile',
      description: 'Initialize career analysis',
      color: 'from-primary-500 to-indigo-500',
      glow: 'group-hover:shadow-primary-500/30',
      border: 'group-hover:border-primary-500/50',
      path: '/upload',
    },
    {
      icon: Target,
      title: 'Strategy Gap',
      description: 'Deep-dive skill analysis',
      color: 'from-accent-500 to-pink-500',
      glow: 'group-hover:shadow-accent-500/30',
      border: 'group-hover:border-accent-500/50',
      path: '/analysis/create',
    },
    {
      icon: Map,
      title: 'Roadmap Ace',
      description: 'Launch growth trajectory',
      color: 'from-amber-400 to-orange-500',
      glow: 'group-hover:shadow-amber-500/30',
      border: 'group-hover:border-amber-500/50',
      path: '/roadmap',
    },
    {
      icon: Briefcase,
      title: 'Market Hunt',
      description: 'Target 50+ career paths',
      color: 'from-fresh-400 to-emerald-500',
      glow: 'group-hover:shadow-fresh-500/30',
      border: 'group-hover:border-fresh-500/50',
      path: '/job-roles',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => navigate(action.path)}
          className={`group relative overflow-hidden bg-white/4 backdrop-blur-xl border border-white/8 rounded-[32px] p-6 text-left transition-all duration-500 hover:-translate-y-2 hover:bg-white/6 ${action.glow} ${action.border} shadow-2xl`}
        >
          {/* Animated accent circle */}
          <div className={`absolute -top-12 -right-12 w-24 h-24 rounded-full bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-20 transition-all duration-700 blur-2xl`} />
          
          {/* Content */}
          <div className="relative z-10 flex flex-col h-full">
            <div className={`w-12 h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white/10 group-hover:border-white/10 group-hover:shadow-lg shadow-white/5`}>
              <action.icon className={`w-6 h-6 text-white transition-all duration-500 group-hover:brightness-125`} />
            </div>
            
            <div className="mt-auto">
              <h3 className="text-xl font-black text-white mb-1.5 tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all duration-500">
                {action.title}
              </h3>
              
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-neutral-500 tracking-tight group-hover:text-neutral-400 transition-colors duration-500">
                  {action.description}
                </p>
                <ChevronRight className="w-4 h-4 text-neutral-700 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-500" />
              </div>
            </div>
          </div>

          {/* Shine effect */}
          <div className="absolute inset-x-0 bottom-0 h-1 px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
             <div className={`h-full w-full rounded-full bg-gradient-to-r ${action.color}`} />
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
