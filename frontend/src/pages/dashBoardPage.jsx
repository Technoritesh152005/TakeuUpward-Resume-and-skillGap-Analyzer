import { useState, useEffect } from 'react';
import { FileText, Target, TrendingUp, BookOpen, Crown, Zap, ShieldCheck } from 'lucide-react';
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
      setDashboardData(response?.data || null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (error && !loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
          <div className="w-20 h-20 bg-danger-500/10 rounded-[32px] border border-danger-500/20 flex items-center justify-center mb-6 animate-bounce">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">Could not load Dashboard</h2>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest max-w-sm mb-8 leading-relaxed">
            There was an error retrieving your profile data. Please try again or contact support if the problem persists.
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-900/40"
          >
            Try Again
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
          <WelcomeBanner />
        </section>

        {/* Quick Actions at Top - Per User Request */}
        <section className="animate-in fade-in slide-in-from-top-6 duration-1000 delay-100">
          <div className="mb-4">
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] ml-2">Quick Access</h3>
          </div>
          <QuickActions aiUsage={dashboardData?.aiUsage} />
        </section>

        {/* Simple Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in slide-in-from-top-8 duration-1000 delay-200">
          <StatsCard
            title="Total Resumes"
            value={dashboardData?.stats?.totalResumes || 0}
            change={dashboardData?.stats?.totalResumes > 0 ? "+1" : null}
            changeType="increase"
            icon={FileText}
            color="primary"
            loading={loading}
          />
          <StatsCard
            title="Analyses Completed"
            value={dashboardData?.stats?.analysesCompleted || 0}
            change={dashboardData?.stats?.analysesCompleted > 0 ? "+2" : null}
            changeType="increase"
            icon={Target}
            color="blue"
            loading={loading}
          />
          <StatsCard
            title="Skills Tracked"
            value={dashboardData?.stats?.skillsImproved || 0}
            change={dashboardData?.stats?.skillsImproved > 5 ? "+3" : null}
            changeType="increase"
            icon={BookOpen}
            color="green"
            loading={loading}
          />
          <StatsCard
            title="Avg. Match Score"
            value={dashboardData?.stats?.avgMatchScore ? `${dashboardData.stats.avgMatchScore}%` : '0%'}
            change={dashboardData?.stats?.avgMatchScore > 70 ? "+5%" : null}
            changeType="increase"
            icon={TrendingUp}
            color="amber"
            loading={loading}
          />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="xl:col-span-8 flex flex-col gap-6">
            <SkillProgressGraph
              data={{ analysisHistory: dashboardData?.analysisHistory || [] }}
              loading={loading}
            />

            <div className="flex-1">
              <SkillProgressChart
                skills={dashboardData?.skillProgress || []}
                loading={loading}
              />
            </div>
          </div>

          <div className="xl:col-span-4 flex flex-col gap-6">
            <div className="flex-1">
              <RecentActivity
                activities={dashboardData?.activities || []}
                loading={loading}
              />
            </div>

            <div className="flex-1">
              <RoadmapPreview
                roadmap={dashboardData?.roadmap}
                loading={loading}
              />
            </div>
          </div>
        </div>

        {dashboardData?.skillGapsSummary && dashboardData.skillGapsSummary.total > 0 && (
          <section className="bg-white/4 backdrop-blur-xl rounded-[40px] p-8 md:p-10 border border-white/8 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
              <Crown className="w-48 h-48 text-white" />
            </div>

            <div className="relative z-10">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-10 flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-danger-600/20 border border-danger-500/30 flex items-center justify-center shadow-lg shadow-danger-900/20">
                  <Zap className="w-5 h-5 text-danger-400" />
                </div>
                Skill Gaps Summary
              </h3>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                <div className="text-center bg-white/5 p-8 rounded-[32px] border border-white/5 group-hover:bg-white/8 transition-all hover:scale-[1.02] duration-300">
                  <div className="text-4xl font-black text-danger-400 tracking-tighter mb-2">
                    {dashboardData.skillGapsSummary.critical}
                  </div>
                  <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    Critical Gaps
                  </div>
                </div>
                <div className="text-center bg-white/5 p-8 rounded-[32px] border border-white/5 group-hover:bg-white/8 transition-all hover:scale-[1.02] duration-300">
                  <div className="text-4xl font-black text-amber-400 tracking-tighter mb-2">
                    {dashboardData.skillGapsSummary.important}
                  </div>
                  <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    Important Gaps
                  </div>
                </div>
                <div className="text-center bg-white/5 p-8 rounded-[32px] border border-white/5 group-hover:bg-white/8 transition-all hover:scale-[1.02] duration-300">
                  <div className="text-4xl font-black text-primary-400 tracking-tighter mb-2">
                    {dashboardData.skillGapsSummary.niceToHave}
                  </div>
                  <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    Nice to Have
                  </div>
                </div>
                <div className="text-center bg-white/5 p-8 rounded-[32px] border border-white/5 group-hover:bg-white/8 transition-all hover:scale-[1.02] duration-300">
                  <div className="text-4xl font-black text-white tracking-tighter mb-2">
                    {dashboardData.skillGapsSummary.total}
                  </div>
                  <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    Total Skills Left
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center gap-3 px-5 py-3.5 bg-success-500/10 border border-success-500/20 rounded-2xl w-fit group/btn cursor-default">
                <ShieldCheck className="w-5 h-5 text-success-400 transition-transform group-hover/btn:scale-110" />
                <p className="text-[11px] font-black text-success-400 tracking-widest italic opacity-80 uppercase">We recommend updating your roadmap to address these gaps.</p>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
