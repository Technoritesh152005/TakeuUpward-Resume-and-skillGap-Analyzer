import { useNavigate } from 'react-router-dom';
import { FileText, Target, Map, LogOut, Sparkles } from 'lucide-react';
import Navbar from '../components/layout/navbar.jsx';
import Footer from '../components/layout/footer.jsx';
import Button from '../components/common components/Button';
import useAuthStore from '../services/authStore';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : null) || 'there';
return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex flex-col">
        {/* navbar */}
      <Navbar />

      <main className="flex-1">
        {/* Welcome section */}
        <section className="section-padding container-custom py-12 md:py-16">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full mb-6 border border-primary-200 dark:border-primary-800">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                Your career hub
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3">
              Welcome back, {displayName}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
              Upload your resume, pick a target role, and get your skill gap analysis and a personalized roadmap.
            </p>
            <Button
              variant="outline"
              size="md"
              onClick={handleLogout}
              leftIcon={<LogOut className="w-5 h-5" />}
            >
              Sign out
            </Button>
          </div>
        </section>

        {/* Quick actions - same pattern as landing steps */}
        <section className="section-padding container-custom pb-16">
          <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-6 text-center">
            What would you like to do?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <button
              type="button"
              onClick={() => {}}
              className="group p-6 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-card transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                <FileText className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Upload resume</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Add or update your resume to get started.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {}}
              className="group p-6 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-card transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                <Target className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">Pick target role</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Choose from 50+ job roles for analysis.
              </p>
            </button>

            <button
              type="button"
              onClick={() => {}}
              className="group p-6 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-card transition-all duration-200 text-left"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
                <Map className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 dark:text-white mb-2">View roadmap</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Your 90-day learning path (coming soon).
              </p>
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
)

};

export default DashboardPage;