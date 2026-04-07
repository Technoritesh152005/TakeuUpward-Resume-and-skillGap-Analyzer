import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  DollarSign,
  Lightbulb,
  Map,
  Rocket,
  Sparkles,
  Target,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import analysisService from '../services/analysisService.js';
import roadmapService from '../services/roadmapService.js';
import dashboardService from '../services/dashboardServices.js';

const defaultPreferences = {
  hoursPerWeek: 8,
  budget: 'free',
  learningStyle: 'mixed',
};

const learningStyleOptions = [
  {
    value: 'mixed',
    label: 'Mixed',
    description: 'Balanced roadmap using projects, reading, and guided learning.',
    icon: Sparkles,
  },
  {
    value: 'visual',
    label: 'Visual',
    description: 'Bias toward videos, demos, and example-driven resources.',
    icon: Lightbulb,
  },
  {
    value: 'reading',
    label: 'Reading',
    description: 'Bias toward documentation, books, and structured notes.',
    icon: BookOpen,
  },
  {
    value: 'auditory',
    label: 'Auditory',
    description: 'Bias toward spoken explanations and discussion-led learning.',
    icon: Brain,
  },
  {
    value: 'kinesthetic',
    label: 'Hands-on',
    description: 'Bias toward projects, practice tasks, and applied exercises.',
    icon: Rocket,
  },
];

const budgetOptions = [
  { value: 'free', label: 'Free', hint: 'Open resources only' },
  { value: 'low', label: 'Low', hint: 'Small paid resources allowed' },
  { value: 'medium', label: 'Medium', hint: 'Balanced paid options' },
  { value: 'high', label: 'High', hint: 'Best available resources' },
];

const getGapCount = (analysis) =>
  (analysis?.skillGaps?.critical?.length || 0) +
  (analysis?.skillGaps?.important?.length || 0) +
  (analysis?.skillGaps?.niceToHave?.length || 0);

const getPrioritySkills = (analysis) => [
  ...(analysis?.skillGaps?.critical || []),
  ...(analysis?.skillGaps?.important || []),
  ...(analysis?.skillGaps?.niceToHave || []),
]
  .map((item) => item?.skill)
  .filter(Boolean)
  .slice(0, 4);

const RoadmapCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const analysisIdFromQuery = searchParams.get('analysisId') || '';

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState(analysisIdFromQuery);
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [aiUsage, setAiUsage] = useState(null);
  const isAiLimitReached = (aiUsage?.usesRemaining ?? 0) === 0;

  useEffect(() => {
    fetchCompletedAnalyses();
    fetchAiUsage();
  }, []);

  const fetchAiUsage = async () => {
    try {
      const response = await dashboardService.getDashboardData();
      setAiUsage(response?.data?.aiUsage || null);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCompletedAnalyses = async () => {
    try {
      setLoading(true);
      const response = await analysisService.getMyAnalyses({
        page: 1,
        limit: 50,
        sort: '-createdAt',
      });

      const docs = Array.isArray(response?.docs) ? response.docs : [];
      setAnalyses(docs);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load analyses for roadmap creation');
    } finally {
      setLoading(false);
    }
  };

  const completedAnalyses = useMemo(
    () => analyses.filter((item) => item?.status === 'completed'),
    [analyses]
  );

  useEffect(() => {
    if (!completedAnalyses.length) return;

    const requested = completedAnalyses.find((item) => item?._id === analysisIdFromQuery);
    if (requested) {
      setSelectedAnalysisId(requested._id);
      return;
    }

    setSelectedAnalysisId((current) => current || completedAnalyses[0]._id);
  }, [analysisIdFromQuery, completedAnalyses]);

  const selectedAnalysis = useMemo(
    () => completedAnalyses.find((item) => item?._id === selectedAnalysisId) || null,
    [completedAnalyses, selectedAnalysisId]
  );

  const summary = useMemo(() => {
    const matchScore = selectedAnalysis?.matchScore || 0;
    const totalGaps = getGapCount(selectedAnalysis);
    const keySkills = getPrioritySkills(selectedAnalysis);

    return {
      matchScore,
      totalGaps,
      keySkills,
      weeks: selectedAnalysis?.estimatedTimeToReady?.weeks || 0,
      readiness: String(selectedAnalysis?.readinessLevel || 'not-ready').replace('-', ' '),
    };
  }, [selectedAnalysis]);

  const canSubmit = Boolean(selectedAnalysisId) && !creating && completedAnalyses.length > 0;

  const roadmapStatusCopy = {
    queued: 'Roadmap queued successfully',
    processing: 'Roadmap generation started',
    finalizing: 'Roadmap is being finalized',
    completed: 'Roadmap created successfully',
  };

  const handleCreateRoadmap = async (event) => {
    event.preventDefault();

    if (!selectedAnalysisId) {
      toast.error('Select a completed analysis first');
      return;
    }
    if (isAiLimitReached) {
      toast.error('Daily AI limit reached. Resets at 12:00 AM IST');
      return;
    }

    try {
      setCreating(true);
      const response = await roadmapService.createRoadmap(selectedAnalysisId, {
        hoursPerWeek: Number(preferences.hoursPerWeek),
        budget: preferences.budget,
        learningStyle: preferences.learningStyle,
      });
      const roadmap = response?.roadmap || response;
      if (response?.aiUsage) setAiUsage(response.aiUsage);

      // Queue-aware create flow: navigate immediately and let detail page track progress.
      toast.success(roadmapStatusCopy[roadmap?.status] || 'Roadmap created successfully');
      navigate(`/roadmap/${roadmap?._id}`);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Failed to create roadmap';

      const normalizedMessage = String(message).toLowerCase();

      if (normalizedMessage.includes('existing roadmap')) {
        try {
          const existingRoadmap = await roadmapService.getRoadmapByAnalysis(selectedAnalysisId);
          toast.success('Existing roadmap found. Opening it now.');
          navigate(`/roadmap/${existingRoadmap?._id}`);
          return;
        } catch (lookupError) {
          console.error(lookupError);
        }
      }

      console.error(error);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(135deg,_#111827,_#1f2937_48%,_#0f766e)] p-6 text-white shadow-soft dark:border-neutral-700 md:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_58%)] lg:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <button
                type="button"
                onClick={() => navigate('/analysis')}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Analyses
              </button>

              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Map className="h-4 w-4" />
                Roadmap Builder
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Turn one completed analysis into a focused learning plan
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                Pick the analysis you want to act on, tune the time and budget constraints, and generate a backend-powered roadmap that matches your role gap profile.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <HeroStat label="Completed Analyses" value={completedAnalyses.length} />
              <HeroStat label="Hours / Week" value={preferences.hoursPerWeek} />
              <HeroStat label="Budget" value={preferences.budget} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <Panel
              title="Select Completed Analysis"
              subtitle="Only completed analyses can be used because roadmap generation depends on the final skill-gap output."
              icon={Target}
            >
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-36 animate-pulse rounded-3xl border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900/60"
                    />
                  ))}
                </div>
              ) : completedAnalyses.length ? (
                <div className="space-y-4">
                  {completedAnalyses.map((analysis) => {
                    const isSelected = analysis._id === selectedAnalysisId;
                    const totalGaps = getGapCount(analysis);

                    return (
                      <button
                        key={analysis._id}
                        type="button"
                        onClick={() => setSelectedAnalysisId(analysis._id)}
                        className={`w-full rounded-3xl border p-5 text-left transition ${
                          isSelected
                            ? 'border-primary-400 bg-primary-50/70 shadow-soft dark:border-primary-700 dark:bg-primary-900/15'
                            : 'border-neutral-200 bg-white hover:border-primary-300 hover:shadow-soft dark:border-neutral-700 dark:bg-neutral-800'
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                Completed
                              </span>
                              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {analysis?.createdAt ? format(new Date(analysis.createdAt), 'dd MMM yyyy') : 'No date'}
                              </span>
                            </div>

                            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                              {analysis?.jobRole?.title || 'Untitled analysis'}
                            </h2>

                            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                              <span>{analysis?.jobRole?.category || 'General role'}</span>
                              <span>{analysis?.resume?.originalFileName || analysis?.resume?.fileName || 'Resume unavailable'}</span>
                              <span>{analysis?.estimatedTimeToReady?.weeks || 0} weeks to ready</span>
                            </div>

                            <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                              {analysis?.aiSuggestion?.summary || 'Use this completed analysis to generate a roadmap with weekly learning items and project suggestions.'}
                            </p>
                          </div>

                          <div className="grid min-w-full grid-cols-2 gap-3 lg:min-w-[280px]">
                            <MetricCard label="Match Score" value={`${analysis?.matchScore || 0}%`} />
                            <MetricCard label="Skill Gaps" value={totalGaps} />
                            <MetricCard label="Critical Gaps" value={analysis?.skillGaps?.critical?.length || 0} />
                            <MetricCard label="Readiness" value={String(analysis?.readinessLevel || 'not-ready').replace('-', ' ')} />
                          </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4 text-sm dark:border-neutral-700">
                          <div className="flex flex-wrap gap-2">
                            {(getPrioritySkills(analysis) || []).map((skill, index) => (
                              <span
                                key={`${skill}-${index}`}
                                className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>

                          {isSelected ? (
                            <span className="inline-flex items-center gap-2 font-semibold text-primary-700 dark:text-primary-300">
                              Selected
                              <CheckCircle2 className="h-4 w-4" />
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 font-semibold text-primary-600 dark:text-primary-400">
                              Use this analysis
                              <ArrowRight className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyStateCard
                  title="No completed analyses available"
                  description="Create and complete an analysis first. Roadmap generation uses the final role-fit and skill-gap results."
                  actionLabel="Create Analysis"
                  onAction={() => navigate('/analysis/create')}
                />
              )}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel
              title="Roadmap Preferences"
              subtitle="These settings are sent directly to the roadmap backend so the generated plan fits your real constraints."
              icon={Sparkles}
            >
              <form className="space-y-6" onSubmit={handleCreateRoadmap}>
                <div className="rounded-3xl bg-neutral-50 p-5 dark:bg-neutral-900/60">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">Weekly learning time</p>
                      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        Higher commitment gives the planner more room for weekly depth.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-soft dark:bg-neutral-800">
                      <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Hours / week</p>
                      <p className="mt-1 text-2xl font-bold text-neutral-900 dark:text-white">{preferences.hoursPerWeek}</p>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="40"
                    step="1"
                    value={preferences.hoursPerWeek}
                    onChange={(event) =>
                      setPreferences((current) => ({
                        ...current,
                        hoursPerWeek: Number(event.target.value),
                      }))
                    }
                    className="mt-5 h-2 w-full cursor-pointer appearance-none rounded-full bg-neutral-200 accent-primary-600 dark:bg-neutral-700"
                  />

                  <div className="mt-3 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>1 hour</span>
                    <span>40 hours</span>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-neutral-400" />
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">Budget</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {budgetOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setPreferences((current) => ({
                            ...current,
                            budget: option.value,
                          }))
                        }
                        className={`rounded-2xl border p-4 text-left transition ${
                          preferences.budget === option.value
                            ? 'border-primary-400 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/15'
                            : 'border-neutral-200 hover:border-primary-300 dark:border-neutral-700'
                        }`}
                      >
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{option.label}</p>
                        <p className="mt-1 text-xs leading-5 text-neutral-500 dark:text-neutral-400">{option.hint}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-neutral-400" />
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white">Learning style</p>
                  </div>
                  <div className="space-y-3">
                    {learningStyleOptions.map((option) => {
                      const Icon = option.icon;
                      const selected = preferences.learningStyle === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setPreferences((current) => ({
                              ...current,
                              learningStyle: option.value,
                            }))
                          }
                          className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                            selected
                              ? 'border-primary-400 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/15'
                              : 'border-neutral-200 hover:border-primary-300 dark:border-neutral-700'
                          }`}
                        >
                          <div className="rounded-2xl bg-neutral-100 p-3 dark:bg-neutral-800">
                            <Icon className="h-5 w-5 text-neutral-700 dark:text-neutral-200" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{option.label}</p>
                              {selected ? <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400" /> : null}
                            </div>
                            <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{option.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit || isAiLimitReached}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Map className="h-4 w-4" />
                  {creating ? 'Generating roadmap...' : 'Generate Roadmap'}
                </button>
                {isAiLimitReached ? (
                  <p className="text-xs font-medium text-red-500 dark:text-red-400">Daily AI limit reached. Resets at 12:00 AM IST.</p>
                ) : null}
              </form>
            </Panel>

            <Panel
              title="Preview"
              subtitle="A quick snapshot of the currently selected analysis before generation."
              icon={Clock3}
            >
              {selectedAnalysis ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <MetricCard label="Match Score" value={`${summary.matchScore}%`} />
                    <MetricCard label="Estimated Ready" value={`${summary.weeks} weeks`} />
                    <MetricCard label="Total Gaps" value={summary.totalGaps} />
                    <MetricCard label="Readiness" value={summary.readiness} />
                  </div>

                  <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      Priority skills likely to shape the roadmap
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {summary.keySkills.length ? (
                        summary.keySkills.map((skill, index) => (
                          <span
                            key={`${skill}-${index}`}
                            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-soft dark:bg-neutral-800 dark:text-neutral-200"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-neutral-500 dark:text-neutral-400">No visible skill gaps in this analysis.</span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Select a completed analysis to preview the roadmap inputs.
                </p>
              )}
            </Panel>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

const Panel = ({ title, subtitle, icon: Icon, children }) => (
  <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
    <div className="mb-5 flex items-start gap-3">
      <div className="rounded-2xl bg-primary-50 p-3 dark:bg-primary-900/20">
        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{subtitle}</p>
      </div>
    </div>
    {children}
  </div>
);

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

const EmptyStateCard = ({ title, description, actionLabel, onAction }) => (
  <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-14 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-soft dark:bg-neutral-800">
      <Map className="h-8 w-8 text-neutral-400" />
    </div>
    <h3 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-white">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-neutral-500 dark:text-neutral-400">{description}</p>
    <button
      type="button"
      onClick={onAction}
      className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
    >
      <Target className="h-4 w-4" />
      {actionLabel}
    </button>
  </div>
);

export default RoadmapCreatePage;