// React hooks used to store state, run side effects, and derive filtered data.
import { useEffect, useMemo, useState } from 'react';
// Router helpers:
// - useNavigate: move user to another route
// - useLocation: read current URL details
// - useParams: read route params like /analysis/:id
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
  ClipboardList,
  GitCompareArrows,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  Loader2,
  Target,
  Trophy,
  Rocket,
  BookOpen,
  Brain,
  ScanSearch,
  Stars,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
// Toasts show small success/error popup messages.
import toast from 'react-hot-toast';
// Shared dashboard shell for authenticated pages.
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
// Service that calls resume-related backend APIs.
import resumeService from '../services/resumeService.js';
// Service that calls analysis backend APIs.
import analysisService from '../services/analysisService.js';
import jobRoleService from '../services/jobRoleService.js';
import dashboardService from '../services/dashboardServices.js';

// Safe fallback object for the analysis result area.
const emptyOverview = {
  matchScore: 0,
  readinessLevel: 'not-ready',
  estimatedTimeToReady: { weeks: 0, reason: '' },
  matchBreakDown: null,
  skillGaps: { critical: [], important: [], niceToHave: [] },
  candidateStrength: [],
  atsScore: null,
  aiSuggestion: { summary: '', recommendations: [] },
};

const createAnalysisStages = [
  {
    title: 'Reading Resume',
    description: 'Looking at your skills and experience.',
    icon: ScanSearch,
  },
  {
    title: 'Checking Job Fit',
    description: 'Seeing how well your skills match the job.',
    icon: Brain,
  },
  {
    title: 'Finishing Analysis',
    description: 'Preparing your match score and tips.',
    icon: Stars,
  },
];

// data for processing status
const analysisStageMeta = {
  queued: {
    title: 'Queueing Analysis',
    description: 'Your analysis request is waiting for the worker to pick it up.',
  },
  processing: {
    title: 'Processing Analysis',
    description: 'The worker is generating your skill-gap and ATS analysis now.',
  },
  finalizing: {
    title: 'Finalizing Result',
    description: 'Saving the analysis summary, strengths, gaps, and ATS insights.',
  },
};

const scoreTone = (score) => {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
};

const parseResumeDocs = (payload) => {
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
  if (Array.isArray(payload?.data?.data?.docs)) return payload.data.data.docs;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
};

const AnalysisPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: analysisIdFromRoute } = useParams();

  const resumeIdFromQuery = new URLSearchParams(location.search).get('resumeId');
  const jobRoleIdFromQuery = new URLSearchParams(location.search).get('jobRoleId');

  const [loadingBase, setLoadingBase] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);

  const [selectedResumeId, setSelectedResumeId] = useState(resumeIdFromQuery || '');
  const [selectedJobRoleId, setSelectedJobRoleId] = useState(jobRoleIdFromQuery || '');
  const [compareRoleIds, setCompareRoleIds] = useState([]);
  const [jobRoleSearch, setJobRoleSearch] = useState('');
  const [compareRoleSearch, setCompareRoleSearch] = useState('');

  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [budget, setBudget] = useState('medium');
  const [learningStyle, setLearningStyle] = useState('mixed');

  const [creating, setCreating] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [createStageIndex, setCreateStageIndex] = useState(0);
  const [showCreateOverlay, setShowCreateOverlay] = useState(false);

  const [analysisOverview, setAnalysisOverview] = useState(emptyOverview);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [aiUsage, setAiUsage] = useState(null);
  const isAiLimitReached = (aiUsage?.usesRemaining ?? 0) === 0;

  useEffect(() => {
    bootstrapData();
  }, []);

  useEffect(() => {
    if (analysisIdFromRoute) {
      fetchAnalysisById(analysisIdFromRoute);
    }
  }, [analysisIdFromRoute]);

  useEffect(() => {
    if (!creating) {
      setCreateStageIndex(0);
      return undefined;
    }

    const interval = window.setInterval(() => {
      setCreateStageIndex((prev) => (prev + 1) % createAnalysisStages.length);
    }, 1500);

    return () => window.clearInterval(interval);
  }, [creating]);

  const bootstrapData = async () => {
    try {
      setLoadingBase(true);
      const [resumeResult, rolesResult, dashboardResult] = await Promise.allSettled([
        resumeService.getMyResume(1, 12),
        jobRoleService.getJobRoles({ limit: 60 }),
        dashboardService.getDashboardData(),
      ]);

      const resumeDocs = resumeResult.status === 'fulfilled' ? parseResumeDocs(resumeResult.value) : [];
      const rolesRes = rolesResult.status === 'fulfilled' ? rolesResult.value : [];
      const aiUsageRes = dashboardResult.status === 'fulfilled' ? dashboardResult.value?.data?.aiUsage : null;

      setResumes(resumeDocs);
      setJobRoles(Array.isArray(rolesRes) ? rolesRes : []);
      setAiUsage(aiUsageRes);

      if (!selectedResumeId && resumeDocs.length > 0) {
        setSelectedResumeId(resumeDocs[0]._id);
      }

      if (jobRoleIdFromQuery && Array.isArray(rolesRes) && rolesRes.some((role) => role?._id === jobRoleIdFromQuery)) {
        setSelectedJobRoleId(jobRoleIdFromQuery);
      } else if (!selectedJobRoleId && Array.isArray(rolesRes) && rolesRes.length > 0) {
        setSelectedJobRoleId(rolesRes[0]._id);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load analysis data');
    } finally {
      setLoadingBase(false);
    }
  };

  const fetchAnalysisById = async (analysisId) => {
    try {
      const payload = await analysisService.getAnalysisById(analysisId);
      const clean = payload?.data || payload;
      if (clean && typeof clean === 'object') {
        setAnalysisOverview({ ...emptyOverview, ...clean });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load analysis');
    }
  };

  const handleCreateAnalysis = async (e) => {
    e.preventDefault();
    if (!selectedResumeId || !selectedJobRoleId) {
      toast.error('Please select a resume and a job role');
      return;
    }
    if (isAiLimitReached) {
      toast.error('Daily limit reached. Try again tomorrow.');
      return;
    }

    const startedAt = Date.now();
    try {
      setCreating(true);
      setShowCreateOverlay(true);
      const payload = await analysisService.createAnalysis({
        resumeId: selectedResumeId,
        jobRoleId: selectedJobRoleId,
        preference: {
          hoursPerWeek: Number(hoursPerWeek),
          budget,
          learningStyle,
        },
      });

      const clean = payload?.analysis || payload?.data || payload;
      setAnalysisOverview({ ...emptyOverview, ...clean });
      if (payload?.aiUsage) setAiUsage(payload.aiUsage);
      toast.success(clean?.status === 'queued' ? 'Analysis queued successfully' : 'Analysis completed');
      if (clean?._id) {
        navigate(`/analysis/${clean._id}`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Something went wrong');
    } finally {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, 2200 - elapsed);
      setCreating(false);
      window.setTimeout(() => setShowCreateOverlay(false), remaining);
    }
  };

  const handleToggleCompareRole = (roleId) => {
    setCompareRoleIds((prev) => {
      if (prev.includes(roleId)) return prev.filter((id) => id !== roleId);
      if (prev.length >= 5) {
        toast.error('You can compare up to 5 roles');
        return prev;
      }
      return [...prev, roleId];
    });
  };

  const handleCompareRoles = async (e) => {
    e.preventDefault();
    if (!selectedResumeId) {
      toast.error('Please pick a resume');
      return;
    }
    if (compareRoleIds.length < 2) {
      toast.error('Select at least 2 roles to compare');
      return;
    }
    if (isAiLimitReached) {
      toast.error('Limit reached');
      return;
    }

    try {
      setComparing(true);
      const payload = await analysisService.compareRoles({
        resumeId: selectedResumeId,
        jobRoleIds: compareRoleIds,
      });
      const clean = payload?.data || payload;
      setComparisonResult(clean);
      if (clean?.aiUsage) setAiUsage(clean.aiUsage);
      toast.success('Comparison finished');
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const selectedRoleName = useMemo(() => {
    return jobRoles.find((role) => role._id === selectedJobRoleId)?.title || 'Selected Role';
  }, [jobRoles, selectedJobRoleId]);

  const filteredJobRoles = useMemo(() => {
    const search = jobRoleSearch.trim().toLowerCase();
    if (!search) return jobRoles;
    return jobRoles.filter((role) =>
      [role.title, role.category].some((v) => String(v).toLowerCase().includes(search))
    );
  }, [jobRoles, jobRoleSearch]);

  const filteredCompareRoles = useMemo(() => {
    const search = compareRoleSearch.trim().toLowerCase();
    if (!search) return jobRoles;
    return jobRoles.filter((role) =>
      [role.title, role.category].some((v) => String(v).toLowerCase().includes(search))
    );
  }, [jobRoles, compareRoleSearch]);

  return (
    <DashboardLayout>
      <div className="relative pb-20">
        {/* Simple Loading Screen */}
        {showCreateOverlay && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md px-4">
            <div className="w-full max-w-lg">
              <AnalysisGenerationCard activeStage={createStageIndex} />
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            MODERN HEADER
        ════════════════════════════════════════ */}
        <header className="mb-10 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 md:p-12 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-100 dark:bg-primary-900/30 px-4 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400">
                <Sparkles className="w-4 h-4" />
                <span>AI Career Assistant</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
                Analysis <span className="text-primary-600">Workspace</span>
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 max-w-xl text-lg leading-relaxed">
                Check how well your resume matches different job roles and see how you can improve to get hired faster.
              </p>
            </div>
            
            <button
              onClick={() => navigate('/resumes')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
            >
              My Resumes <Rocket className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ════════════════════════════════════════
            MAIN CONTENT
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Simple Tab Switcher */}
            <div className="flex gap-2 p-1.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 w-fit">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'create' 
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <ClipboardList className="w-4 h-4" /> Create Analysis
              </button>
              <button
                onClick={() => setActiveTab('compare')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'compare' 
                  ? 'bg-white dark:bg-neutral-900 text-primary-600 shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`}
              >
                <GitCompareArrows className="w-4 h-4" /> Compare Roles
              </button>
            </div>

            {/* Main Selection Area */}
            <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 md:p-8 shadow-sm">
              {loadingBase ? (
                <div className="space-y-6 animate-pulse">
                  <div className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-1/3" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
                    <div className="h-20 bg-neutral-100 dark:bg-neutral-800 rounded-2xl" />
                  </div>
                </div>
              ) : activeTab === 'create' ? (
                <form onSubmit={handleCreateAnalysis} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="Choose Resume">
                      <select
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="w-full h-14 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                      >
                        <option value="">Choose a resume...</option>
                        {resumes.map((r) => (
                          <option key={r._id} value={r._id}>{r.originalFileName || r.fileName}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Choose Job Role">
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={jobRoleSearch}
                          onChange={(e) => setJobRoleSearch(e.target.value)}
                          placeholder="Search for a job..."
                          className="w-full h-14 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        />
                        <select 
                          value={selectedJobRoleId} 
                          onChange={(e) => setSelectedJobRoleId(e.target.value)}
                          className="w-full h-14 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                        >
                          <option value="">Select job link...</option>
                          {filteredJobRoles.map((role) => (
                            <option key={role._id} value={role._id}>{role.title}</option>
                          ))}
                        </select>
                      </div>
                    </Field>
                  </div>

                  <div className="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 space-y-6">
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Analysis Settings</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <Field label="Hours per Week">
                        <input type="number" min="1" max="168" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white" />
                      </Field>
                      <Field label="Your Budget">
                        <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                          {['free', 'low', 'medium', 'high'].map(b => <option key={b} value={b}>{b[0].toUpperCase() + b.slice(1)}</option>)}
                        </select>
                      </Field>
                      <Field label="Learning Style">
                        <select value={learningStyle} onChange={(e) => setLearningStyle(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white">
                          {['mixed', 'visual', 'auditory', 'reading', 'kinesthetic'].map(s => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                    <button 
                      type="submit" 
                      disabled={creating || isAiLimitReached} 
                      className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-lg shadow-lg disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                      {creating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Target className="w-6 h-6" />}
                      {creating ? 'Working...' : `Start Analysis`}
                    </button>
                    {isAiLimitReached && (
                      <p className="text-xs font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800">
                        Daily help limit reached. Try tomorrow!
                      </p>
                    )}
                  </div>

                  {analysisOverview?._id && ['queued', 'processing'].includes(analysisOverview?.status) ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-900/15 dark:text-blue-200">
                      <p className="font-semibold">
                        {analysisStageMeta[analysisOverview?.processingStage]?.title || 'Analysis is running'}
                      </p>
                      <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                        {analysisStageMeta[analysisOverview?.processingStage]?.description || 'Open the detail page to track live progress.'}
                      </p>
                    </div>
                  ) : null}
                </form>
              ) : (
                <form onSubmit={handleCompareRoles} className="space-y-8">
                  <Field label="Pick Resume for Comparison">
                    <select
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="w-full h-14 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium outline-none"
                    >
                      <option value="">Select your resume...</option>
                      {resumes.map((r) => (
                        <option key={r._id} value={r._id}>{r.originalFileName || r.fileName}</option>
                      ))}
                    </select>
                  </Field>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-neutral-600 dark:text-neutral-400">Choose 2 to 5 Job Roles</label>
                    <input
                      type="text"
                      value={compareRoleSearch}
                      onChange={(e) => setCompareRoleSearch(e.target.value)}
                      placeholder="Search to filter roles..."
                      className="w-full h-14 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredCompareRoles.map((role) => {
                        const isSelected = compareRoleIds.includes(role._id);
                        return (
                          <button
                            key={role._id}
                            type="button"
                            onClick={() => handleToggleCompareRole(role._id)}
                            className={`p-4 rounded-xl border text-left transition-all relative ${
                              isSelected 
                              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-500' 
                              : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <p className={`text-sm font-bold truncate ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                {role.title}
                              </p>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-primary-500" />}
                            </div>
                            <p className="text-[10px] uppercase font-bold text-neutral-500 mt-1">{role.category}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={comparing || isAiLimitReached} 
                    className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                  >
                    {comparing ? <Loader2 className="w-6 h-6 animate-spin" /> : <GitCompareArrows className="w-6 h-6" />}
                    {comparing ? 'Comparing...' : 'Compare Selected Roles'}
                  </button>
                </form>
              )}
            </div>

            {/* Results Display */}
            {analysisOverview.matchScore > 0 ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-8 bg-primary-600 rounded-full" />
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">Your Analysis Results</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <StatCard label="Match Score" value={`${analysisOverview.matchScore}%`} tone={scoreTone(analysisOverview.matchScore)} icon={Target} />
                  <StatCard label="Your Readiness" value={analysisOverview.readinessLevel} tone="text-blue-500" icon={Rocket} />
                  <StatCard label="Time Needed" value={`${analysisOverview?.estimatedTimeToReady?.weeks} Weeks`} tone="text-amber-500" icon={Clock3} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <BreakdownBlock title="Skill Categories" breakdown={analysisOverview.matchBreakDown} />
                    <ListBlock
                      title="Your Strengths"
                      icon={CheckCircle2}
                      items={(analysisOverview.candidateStrength || []).map(s => s.skill)}
                      colorClass="text-emerald-500"
                    />
                  </div>
                  <div className="space-y-8">
                    <GapBlock gaps={analysisOverview.skillGaps} />
                    <ListBlock
                      title="Improvement Tips"
                      icon={AlertTriangle}
                      items={analysisOverview?.aiSuggestion?.recommendations || []}
                      colorClass="text-amber-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 rounded-[2rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                  <Brain className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white">Ready to Analyze</h3>
                  <p className="text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                    Choose a resume and a job role above to see your scores and get career tips.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* User Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            {/* ATS Score Card */}
            <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 p-8 shadow-xl text-white">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-primary-500 rounded-full" />
                Resume Check (ATS)
              </h3>
              <div className="space-y-6">
                <MiniMeter label="Total Score" value={analysisOverview?.atsScore?.overall || 0} />
                <div className="grid grid-cols-2 gap-4">
                  <MetricSquare label="Layout" value={analysisOverview?.atsScore?.structure?.score || 0} />
                  <MetricSquare label="Keywords" value={analysisOverview?.atsScore?.keywords?.score || 0} />
                  <MetricSquare label="Formatting" value={analysisOverview?.atsScore?.formatting?.score || 0} />
                  <MetricSquare label="Content" value={analysisOverview?.atsScore?.content?.score || 0} />
                </div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest text-center mt-2 font-bold">
                  Shows how bot-friendly your resume is
                </p>
              </div>
            </div>

            {/* Comparison Log */}
            <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-3">
                <div className="w-1 h-6 bg-blue-500 rounded-full" />
                Compare History
              </h3>
              {!comparisonResult?.comparisons?.length ? (
                <div className="py-10 text-center space-y-3">
                  <GitCompareArrows className="w-10 h-10 text-neutral-200 dark:text-neutral-800 mx-auto" />
                  <p className="text-xs text-neutral-500">Pick some roles to see which one fits you best!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comparisonResult.comparisons.map((item, idx) => (
                    <div key={idx} className="group p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-all hover:border-primary-500">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-sm font-bold text-neutral-900 dark:text-white leading-tight max-w-[70%]">{item?.jobRole?.title}</p>
                        <span className="text-xs font-bold text-primary-600">{item?.matchScore || item?.matchPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-600 rounded-full" style={{ width: `${item?.matchScore || item?.matchPercentage}%` }} />
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-8 p-6 rounded-3xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">
                      <Trophy className="w-4 h-4" /> Best Choice
                    </div>
                    <p className="text-lg font-bold text-neutral-900 dark:text-white">{comparisonResult?.bestFit?.title}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Usage Info */}
            <div className="p-6 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">AI Credits</span>
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">{aiUsage?.usesRemaining ?? 0} Uses Left</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${((aiUsage?.usesRemaining ?? 0) / (aiUsage?.dailyLimit ?? 10)) * 100}%` }} 
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const StatCard = ({ label, value, tone, icon: Icon }) => (
  <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</p>
        <p className={`text-2xl font-bold tracking-tight ${tone}`}>{value}</p>
      </div>
      <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800 text-neutral-400">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </div>
);

const BreakdownBlock = ({ title, breakdown }) => {
  const rows = [
    { label: 'Must-Have Skills', key: 'criticalSkills', col: 'bg-primary-600' },
    { label: 'Important Skills', key: 'importantSkills', col: 'bg-blue-600' },
    { label: 'Bonus Skills', key: 'niceToHaveSkills', col: 'bg-emerald-600' },
  ];

  return (
    <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">{title}</h3>
      <div className="space-y-6">
        {rows.map((row) => {
          const item = breakdown?.[row.key] || { matched: 0, total: 0, percentage: 0 };
          return (
            <div key={row.key} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-600 dark:text-neutral-400">
                <span className="uppercase tracking-widest">{row.label}</span>
                <span className="font-bold text-neutral-900 dark:text-white">{item.matched}/{item.total}</span>
              </div>
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className={`h-full ${row.col} rounded-full transition-all duration-1000`} style={{ width: `${item.percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const GapBlock = ({ gaps }) => {
  const critical = gaps?.critical?.length || 0;
  const important = gaps?.important?.length || 0;
  const nice = gaps?.niceToHave?.length || 0;

  return (
    <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm">
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6">Missing Skills</h3>
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Major', v: critical, c: 'text-red-600', bg: 'bg-red-50' },
          { l: 'Moderate', v: important, c: 'text-amber-600', bg: 'bg-amber-50' },
          { l: 'Minor', v: nice, c: 'text-blue-600', bg: 'bg-blue-50' }
        ].map((g, i) => (
          <div key={i} className={`rounded-2xl p-4 ${g.bg} dark:bg-neutral-800 text-center border border-transparent hover:border-neutral-200 transition-all`}>
            <p className={`text-2xl font-bold ${g.c}`}>{g.v}</p>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mt-1">{g.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalysisGenerationCard = ({ activeStage = 0 }) => (
  <div className="rounded-3xl bg-white dark:bg-neutral-900 p-8 shadow-2xl border border-neutral-100 dark:border-neutral-800 text-center">
    <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
      <Sparkles className="w-10 h-10 text-primary-600 animate-pulse" />
    </div>
    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Analyzing...</h3>
    <p className="text-neutral-500 dark:text-neutral-400 mb-8 max-w-xs mx-auto">Please wait while the AI checks your resume against the job requirements.</p>

    <div className="space-y-3">
      {createAnalysisStages.map((stage, index) => {
        const isActive = index === activeStage;
        const isPassed = index < activeStage;
        const Icon = stage.icon;

        return (
          <div
            key={index}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              isActive
              ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-300'
              : 'border-transparent opacity-60'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isActive ? 'bg-primary-600 text-white' : isPassed ? 'bg-emerald-500 text-white' : 'bg-neutral-100 text-neutral-400'
            }`}>
              {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className={`w-5 h-5 ${isActive ? 'animate-spin' : ''}`} />}
            </div>
            <div className="flex-1 text-left">
              <p className={`text-sm font-bold ${isActive ? 'text-primary-900 dark:text-primary-100' : 'text-neutral-500'}`}>{stage.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const ListBlock = ({ title, icon: Icon, items, colorClass }) => (
  <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-8 shadow-sm h-full">
    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
      <Icon className={`w-5 h-5 ${colorClass}`} /> {title}
    </h3>
    <ul className="space-y-4">
      {items?.length ? items.slice(0, 6).map((item, idx) => (
        <li key={idx} className="flex gap-4">
          <div className="mt-1.5 w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700 rounded-full flex-shrink-0" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">{item}</span>
        </li>
      )) : (
        <li className="text-sm text-neutral-400 italic">No items found.</li>
      )}
    </ul>
  </div>
);

const MiniMeter = ({ label, value }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
      <span>{label}</span>
      <span className="text-neutral-300">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
      <div className="h-full bg-primary-600 rounded-full" style={{ width: `${value}%` }} />
    </div>
  </div>
);

const MetricSquare = ({ label, value }) => (
  <div className="p-4 rounded-xl bg-neutral-800 border border-white/5 text-center transition-all hover:bg-neutral-700 shadow-sm">
    <p className="text-xl font-bold text-white mb-1 font-mono">{value}%</p>
    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</p>
  </div>
);

export default AnalysisPage;
