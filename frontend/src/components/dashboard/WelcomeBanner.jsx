import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';
import useAuthStore from '../../services/authStore.js'

const WelcomeBanner = () => {
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800 dark:via-primary-900 dark:to-neutral-900 rounded-3xl p-8 md:p-10">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-400/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {greeting}, {firstName}! 👋
              </h1>
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            
            <p className="text-lg text-primary-100 max-w-2xl">
              Ready to take your career to the next level? Let's analyze your progress and plan your journey.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <TrendingUp className="w-4 h-4 text-green-300" />
                <span className="text-sm font-medium text-white">
                  Career Growth Tracker
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <span className="text-sm font-medium text-white">
                  🎯 Skill-Based Matching
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-center px-6 py-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div className="text-2xl font-bold text-white mb-1">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="text-xs text-primary-100">Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative pattern */}
      <div className="absolute bottom-0 right-0 opacity-10">
        <svg width="200" height="200" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2" />
          <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="2" />
          <circle cx="100" cy="100" r="40" stroke="white" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
};

export default WelcomeBanner;