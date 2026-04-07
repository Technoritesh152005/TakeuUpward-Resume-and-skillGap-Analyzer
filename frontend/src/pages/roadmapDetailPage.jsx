import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flag,
  Lightbulb,
  Loader2,
  Map,
  BookOpen,
  Rocket,
  Target,
  Trophy,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import roadmapService from '../services/roadmapService.js';

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

  useEffect(() => {
    if (id) {
      fetchRoadmap();
    }
  }, [id]);

  // Poll only while the roadmap job is still active.
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
      if (!silent) {
        setLoading(true);
      }
      const response = await roadmapService.getRoadmapById(id);
      const clean = response?.data || response;
      setRoadmap({ ...emptyRoadmap, ...clean });
    } catch (error) {
      console.error(error);
      toast.error('Failed to fetch your roadmap');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Status polling keeps the processing screen stable and fetches full detail only at the end.
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
      }));

      if (clean?.status === 'completed' || clean?.status === 'failed') {
        fetchRoadmap({ silent: true });
      }
    } catch (error) {
      console.error(error);
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
      console.error(error);
      toast.error('Failed to mark the item as completed');
    } finally {
      setCompletingKey('');
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

    return {
      totalPhases,
      totalWeeks,
      quickWins,
      milestones,
      nextIncompletePhaseIndex,
    };
  }, [roadmap]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_28%),linear-gradient(135deg,_#0f172a,_#111827_48%,_#172554)] p-6 text-white shadow-soft dark:border-neutral-700 md:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.16),_transparent_58%)] xl:block" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
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
                Learning Route
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                {loading ? 'Loading roadmap...' : roadmap?.title || 'Learning roadmap'}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
                {['queued', 'processing', 'finalizing'].includes(roadmap?.status)
                  ? (roadmapStageCopy[roadmap?.processingStage || roadmap?.status] || 'Roadmap generation is running in the background.')
                  : 'A phase-by-phase path to move from current gaps to a stronger role fit. Follow the sequence, complete each learning item, and use the progress markers to stay on track.'}
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[420px]">
              <HeroStat label="Progress" value={`${roadmap?.progress?.overallPercentage || 0}%`} />
              <HeroStat label="Phases" value={summary.totalPhases} />
              <HeroStat label="Weeks" value={summary.totalWeeks} />
              <HeroStat label="Quick Wins" value={summary.quickWins} />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
            <div className="h-[42rem] animate-pulse rounded-[2rem] border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
            <div className="h-[42rem] animate-pulse rounded-[2rem] border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
          </div>
        ) : ['queued', 'processing', 'finalizing'].includes(roadmap?.status) ? (
          <RoadmapProcessingState roadmap={roadmap} />
        ) : (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_340px]">
            <div className="space-y-6">
              <Panel title="Roadmap Journey" icon={Map}>
                <div className="space-y-6">
                  {(roadmap?.phases || []).length ? (
                    roadmap.phases.map((phase, phaseIndex) => {
                      const phaseCompleted = getPhaseCompletedCount(phase);
                      const phaseTotal = getPhaseTotalCount(phase);
                      const phaseProgress = phaseTotal ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
                      const isCurrent = summary.nextIncompletePhaseIndex === -1
                        ? phaseIndex === roadmap.phases.length - 1
                        : phaseIndex === summary.nextIncompletePhaseIndex;

                      return (
                        <div key={`${phase?.title || 'phase'}-${phaseIndex}`} className="relative pl-8">
                          {phaseIndex !== roadmap.phases.length - 1 ? (
                            <div className="absolute left-[0.92rem] top-10 h-[calc(100%+1.5rem)] w-px bg-gradient-to-b from-primary-500/70 to-neutral-200 dark:to-neutral-700" />
                          ) : null}

                          <div className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold ${
                            isCurrent
                              ? 'border-primary-400 bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                              : phaseProgress === 100
                                ? 'border-emerald-300 bg-emerald-500 text-white'
                                : 'border-neutral-300 bg-white text-neutral-700 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-200'
                          }`}>
                            {phaseProgress === 100 ? <CheckCircle2 className="h-4 w-4" /> : phase?.phaseNumber || phaseIndex + 1}
                          </div>

                          <div className="rounded-[1.5rem] border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                                    Phase {phase?.phaseNumber || phaseIndex + 1}
                                  </span>
                                  {isCurrent ? (
                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                                      Current focus
                                    </span>
                                  ) : null}
                                </div>
                                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                                  {phase?.title || 'Learning phase'}
                                </h2>
                                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                  {phaseCompleted} of {phaseTotal} items completed
                                </p>
                              </div>

                              <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
                                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                                  <span>Phase progress</span>
                                  <span>{phaseProgress}%</span>
                                </div>
                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-primary-600 to-emerald-500"
                                    style={{ width: `${Math.min(100, Math.max(0, phaseProgress))}%` }}
                                  />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-sm text-neutral-600 dark:text-neutral-300">
                                  <span>{phase?.duration ? `${phase.duration} weeks` : 'Flexible pace'}</span>
                                  <span>{phaseTotal} tasks</span>
                                </div>
                              </div>
                            </div>

                            {phase?.objectives?.length ? (
                              <div className="mt-5 rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Objectives</p>
                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                  {phase.objectives.map((objective, index) => (
                                    <div key={`${objective}-${index}`} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                                      <span className="mt-1 h-2 w-2 rounded-full bg-primary-600" />
                                      <span>{objective}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            <div className="mt-6 space-y-3">
                              {(phase?.weeklyBreakdown || []).map((week, weekIndex) => (
                                <div key={`${week?.week || weekIndex}-${phaseIndex}`} className="rounded-[1.25rem] border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/60">
                                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                      <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                                        Week {week?.week || weekIndex + 1}
                                        <span className="ml-2 text-neutral-500 dark:text-neutral-400">· {week?.focus || 'Focus area'}</span>
                                      </p>
                                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                        {week?.timeCommitment || 'No time commitment provided'}
                                      </p>
                                    </div>
                                  </div>

                                  {week?.goals?.length ? (
                                    <div className="mt-4">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Goals for this week</p>
                                      <div className="mt-3 grid gap-2">
                                        {week.goals.map((goal, goalIndex) => (
                                          <div key={`${goal}-${goalIndex}`} className="flex items-start gap-3 text-sm text-neutral-700 dark:text-neutral-300">
                                            <Flag className="mt-0.5 h-4 w-4 text-primary-600" />
                                            <span>{goal}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}

                                  <div className="mt-4 space-y-3">
                                    {week?.learningItems?.length ? (
                                      week.learningItems.map((item, itemIndex) => {
                                        const itemKey = `${phaseIndex}-${weekIndex}-${itemIndex}`;
                                        const isCompleting = completingKey === itemKey;
                                        const isCompleted = Boolean(item?.completed);
                                        const resourceMeta = getResourceMeta(item);

                                        return (
                                          <div
                                            key={`${item?.title || 'item'}-${itemIndex}`}
                                            className={`rounded-[1.1rem] border p-4 ${
                                              isCompleted
                                                ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                                : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'
                                            }`}
                                          >
                                            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_170px] xl:items-start">
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

                                                <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
                                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                    <div className="min-w-0 flex-1">
                                                      <div className="flex flex-wrap items-center gap-2">
                                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white shadow-soft dark:bg-neutral-800">
                                                          <BookOpen className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                                                        </span>
                                                        <div>
                                                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                                            {resourceMeta.title}
                                                          </p>
                                                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            {resourceMeta.provider}
                                                            {resourceMeta.platform ? ` · ${resourceMeta.platform}` : ''}
                                                          </p>
                                                        </div>
                                                      </div>

                                                      <div className="mt-3 flex flex-wrap gap-2">
                                                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium capitalize text-neutral-700 shadow-soft dark:bg-neutral-800 dark:text-neutral-200">
                                                          {resourceMeta.type}
                                                        </span>
                                                        {resourceMeta.difficulty ? (
                                                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium capitalize text-neutral-700 shadow-soft dark:bg-neutral-800 dark:text-neutral-200">
                                                            {resourceMeta.difficulty}
                                                          </span>
                                                        ) : null}
                                                        {resourceMeta.rating ? (
                                                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-soft dark:bg-neutral-800 dark:text-neutral-200">
                                                            {resourceMeta.rating}/5 rating
                                                          </span>
                                                        ) : null}
                                                        {resourceMeta.estimatedTime ? (
                                                          <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-neutral-700 shadow-soft dark:bg-neutral-800 dark:text-neutral-200">
                                                            ~{resourceMeta.estimatedTime}h
                                                          </span>
                                                        ) : null}
                                                        <span className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                                                          resourceMeta.isPremium
                                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                                                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                                                        }`}>
                                                          {resourceMeta.isPremium ? 'Premium' : 'Free'}
                                                        </span>
                                                      </div>
                                                    </div>

                                                    {resourceMeta.hasUrl ? (
                                                      <a
                                                        href={resourceMeta.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 self-start rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-900/40 dark:bg-primary-900/15 dark:text-primary-300"
                                                      >
                                                        Open resource
                                                        <ExternalLink className="h-4 w-4" />
                                                      </a>
                                                    ) : (
                                                      <span className="rounded-full bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400">
                                                        Resource link not available yet
                                                      </span>
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                              <button
                                                type="button"
                                                disabled={isCompleted || isCompleting}
                                                onClick={() => handleMarkComplete(phaseIndex, weekIndex, itemIndex)}
                                                className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition xl:sticky xl:top-4 ${
                                                  isCompleted
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                    : 'bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60'
                                                }`}
                                              >
                                                {isCompleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                {isCompleted ? 'Completed' : 'Mark Complete'}
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })
                                    ) : (
                                      <EmptyText text="No learning items in this week yet." />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <EmptyText text="No roadmap phases available yet." />
                  )}
                </div>
              </Panel>
            </div>

            <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              <Panel title="Progress Snapshot" icon={Trophy}>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
                      <span>Overall completion</span>
                      <span className="font-medium">
                        {roadmap?.progress?.completedItems || 0}/{roadmap?.progress?.totalItems || 0}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-600 to-emerald-500"
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
                      <div key={`${item?.skill || 'quickwin'}-${index}`} className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item?.skill || 'Quick win'}</p>
                          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                            {item?.timeEstimate || 'Flexible'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{item?.impact || 'No impact note available yet.'}</p>
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
                      <div key={`${item?.title || 'milestone'}-${index}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">{item?.title || 'Milestone'}</p>
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
                            <span
                              key={`${skill}-${skillIndex}`}
                              className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                            >
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
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                          >
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

const Panel = ({ title, icon: Icon, children }) => (
  <div className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-2xl bg-primary-50 p-3 dark:bg-primary-900/20">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
    </div>
    {children}
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

  const progressWidth = currentStage === 'completed'
    ? 100
    : currentStage === 'finalizing'
      ? 86
      : currentStage === 'processing'
        ? 56
        : 22;

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
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Live backend job state for roadmap generation.
              </p>
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
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 transition-[width] duration-700 ease-out"
              style={{ width: `${progressWidth}%` }}
            >
              <div className="absolute inset-0 animate-pulse bg-white/20" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span>Current stage: {String(currentStage).replaceAll('_', ' ')}</span>
            <span>Typical completion time: 20 to 45 seconds</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {stages.map((stage, index) => {
            const isDone = index < currentIndex || currentStage === 'completed';
            const isActive = stage.key === currentStage;

            return (
              <div
                key={stage.key}
                className={`rounded-2xl border px-4 py-4 transition ${isActive ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' : 'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/60'}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${isDone ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : isActive ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'}`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{stage.label}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {isDone ? 'Finished' : isActive ? 'In progress' : 'Waiting'}
                      </p>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      Current
                    </span>
                  ) : null}
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

        <Panel title="What Happens Next" icon={Clock3}>
          <div className="space-y-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            <p>The worker is building the roadmap structure and matching learning resources.</p>
            <p>This page checks for status updates automatically without interrupting the view.</p>
            <p>Once completed, phases, weekly tasks, quick wins, projects, and certifications will appear here automatically.</p>
          </div>
        </Panel>
      </div>
    </section>
  );
};

const HeroStat = ({ label, value }) => (
  <div className="rounded-2xl bg-white/10 px-4 py-4 backdrop-blur-sm">
    <p className="text-xs uppercase tracking-wide text-white/70">{label}</p>
    <p className="mt-2 text-2xl font-bold text-white">{value}</p>
  </div>
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

export default RoadmapDetailPage;