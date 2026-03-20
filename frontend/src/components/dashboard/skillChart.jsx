import { TrendingUp, Target as TargetIcon } from 'lucide-react';

const SkillProgressChart = ({ skills = [], loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 animate-pulse">
        <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-6" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded mb-2" />
              <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-700 rounded" />
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
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Skill Progress
        </h2>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary-500 to-primary-600" />
            <span className="text-neutral-600 dark:text-neutral-400">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border-2 border-amber-500" />
            <span className="text-neutral-600 dark:text-neutral-400">Target</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {skills.map((skill, index) => {
          const percentage = (skill.current / skill.target) * 100;
          const isNearTarget = percentage >= 80;
          
          return (
            <div key={index} className="group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900 dark:text-white">
                    {skill.name}
                  </span>
                  {isNearTarget && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                      Almost there!
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs font-medium">
                  <span className="text-neutral-600 dark:text-neutral-400">
                    {skill.current}/{skill.target}
                  </span>
                  {skill.gap > 0 && (
                    <span className="text-amber-600 dark:text-amber-500">
                      -{skill.gap} gap
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                {/* Current progress */}
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000 ease-out group-hover:from-primary-600 group-hover:to-primary-700"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </div>

                {/* Target marker */}
                {skill.target > skill.current && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-amber-500"
                    style={{ left: '100%' }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                      <TargetIcon className="w-3 h-3 text-amber-500 fill-amber-500" />
                    </div>
                  </div>
                )}
              </div>

              {/* Gap indicator */}
              {skill.gap > 0 && (
                <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>{Math.round(percentage)}% complete</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillProgressChart;