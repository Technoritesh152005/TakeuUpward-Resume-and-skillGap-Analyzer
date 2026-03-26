import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Lightbulb,
  ListChecks,
  Loader2,
  Map,
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
    completedItems: 0,
    totalItems: 0,
    milestones: [],
  },
  userPreferences: {},
  createdAt: '',
};

const priorityTone = {
  high: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  low: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
};

const RoadmapDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [completingKey, setCompletingKey] = useState('');
  const [roadmap, setRoadmap] = useState(emptyRoadmap);

  useEffect(() => {
    if (id) {
      fetchRoadmap();
    }
  }, [id]);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      const payload = await roadmapService.getRoadmapById(id);
      const clean = payload?.data || payload;
      setRoadmap({ ...emptyRoadmap, ...clean });
    } catch (error) {
      console.error(error);
      toast.error('Failed to load roadmap details');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (phaseIndex, weekIndex, itemIndex) => {
    const key = `${phaseIndex}-${weekIndex}-${itemIndex}`;
    try {
      setCompletingKey(key);
      const payload = await roadmapService.markItemComplete({
        roadmapId: id,
        phaseIndex,
        weekIndex,
        itemIndex,
      });
      const clean = payload?.data || payload;
      setRoadmap({ ...emptyRoadmap, ...clean });
      toast.success('Learning item marked complete');
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to update roadmap progress');
    } finally {
      setCompletingKey('');
    }
  };

  const summary = useMemo(() => {
    const totalWeeks = roadmap?.duration?.weeks || 0;
    const totalPhases = roadmap?.phases?.length || 0;
    const quickWins = roadmap?.quickwins?.length || 0;
    const milestones = roadmap?.progress?.milestones?.length || 0;

    return { totalWeeks, totalPhases, quickWins, milestones };
  }, [roadmap]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-soft dark:border-neutral-700 dark:bg-neutral-800 md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate('/roadmap')}
                className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to All Roadmaps
              </button>

              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
                Roadmap Detail
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
                {loading ? 'Loading roadmap...' : roadmap?.title || 'Learning roadmap'}
              </h1>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                <span className="inline-flex items-center gap-2">
                  <Target className="h-4 w-4 text-neutral-400" />
                  {roadmap?.analysis?.jobRole?.title || 'Role unavailable'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Map className="h-4 w-4 text-neutral-400" />
                  {roadmap?.analysis?.jobRole?.category || 'General roadmap'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-neutral-400" />
                  {roadmap?.createdAt ? format(new Date(roadmap.createdAt), 'dd MMM yyyy, hh:mm a') : 'No date'}
                </span>
              </div>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">
                Review your phase-by-phase learning sequence, track completed items, and use the weekly plan to stay on schedule for the target role.
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="h-96 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 xl:col-span-2" />
            <div className="h-96 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Progress" value={`${roadmap?.progress?.overallPercentage || 0}%`} icon={Trophy} />
              <StatCard label="Duration" value={`${summary.totalWeeks || 0} weeks`} icon={Clock3} />
              <StatCard label="Phases" value={summary.totalPhases} icon={ListChecks} />
              <StatCard label="Quick Wins" value={summary.quickWins} icon={Lightbulb} />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="space-y-6 xl:col-span-2">
                <Panel title="Roadmap Progress" icon={Trophy}>
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
                        <span>Completed learning items</span>
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

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <MetricCard label="Completed" value={roadmap?.progress?.completedItems || 0} />
                      <MetricCard label="Total Items" value={roadmap?.progress?.totalItems || 0} />
                      <MetricCard label="Milestones" value={summary.milestones} />
                    </div>
                  </div>
                </Panel>

                <Panel title="Quick Wins" icon={Lightbulb}>
                  {roadmap?.quickwins?.length ? (
                    <div className="space-y-3">
                      {roadmap.quickwins.map((item, index) => (
                        <div key={`${item?.skill || 'quickwin'}-${index}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
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

                <Panel title="Phase Breakdown" icon={Map}>
                  {roadmap?.phases?.length ? (
                    <div className="space-y-6">
                      {roadmap.phases.map((phase, phaseIndex) => (
                        <div key={`${phase?.title || 'phase'}-${phaseIndex}`} className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-700">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
                                Phase {phase?.phaseNumber || phaseIndex + 1}
                              </p>
                              <h3 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-white">
                                {phase?.title || 'Learning phase'}
                              </h3>
                            </div>
                            <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                              {phase?.duration ? `${phase.duration} weeks` : 'Flexible'}
                            </span>
                          </div>

                          {phase?.objectives?.length ? (
                            <div className="mt-4">
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white">Objectives</p>
                              <ul className="mt-2 space-y-2">
                                {phase.objectives.map((objective, index) => (
                                  <li key={`${objective}-${index}`} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                                    <span className="mt-1 text-primary-600">•</span>
                                    <span>{objective}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}

                          <div className="mt-5 space-y-4">
                            {phase?.weeklyBreakdown?.map((week, weekIndex) => (
                              <div key={`${week?.week || weekIndex}-${phaseIndex}`} className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                      Week {week?.week || weekIndex + 1}: {week?.focus || 'Focus area'}
                                    </p>
                                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                      {week?.timeCommitment || 'No time commitment provided'}
                                    </p>
                                  </div>
                                </div>

                                {week?.goals?.length ? (
                                  <div className="mt-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Goals</p>
                                    <ul className="mt-2 space-y-1">
                                      {week.goals.map((goal, goalIndex) => (
                                        <li key={`${goal}-${goalIndex}`} className="flex items-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                                          <span className="mt-1 text-primary-600">•</span>
                                          <span>{goal}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}

                                <div className="mt-4 space-y-3">
                                  {week?.learningItems?.length ? (
                                    week.learningItems.map((item, itemIndex) => {
                                      const itemKey = `${phaseIndex}-${weekIndex}-${itemIndex}`;
                                      const isCompleting = completingKey === itemKey;
                                      const isCompleted = Boolean(item?.completed);

                                      return (
                                        <div
                                          key={`${item?.title || 'item'}-${itemIndex}`}
                                          className={`rounded-2xl border p-4 ${isCompleted
                                            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                                            : 'border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'}`}
                                        >
                                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="min-w-0 flex-1">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
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

                                              {item?.url ? (
                                                <a
                                                  href={item.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                                                >
                                                  Open resource
                                                  <ExternalLink className="h-4 w-4" />
                                                </a>
                                              ) : null}
                                            </div>

                                            <button
                                              type="button"
                                              disabled={isCompleted || isCompleting}
                                              onClick={() => handleMarkComplete(phaseIndex, weekIndex, itemIndex)}
                                              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
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
                      ))}
                    </div>
                  ) : (
                    <EmptyText text="No roadmap phases available yet." />
                  )}
                </Panel>
              </div>

              <div className="space-y-6">
                <Panel title="Preferences" icon={Target}>
                  <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                    <InfoRow label="Hours / week" value={roadmap?.userPreferences?.hoursPerWeek || 0} />
                    <InfoRow label="Budget" value={roadmap?.userPreferences?.budget || 'Not set'} />
                    <InfoRow label="Learning style" value={roadmap?.userPreferences?.learningStyle || 'Not set'} />
                  </div>
                </Panel>

                <Panel title="Milestones" icon={Trophy}>
                  {roadmap?.progress?.milestones?.length ? (
                    <div className="space-y-3">
                      {roadmap.progress.milestones.map((item, index) => (
                        <div key={`${item?.title || 'milestone'}-${index}`} className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
                          <p className="text-sm font-medium text-neutral-900 dark:text-white">{item?.title || 'Milestone'}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyText text="No milestones available yet." />
                  )}
                </Panel>

                <Panel title="Portfolio Projects" icon={ListChecks}>
                  {roadmap?.projects?.length ? (
                    <div className="space-y-4">
                      {roadmap.projects.map((project, index) => (
                        <div key={`${project?.title || 'project'}-${index}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">{project?.title || 'Project'}</p>
                          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{project?.description || 'No project description available.'}</p>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

const Panel = ({ title, icon: Icon, children }) => (
  <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
    <div className="mb-5 flex items-center gap-3">
      <div className="rounded-2xl bg-primary-50 p-3 dark:bg-primary-900/20">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
    </div>
    {children}
  </div>
);

const StatCard = ({ label, value, icon: Icon }) => (
  <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
      <div className="rounded-2xl bg-neutral-100 p-3 dark:bg-neutral-700">
        <Icon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
      </div>
    </div>
    <p className="mt-5 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">{value}</p>
  </div>
);

const MetricCard = ({ label, value }) => (
  <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">{value}</p>
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
