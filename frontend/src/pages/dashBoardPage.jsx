import { useState, useEffect } from 'react';
import { FileText, Target, TrendingUp, BookOpen } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import WelcomeBanner from '../components/dashboard/WelcomeBanner.jsx'
import StatsCard from '../components/dashboard/StatsCard.jsx';
import QuickActions from '../components/dashboard/QuickAction.jsx';
import RecentActivity from '../components/dashboard/RecentActivity.jsx';
import SkillProgressChart from '../components/dashboard/skillChart.jsx'
import SkillProgressGraph from '../components/dashboard/skillGraph.jsx';
import RoadmapPreview from '../components/dashboard/Roadmapoverview.jsx';
import dashboardService from '../services/dashboardServices.js'
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getDashboardData();
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Show error state
  if (error && !loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
              Failed to Load Dashboard
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              {error}
            </p>
            <button
              onClick={fetchDashboardData}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <WelcomeBanner />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Resumes"
            value={dashboardData?.stats.totalResumes || 0}
            change={dashboardData?.stats.totalResumes > 0 ? "+1" : null}
            changeType="increase"
            icon={FileText}
            color="primary"
            loading={loading}
          />
          <StatsCard
            title="Analyses Done"
            value={dashboardData?.stats.analysesCompleted || 0}
            change={dashboardData?.stats.analysesCompleted > 0 ? "+2" : null}
            changeType="increase"
            icon={Target}
            color="blue"
            loading={loading}
          />
          <StatsCard
            title="Skills Tracked"
            value={dashboardData?.stats.skillsImproved || 0}
            change={dashboardData?.stats.skillsImproved > 5 ? "+3" : null}
            changeType="increase"
            icon={BookOpen}
            color="green"
            loading={loading}
          />
          <StatsCard
            title="Avg Match Score"
            value={dashboardData?.stats.avgMatchScore ? `${dashboardData.stats.avgMatchScore}%` : '0%'}
            change={dashboardData?.stats.avgMatchScore > 70 ? "+5%" : null}
            changeType="increase"
            icon={TrendingUp}
            color="amber"
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <QuickActions />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Skill Progress Graph (with Recharts) */}
            {dashboardData?.analysisHistory && dashboardData.analysisHistory.length > 0 ? (
              <SkillProgressGraph 
                data={{
                  analysisHistory: dashboardData.analysisHistory
                }}
                loading={loading}
              />
            ) : (
              !loading && (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-12 border border-neutral-200 dark:border-neutral-700 text-center">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    No Analysis History Yet
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Complete at least one analysis to see your real progress history
                  </p>
                </div>
              )
            )}

            {/* Skill Progress Bars */}
            {dashboardData?.skillProgress && dashboardData.skillProgress.length > 0 ? (
              <SkillProgressChart 
                skills={dashboardData.skillProgress} 
                loading={loading} 
              />
            ) : (
              !loading && (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-12 border border-neutral-200 dark:border-neutral-700 text-center">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    No Skills Tracked
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    Upload a resume and run analysis to track skills
                  </p>
                </div>
              )
            )}
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <RecentActivity 
              activities={dashboardData?.activities || []} 
              loading={loading} 
            />

            {/* Roadmap Preview */}
            {dashboardData?.roadmap ? (
              <RoadmapPreview 
                roadmap={dashboardData.roadmap} 
                loading={loading} 
              />
            ) : (
              !loading && (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 border border-neutral-200 dark:border-neutral-700 text-center">
                  <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-neutral-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                    No Roadmap Yet
                  </h3>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                    Complete an analysis to generate your learning roadmap
                  </p>
                  <button
                    onClick={() => { window.location.href = '/upload'; }}
                    className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Upload Resume
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Skill Gaps Summary (if available) */}
        {dashboardData?.skillGapsSummary && dashboardData.skillGapsSummary.total > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
              Skill Gaps Summary
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-500">
                  {dashboardData.skillGapsSummary.critical}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Critical Gaps
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-500">
                  {dashboardData.skillGapsSummary.important}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Important Gaps
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">
                  {dashboardData.skillGapsSummary.niceToHave}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Nice to Have
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-500">
                  {dashboardData.skillGapsSummary.total}
                </div>
                <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                  Total Gaps
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
