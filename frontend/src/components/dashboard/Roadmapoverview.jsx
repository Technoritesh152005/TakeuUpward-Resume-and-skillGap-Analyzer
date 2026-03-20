import { Map, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const RoadmapPreview = ({ roadmap, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 animate-pulse">
        <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-700 rounded mb-4" />
        <div className="h-3 w-full bg-neutral-200 dark:bg-neutral-700 rounded mb-6" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 bg-neutral-200 dark:bg-neutral-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <Map className="w-5 h-5 text-primary-600" />
          Learning Roadmap
        </h2>
        <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1">
        View Full 
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-white">
            {roadmap.title}
          </span>
          <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
            {roadmap.progress}%
          </span>
        </div>
        
        <div className="relative h-2.5 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000"
            style={{ width: `${roadmap.progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          <span>{roadmap.completedItems} completed</span>
          <span>{roadmap.totalItems} total items</span>
        </div>
      </div>

      {/* Upcoming items */}
      {roadmap.upcomingItems && roadmap.upcomingItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            Coming Up
          </h3>
          <div className="space-y-2">
            {roadmap.upcomingItems.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-amber-600 dark:text-amber-500">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {item.phase}
                    </span>
                    {item.estimatedHours && (
                      <>
                        <span className="text-neutral-400 dark:text-neutral-600">•</span>
                        <span className="text-xs text-neutral-600 dark:text-neutral-400">
                          ~{item.estimatedHours}h
                        </span>
                      </>
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
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            Recently Completed
          </h3>
          <div className="space-y-2">
            {roadmap.recentCompleted.map((item, index) => (
              <div
                key={item.id || index}
                className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {item.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {item.phase}
                    </span>
                    <span className="text-neutral-400 dark:text-neutral-600">•</span>
                    <span className="text-xs text-green-600 dark:text-green-500">
                      {item.completedAt ? formatDistanceToNow(new Date(item.completedAt), { addSuffix: true }) : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!roadmap.upcomingItems || roadmap.upcomingItems.length === 0) &&
       (!roadmap.recentCompleted || roadmap.recentCompleted.length === 0) && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-3">
            <Map className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            No items in your roadmap yet
          </p>
        </div>
      )}
    </div>
  );
};

export default RoadmapPreview;