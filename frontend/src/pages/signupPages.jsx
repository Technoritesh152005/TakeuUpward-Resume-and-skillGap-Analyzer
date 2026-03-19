import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Sparkles, Zap, Shield, Target, Map, TrendingUp } from 'lucide-react';
import SignupForm from '../components/auth/signupForm.jsx'

const SignupPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      {/* Left Side - Animated Showcase */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-blue-600 to-blue-700 dark:from-primary-700 dark:via-blue-700 dark:to-blue-800 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating Gradient Orbs */}
          <div className="absolute top-40 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse-soft"></div>
          <div className="absolute bottom-40 right-20 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1.5s' }}></div>
          
          {/* Floating Feature Cards */}
          <div className="absolute top-20 left-16 animate-float">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30 shadow-2xl transform -rotate-6 hover:rotate-0 transition-all duration-500">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="text-white font-semibold">AI Analysis</div>
                  <div className="text-white/70 text-sm">60 seconds</div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute top-64 left-32 animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-2xl transform rotate-3 hover:rotate-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-300" />
                <span className="text-white font-medium">Gap Analysis</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-32 left-24 animate-float" style={{ animationDelay: '1s' }}>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30 shadow-2xl transform rotate-6 hover:rotate-0 transition-all duration-500">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">90</div>
                  <div className="text-white/80 text-xs">Day Roadmap</div>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Progress Bars */}
          <div className="absolute bottom-48 left-20 animate-float" style={{ animationDelay: '1.5s' }}>
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-2xl w-64">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-sm font-medium">React</span>
                    <span className="text-white/90 text-sm">85%</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-white text-sm font-medium">Node.js</span>
                    <span className="text-white/90 text-sm">72%</span>
                  </div>
                  <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full" style={{ width: '72%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 self-start border border-white/30">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold">Join Free Today</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Start Your Journey to{' '}
            <span className="inline-block relative">
              Your Dream Job
              <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none">
                <path d="M2 10C80 3 220 3 298 10" stroke="white" strokeWidth="3" strokeLinecap="round" className="opacity-50" />
              </svg>
            </span>
          </h2>
          
          <p className="text-xl text-white/90 mb-12 max-w-md">
            Get instant AI-powered insights, personalized roadmaps, and track your progress—all for free.
          </p>

          {/* Animated Feature List */}
          <div className="space-y-4 mb-12">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <span className="font-medium">Instant resume analysis in 60 seconds</span>
            </div>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="font-medium">Personalized 90-day learning roadmap</span>
            </div>
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Shield className="w-5 h-5" />
              </div>
              <span className="font-medium">Your data stays private & secure</span>
            </div>
          </div>

          {/* Success Story */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-white/90 mb-4 italic">
              "Landed my dream role in just 3 months! The personalized roadmap was a game-changer."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">AK</span>
              </div>
              <div>
                <div className="font-semibold">Arjun Kumar</div>
                <div className="text-sm text-white/70">Full Stack Developer @ Amazon</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Back to Home Link */}
        <Link
          to="/"
          className="absolute top-8 left-8 lg:left-auto lg:right-8 flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to home</span>
        </Link>

        {/* Form Container */}
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
              <FileText className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              TakeU<span className="text-primary-600 dark:text-primary-500">Upward</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
              Create your account
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Start your career transformation journey
            </p>
          </div>

          {/* Benefits (Mobile Only) */}
          <div className="lg:hidden mb-8 grid grid-cols-3 gap-3">
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 text-center border border-primary-200 dark:border-primary-800">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-500 mb-1">50+</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Roles</div>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 text-center border border-primary-200 dark:border-primary-800">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-500 mb-1">Free</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Forever</div>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 text-center border border-primary-200 dark:border-primary-800">
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-500 mb-1">60s</div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">Analysis</div>
            </div>
          </div>

          {/* Signup Form */}
          <SignupForm />

          {/* Trust Indicators */}
          <div className="mt-8 pt-8 border-t border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center justify-center gap-6 text-sm text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                <span>Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                <span>Instant Access</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                <span>No Credit Card</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;