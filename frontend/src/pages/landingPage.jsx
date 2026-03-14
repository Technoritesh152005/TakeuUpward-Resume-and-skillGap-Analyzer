import { useNavigate } from 'react-router-dom';
import { 
  Target, 
  Map, 
  FileCheck, 
  Upload, 
  Search, 
  BarChart3, 
  Rocket,
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import Navbar from '../components/layout/navbar.jsx'
import Footer from '../components/layout/footer.jsx';
import Button from '../components/common components/Button';
import Card from '../components/common components/Card';
import Badge from '../components/common components/Badge';


const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Target,
      title: 'Smart Gap Analysis',
      description: 'AI identifies exactly what skills you\'re missing for your dream job. No guesswork, just facts.',
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      icon: Map,
      title: '90-Day Roadmap',
      description: 'Get a personalized learning path with resources, projects, and milestones to bridge your gaps.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: FileCheck,
      title: 'ATS Optimization',
      description: 'Beat applicant tracking systems with resume scoring and keyword recommendations.',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Upload Resume',
      description: 'Drop your PDF or DOCX resume. We\'ll extract your skills and experience instantly.',
      icon: Upload,
    },
    {
      number: '02',
      title: 'Pick Target Role',
      description: 'Choose from 50+ job roles or search for your dream position.',
      icon: Search,
    },
    {
      number: '03',
      title: 'Get Analysis',
      description: 'See your match score, skill gaps, strengths, and ATS score in seconds.',
      icon: BarChart3,
    },
    {
      number: '04',
      title: 'Follow Roadmap',
      description: 'Learn skills in the right order with curated resources and track your progress.',
      icon: Rocket,
    },
  ];

  const stats = [
    { label: 'Launch', value: '2025', icon: Rocket },
    { label: 'Job Roles', value: '50+', icon: Target },
    { label: 'Always Free', value: '100%', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800"></div>
        
        {/* Decorative Blobs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400/20 dark:bg-primary-600/10 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-pulse-soft"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-600/10 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-amber-400/20 dark:bg-amber-600/10 rounded-full mix-blend-multiply dark:mix-blend-soft-light filter blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"></div>

        <div className="container-custom relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Badge with Icon */}
            <div className="flex justify-center mb-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800">
                <div className="w-2 h-2 bg-primary-600 dark:bg-primary-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                  🚀 100% Free for Students • AI-Powered Analysis
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <h1 className="text-center text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] animate-slide-up">
              <span className="text-neutral-900 dark:text-white">Know Your </span>
              <span className="relative inline-block">
                <span className="text-neutral-900 dark:text-white">Career Gaps</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="12" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C80 3 220 3 298 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary-600 dark:text-primary-500" />
                </svg>
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-blue-600 dark:from-primary-500 dark:via-primary-400 dark:to-blue-500 bg-clip-text text-transparent">
                Build Skills That Matter
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-center text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.1s' }}>
              AI-powered resume analysis + personalized{' '}
              <span className="font-semibold text-primary-600 dark:text-primary-500">90-day roadmaps</span>
              {' '}to help you land your dream job
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/signup')}
                rightIcon={<CheckCircle className="w-5 h-5" />}
                className="shadow-xl shadow-primary-600/30 dark:shadow-primary-600/20 hover:shadow-2xl hover:shadow-primary-600/40 hover:scale-105 transition-all duration-300"
              >
                Analyze Your Resume Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/job-roles')}
                className="border-2 hover:scale-105 transition-all duration-300"
              >
                Browse 50+ Job Roles
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-500" />
                <span className="text-sm font-medium">No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-500" />
                <span className="text-sm font-medium">Results in 60 Seconds</span>
              </div>
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-500" />
                <span className="text-sm font-medium">Privacy Protected</span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.4s' }}>
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-10 dark:group-hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="relative bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                    <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-500 dark:to-blue-500 bg-clip-text text-transparent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 font-medium">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section-padding bg-white dark:bg-neutral-900 relative">
        <div className="container-custom">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 mb-6">
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                ✨ Features
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
              Everything You Need to Get{' '}
              <span className="bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-500 dark:to-blue-500 bg-clip-text text-transparent">
                Job-Ready
              </span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              From skill gap analysis to personalized roadmaps, we've got you covered.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-blue-500/5 dark:from-primary-500/10 dark:to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Card */}
                <div className="relative bg-white dark:bg-neutral-800 rounded-2xl p-8 border-2 border-neutral-100 dark:border-neutral-700 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
                  {/* Icon */}
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-8 h-8 ${feature.color}`} />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Decorative Element */}
                  <div className={`absolute top-6 right-6 w-20 h-20 ${feature.color} opacity-5 rounded-full blur-2xl`}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Ready to discover your skill gaps?
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/signup')}
              rightIcon={<Target className="w-5 h-5" />}
            >
              Start Your Analysis
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="section-padding bg-neutral-50 dark:bg-neutral-800/50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(5,150,105,0.05),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_50%,rgba(5,150,105,0.1),transparent_50%)]"></div>

        <div className="container-custom relative">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 mb-6">
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">
                🚀 Simple Process
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6">
              Get Started in{' '}
              <span className="bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-500 dark:to-blue-500 bg-clip-text text-transparent">
                4 Easy Steps
              </span>
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              From upload to job-ready in minutes, not months.
            </p>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connection Lines (Desktop) */}
            <div className="hidden lg:block absolute top-1/3 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 dark:from-primary-800 dark:via-primary-700 dark:to-primary-800"></div>

            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="relative bg-white dark:bg-neutral-800 rounded-2xl p-8 border-2 border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full">
                  {/* Step Number Badge */}
                  <div className="absolute -top-4 left-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-blue-600 dark:from-primary-500 dark:to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-xl font-bold text-white">{index + 1}</span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center mb-6 mt-6 group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-7 h-7 text-primary-600 dark:text-primary-500" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Arrow (Desktop) */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/3 -right-8 text-primary-400 dark:text-primary-700">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-16">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/signup')}
              rightIcon={<Rocket className="w-5 h-5" />}
              className="shadow-xl shadow-primary-600/30 dark:shadow-primary-600/20"
            >
              Start Your Journey Now
            </Button>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">
              Takes less than 2 minutes to get started
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="section-padding bg-white dark:bg-neutral-900 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom relative">
          <div className="max-w-4xl mx-auto">
            {/* Main Card */}
            <div className="relative group">
              {/* Gradient Border Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 via-blue-600 to-primary-600 rounded-3xl opacity-75 group-hover:opacity-100 blur transition duration-500"></div>
              
              {/* Card Content */}
              <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-blue-700 dark:from-primary-700 dark:via-primary-800 dark:to-blue-800 rounded-3xl p-12 md:p-16 text-center overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full -ml-32 -mb-32"></div>

                {/* Icon */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-10 h-10 text-white" />
                </div>

                {/* Content */}
                <h2 className="relative text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                  Join Students Building Their{' '}
                  <span className="inline-block relative">
                    Careers
                    <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 200 8" fill="none">
                      <path d="M2 6C60 2 140 2 198 6" stroke="white" strokeWidth="3" strokeLinecap="round" className="opacity-50" />
                    </svg>
                  </span>
                </h2>
                
                <p className="relative text-xl text-white/90 mb-10 max-w-2xl mx-auto">
                  Don't let skill gaps hold you back. Start your journey to your dream job today.
                </p>

                {/* Stats Row */}
                <div className="relative grid grid-cols-3 gap-6 mb-10 max-w-2xl mx-auto">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-3xl font-bold text-white mb-1">2025</div>
                    <div className="text-sm text-white/80">Launch Year</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-3xl font-bold text-white mb-1">50+</div>
                    <div className="text-sm text-white/80">Job Roles</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-3xl font-bold text-white mb-1">100%</div>
                    <div className="text-sm text-white/80">Free</div>
                  </div>
                </div>

                {/* CTA */}
                <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/signup')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-neutral-50 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <span>Start Free Analysis</span>
                    <TrendingUp className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => navigate('/job-roles')}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/20 transition-all duration-300 hover:scale-105"
                  >
                    Browse Job Roles
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="section-padding bg-neutral-50 dark:bg-neutral-800/50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]"></div>
        
        {/* Gradient Blobs */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="container-custom relative">
          <div className="max-w-4xl mx-auto">
            {/* Content Card */}
            <div className="bg-white dark:bg-neutral-800 rounded-3xl p-12 md:p-16 border-2 border-neutral-200 dark:border-neutral-700 shadow-2xl">
              <div className="text-center">
                {/* Icon Group */}
                <div className="flex justify-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center animate-pulse-soft">
                    <Target className="w-7 h-7 text-primary-600 dark:text-primary-500" />
                  </div>
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center animate-pulse-soft" style={{ animationDelay: '0.2s' }}>
                    <Map className="w-7 h-7 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center animate-pulse-soft" style={{ animationDelay: '0.4s' }}>
                    <Rocket className="w-7 h-7 text-amber-600 dark:text-amber-500" />
                  </div>
                </div>

                {/* Headline */}
                <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight">
                  Ready to Bridge Your{' '}
                  <span className="bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-500 dark:to-blue-500 bg-clip-text text-transparent">
                    Skill Gaps?
                  </span>
                </h2>

                {/* Description */}
                <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto">
                  Upload your resume, pick a job role, and get your personalized roadmap in minutes.
                </p>

                {/* CTA Button */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => navigate('/signup')}
                  rightIcon={<Rocket className="w-5 h-5" />}
                  className="shadow-2xl shadow-primary-600/30 dark:shadow-primary-600/20 hover:shadow-primary-600/50 hover:scale-105"
                >
                  Get Started Free
                </Button>

                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                    <span>100% Free for students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                    <span>Start in 60 seconds</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Note */}
            <p className="text-center text-neutral-500 dark:text-neutral-400 mt-8">
              Join thousands of students taking control of their career journey
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;