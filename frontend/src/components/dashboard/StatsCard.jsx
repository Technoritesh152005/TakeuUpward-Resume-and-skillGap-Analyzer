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
  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    amber: 'from-amber-500 to-amber-600',
    purple: 'from-purple-500 to-purple-600',
  };

  const iconBgClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded" />
          <div className="w-12 h-12 bg-neutral-200 dark:bg-neutral-700 rounded-xl" />
        </div>
        <div className="h-8 w-20 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
        <div className="h-3 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
      </div>
    );
  }

  return (
    <div className="group relative bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 hover:shadow-xl hover:shadow-neutral-200/50 dark:hover:shadow-neutral-900/50 transition-all duration-300 hover:-translate-y-1">
      {/* Gradient border on hover */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${colorClasses[color]} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {title}
          </p>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClasses[color]} transition-transform duration-300 group-hover:scale-110`}>
            {Icon && <Icon className="w-6 h-6" />}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-3xl font-bold text-neutral-900 dark:text-white">
            {value}
          </h3>

          {change && (
            <div className="flex items-center gap-1">
              {changeType === 'increase' ? (
                <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-500" />
              )}
              <span className={`text-sm font-medium ${
                changeType === 'increase' 
                  ? 'text-green-600 dark:text-green-500' 
                  : 'text-red-600 dark:text-red-500'
              }`}>
                {change}
              </span>
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                vs last week
              </span>
            </div>
          )}
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    </div>
  );
};

export default StatsCard;