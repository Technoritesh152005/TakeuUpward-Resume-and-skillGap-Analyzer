import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Sparkles, TrendingUp, Zap } from 'lucide-react';
import LoginForm from '../components/auth/loginForm.jsx'

const LoginPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Back to Home Link */}
        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-500 transition-colors group"
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
              Welcome back!
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              Sign in to continue your career journey
            </p>
          </div>

          {/* Login Form */}
          <LoginForm />

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-300 dark:border-neutral-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400">
                New to TakeUUpward?
              </span>
            </div>
          </div>

          {/* Signup CTA */}
          <div className="text-center">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-primary-600 dark:border-primary-500 text-primary-600 dark:text-primary-500 font-semibold rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-300"
            >
              Create free account
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side - Animated Interactive Background */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-700 dark:from-primary-700 dark:via-primary-800 dark:to-blue-800 relative overflow-hidden">
        {/* Animated Floating Elements */}
        <div className="absolute inset-0">
          {/* Large Circle */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse-soft"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
          
          {/* Floating Cards */}
          <div className="absolute top-32 right-32 animate-float">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-6 border border-white/30 shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">85%</div>
                </div>
              </div>
              <div className="text-sm text-white/90">Match Score</div>
            </div>
          </div>

          <div className="absolute bottom-40 right-40 animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 border border-white/30 shadow-2xl transform -rotate-6 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <div className="text-lg font-semibold text-white">React</div>
              </div>
              <div className="flex gap-1">
                <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-300 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <span className="text-xs text-white/80">90%</span>
              </div>
            </div>
          </div>

          <div className="absolute top-1/2 right-20 animate-float" style={{ animationDelay: '1s' }}>
            <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-2xl">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-300" />
                <div className="text-white font-semibold">3 New Skills</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 border border-white/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold">Welcome Back!</span>
            </div>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Your Career Growth Journey Continues Here
          </h2>
          <p className="text-xl text-white/90 mb-12">
            Pick up right where you left off. Your personalized roadmap is waiting.
          </p>

          {/* Animated Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform">50+</div>
              <div className="text-sm text-white/80">Job Roles</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform">100%</div>
              <div className="text-sm text-white/80">Free</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300 group">
              <div className="text-3xl font-bold mb-1 group-hover:scale-110 transition-transform">AI</div>
              <div className="text-sm text-white/80">Powered</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;