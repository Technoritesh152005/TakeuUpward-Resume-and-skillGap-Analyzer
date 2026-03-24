import { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout.jsx';
import resumeService from '../services/resumeService.js';
import analysisService from '../services/analysisService.js';

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

const scoreTone = (score) => {
  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
};

const parseResumeDocs = (payload) => {
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const AnalysisPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: analysisIdFromRoute } = useParams();

  const resumeIdFromQuery = new URLSearchParams(location.search).get('resumeId');

  const [loadingBase, setLoadingBase] = useState(true);
  const [resumes, setResumes] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);

  const [selectedResumeId, setSelectedResumeId] = useState(resumeIdFromQuery || '');
  const [selectedJobRoleId, setSelectedJobRoleId] = useState('');
  const [compareRoleIds, setCompareRoleIds] = useState([]);

  const [hoursPerWeek, setHoursPerWeek] = useState(10);
  const [budget, setBudget] = useState('medium');
  const [learningStyle, setLearningStyle] = useState('mixed');

  const [creating, setCreating] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [activeTab, setActiveTab] = useState('create');

  const [analysisOverview, setAnalysisOverview] = useState(emptyOverview);
  const [comparisonResult, setComparisonResult] = useState(null);

  useEffect(() => {
    bootstrapData();
  }, []);

  useEffect(() => {
    if (analysisIdFromRoute) {
      fetchAnalysisById(analysisIdFromRoute);
    }
  }, [analysisIdFromRoute]);

  const bootstrapData = async () => {
    try {
      setLoadingBase(true);
      const [resumeRes, rolesRes] = await Promise.all([
        resumeService.getMyResume(1, 12),
        analysisService.getJobRoles({ limit: 12 }),
      ]);

      const resumeDocs = parseResumeDocs(resumeRes);
      setResumes(resumeDocs);
      setJobRoles(Array.isArray(rolesRes) ? rolesRes : []);

      if (!selectedResumeId && resumeDocs.length > 0) {
        setSelectedResumeId(resumeDocs[0]._id);
      }

      if (!selectedJobRoleId && Array.isArray(rolesRes) && rolesRes.length > 0) {
        setSelectedJobRoleId(rolesRes[0]._id);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load resumes or job roles');
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
      toast.error('Unable to load this analysis details');
    }
  };

  const handleCreateAnalysis = async (e) => {
    e.preventDefault();

    if (!selectedResumeId || !selectedJobRoleId) {
      toast.error('Please select a resume and target role');
      return;
    }

    try {
      setCreating(true);
      const payload = await analysisService.createAnalysis({
        resumeId: selectedResumeId,
        jobRoleId: selectedJobRoleId,
        preference: {
          hoursPerWeek: Number(hoursPerWeek),
          budget,
          learningStyle,
        },
      });

      const clean = payload?.data || payload;
      setAnalysisOverview({ ...emptyOverview, ...clean });
      toast.success('Analysis generated successfully');
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Failed to create analysis');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleCompareRole = (roleId) => {
    setCompareRoleIds((prev) => {
      if (prev.includes(roleId)) return prev.filter((id) => id !== roleId);
      if (prev.length >= 5) {
        toast.error('You can compare up to 5 roles at once');
        return prev;
      }
      return [...prev, roleId];
    });
  };

  const handleCompareRoles = async (e) => {
    e.preventDefault();

    if (!selectedResumeId) {
      toast.error('Pick a resume for comparison');
      return;
    }
    if (compareRoleIds.length < 2) {
      toast.error('Select at least 2 job roles to compare');
      return;
    }

    try {
      setComparing(true);
      const payload = await analysisService.compareRoles({
        resumeId: selectedResumeId,
        jobRoleIds: compareRoleIds,
      });
      setComparisonResult(payload?.data || payload);
      toast.success('Role comparison completed');
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const selectedRoleName = useMemo(() => {
    return jobRoles.find((role) => role._id === selectedJobRoleId)?.title || 'Selected role';
  }, [jobRoles, selectedJobRoleId]);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-primary-600 to-emerald-700 text-white p-6 md:p-8 shadow-card">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                <Sparkles className="w-4 h-4" />
                AI Analysis Workspace
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mt-3 !text-white">Create analysis, deep overview & role comparison</h1>
              <p className="mt-2 text-primary-100 max-w-3xl">
                Build role-targeted analysis from your resume, inspect detailed readiness metrics, and compare multiple job roles to find your best-fit path.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/resumes')}
              className="self-start md:self-auto px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium"
            >
              Back to Resumes
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('create')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'create'
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2"><ClipboardList className="w-4 h-4" /> Create Analysis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('compare')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'compare'
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2"><GitCompareArrows className="w-4 h-4" /> Compare Roles</span>
                  </button>
                </div>
              </div>

              {loadingBase ? (
                <div className="h-40 rounded-xl bg-neutral-100 dark:bg-neutral-700 animate-pulse" />
              ) : activeTab === 'create' ? (
                <form onSubmit={handleCreateAnalysis} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Resume">
                      <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)} className="input dark:bg-neutral-900 dark:text-neutral-100">
                        <option value="">Select your resume</option>
                        {resumes.map((resume) => (
                          <option key={resume._id} value={resume._id}>{resume.originalFileName || resume.fileName}</option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Target Job Role">
                      <select value={selectedJobRoleId} onChange={(e) => setSelectedJobRoleId(e.target.value)} className="input dark:bg-neutral-900 dark:text-neutral-100">
                        <option value="">Select target role</option>
                        {jobRoles.map((role) => (
                          <option key={role._id} value={role._id}>{role.title}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-900/40">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Learning Preferences (for roadmap-aware analysis)</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Field label="Hours / Week">
                        <input type="number" min="1" max="168" value={hoursPerWeek} onChange={(e) => setHoursPerWeek(e.target.value)} className="input dark:bg-neutral-900 dark:text-neutral-100" />
                      </Field>
                      <Field label="Budget">
                        <select value={budget} onChange={(e) => setBudget(e.target.value)} className="input dark:bg-neutral-900 dark:text-neutral-100">
                          <option value="free">Free</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </Field>
                      <Field label="Learning Style">
                        <select value={learningStyle} onChange={(e) => setLearningStyle(e.target.value)} className="input dark:bg-neutral-900 dark:text-neutral-100">
                          {['mixed', 'visual', 'auditory', 'reading', 'kinesthetic'].map((style) => (
                            <option value={style} key={style}>{style[0].toUpperCase() + style.slice(1)}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </div>

                  <button type="submit" disabled={creating} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium disabled:opacity-60">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
                    {creating ? 'Generating analysis...' : `Create analysis for ${selectedRoleName}`}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleCompareRoles} className="space-y-5">
                  <Field label="Resume for Comparison">
                    <select value={selectedResumeId} onChange={(e) => setSelectedResumeId(e.target.value)} className="input dark:bg-neutral-900 dark:text-neutral-100">
                      <option value="">Select your resume</option>
                      {resumes.map((resume) => (
                        <option key={resume._id} value={resume._id}>{resume.originalFileName || resume.fileName}</option>
                      ))}
                    </select>
                  </Field>

                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">Choose 2-5 job roles</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-auto pr-1 scrollbar-thin">
                      {jobRoles.map((role) => {
                        const selected = compareRoleIds.includes(role._id);
                        return (
                          <button
                            key={role._id}
                            type="button"
                            onClick={() => handleToggleCompareRole(role._id)}
                            className={`text-left border rounded-xl p-3 transition-all ${selected
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
                              }`}
                          >
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{role.title}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{role.category || 'Role'}</p>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Selected: {compareRoleIds.length} / 5</p>
                  </div>

                  <button type="submit" disabled={comparing} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60">
                    {comparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompareArrows className="w-4 h-4" />}
                    {comparing ? 'Comparing roles...' : 'Compare roles with this resume'}
                  </button>
                </form>
              )}
            </div>

            {/* Detailed analysis overview */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 shadow-soft space-y-6">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Detailed Analysis Overview</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Match Score" value={`${analysisOverview.matchScore || 0}%`} tone={scoreTone(analysisOverview.matchScore || 0)} icon={Target} />
                <StatCard label="Readiness" value={analysisOverview.readinessLevel || 'Not evaluated'} tone="text-blue-600 dark:text-blue-400" icon={Rocket} />
                <StatCard
                  label="Time to Ready"
                  value={`${analysisOverview?.estimatedTimeToReady?.weeks || 0} weeks`}
                  tone="text-amber-600 dark:text-amber-400"
                  icon={Clock3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <BreakdownBlock title="Skill Match Breakdown" breakdown={analysisOverview.matchBreakDown} />
                <GapBlock gaps={analysisOverview.skillGaps} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ListBlock
                  title="Top Candidate Strengths"
                  icon={CheckCircle2}
                  items={(analysisOverview.candidateStrength || []).map((item) => item.skill)}
                  emptyLabel="No strengths available yet"
                  colorClass="text-emerald-600 dark:text-emerald-400"
                />
                <ListBlock
                  title="AI Recommendations"
                  icon={AlertTriangle}
                  items={analysisOverview?.aiSuggestion?.recommendations || []}
                  emptyLabel="No AI recommendations yet"
                  colorClass="text-amber-600 dark:text-amber-400"
                />
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 shadow-soft">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">ATS Snapshot</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Quick view of your ATS scoring dimensions.</p>
              <div className="mt-4 space-y-3">
                <MiniMeter label="Overall" value={analysisOverview?.atsScore?.overall || 0} />
                <MiniMeter label="Formatting" value={analysisOverview?.atsScore?.formatting?.score || 0} />
                <MiniMeter label="Keywords" value={analysisOverview?.atsScore?.keywords?.score || 0} />
                <MiniMeter label="Structure" value={analysisOverview?.atsScore?.structure?.score || 0} />
                <MiniMeter label="Content" value={analysisOverview?.atsScore?.content?.score || 0} />
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-5 shadow-soft">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Role Comparison Results</h3>
              {!comparisonResult?.comparisons?.length ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-3">Run role comparison to see best fit, fastest path, and score insights.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {comparisonResult.comparisons.map((item, idx) => (
                    <div key={`${item?.jobRole?._id || idx}`} className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item?.jobRole?.title || 'Role'}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Match: <span className="font-semibold">{item?.matchScore ?? item?.matchPercentage ?? 0}%</span>
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">Ready in: {item?.estimatedTimeToReady?.weeks || 0} weeks</p>
                    </div>
                  ))}

                  <div className="pt-2 text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                    <p className="inline-flex items-center gap-1"><Trophy className="w-3 h-3 text-amber-500" /> Best Fit: {comparisonResult?.bestFit?.title || '—'}</p>
                    <p className="inline-flex items-center gap-1"><Rocket className="w-3 h-3 text-blue-500" /> Fastest Path: {comparisonResult?.fastestPath?.title || '—'}</p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </section>
      </div>
    </DashboardLayout>
  );
};

const Field = ({ label, children }) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{label}</span>
    {children}
  </label>
);

const StatCard = ({ label, value, tone, icon: Icon }) => (
  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4 bg-neutral-50 dark:bg-neutral-900/50">
    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
    <p className={`mt-2 text-xl font-bold capitalize ${tone}`}>{value}</p>
    <Icon className="w-4 h-4 mt-2 text-neutral-400" />
  </div>
);

const BreakdownBlock = ({ title, breakdown }) => {
  const rows = [
    { label: 'Critical', key: 'criticalSkills' },
    { label: 'Important', key: 'importantSkills' },
    { label: 'Nice to Have', key: 'niceToHaveSkills' },
  ];

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">{title}</h3>
      <div className="space-y-3">
        {rows.map((row) => {
          const item = breakdown?.[row.key] || { matched: 0, total: 0, percentage: 0 };
          return (
            <div key={row.key}>
              <div className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
                <span>{row.label}</span>
                <span>{item.matched}/{item.total} ({item.percentage || 0}%)</span>
              </div>
              <div className="h-2 mt-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 rounded-full" style={{ width: `${item.percentage || 0}%` }} />
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
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Skill Gap Severity</h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <GapPill label="Critical" value={critical} color="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" />
        <GapPill label="Important" value={important} color="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" />
        <GapPill label="Nice" value={nice} color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" />
      </div>
    </div>
  );
};

const GapPill = ({ label, value, color }) => (
  <div className={`rounded-xl px-3 py-4 ${color}`}>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs font-medium mt-1">{label}</p>
  </div>
);

const ListBlock = ({ title, icon: Icon, items, emptyLabel, colorClass }) => (
  <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 inline-flex items-center gap-2">
      <Icon className={`w-4 h-4 ${colorClass}`} /> {title}
    </h3>
    {items?.length ? (
      <ul className="space-y-2 max-h-52 overflow-auto pr-1 scrollbar-thin">
        {items.slice(0, 8).map((item, idx) => (
          <li key={`${item}-${idx}`} className="text-sm text-neutral-700 dark:text-neutral-300">• {item}</li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{emptyLabel}</p>
    )}
  </div>
);

const MiniMeter = ({ label, value }) => (
  <div>
    <div className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <div className="h-2 mt-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
      <div className="h-full bg-primary-600 rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  </div>
);

export default AnalysisPage;