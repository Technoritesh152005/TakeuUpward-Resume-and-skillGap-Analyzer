import { FileText, Target, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const RecentActivity = ({ activities = [], loading = false }) => {

  const navigate = useNavigate()
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
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'analysis_complete':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      default:
        return 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400';
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
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4" />
                <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
          Recent Activity
        </h2>
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            No activity yet. Start by uploading a resume!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
          Recent Activity
        </h2>
        <button
          onClick={() => navigate('/analysis')}
          className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
        >
          View Analyses
        </button>
      </div>

      <div className="space-y-4">
        {activities.slice(0, 5).map((activity, index) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type);
          
          return (
            <div 
              key={activity.id || index} 
              onClick={() => handleActivityClick(activity)}
              className="flex gap-4 items-start group hover:bg-neutral-50 dark:hover:bg-neutral-700/50 p-3 rounded-xl -mx-3 transition-colors duration-200 cursor-pointer"
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass} group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-5 h-5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white mb-1">
                  {activity.title}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                  {activity.timestamp ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true }) : 'Just now'}
                </p>
              </div>

              {/* Timeline dot */}
              {index < activities.slice(0, 5).length - 1 && (
                <div className="absolute left-[29px] top-[56px] w-0.5 h-8 bg-neutral-200 dark:bg-neutral-700" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;
