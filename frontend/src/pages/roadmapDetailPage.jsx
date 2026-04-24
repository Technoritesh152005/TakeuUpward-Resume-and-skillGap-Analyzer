import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flag,
  Lightbulb,
  Loader2,
  Map,
  Rocket,
  RotateCcw,
  Target,
  Trophy,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import roadmapService from '../services/roadmapService.js';
import dashboardService from '../services/dashboardServices.js';

const emptyRoadmap = {
  title: '',
  analysis: null,
  duration: { weeks: 0 },
  phases: [],
  quickwins: [],
  projects: [],
  certification: [],
  progress: {
    overallPercentage: 0,
    totalItems: 0,
    completedItems: 0,
    milestones: [],
  },
  userPreferences: {},
  generationMeta: null,
  createdAt: '',
  status: 'completed',
  processingStage: 'completed',
};

const priorityTone = {
  high: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  low: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
};

const roadmapStatusTone = {
  queued: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  finalizing: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const roadmapStageCopy = {
  queued: 'Waiting in queue for roadmap generation.',
  processing: 'Generating your phase-by-phase roadmap in the background.',
  finalizing: 'Saving roadmap phases, resources, and progress structure.',
  completed: 'Roadmap completed successfully.',
  failed: 'Roadmap generation failed before completion.',
};

const getRoadmapGenerationNotice = (generationMeta, status) => {
  if (status !== 'completed' || !generationMeta) return null;

  if (generationMeta?.usedFallback || generationMeta?.mode === 'fallback') {
    return {
      tone: 'warning',
      title: 'Fallback Roadmap',
      description:
        generationMeta?.fallbackReason ||
        'This roadmap was generated using deterministic fallback because the AI response format was invalid. It is usable, but may be less tailored.',
    };
  }

  if (generationMeta?.usedRepair) {
    return {
      tone: 'info',
      title: 'AI Response Repaired',
      description: 'The AI response needed automatic JSON repair before this roadmap could be shown.',
    };
  }

  return null;
};

const getPhaseCompletedCount = (phase) =>
  (phase?.weeklyBreakdown || []).reduce(
    (sum, week) => sum + (week?.learningItems || []).filter((item) => item?.completed).length,
    0
  );

const getPhaseTotalCount = (phase) =>
  (phase?.weeklyBreakdown || []).reduce(
    (sum, week) => sum + (week?.learningItems || []).length,
    0
  );

const getWeekCompletedCount = (week) => (week?.learningItems || []).filter((item) => item?.completed).length;
const getWeekTotalCount = (week) => (week?.learningItems || []).length;

const getResourceMeta = (item) => {
  const resource = item?.resource && typeof item.resource === 'object' ? item.resource : null;
  const hasUrl = Boolean(resource?.url || item?.url);

  return {
    title: resource?.title || item?.title || 'Learning resource',
    provider: resource?.provider || 'Source not specified',
    platform: resource?.platform || '',
    type: resource?.resourceType || item?.type || 'resource',
    difficulty: resource?.difficulty || item?.difficulty || '',
    rating: resource?.rating || 0,
    estimatedTime: resource?.estimatedTimeToComplete || item?.estimatedHours || 0,
    isPremium: Boolean(resource?.isPremium),
    url: resource?.url || item?.url || '',
    hasUrl,
  };
};

const RoadmapDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState(emptyRoadmap);
  const [completingKey, setCompletingKey] = useState('');
  const [retrying, setRetrying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [aiUsage, setAiUsage] = useState(null);
  const isAiLimitReached = (aiUsage?.usesRemaining ?? 0) === 0;

  useEffect(() => {
    if (id) {
      fetchRoadmap();
    }
  }, [id]);

  useEffect(() => {
    fetchAiUsage();
  }, []);

  useEffect(() => {
    if (!id) return undefined;
    if (!['queued', 'processing', 'finalizing'].includes(roadmap?.status)) return undefined;

    const interval = window.setInterval(() => {
      fetchRoadmapStatus();
    }, 2000);

    return () => window.clearInterval(interval);
  }, [id, roadmap?.status]);

  const fetchRoadmap = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await roadmapService.getRoadmapById(id);
      const clean = response?.data || response;
      setRoadmap({ ...emptyRoadmap, ...clean });
    } catch (error) {
      toast.error('Failed to fetch your roadmap');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchAiUsage = async () => {
    try {
      const response = await dashboardService.getDashboardData();
      setAiUsage(response?.data?.aiUsage || null);
    } catch (error) {
    }
  };

  const fetchRoadmapStatus = async () => {
    try {
      const response = await roadmapService.getRoadmapStatus(id);
      const clean = response?.data || response;

      setRoadmap((current) => ({
        ...current,
        status: clean?.status || current?.status,
        processingStage: clean?.processingStage || current?.processingStage,
        error: clean?.error || current?.error,
        queuedAt: clean?.queuedAt || current?.queuedAt,
        processingStartedAt: clean?.processingStartedAt || current?.processingStartedAt,
        completedAt: clean?.completedAt || current?.completedAt,
        processingTime: clean?.processingTime || current?.processingTime,
        generationMeta: clean?.generationMeta ?? current?.generationMeta,
      }));

      if (clean?.status === 'completed' || clean?.status === 'failed') {
        fetchRoadmap({ silent: true });
      }
    } catch (error) {
    }
  };

  const handleMarkComplete = async (phaseIndex, weekIndex, itemIndex) => {
    const key = `${phaseIndex}-${weekIndex}-${itemIndex}`;

    try {
      setCompletingKey(key);
      const response = await roadmapService.markItemComplete({
        roadmapId: id,
        phaseIndex,
        weekIndex,
        itemIndex,
      });
      const clean = response?.data || response;
      setRoadmap({ ...emptyRoadmap, ...clean });
      toast.success('Item marked completed');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to mark the item as completed');
    } finally {
      setCompletingKey('');
    }
  };

  const handleResetProgress = async () => {
    if (!roadmap?.progress?.completedItems) {
      toast('No completed items to reset');
      return;
    }

    if (!window.confirm('Are you sure you want to reset all completed roadmap items?')) return;

    try {
      setResetting(true);
      const response = await roadmapService.resetProgress(id);
      const clean = response?.data || response;
      setRoadmap({ ...emptyRoadmap, ...clean });
      toast.success('Roadmap progress reset');
    } catch (error) {
      toast.error('Failed to reset roadmap progress');
    } finally {
      setResetting(false);
    }
  };

  const handleRetryRoadmap = async () => {
    if (isAiLimitReached) {
      toast.error('Daily AI limit reached. Resets at 12:00 AM IST');
      return;
    }

    try {
      setRetrying(true);
      const response = await roadmapService.retryRoadmap(id);
      const clean = response?.roadmap || response?.data || response;
      setRoadmap((current) => ({ ...current, ...clean, generationMeta: clean?.generationMeta ?? null }));
      if (response?.aiUsage) setAiUsage(response.aiUsage);
      toast.success('Roadmap retry queued successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to retry roadmap');
    } finally {
      setRetrying(false);
    }
  };

  const summary = useMemo(() => {
    const totalWeeks = roadmap?.duration?.weeks || 0;
    const totalPhases = roadmap?.phases?.length || 0;
    const quickWins = roadmap?.quickwins?.length || 0;
    const milestones = roadmap?.progress?.milestones?.length || 0;
    const nextIncompletePhaseIndex = (roadmap?.phases || []).findIndex(
      (phase) => getPhaseCompletedCount(phase) < getPhaseTotalCount(phase)
    );
    const currentPhaseIndex = nextIncompletePhaseIndex === -1 ? Math.max(0, totalPhases - 1) : nextIncompletePhaseIndex;

    return {
      totalPhases,
      totalWeeks,
      quickWins,
      milestones,
      currentPhaseIndex,
    };
  }, [roadmap]);
  const generationNotice = useMemo(
    () => getRoadmapGenerationNotice(roadmap?.generationMeta, roadmap?.status),
    [roadmap?.generationMeta, roadmap?.status]
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.16),_transparent_28%),linear-gradient(135deg,_#0f172a,_#111827_48%,_#172554)] p-6 text-white shadow-soft dark:border-neutral-700 md:p-8">
          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px] xl:items-end">
            <div className="max-w-3xl">
              <button
                type="button"
                onClick={() => navigate('/roadmap')}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Roadmaps
              </button>

              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Map className="h-4 w-4" />
                Structured Roadmap
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                {loading ? 'Loading roadmap...' : roadmap?.title || 'Learning roadmap'}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
                {['queued', 'processing', 'finalizing'].includes(roadmap?.status)
                  ? (roadmapStageCopy[roadmap?.processingStage || roadmap?.status] || 'Roadmap generation is running in the background.')
                  : 'Follow the roadmap in order, complete the weekly work, and use the sidebar progress blocks to keep the journey structured.'}
              </p>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${roadmapStatusTone[roadmap?.status] || 'bg-white/10 text-white'}`}>
                  {roadmap?.status || 'unknown'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Target className="h-4 w-4 text-white/60" />
                  {roadmap?.analysis?.jobRole?.title || 'Role unavailable'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Rocket className="h-4 w-4 text-white/60" />
                  {roadmap?.analysis?.jobRole?.category || 'General roadmap'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-white/60" />
                  {roadmap?.createdAt ? format(new Date(roadmap.createdAt), 'dd MMM yyyy, hh:mm a') : 'No date'}
                </span>
              </div>
            </div>

            <div className="rounded-[1.45rem] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">Roadmap Overview</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <HeroMeta label="Phases" value={summary.totalPhases} />
                <HeroMeta label="Weeks" value={summary.totalWeeks} />
                <HeroMeta label="Quick Wins" value={summary.quickWins} />
                <HeroMeta label="Milestones" value={summary.milestones} />
              </div>
              <div className="mt-3 rounded-[1.05rem] border border-white/10 bg-slate-950/25 px-4 py-3">
                <p className="text-base font-semibold text-white">
                  {roadmap?.analysis?.jobRole?.title || roadmap?.title || 'Learning roadmap'}
                </p>
                <p className="mt-1.5 text-sm leading-6 text-white/70">
                  Built for {roadmap?.userPreferences?.hoursPerWeek || 0} hours per week with a {roadmap?.userPreferences?.budget || 'custom'} budget and {roadmap?.userPreferences?.learningStyle || 'mixed'} learning style.
                </p>
              </div>
            </div>
          </div>
        </section>

        {generationNotice ? <GenerationNotice notice={generationNotice} /> : null}

        {loading ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
            <div className="h-[42rem] animate-pulse rounded-[2rem] border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
            <div className="h-[42rem] animate-pulse rounded-[2rem] border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
          </div>
        ) : ['queued', 'processing', 'finalizing'].includes(roadmap?.status) ? (
          <RoadmapProcessingState roadmap={roadmap} />
        ) : roadmap?.status === 'failed' ? (
          <RoadmapFailedState
            roadmap={roadmap}
            retrying={retrying}
            isAiLimitReached={isAiLimitReached}
            onRetry={handleRetryRoadmap}
          />
        ) : (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
            <div className="space-y-6">
              <Panel title="Roadmap Journey" icon={Map}>
                {(roadmap?.phases || []).length ? (
                  <div className="space-y-6">
                    {roadmap.phases.map((phase, phaseIndex) => {
                      const phaseCompleted = getPhaseCompletedCount(phase);
                      const phaseTotal = getPhaseTotalCount(phase);
                      const phaseProgress = phaseTotal ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
                      const isCurrent = summary.currentPhaseIndex === phaseIndex;
                      const isCompleted = phaseProgress === 100;

                      return (
                        <div key={`${phase?.title || 'phase'}-${phaseIndex}`} className="relative pl-10">
                          {phaseIndex !== roadmap.phases.length - 1 ? (
                            <div className="absolute left-[1.15rem] top-12 h-[calc(100%+1.75rem)] w-px bg-gradient-to-b from-primary-500 via-cyan-400/50 to-neutral-200 dark:to-neutral-700" />
                          ) : null}

                          <div className={`absolute left-0 top-1 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                            isCompleted
                              ? 'border-emerald-300 bg-emerald-500 text-white'
                              : isCurrent
                                ? 'border-primary-400 bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                                : 'border-neutral-300 bg-white text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : phase?.phaseNumber || phaseIndex + 1}
                          </div>

                          <div className={`rounded-[1.7rem] border p-5 shadow-soft ${
                            isCurrent
                              ? 'border-primary-200 bg-[linear-gradient(135deg,_rgba(248,250,252,0.98),_rgba(238,242,255,0.98))] dark:border-primary-900/40 dark:bg-[linear-gradient(135deg,_rgba(30,41,59,0.96),_rgba(30,27,75,0.92))]'
                              : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'
                          }`}>
                            <div className="grid gap-4">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                                    Phase {phase?.phaseNumber || phaseIndex + 1}
                                  </span>
                                  {isCurrent ? (
                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                      Active now
                                    </span>
                                  ) : null}
                                </div>

                                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                                  {phase?.title || 'Learning phase'}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                  {phase?.objectives?.[0] || 'Move through this phase week by week and complete the learning items in order.'}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-3 rounded-[1.2rem] border border-neutral-200 bg-white/75 px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900/40">
                                <PhaseInlineMetric label="Phase progress" value={`${phaseProgress}%`} />
                                <PhaseInlineMetric label="Duration" value={phase?.duration ? `${phase.duration} weeks` : 'Flexible'} />
                                <PhaseInlineMetric label="Completed" value={`${phaseCompleted}/${phaseTotal}`} />
                              </div>
                            </div>

                            {phase?.objectives?.length ? (
                              <div className="mt-5 rounded-[1.35rem] border border-neutral-200 bg-white/70 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
                                <div className="mb-3 flex items-center gap-2">
                                  <Target className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">Phase objectives</p>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {phase.objectives.map((objective, index) => (
                                    <div key={`${objective}-${index}`} className="flex items-start gap-3 rounded-2xl bg-neutral-50 px-3 py-3 text-sm text-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
                                      <span className="mt-1 h-2 w-2 rounded-full bg-primary-600" />
                                      <span>{objective}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            <div className="mt-6 space-y-4">
                              {(phase?.weeklyBreakdown || []).map((week, weekIndex) => {
                                const weekCompleted = getWeekCompletedCount(week);
                                const weekTotal = getWeekTotalCount(week);
                                const weekProgress = weekTotal ? Math.round((weekCompleted / weekTotal) * 100) : 0;

                                return (
                                  <div key={`${week?.week || weekIndex}-${phaseIndex}`} className="rounded-[1.45rem] border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                          <span className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white dark:bg-white dark:text-neutral-900">
                                            Week {week?.week || weekIndex + 1}
                                          </span>
                                          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                                            {week?.focus || 'Focus area'}
                                          </span>
                                        </div>
                                        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                                          {week?.timeCommitment || 'No time commitment provided'}
                                        </p>
                                      </div>

                                      <div className="w-full rounded-[1.2rem] border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-800 lg:w-[260px]">
                                        <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                          <span>Week progress</span>
                                          <span>{weekProgress}%</span>
                                        </div>
                                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                                          <div
                                            className="h-full rounded-full bg-gradient-to-r from-primary-600 via-cyan-500 to-emerald-500"
                                            style={{ width: `${Math.min(100, Math.max(0, weekProgress))}%` }}
                                          />
                                        </div>
                                        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
                                          {weekCompleted} of {weekTotal} learning items finished
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-5 space-y-4">
                                      <SectionCard title="Goals" icon={Flag}>
                                        {week?.goals?.length ? (
                                          <div className="grid gap-3 md:grid-cols-2">
                                            {week.goals.map((goal, goalIndex) => (
                                              <div key={`${goal}-${goalIndex}`} className="flex items-start gap-3 rounded-2xl bg-neutral-50 px-3 py-3 text-sm text-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
                                                <Flag className="mt-0.5 h-4 w-4 text-primary-600" />
                                                <span>{goal}</span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <EmptyText text="No weekly goals provided." />
                                        )}
                                      </SectionCard>

                                      <SectionCard title="Learning Items" icon={BookOpen}>
                                        {week?.learningItems?.length ? (
                                          <div className="space-y-3">
                                            {week.learningItems.map((item, itemIndex) => {
                                              const itemKey = `${phaseIndex}-${weekIndex}-${itemIndex}`;
                                              const isCompleting = completingKey === itemKey;
                                              const isCompleted = Boolean(item?.completed);
                                              const resourceMeta = getResourceMeta(item);

                                              return (
                                                <LearningItemCard
                                                  key={`${item?.title || 'item'}-${itemIndex}`}
                                                  item={item}
                                                  resourceMeta={resourceMeta}
                                                  isCompleted={isCompleted}
                                                  isCompleting={isCompleting}
                                                  onComplete={() => handleMarkComplete(phaseIndex, weekIndex, itemIndex)}
                                                />
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <EmptyText text="No learning items in this week yet." />
                                        )}
                                      </SectionCard>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyText text="No roadmap phases available yet." />
                )}
              </Panel>
            </div>
            <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              <Panel
                title="Progress Snapshot"
                icon={Trophy}
                action={(
                  <button
                    type="button"
                    onClick={handleResetProgress}
                    disabled={resetting || !roadmap?.progress?.completedItems}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/40 dark:bg-red-900/15 dark:text-red-300"
                  >
                    {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    Reset progress
                  </button>
                )}
              >
                <div className="space-y-4">
                  <div className="rounded-[1.35rem] border border-neutral-200 bg-[linear-gradient(135deg,_rgba(243,244,246,0.95),_rgba(238,242,255,0.95))] p-4 dark:border-neutral-700 dark:bg-[linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.96))]">
                    <div className="mb-2 flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
                      <span>Overall completion</span>
                      <span className="font-medium">
                        {roadmap?.progress?.completedItems || 0}/{roadmap?.progress?.totalItems || 0}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-600 via-cyan-500 to-emerald-500"
                        style={{ width: `${Math.min(100, Math.max(0, roadmap?.progress?.overallPercentage || 0))}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Progress" value={`${roadmap?.progress?.overallPercentage || 0}%`} />
                    <MetricCard label="Milestones" value={summary.milestones} />
                    <MetricCard label="Completed" value={roadmap?.progress?.completedItems || 0} />
                    <MetricCard label="Total Items" value={roadmap?.progress?.totalItems || 0} />
                  </div>
                </div>
              </Panel>

              <Panel title="Roadmap Setup" icon={Target}>
                <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <InfoRow label="Hours / week" value={roadmap?.userPreferences?.hoursPerWeek || 0} />
                  <InfoRow label="Budget" value={roadmap?.userPreferences?.budget || 'Not set'} />
                  <InfoRow label="Learning style" value={roadmap?.userPreferences?.learningStyle || 'Not set'} />
                </div>
              </Panel>

              <Panel title="Quick Wins" icon={Lightbulb}>
                {roadmap?.quickwins?.length ? (
                  <div className="space-y-3">
                    {roadmap.quickwins.map((item, index) => (
                      <div key={`${item?.skill || 'quickwin'}-${index}`} className="rounded-[1.35rem] border border-amber-200 bg-[linear-gradient(135deg,_rgba(255,251,235,0.98),_rgba(254,249,195,0.9))] p-4 dark:border-amber-900/40 dark:bg-[linear-gradient(135deg,_rgba(69,26,3,0.25),_rgba(15,23,42,0.96))]">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-amber-600 shadow-soft dark:bg-neutral-900/70 dark:text-amber-300">
                              <Lightbulb className="h-5 w-5" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item?.skill || 'Quick win'}</p>
                              <p className="text-xs uppercase tracking-wide text-amber-700 dark:text-amber-300">High momentum action</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-neutral-900/70 dark:text-amber-300">
                            {item?.timeEstimate || 'Flexible'}
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-neutral-700 dark:text-neutral-300">{item?.impact || 'No impact note available yet.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="No quick wins available yet." />
                )}
              </Panel>

              <Panel title="Milestones" icon={Flag}>
                {roadmap?.progress?.milestones?.length ? (
                  <div className="space-y-3">
                    {roadmap.progress.milestones.map((item, index) => (
                      <div key={`${item?.title || 'milestone'}-${index}`} className="rounded-[1.3rem] border border-violet-200 bg-[linear-gradient(135deg,_rgba(245,243,255,0.98),_rgba(238,242,255,0.98))] p-4 dark:border-violet-900/40 dark:bg-[linear-gradient(135deg,_rgba(46,16,101,0.3),_rgba(15,23,42,0.96))]">
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl ${
                            item?.completed
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                              : 'bg-white text-violet-700 shadow-soft dark:bg-neutral-900 dark:text-violet-300'
                          }`}>
                            {item?.completed ? <CheckCircle2 className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item?.title || 'Milestone'}</p>
                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                              {item?.completed ? 'Reached' : 'Upcoming checkpoint'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="No milestones available yet." />
                )}
              </Panel>

              <Panel title="Portfolio Projects" icon={Rocket}>
                {roadmap?.projects?.length ? (
                  <div className="space-y-4">
                    {roadmap.projects.map((project, index) => (
                      <div key={`${project?.title || 'project'}-${index}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{project?.title || 'Project'}</p>
                        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                          {project?.description || 'No project description available.'}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {(project?.skillsCovered || []).map((skill, skillIndex) => (
                            <span key={`${skill}-${skillIndex}`} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="No portfolio projects available yet." />
                )}
              </Panel>

              <Panel title="Recommended Certifications" icon={Award}>
                {roadmap?.certification?.length ? (
                  <div className="space-y-3">
                    {roadmap.certification.map((item, index) => (
                      <div key={`${item?.title || 'certification'}-${index}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item?.title || 'Certification'}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${priorityTone[item?.priority] || priorityTone.medium}`}>
                            {item?.priority || 'medium'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{item?.provider || 'Provider unavailable'}</p>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400">
                          <span>Duration: {item?.duration || 'Not specified'}</span>
                          <span>Cost: {item?.cost ? `$${item.cost}` : 'Free / unspecified'}</span>
                        </div>
                        {item?.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400">
                            View certification
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyText text="No certifications available yet." />
                )}
              </Panel>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
};

const Panel = ({ title, icon: Icon, children, action = null }) => (
  <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
    <div className="mb-5 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-primary-50 p-3 dark:bg-primary-900/20">
          <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
      </div>
      {action}
    </div>
    {children}
  </div>
);

const GenerationNotice = ({ notice }) => {
  const toneClass = notice?.tone === 'warning'
    ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/15 dark:text-amber-100'
    : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-900/15 dark:text-blue-100';

  const badgeClass = notice?.tone === 'warning'
    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';

  return (
    <section className={`rounded-[1.5rem] border px-5 py-4 ${toneClass}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${badgeClass}`}>
          {notice?.tone === 'warning' ? 'Fallback Mode' : 'Repaired Output'}
        </span>
        <p className="text-sm font-semibold">{notice?.title}</p>
      </div>
      <p className="mt-2 text-sm leading-6 opacity-90">{notice?.description}</p>
    </section>
  );
};

const SectionCard = ({ title, icon: Icon, children }) => (
  <div className="h-full rounded-[1.2rem] border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary-600 dark:text-primary-400" />
      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</p>
    </div>
    {children}
  </div>
);

const PhaseInlineMetric = ({ label, value }) => (
  <div className="min-w-[112px] flex-1 rounded-2xl bg-neutral-50 px-3 py-3 dark:bg-neutral-900/60">
    <p className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
    <p className="mt-1.5 text-sm font-semibold text-neutral-900 dark:text-white">{value}</p>
  </div>
);

const HeroMeta = ({ label, value }) => (
  <div className="rounded-[1rem] border border-white/10 bg-white/8 px-4 py-3">
    <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">{label}</p>
    <p className="mt-1.5 text-lg font-semibold text-white">{value}</p>
  </div>
);

const Tag = ({ children }) => (
  <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium capitalize text-neutral-700 shadow-soft dark:bg-neutral-800 dark:text-neutral-200">
    {children}
  </span>
);

const MetricCard = ({ label, value }) => (
  <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
    <p className="mt-2 text-lg font-semibold capitalize text-neutral-900 dark:text-white">{value}</p>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 capitalize dark:bg-neutral-900/60">
    <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="font-medium text-neutral-900 dark:text-white">{String(value)}</span>
  </div>
);

const EmptyText = ({ text }) => (
  <p className="text-sm text-neutral-500 dark:text-neutral-400">{text}</p>
);

const LearningItemCard = ({ item, resourceMeta, isCompleted, isCompleting, onComplete }) => (
  <div className={`rounded-[1.2rem] border p-4 ${
    isCompleted
      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
      : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'
  }`}>
    <div className="flex flex-col gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-neutral-900 dark:text-white">
                {item?.title || 'Learning item'}
              </p>
              <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium capitalize text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                {item?.type || 'tutorial'}
              </span>
              {item?.estimatedHours ? (
                <span className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                  ~{item.estimatedHours}h
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {item?.description || 'No description available.'}
            </p>
          </div>

          <button
            type="button"
            disabled={isCompleted || isCompleting}
            onClick={onComplete}
            className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition lg:w-[170px] lg:flex-none ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60'
            }`}
          >
            {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isCompleted ? 'Completed' : 'Mark Complete'}
          </button>
        </div>

        <div className="mt-4 rounded-[1.1rem] border border-dashed border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
          <div className="grid gap-4">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-soft dark:bg-neutral-800">
                  <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-6 text-neutral-900 dark:text-white">
                    {resourceMeta.title}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {resourceMeta.provider}
                    {resourceMeta.platform ? ` | ${resourceMeta.platform}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {resourceMeta.hasUrl ? (
              <a
                href={resourceMeta.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-900/40 dark:bg-primary-900/15 dark:text-primary-300"
              >
                Open resource
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <span className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                Resource link not available yet
              </span>
            )}

            <div className="flex flex-wrap gap-2">
              <Tag>{resourceMeta.type}</Tag>
              {resourceMeta.difficulty ? <Tag>{resourceMeta.difficulty}</Tag> : null}
              {resourceMeta.rating ? <Tag>{resourceMeta.rating}/5 rating</Tag> : null}
              {resourceMeta.estimatedTime ? <Tag>~{resourceMeta.estimatedTime}h</Tag> : null}
              <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                resourceMeta.isPremium
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
              }`}>
                {resourceMeta.isPremium ? 'Premium' : 'Free'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const RoadmapProcessingState = ({ roadmap }) => {
  const stages = [
    { key: 'queued', label: 'Queued' },
    { key: 'processing', label: 'Processing' },
    { key: 'finalizing', label: 'Finalizing' },
    { key: 'completed', label: 'Completed' },
  ];

  const currentStage = roadmap?.processingStage || roadmap?.status || 'queued';
  const matchedStageIndex = stages.findIndex((stage) => stage.key === currentStage);
  const currentIndex = matchedStageIndex >= 0 ? matchedStageIndex : 0;
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const baseTime = roadmap?.processingStartedAt || roadmap?.queuedAt || roadmap?.createdAt;
    if (!baseTime) {
      setElapsedSeconds(0);
      return undefined;
    }

    const updateElapsed = () => {
      const diffMs = Date.now() - new Date(baseTime).getTime();
      setElapsedSeconds(Math.max(0, Math.floor(diffMs / 1000)));
    };

    updateElapsed();

    if (!['queued', 'processing', 'finalizing'].includes(roadmap?.status)) {
      return undefined;
    }

    const interval = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(interval);
  }, [roadmap?.processingStartedAt, roadmap?.queuedAt, roadmap?.createdAt, roadmap?.status]);

  const progressWidth = currentStage === 'completed' ? 100 : currentStage === 'finalizing' ? 86 : currentStage === 'processing' ? 56 : 22;
  const elapsedLabel = elapsedSeconds < 60
    ? `${elapsedSeconds}s elapsed`
    : `${Math.floor(elapsedSeconds / 60)}m ${String(elapsedSeconds % 60).padStart(2, '0')}s elapsed`;

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_340px]">
      <Panel title="Roadmap Generation" icon={Map}>
        <div className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-teal-50 p-5 dark:border-blue-900/30 dark:from-blue-950/30 dark:via-neutral-900 dark:to-teal-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">Worker activity</p>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Live backend job state for roadmap generation.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm dark:bg-neutral-800 dark:text-blue-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
              </span>
              {elapsedLabel}
            </div>
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-neutral-200/80 dark:bg-neutral-700/80">
            <div className="relative h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 transition-[width] duration-700 ease-out" style={{ width: `${progressWidth}%` }}>
              <div className="absolute inset-0 animate-pulse bg-white/20" />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {stages.map((stage, index) => {
            const isDone = index < currentIndex || currentStage === 'completed';
            const isActive = stage.key === currentStage;

            return (
              <div key={stage.key} className={`rounded-2xl border px-4 py-4 ${isActive ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/60'}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'}`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{stage.label}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{isDone ? 'Finished' : isActive ? 'In progress' : 'Waiting'}</p>
                    </div>
                  </div>
                  {isActive ? <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Current</span> : null}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
        <Panel title="Current Status" icon={Rocket}>
          <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
            <InfoRow label="Status" value={String(roadmap?.status || 'queued')} />
            <InfoRow label="Stage" value={String(currentStage).replaceAll('_', ' ')} />
            <InfoRow label="Elapsed" value={elapsedLabel} />
            <InfoRow label="Role" value={roadmap?.analysis?.jobRole?.title || 'Selected role'} />
          </div>
        </Panel>
      </div>
    </section>
  );
};

const getSafeRoadmapError = (error) => {
  const raw = String(error || '').trim();
  if (!raw) return 'The roadmap worker could not finish this request.';
  const normalized = raw.toLowerCase();
  if (normalized.includes('quota') || normalized.includes('rate limit')) return 'Roadmap generation could not finish because the AI provider was temporarily unavailable.';
  if (normalized.includes('timeout')) return 'Roadmap generation timed out before the worker could finish.';
  if (normalized.includes('json') || normalized.includes('parse')) return 'Roadmap generation returned an invalid response format.';
  return 'Roadmap generation failed before completion.';
};

const RoadmapFailedState = ({ roadmap, retrying, isAiLimitReached, onRetry }) => (
  <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_340px]">
    <Panel title="Roadmap Generation Failed" icon={Rocket}>
      <div className="rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-900/15">
        <p className="text-lg font-semibold text-red-800 dark:text-red-200">The roadmap job did not complete.</p>
        <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-300">{getSafeRoadmapError(roadmap?.error)}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={onRetry} disabled={retrying || isAiLimitReached} className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
            {retrying ? 'Retrying...' : 'Retry Roadmap'}
          </button>
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:bg-transparent dark:text-red-300">
            Refresh Status
          </button>
        </div>
      </div>
    </Panel>

    <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
      <Panel title="Failure Details" icon={Clock3}>
        <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
          <InfoRow label="Status" value={String(roadmap?.status || 'failed')} />
          <InfoRow label="Stage" value={String(roadmap?.processingStage || 'failed').replaceAll('_', ' ')} />
          <InfoRow label="Role" value={roadmap?.analysis?.jobRole?.title || 'Selected role'} />
        </div>
        {isAiLimitReached ? <p className="mt-4 text-xs font-medium text-red-600 dark:text-red-300">Daily AI limit reached. Resets at 12:00 AM IST.</p> : null}
      </Panel>
    </div>
  </section>
);

export default RoadmapDetailPage;
