import { Upload, Target, Map, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActions = () => {

    // here r the list of actions shown in dashboard where it redirects to the action route
  const navigate = useNavigate();

  const actions = [
    {
      icon: Upload,
      title: 'Upload Resume',
      description: 'Upload and parse your resume',
      gradient: 'from-blue-500 to-cyan-500',
      hoverGradient: 'hover:from-blue-600 hover:to-cyan-600',
      path: '/upload',
    },
    {
      icon: Target,
      title: 'Analyze Skills',
      description: 'Get detailed skill gap analysis',
      gradient: 'from-purple-500 to-pink-500',
      hoverGradient: 'hover:from-purple-600 hover:to-pink-600',
      path: '/analysis/create',
    },
    {
      icon: Map,
      title: 'View Roadmap',
      description: 'Check your learning path',
      gradient: 'from-amber-500 to-orange-500',
      hoverGradient: 'hover:from-amber-600 hover:to-orange-600',
      path: '/roadmap',
    },
    {
      icon: Briefcase,
      title: 'Browse Jobs',
      description: 'Explore 50+ career paths',
      gradient: 'from-green-500 to-emerald-500',
      hoverGradient: 'hover:from-green-600 hover:to-emerald-600',
      path: '/job-roles',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => navigate(action.path)}
          className={`group relative overflow-hidden bg-gradient-to-br ${action.gradient} ${action.hoverGradient} rounded-2xl p-6 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Content */}
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <action.icon className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">
              {action.title}
            </h3>
            
            <p className="text-sm text-white/80">
              {action.description}
            </p>
          </div>

          {/* Shine effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </button>
      ))}
    </div>
  );
};

export default QuickActions;