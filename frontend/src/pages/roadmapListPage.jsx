import roadmapService from "../services/roadmapService";
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Trash2,
  Layers3,
  Map,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import DashboardLayout from "../components/layout/DashboardLayout";

const getProgressValue = (roadmap) => roadmap?.progress?.overallPercentage || 0;
const hasActiveRoadmapJob = (roadmap) => ['queued', 'processing', 'finalizing'].includes(roadmap?.status);

const getDurationValue = (roadmap) => {
  const weeks = roadmap?.duration?.weeks || 0;
  return weeks ? `${weeks} weeks` : 'Flexible duration';
};

const getRoadmapState = (roadmap) => {
  const progress = getProgressValue(roadmap);

  if (hasActiveRoadmapJob(roadmap)) {
    return {
      label: roadmap?.status || 'active',
      cardClass: 'border-sky-200 bg-[linear-gradient(135deg,_rgba(239,246,255,0.96),_rgba(224,242,254,0.98))] shadow-sky-100/70 dark:border-sky-900/40 dark:bg-[linear-gradient(135deg,_rgba(8,47,73,0.82),_rgba(15,23,42,0.96))]',
      ringClass: 'from-sky-500 via-cyan-400 to-emerald-400',
      pillClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      badgeClass: 'bg-sky-600 text-white',
    };
  }

  if (progress >= 100) {
    return {
      label: 'completed',
      cardClass: 'border-emerald-200 bg-[linear-gradient(135deg,_rgba(236,253,245,0.98),_rgba(240,253,250,0.98))] shadow-emerald-100/70 dark:border-emerald-900/40 dark:bg-[linear-gradient(135deg,_rgba(6,78,59,0.42),_rgba(15,23,42,0.96))]',
      ringClass: 'from-emerald-500 via-teal-400 to-cyan-400',
      pillClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
      badgeClass: 'bg-emerald-600 text-white',
    };
  }

  if (progress > 0) {
    return {
      label: 'in progress',
      cardClass: 'border-violet-200 bg-[linear-gradient(135deg,_rgba(245,243,255,0.98),_rgba(238,242,255,0.98))] shadow-violet-100/70 dark:border-violet-900/40 dark:bg-[linear-gradient(135deg,_rgba(46,16,101,0.45),_rgba(15,23,42,0.96))]',
      ringClass: 'from-violet-500 via-fuchsia-400 to-cyan-400',
      pillClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
      badgeClass: 'bg-violet-600 text-white',
    };
  }

  return {
    label: 'not started',
    cardClass: 'border-neutral-200 bg-white shadow-soft dark:border-neutral-700 dark:bg-neutral-800',
    ringClass: 'from-neutral-400 via-neutral-500 to-neutral-600',
    pillClass: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
    badgeClass: 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900',
  };
};

const roadmapListPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState([]);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    fetchAllRoadmap();
  }, []);

  // Poll silently only while at least one roadmap job is still active.
  useEffect(() => {
    if (!roadmap.some(hasActiveRoadmapJob)) return undefined;

    const interval = window.setInterval(() => {
      fetchAllRoadmap({ silent: true });
    }, 4000);

    return () => window.clearInterval(interval);
  }, [roadmap]);

  const fetchAllRoadmap = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const response = await roadmapService.getMyRoadmaps({
        page: 1,
        limit: 24,
      });
      setRoadmap(Array.isArray(response?.docs) ? response.docs : []);
    } catch (error) {
      toast.error('failed to load roadmap');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleDeleteRoadmap = async (event, roadmapId, title) => {
    event.stopPropagation();

    const confirmed = window.confirm(`Are you sure you want to delete "${title || 'this roadmap'}"?`);
    if (!confirmed) return;

    try {
      setDeletingId(roadmapId);
      await roadmapService.deleteRoadmap(roadmapId);
      setRoadmap((current) => current.filter((item) => item._id !== roadmapId));
      toast.success('Roadmap deleted');
    } catch (error) {
      toast.error('Failed to delete roadmap');
    } finally {
      setDeletingId('');
    }
  };

  // now whenever some new roadmap or old roadmap has been reoved then just usememeo so that for every change in roadmap u recalculate their summary
  const summary = useMemo(() => {
    const total = roadmap.length;
    const completedItems = roadmap.reduce((sum, item) => sum + (item?.progress?.completedItems || 0), 0);
    const totalItems = roadmap.reduce((sum, item) => sum + (item?.progress?.totalItems || 0), 0);
    const avgProgress = total ? Math.round(roadmap.reduce((sum, item) => sum + getProgressValue(item), 0) / total) : 0;
    const active = roadmap.filter((item) => hasActiveRoadmapJob(item) || (getProgressValue(item) > 0 && getProgressValue(item) < 100)).length;
    const finished = roadmap.filter((item) => getProgressValue(item) >= 100).length;
    const latestRoadmap = roadmap[0] || null;

    return {
      total,
      completedItems,
      totalItems,
      avgProgress,
      active,
      finished,
      latestRoadmap,
    };
  }, [roadmap]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.22),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(135deg,_#0f172a,_#172554_52%,_#0f766e)] p-6 text-white shadow-soft dark:border-neutral-700 md:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-[38%] bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.16),_transparent_60%)] xl:block" />
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_360px] xl:items-end">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Sparkles className="h-4 w-4" />
                Roadmap Control Center
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">Roadmaps that feel alive, not archived</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
                Track active learning plans, spot what needs attention, and jump into the right roadmap from a cleaner progress view.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/analysis')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
                >
                  <Plus className="h-4 w-4" />
                  Create From Analysis
                </button>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white/80 backdrop-blur-sm">
                  <Activity className="h-4 w-4 text-cyan-300" />
                  {summary.active} active roadmap{summary.active === 1 ? '' : 's'}
                </div>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.6rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-3">
                <HeroStat label="Average progress" value={`${summary.avgProgress}%`} />
                <HeroStat label="Completed roadmaps" value={summary.finished} />
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-slate-950/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/60">Latest roadmap</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {summary.latestRoadmap?.title || summary.latestRoadmap?.analysis?.jobRole?.title || 'No roadmap yet'}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                    {summary.latestRoadmap ? `${getProgressValue(summary.latestRoadmap)}% done` : 'Start now'}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {summary.latestRoadmap
                    ? `${summary.latestRoadmap?.progress?.completedItems || 0} of ${summary.latestRoadmap?.progress?.totalItems || 0} items complete.`
                    : 'Create a roadmap from a completed analysis to start tracking structured weekly progress.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Roadmaps" value={summary.total} icon={Map} accent="cyan" />
          <SummaryCard label="Active Right Now" value={summary.active} icon={Activity} accent="violet" />
          <SummaryCard label="Completed Items" value={summary.completedItems} icon={CheckCircle2} accent="emerald" />
          <SummaryCard label="Tracked Items" value={summary.totalItems} icon={Clock3} accent="amber" />
        </section>

        <section className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
            ))
          ) : roadmap.length > 0 ? (
            roadmap.map((item) => {
              const progress = getProgressValue(item);
              const state = getRoadmapState(item);

              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => navigate(`/roadmap/${item._id}`)}
                  className={`group relative w-full overflow-hidden rounded-[1.85rem] border p-6 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-xl dark:hover:border-primary-700 ${state.cardClass}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${state.ringClass}`} />

                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${state.pillClass}`}>
                          {state.label}
                        </span>
                        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200">
                          {getDurationValue(item)}
                        </span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {item?.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : 'No date'}
                        </span>
                      </div>

                      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                            {item?.title || item?.analysis?.jobRole?.title || 'Learning roadmap'}
                          </h2>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                            <span className="inline-flex items-center gap-2">
                              <Target className="h-4 w-4 text-neutral-400" />
                              {item?.analysis?.jobRole?.title || 'Role unavailable'}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <Layers3 className="h-4 w-4 text-neutral-400" />
                              {item?.analysis?.jobRole?.category || 'General role'}
                            </span>
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays className="h-4 w-4 text-neutral-400" />
                              {(item?.progress?.milestones?.length || 0)} milestones
                            </span>
                          </div>
                        </div>

                        <div className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-semibold ${state.badgeClass}`}>
                          {hasActiveRoadmapJob(item) ? 'Live updates' : progress >= 100 ? 'Ready to review' : 'Continue learning'}
                        </div>
                      </div>

                      <p className="mt-4 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                        {hasActiveRoadmapJob(item)
                          ? `This roadmap is ${item.status}. Open it to follow background generation and see the structure as soon as it is ready.`
                          : item?.userPreferences?.hoursPerWeek
                            ? `Built for ${item.userPreferences.hoursPerWeek} hours/week, ${item.userPreferences.budget || 'custom'} budget, and ${item.userPreferences.learningStyle || 'mixed'} learning style.`
                            : 'Open this roadmap to review phases, weekly learning items, quick wins, and milestone progress.'}
                      </p>
                    </div>

                    <div className="grid min-w-full grid-cols-2 gap-3 lg:min-w-[320px]">
                      <MetricCard label="Progress" value={`${progress}%`} tone={state.pillClass} />
                      <MetricCard label="Completed" value={item?.progress?.completedItems || 0} tone={state.pillClass} />
                      <MetricCard label="Total Items" value={item?.progress?.totalItems || 0} tone={state.pillClass} />
                        <MetricCard label="Milestones" value={item?.progress?.milestones?.length || 0} tone={state.pillClass} />
                      </div>
                    </div>

                    <div className="mt-6 rounded-[1.3rem] border border-white/50 bg-white/60 p-4 dark:border-neutral-700/80 dark:bg-neutral-900/40">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
                          <span>Roadmap completion</span>
                          <span className="font-semibold text-neutral-900 dark:text-white">{progress}%</span>
                        </div>
                        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-neutral-200/90 dark:bg-neutral-700">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${state.ringClass}`}
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                          />
                        </div>
                        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                          {item?.progress?.completedItems || 0} of {item?.progress?.totalItems || 0} learning items completed
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(event) => handleDeleteRoadmap(event, item._id, item?.title || item?.analysis?.jobRole?.title)}
                          disabled={deletingId === item._id}
                          className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/15 dark:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                          {deletingId === item._id ? 'Deleting...' : 'Delete'}
                        </button>
                        <span className="inline-flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition group-hover:translate-x-1 dark:bg-white dark:text-neutral-950">
                          View roadmap
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-700 dark:bg-neutral-800">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-700">
                <Map className="h-8 w-8 text-neutral-400" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-white">No roadmaps yet</h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Create a roadmap from a completed analysis, then come back here to track your weekly progress.
              </p>
              <button
                type="button"
                onClick={() => navigate('/analysis')}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Go to Analysis
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
};

const SummaryCard = ({ label, value, icon: Icon, accent }) => {
  const accentMap = {
    cyan: 'from-cyan-500/20 to-sky-500/5 text-cyan-700 dark:text-cyan-300',
    violet: 'from-violet-500/20 to-fuchsia-500/5 text-violet-700 dark:text-violet-300',
    emerald: 'from-emerald-500/20 to-teal-500/5 text-emerald-700 dark:text-emerald-300',
    amber: 'from-amber-500/20 to-orange-500/5 text-amber-700 dark:text-amber-300',
  };

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
        <div className={`rounded-2xl bg-gradient-to-br p-3 ${accentMap[accent] || accentMap.cyan}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
};

const MetricCard = ({ label, value, tone }) => (
  <div className="rounded-[1.2rem] border border-white/60 bg-white/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/45">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`}>Live</span>
    </div>
    <p className="mt-3 text-lg font-semibold text-neutral-900 dark:text-white">{value}</p>
  </div>
);

const HeroStat = ({ label, value }) => (
  <div className="rounded-[1.25rem] border border-white/10 bg-white/10 px-4 py-4 backdrop-blur-sm">
    <p className="text-xs uppercase tracking-wide text-white/65">{label}</p>
    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
  </div>
);

export default roadmapListPage;
