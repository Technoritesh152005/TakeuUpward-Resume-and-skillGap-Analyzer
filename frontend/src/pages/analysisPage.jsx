// React hooks used to store state, run side effects, and derive filtered data.
import { useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronDown,
  Search,
  ShieldCheck,
  Zap,
  Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
import { getRoleTheme, getStatusConfig } from '../utils/analysisTheme.js';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
};

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
    description: 'Scanning your professional experience and skills.',
    icon: ScanSearch,
  },
  {
    title: 'Analyzing Fit',
    description: 'Comparing your background with role requirements.',
    icon: Brain,
  },
  {
    title: 'Generating Insights',
    description: 'Preparing your match score and recommendations.',
    icon: Stars,
  },
];

const analysisStageMeta = {
  queued: {
    title: 'In Queue',
    description: 'Your analysis is waiting to be processed.',
  },
  processing: {
    title: 'Analyzing',
    description: 'We are currently reviewing your skills and experience.',
  },
  finalizing: {
    title: 'Finalizing',
    description: 'Saving your results and generating final tips.',
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
  const [isJobRoleDropdownOpen, setIsJobRoleDropdownOpen] = useState(false);

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
  const jobRoleDropdownRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!jobRoleDropdownRef.current?.contains(event.target)) {
        setIsJobRoleDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      toast.error('Daily AI credits exhausted. Try again tomorrow.');
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
      toast.error('Daily AI credits exhausted');
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

  const selectedJobRole = useMemo(
    () => jobRoles.find((role) => role._id === selectedJobRoleId) || null,
    [jobRoles, selectedJobRoleId]
  );

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
            ELITE HEADER
        ════════════════════════════════════════ */}
        <header className="mb-10 px-8 py-10 rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
          
          <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 border border-primary-500/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-400"
              >
                <Sparkles className="w-3 h-3" />
                <span>Career Intelligence Engine</span>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                Skill Gap <span className="text-primary-400">Analysis</span>
              </h1>
              <p className="text-neutral-400 max-w-xl text-base font-medium">
                Compare your profile against industry standards to identify growth opportunities and career fit.
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/resumes')}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white text-neutral-950 font-bold text-sm transition-all shadow-lg hover:bg-neutral-100"
            >
              Manage Resumes <Rocket className="w-4 h-4" />
            </motion.button>
          </div>
        </header>

        {/* ════════════════════════════════════════
            CONTROL INTERFACE
        ════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            {/* Mode Selector */}
            <div className="flex gap-2 p-1.5 rounded-2xl bg-neutral-900/50 border border-white/5 w-fit backdrop-blur-xl">
              {[
                { id: 'create', label: 'Analysis Tool', icon: Cpu },
                { id: 'compare', label: 'Role Comparison', icon: GitCompareArrows },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${
                    activeTab === tab.id 
                    ? 'bg-primary-600 text-white shadow-lg' 
                    : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Selection Engine */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="rounded-[2.5rem] border border-white/10 bg-neutral-900/40 backdrop-blur-3xl p-8 md:p-12 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 p-8">
                {activeTab === 'create' && <Zap className="w-6 h-6 text-primary-500/20" />}
              </div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Field label="Select Resume">
                      <select
                        value={selectedResumeId}
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        className="w-full h-14 px-5 rounded-2xl border border-white/10 bg-white/5 text-white font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all cursor-pointer hover:bg-white/10"
                      >
                        <option value="" className="bg-neutral-900" disabled>Select your resume...</option>
                        {resumes.map((r) => (
                          <option key={r._id} value={r._id} className="bg-neutral-900">{r.originalFileName || r.fileName}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Target Job Role">
                      <div className="space-y-4" ref={jobRoleDropdownRef}>
                        <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                          <input
                            type="text"
                            value={jobRoleSearch}
                            onChange={(e) => {
                              setJobRoleSearch(e.target.value);
                              setIsJobRoleDropdownOpen(true);
                            }}
                            onFocus={() => setIsJobRoleDropdownOpen(true)}
                            placeholder="Find a job role..."
                            className="w-full h-14 pl-12 pr-14 rounded-2xl border border-white/10 bg-white/5 text-white font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                          />
                          <button
                            type="button"
                            aria-label={isJobRoleDropdownOpen ? 'Close job role dropdown' : 'Open job role dropdown'}
                            onClick={() => setIsJobRoleDropdownOpen((prev) => !prev)}
                            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl text-neutral-400 transition hover:bg-white/10 hover:text-white"
                          >
                            <ChevronDown className={`h-4 w-4 transition-transform ${isJobRoleDropdownOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
                          {selectedJobRole ? (
                            <div className="mb-2 flex items-center justify-between rounded-2xl border border-primary-500/20 bg-primary-500/10 px-4 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-bold text-white">{selectedJobRole.title}</p>
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary-300">
                                  {selectedJobRole.category || 'Selected role'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedJobRoleId('');
                                  setJobRoleSearch('');
                                  setIsJobRoleDropdownOpen(true);
                                }}
                                className="shrink-0 rounded-xl px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-300 transition hover:bg-white/5"
                              >
                                Clear
                              </button>
                            </div>
                          ) : null}

                          {isJobRoleDropdownOpen ? (
                            <div className="max-h-44 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                              {filteredJobRoles.length > 0 ? (
                                filteredJobRoles.map((role) => {
                                  const isSelected = role._id === selectedJobRoleId

                                  return (
                                    <button
                                      key={role._id}
                                      type="button"
                                      onClick={() => {
                                        setSelectedJobRoleId(role._id);
                                        setJobRoleSearch('');
                                        setIsJobRoleDropdownOpen(false);
                                      }}
                                      className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                                        isSelected
                                          ? 'border-primary-500 bg-primary-500/15'
                                          : 'border-white/5 bg-transparent hover:border-primary-500/30 hover:bg-white/5'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className={`truncate text-sm font-bold ${isSelected ? 'text-primary-200' : 'text-white'}`}>
                                            {role.title}
                                          </p>
                                          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
                                            {role.category || 'General role'}
                                          </p>
                                        </div>
                                        {isSelected ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary-300" /> : null}
                                      </div>
                                    </button>
                                  )
                                })
                              ) : (
                                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center">
                                  <p className="text-sm font-medium text-neutral-400">No job roles match this search.</p>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </Field>
                  </div>

                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5 space-y-6">
                    <h3 className="text-xs font-bold text-primary-400 uppercase tracking-widest">Analysis Preferences</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <Field label="Hours per Week">
                        <input type="number" min="1" max="168" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-white/10 bg-neutral-950 text-white font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                      </Field>
                      <Field label="Learning Budget">
                        <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-white/10 bg-neutral-950 text-white font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                          {['free', 'low', 'medium', 'high'].map(b => <option key={b} value={b} className="bg-neutral-900">{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
                        </select>
                      </Field>
                      <Field label="Learning Style">
                        <select value={learningStyle} onChange={(e) => setLearningStyle(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-white/10 bg-neutral-950 text-white font-bold text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                          {['mixed', 'visual', 'auditory', 'reading', 'kinesthetic'].map(s => <option key={s} value={s} className="bg-neutral-900">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </Field>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
                    <motion.button 
                      type="submit" 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={creating || isAiLimitReached} 
                      className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold text-base shadow-xl disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                    >
                      {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                      {creating ? 'Analyzing Profile...' : `Start Analysis`}
                    </motion.button>
                    {isAiLimitReached && (
                      <p className="text-sm font-bold text-red-400">
                        Daily limit reached. Resets at midnight.
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
            </motion.div>

            {/* Results Display Area */}
            {analysisOverview.matchScore > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-2 h-10 bg-primary-600 rounded-full" />
                  <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Analysis Results</h2>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mt-1">Review your match scores and recommendations</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <StatCard label="Overall Match" value={`${analysisOverview.matchScore}%`} tone={scoreTone(analysisOverview.matchScore)} icon={Target} />
                  <StatCard label="Readiness" value={analysisOverview.readinessLevel} icon={Rocket} />
                  <StatCard label="Review Period" value={`${analysisOverview?.estimatedTimeToReady?.weeks} Weeks`} icon={Clock3} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-8">
                    <BreakdownBlock title="Skill Categories" breakdown={analysisOverview.matchBreakDown} />
                    <ListBlock
                      title="Top Strengths"
                      icon={ShieldCheck}
                      items={(analysisOverview.candidateStrength || []).map(s => s.skill)}
                      theme={getRoleTheme(analysisOverview?.jobRole?.category, analysisOverview?.jobRole?.title)}
                    />
                  </div>
                  <div className="space-y-8">
                    <GapBlock gaps={analysisOverview.skillGaps} />
                    <ListBlock
                      title="Key Suggestions"
                      icon={Zap}
                      items={analysisOverview?.aiSuggestion?.recommendations || []}
                      theme={getRoleTheme(analysisOverview?.jobRole?.category, analysisOverview?.jobRole?.title)}
                    />
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-16 md:p-24 rounded-[2.5rem] border border-white/5 bg-neutral-900/20 text-center space-y-6 backdrop-blur-sm"
              >
                <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto text-neutral-700 border border-white/5 transition-transform duration-500 hover:scale-105">
                  <Brain className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white tracking-tight">Ready for Analysis</h3>
                  <p className="text-neutral-500 max-w-sm mx-auto font-medium">
                    Configure your resume and target role above to generate a professional skill gap analysis.
                  </p>
                </div>
              </motion.div>
            )}
          </div>

        {/* Side Panel */}
        <aside className="lg:col-span-4 space-y-8">
          {/* ATS Intelligence Card */}
          <div className="rounded-3xl border border-white/10 bg-neutral-900 p-8 shadow-2xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-500/10 transition-colors duration-700" />
            <h3 className="text-xs font-bold mb-6 flex items-center gap-3 uppercase tracking-widest text-primary-400">
              <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
              Resume Score (ATS)
            </h3>
            <div className="space-y-6">
              <MiniMeter label="Overall Compatibility" value={analysisOverview?.atsScore?.overall || 0} />
              <div className="grid grid-cols-2 gap-3">
                <MetricSquare label="Structure" value={analysisOverview?.atsScore?.structure?.score || 0} />
                <MetricSquare label="Keywords" value={analysisOverview?.atsScore?.keywords?.score || 0} />
                <MetricSquare label="Formatting" value={analysisOverview?.atsScore?.formatting?.score || 0} />
                <MetricSquare label="Content" value={analysisOverview?.atsScore?.content?.score || 0} />
              </div>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest text-center mt-2">
                Evaluated by industry standards
              </p>
            </div>
          </div>

            {/* Comparison Intelligence */}
            <div className="rounded-3xl border border-white/10 bg-neutral-900/60 p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden">
              <h3 className="text-xs font-bold text-white mb-6 flex items-center gap-3 uppercase tracking-widest">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                Comparison History
              </h3>
              {!comparisonResult?.comparisons?.length ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mx-auto text-neutral-600">
                    <GitCompareArrows className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest max-w-[180px] mx-auto">
                    Compare multiple roles to see your best fit.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {comparisonResult.comparisons.map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ x: 4 }}
                      className="group p-4 rounded-xl bg-white/5 border border-white/5 transition-all hover:bg-white/10"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-xs font-bold text-white leading-tight max-w-[75%]">{item?.jobRole?.title}</p>
                        <span className="text-xs font-bold text-primary-400">{item?.matchScore || item?.matchPercentage}%</span>
                      </div>
                      <div className="h-1 w-full bg-neutral-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item?.matchScore || item?.matchPercentage}%` }}
                          className="h-full bg-primary-500 rounded-full" 
                        />
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="mt-8 p-6 rounded-2xl bg-primary-500/10 border border-primary-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary-400 uppercase tracking-widest">
                      <Trophy className="w-3 h-3" /> Recommended Role
                    </div>
                    <p className="text-lg font-bold text-white tracking-tight leading-tight">{comparisonResult?.bestFit?.title}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">AI Credits</span>
                <span className="text-xs font-bold text-white">{aiUsage?.usesRemaining ?? 0} REMAINING</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${((aiUsage?.usesRemaining ?? 0) / (aiUsage?.dailyLimit ?? 10)) * 100}%` }}
                   className="h-full bg-emerald-500 rounded-full" 
                />
              </div>
              <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest mt-3 text-center">
                Resets daily at UTC 00:00
              </p>
            </div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
};

const Field = ({ label, children }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest ml-1">
      {label}
    </label>
    {children}
  </div>
);

const StatCard = ({ label, value, tone, icon: Icon }) => (
  <div className="rounded-3xl border border-white/5 bg-neutral-900/40 p-6 md:p-8 shadow-2xl backdrop-blur-xl group hover:border-primary-500/30 transition-all duration-300">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</p>
        <p className={`text-3xl md:text-4xl font-bold tracking-tight capitalize ${tone || 'text-white'}`}>{value}</p>
      </div>
      <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-neutral-400 group-hover:text-primary-400 transition-colors">
        <Icon className="w-5 h-5 md:w-6 md:h-6" />
      </div>
    </div>
  </div>
);

const BreakdownBlock = ({ title, breakdown }) => {
  const rows = [
    { label: 'Core Skills', key: 'criticalSkills', col: 'from-primary-600 to-indigo-600' },
    { label: 'Important Skills', key: 'importantSkills', col: 'from-blue-600 to-cyan-600' },
    { label: 'Secondary Skills', key: 'niceToHaveSkills', col: 'from-emerald-600 to-teal-600' },
  ];

  return (
    <div className="rounded-3xl border border-white/5 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-xl">
      <h3 className="text-xs font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-widest">
        <div className="w-1.5 h-6 bg-primary-600 rounded-full" />
        {title}
      </h3>
      <div className="space-y-6">
        {rows.map((row) => {
          const item = breakdown?.[row.key] || { matched: 0, total: 0, percentage: 0 };
          return (
            <div key={row.key} className="space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                <span>{row.label}</span>
                <span className="text-white">{item.matched}/{item.total} Done</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={`h-full bg-gradient-to-r ${row.col} rounded-full`} 
                />
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
    <div className="rounded-3xl border border-white/5 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-xl">
      <h3 className="text-xs font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-widest">
        <div className="w-1.5 h-6 bg-red-600 rounded-full" />
        Identified Gaps
      </h3>
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: 'Critical', v: critical, c: 'text-red-400', bg: 'bg-red-500/5 border-red-500/10' },
          { l: 'Moderate', v: important, c: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/10' },
          { l: 'Minor', v: nice, c: 'text-blue-400', bg: 'bg-blue-500/5 border-blue-500/10' }
        ].map((g, i) => (
          <div key={i} className={`rounded-2xl p-4 ${g.bg} text-center border group hover:scale-105 transition-all duration-300`}>
            <p className={`text-3xl font-bold tracking-tight ${g.c}`}>{g.v}</p>
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1">{g.l}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const AnalysisGenerationCard = ({ activeStage = 0 }) => (
  <div className="rounded-[2.5rem] bg-neutral-900 border border-white/10 p-10 shadow-3xl text-center relative overflow-hidden">
    <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-30" />
    <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-6 border border-primary-500/20">
      <Sparkles className="w-8 h-8 text-primary-500 animate-pulse" />
    </div>
    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Analyzing Profile</h3>
    <p className="text-neutral-500 mb-10 max-w-xs mx-auto font-medium text-sm">We are reviewing your background and skills.</p>

    <div className="space-y-3 max-w-sm mx-auto">
      {createAnalysisStages.map((stage, index) => {
        const isActive = index === activeStage;
        const isPassed = index < activeStage;
        const Icon = stage.icon;

        return (
          <motion.div
            key={index}
            animate={{ opacity: isActive ? 1 : 0.5, scale: isActive ? 1.02 : 1 }}
            className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
              isActive
              ? 'bg-primary-500/5 border-primary-500/30'
              : 'border-transparent'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
              isActive ? 'bg-primary-600 border-primary-400 text-white' : isPassed ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-neutral-800 border-white/5 text-neutral-600'
            }`}>
              {isPassed ? <ShieldCheck className="w-5 h-5" /> : <Icon className={`w-5 h-5 ${isActive ? 'animate-spin' : ''}`} />}
            </div>
            <div className="flex-1 text-left">
              <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-neutral-500'}`}>{stage.title}</p>
              {isActive && <p className="text-[10px] text-primary-400 mt-0.5">{stage.description}</p>}
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);

const ListBlock = ({ title, icon: Icon, items, theme }) => (
  <div className={`rounded-3xl border border-white/5 bg-neutral-900/60 p-8 shadow-2xl backdrop-blur-xl h-full relative overflow-hidden`}>
    {theme && <div className={`absolute -top-12 -right-12 w-32 h-32 ${theme.bg} rounded-full blur-[60px] opacity-10`} />}
    <h3 className="text-xs font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-widest">
      <div className={`w-1.5 h-6 ${theme?.primary || 'bg-primary-600'} rounded-full`} />
      {title}
    </h3>
    <ul className="space-y-4">
      {items?.length ? items.slice(0, 8).map((item, idx) => (
        <motion.li 
          key={idx} 
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="flex gap-4 group/item"
        >
          <div className={`mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all ${theme?.bg || 'bg-neutral-700'}`} />
          <span className="text-sm text-neutral-400 font-medium tracking-tight leading-relaxed group-hover/item:text-neutral-200 transition-colors">{item}</span>
        </motion.li>
      )) : (
        <li className="text-[10px] text-neutral-600 italic uppercase font-bold tracking-widest text-center py-4">No data available</li>
      )}
    </ul>
  </div>
);

const MiniMeter = ({ label, value }) => (
  <div className="space-y-2.5">
    <div className="flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
      <span>{label}</span>
      <span className="text-white bg-primary-600/20 px-2 py-0.5 rounded-full border border-primary-500/10">{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="h-full bg-primary-600 rounded-full" 
      />
    </div>
  </div>
);

const MetricSquare = ({ label, value }) => (
  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 text-center transition-all hover:bg-white/10 group overflow-hidden relative">
    <p className="text-2xl font-bold text-white mb-1 font-mono">{value}%</p>
    <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{label}</p>
  </div>
);

export default AnalysisPage;
