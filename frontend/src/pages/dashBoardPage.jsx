import { useState, useEffect } from 'react';
import { FileText, Target, TrendingUp, BookOpen, Crown, Zap, ShieldCheck, Sparkles } from 'lucide-react';
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

  if (error && !loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-8">
          <div className="w-20 h-20 bg-danger-500/10 rounded-[32px] border border-danger-500/20 flex items-center justify-center mb-6 animate-bounce">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase">Initialization Failed</h2>
          <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest max-w-sm mb-8 leading-relaxed">
            {error}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-500 text-white font-black uppercase text-xs tracking-widest rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary-900/40"
          >
            Retry Protocol
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-6">
        
        {/* Row 1: Mission Briefing */}
        <section className="animate-in fade-in slide-in-from-top-4 duration-700">
           <WelcomeBanner />
        </section>

        {/* Row 2: Rapid Access Nodes */}
        <section className="animate-in fade-in slide-in-from-top-6 duration-1000 delay-100">
           <QuickActions aiUsage={dashboardData?.aiUsage} />
        </section>

        {/* Row 3: Core Performance Metrics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-in fade-in slide-in-from-top-8 duration-1000 delay-200">
          <StatsCard
            title="AI Credits Left"
            value={`${dashboardData?.aiUsage?.usesRemaining ?? 0}/${dashboardData?.aiUsage?.dailyLimit ?? 4}`}
            change={dashboardData?.aiUsage ? `${dashboardData.aiUsage.usedToday} used` : null}
            changeType={(dashboardData?.aiUsage?.usesRemaining ?? 0) > 0 ? "increase" : "decrease"}
            icon={Sparkles}
            color="purple"
            loading={loading}
          />
          <StatsCard
            title="Active Intelligence"
            value={dashboardData?.stats.totalResumes || 0}
            change={dashboardData?.stats.totalResumes > 0 ? "+1" : null}
            changeType="increase"
            icon={FileText}
            color="primary"
            loading={loading}
          />
          <StatsCard
            title="Strategic Scans"
            value={dashboardData?.stats.analysesCompleted || 0}
            change={dashboardData?.stats.analysesCompleted > 0 ? "+2" : null}
            changeType="increase"
            icon={Target}
            color="blue"
            loading={loading}
          />
          <StatsCard
            title="Skill Mastery"
            value={dashboardData?.stats.skillsImproved || 0}
            change={dashboardData?.stats.skillsImproved > 5 ? "+3" : null}
            changeType="increase"
            icon={BookOpen}
            color="green"
            loading={loading}
          />
          <StatsCard
            title="Market Alignment"
            value={dashboardData?.stats.avgMatchScore ? `${dashboardData.stats.avgMatchScore}%` : '0%'}
            change={dashboardData?.stats.avgMatchScore > 70 ? "+5%" : null}
            changeType="increase"
            icon={TrendingUp}
            color="amber"
            loading={loading}
          />
        </section>

        {/* Row 4: Deep Analytics Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          
          {/* Performance Trend (8Cols on XL) */}
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

          {/* Operation Status (4Cols on XL) */}
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

        {/* Row 5: Critical Vulnerability Scan (Skill Gaps) */}
        {dashboardData?.skillGapsSummary && dashboardData.skillGapsSummary.total > 0 && (
          <section className="bg-white/4 backdrop-blur-xl rounded-[32px] p-8 border border-white/8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Crown className="w-32 h-32 text-white" />
            </div>
            
            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-danger-600/20 border border-danger-500/30 flex items-center justify-center">
                 <Zap className="w-4 h-4 text-danger-400" />
              </div>
              Vulnerability Assessment
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
              <div className="text-center bg-white/5 p-6 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-colors">
                <div className="text-4xl font-black text-danger-400 tracking-tighter mb-1">
                  {dashboardData.skillGapsSummary.critical}
                </div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Critical Gaps
                </div>
              </div>
              <div className="text-center bg-white/5 p-6 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-colors">
                <div className="text-4xl font-black text-amber-400 tracking-tighter mb-1">
                   {dashboardData.skillGapsSummary.important}
                </div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Important Gaps
                </div>
              </div>
              <div className="text-center bg-white/5 p-6 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-colors">
                <div className="text-4xl font-black text-primary-400 tracking-tighter mb-1">
                  {dashboardData.skillGapsSummary.niceToHave}
                </div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Nice to Have
                </div>
              </div>
              <div className="text-center bg-white/5 p-6 rounded-3xl border border-white/5 group-hover:bg-white/10 transition-colors">
                <div className="text-4xl font-black text-white tracking-tighter mb-1">
                  {dashboardData.skillGapsSummary.total}
                </div>
                <div className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                  Total Nodes Remaining
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex items-center gap-2.5 px-4 py-3 bg-success-500/10 border border-success-500/20 rounded-2xl w-fit">
               <ShieldCheck className="w-4 h-4 text-success-400" />
               <p className="text-[10px] font-black text-success-400 uppercase tracking-widest italic">Optimization Protocol Recommended</p>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
