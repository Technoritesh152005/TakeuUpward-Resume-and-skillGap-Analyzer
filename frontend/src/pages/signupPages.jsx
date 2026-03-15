import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Sparkles, Zap, Shield } from 'lucide-react';
import SignupForm from '../components/auth/signupForm.jsx'

const SignupPage = () => {
  
  return (
    
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-primary-600 via-blue-600 to-blue-700 dark:from-primary-700 dark:via-blue-700 dark:to-blue-800 relative overflow-hidden">
        {/* Decorative Blobs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mt-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mb-48"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 self-start border border-white/30">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">100% Free for Students</span>
          </div>

          <h2 className="text-4xl font-bold mb-6 leading-tight">
            Start Your Journey to Your Dream Job Today
          </h2>
          <p className="text-xl text-white/90 mb-12">
            Join thousands of students who've discovered their skill gaps and built successful careers.
          </p>

          {/* Features */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Instant Analysis</h3>
                <p className="text-white/80">Get your resume analyzed and skill gaps identified in 60 seconds</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Personalized Roadmap</h3>
                <p className="text-white/80">90-day learning path tailored to your target job role</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-1">Privacy First</h3>
                <p className="text-white/80">Your data is secure and never shared with third parties</p>
              </div>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-white/90 mb-4 italic">
              "TakeUUpward helped me identify exactly what I needed to learn to become a full-stack developer. 
              Got my dream job in 3 months!"
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold">PR</span>
              </div>
              <div>
                <div className="font-semibold">Priya Sharma</div>
                <div className="text-sm text-white/70">Full Stack Developer</div>
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
            <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center">
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