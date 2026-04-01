import {useEffect, useState , useMemo} from 'react'
import {useNavigate , useParams} from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  FileText,
  Lightbulb,
  Radar,
  Rocket,
  ScanSearch,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {format} from 'date-fns'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import analysisService from '../services/analysisService.js'
import dashboardService from '../services/dashboardServices.js'

const emptyOverview = {
  matchScore: 0,
  readinessLevel: 'not-ready',
  estimatedTimeToReady: { weeks: 0, reason: '' },
  matchBreakDown: null,
  skillGaps: { critical: [], important: [], niceToHave: [] },
  candidateStrength: [],
  skillBreakdown: [],
  experienceAnalysis: {},
  atsScore: null,
  aiSuggestion: { summary: '', recommendations: [] },
}

const scoreTone = (score)=>{
  if(score >=75) return 'text-emerald-600 dark:text-emerald-400';
   if(score >= 50) return 'text-amber-600 dark:text-amber-400';
   return 'text-red-600 dark:text-red-400';
}

const AnalysisDetailPage = ()=>{

  const navigate = useNavigate()
  const {id} = useParams()
  const [loading , setLoading] = useState(false)
  const [analysis , setAnalysis] = useState(emptyOverview)
  const [deleting , setDeleting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [aiUsage, setAiUsage] = useState(null)
  const isAiLimitReached = (aiUsage?.usesRemaining ?? 0) === 0

  // whenever there is a change in id in params call these means someone want analysis detail
  useEffect(()=>{
    if(id){
      fetchAnalysis()
    }
  },[id])

  useEffect(() => {
    fetchAiUsage()
  }, [])

  const fetchAnalysis = async()=>{

    try{
      setLoading(true)
      const payload = await analysisService.getAnalysisById(id)
      const cleandata = payload?.data || payload
      // if cleaneddata key exist in emptyoverview the cleaned data value will override it
      setAnalysis({...emptyOverview , ...cleandata})
    }catch(error){
      console.error(error)
      toast.error('failed to fetch your analysis detail.. Sorry for Inconveince. also sorry for spelling mistake')
    }finally{
      setLoading(false)
	  }
  }

  const fetchAiUsage = async () => {
    try {
      const response = await dashboardService.getDashboardData()
      setAiUsage(response?.data?.aiUsage || null)
    } catch (error) {
      console.error(error)
    }
  }

  const skillGapSummary = useMemo(() => ({
    critical: analysis?.skillGaps?.critical?.length || 0,
    important: analysis?.skillGaps?.important?.length || 0,
    niceToHave: analysis?.skillGaps?.niceToHave?.length || 0,
  }), [analysis]);

  const handleDeleteAnalysis = async()=> {
    const confirmed = window.confirm('Delete this analysis? This will remove it from your active analysis history.')

    if (!confirmed) return

    try{
      setDeleting(true)
      await analysisService.deleteAnalysis(id)
      toast.success('Analysis deleted successfully')
      navigate('/analysis')
    }catch(error){
      console.error(error)
      toast.error('Failed to delete analysis')
    }finally{
      setDeleting(false)
	  }
  }

  const handleRegenerateAnalysis = async () => {
    if (isAiLimitReached) {
      toast.error('Daily AI limit reached. Resets at 12:00 AM IST')
      return
    }

    try {
      setRegenerating(true)
      const payload = await analysisService.regenerateAnalysis(id)
      const clean = payload?.analysis || payload?.data || payload
      setAnalysis({ ...emptyOverview, ...clean })
      if (payload?.aiUsage) setAiUsage(payload.aiUsage)
      toast.success('Analysis regenerated successfully')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Failed to regenerate analysis')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <DashboardLayout>
    <div className="space-y-8">
      <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-soft dark:border-neutral-700 dark:bg-neutral-800 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to All Analyses
            </button>

            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
              Detailed Overview
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white md:text-4xl">
              {loading ? 'Loading analysis...' : analysis?.jobRole?.title || 'Analysis detail'}
            </h1>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="inline-flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-neutral-400" />
                {analysis?.jobRole?.category || 'General role'}
              </span>
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-neutral-400" />
                {analysis?.resume?.originalFileName || analysis?.resume?.fileName || 'Resume'}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-neutral-400" />
                {analysis?.createdAt ? format(new Date(analysis.createdAt), 'dd MMM yyyy, hh:mm a') : 'No date'}
              </span>
            </div>

            <p className="mt-5 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">
              {analysis?.aiSuggestion?.summary || 'This detailed view combines fit score, role-readiness, ATS quality, strengths, skill gaps, and next-step recommendations for the selected role.'}
            </p>
          </div>

	          <div className="flex flex-wrap items-center gap-3">
	            <button
	              type="button"
	              onClick={handleRegenerateAnalysis}
	              disabled={regenerating || isAiLimitReached}
	              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-900/40 dark:bg-blue-900/15 dark:text-blue-300"
	            >
	              <Target className="h-4 w-4" />
	              {regenerating ? 'Regenerating...' : 'Regenerate Analysis'}
	            </button>
	            <button
	              type="button"
	              onClick={() => navigate(`/analysis/create?resumeId=${analysis?.resume?._id || ''}`)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <Target className="h-4 w-4" />
              Create Another Analysis
            </button>

            <button
              type="button"
              onClick={handleDeleteAnalysis}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/15 dark:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete Analysis'}
            </button>
	          </div>
	        </div>
          {isAiLimitReached ? (
            <p className="mt-4 text-xs font-medium text-red-500 dark:text-red-400">Daily AI limit reached. Resets at 12:00 AM IST.</p>
          ) : null}

	        {analysis?.status === 'completed' ? (
          <div className="mt-5 border-t border-neutral-200 pt-5 dark:border-neutral-700">
            <button
              type="button"
              onClick={() => navigate(`/roadmap/create?analysisId=${analysis?._id || id}`)}
              className="inline-flex items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 px-5 py-3 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-900/40 dark:bg-primary-900/15 dark:text-primary-300"
            >
              <Rocket className="h-4 w-4" />
              Generate Roadmap From This Analysis
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </section>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="h-96 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 xl:col-span-2" />
          <div className="h-96 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Match Score" value={`${analysis.matchScore || 0}%`} icon={Target} tone={scoreTone(analysis.matchScore || 0)} />
            <StatCard label="Readiness" value={String(analysis.readinessLevel || 'not-ready').replace('-', ' ')} icon={Rocket} />
            <StatCard label="Time to Ready" value={`${analysis?.estimatedTimeToReady?.weeks || 0} weeks`} icon={Clock3} />
            <StatCard label="ATS Score" value={`${analysis?.atsScore?.overall || 0}%`} icon={ScanSearch} />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="space-y-6 xl:col-span-2">
              <Panel title="Role Match Breakdown" icon={Radar}>
                <BreakdownBlock breakdown={analysis.matchBreakDown} />
              </Panel>

              <Panel title="Skill Gap Overview" icon={TrendingUp}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <GapSummaryCard label="Critical" value={skillGapSummary.critical} className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" />
                  <GapSummaryCard label="Important" value={skillGapSummary.important} className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" />
                  <GapSummaryCard label="Nice to Have" value={skillGapSummary.niceToHave} className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" />
                </div>
                <div className="mt-6 space-y-5">
                  <GapList title="Critical gaps" items={analysis?.skillGaps?.critical || []} />
                  <GapList title="Important gaps" items={analysis?.skillGaps?.important || []} />
                  <GapList title="Nice-to-have gaps" items={analysis?.skillGaps?.niceToHave || []} />
                </div>
              </Panel>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel title="Candidate Strengths" icon={CheckCircle2}>
                  <StrengthList items={analysis?.candidateStrength || []} />
                </Panel>
                <Panel title="AI Recommendations" icon={Lightbulb}>
                  <RecommendationList items={analysis?.aiSuggestion?.recommendations || []} />
                </Panel>
              </div>
            </div>

            <div className="space-y-6">
              <Panel title="ATS Snapshot" icon={ScanSearch}>
                <div className="space-y-4">
                  <MiniMeter label="Overall" value={analysis?.atsScore?.overall || 0} />
                  <MiniMeter label="Formatting" value={analysis?.atsScore?.formatting?.score || 0} />
                  <MiniMeter label="Keywords" value={analysis?.atsScore?.keywords?.score || 0} />
                  <MiniMeter label="Structure" value={analysis?.atsScore?.structure?.score || 0} />
                  <MiniMeter label="Content" value={analysis?.atsScore?.content?.score || 0} />
                </div>
              </Panel>

              <Panel title="Skill Progress Detail" icon={TrendingUp}>
                <SkillBreakdownList items={analysis?.skillBreakdown || []} />
              </Panel>

              <Panel title="Experience Alignment" icon={Briefcase}>
                <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <InfoRow label="Your experience" value={`${analysis?.experienceAnalysis?.candidateYears || 0} years`} />
                  <InfoRow label="Role expectation" value={`${analysis?.experienceAnalysis?.requiredYears || 0} years`} />
                  <InfoRow label="Gap" value={`${analysis?.experienceAnalysis?.gap || 0} years`} />
                  <p className="rounded-2xl bg-neutral-50 p-4 leading-6 dark:bg-neutral-900/60">
                    {analysis?.experienceAnalysis?.assessment || 'No experience assessment available yet.'}
                  </p>
                </div>
              </Panel>
            </div>
          </section>
        </>
      )}
    </div>
  </DashboardLayout>

  )
}

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

const StatCard = ({ label, value, icon: Icon, tone = 'text-neutral-900 dark:text-white' }) => (
  <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">{label}</p>
      <div className="rounded-2xl bg-neutral-100 p-3 dark:bg-neutral-700">
        <Icon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
      </div>
    </div>
    <p className={`mt-5 text-3xl font-bold capitalize tracking-tight ${tone}`}>{value}</p>
  </div>
);

const BreakdownBlock = ({ breakdown }) => {
  const rows = [
    { label: 'Critical skills', key: 'criticalSkills' },
    { label: 'Important skills', key: 'importantSkills' },
    { label: 'Nice-to-have skills', key: 'niceToHaveSkills' },
  ];

  return (
    <div className="space-y-4">
      {rows.map((row) => {
        const item = breakdown?.[row.key] || { matched: 0, total: 0, percentage: 0 };
        return (
          <div key={row.key}>
            <div className="mb-2 flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
              <span>{row.label}</span>
              <span className="font-medium">{item.matched}/{item.total} matched</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-600 to-emerald-500"
                style={{ width: `${item.percentage || 0}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">{item.percentage || 0}% coverage</p>
          </div>
        );
      })}
    </div>
  );
};

const GapSummaryCard = ({ label, value, className }) => (
  <div className={`rounded-2xl px-4 py-5 ${className}`}>
    <p className="text-sm font-medium">{label}</p>
    <p className="mt-2 text-3xl font-bold">{value}</p>
  </div>
);

const GapList = ({ title, items }) => (
  <div>
    <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{title}</h3>
    {items.length ? (
      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <div key={`${item?.skill || title}-${index}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item?.skill || 'Skill gap'}</p>
              {item?.difficulty ? (
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-medium capitalize text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300">
                  {item.difficulty}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{item?.reason || 'No explanation available.'}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span>Importance: {item?.importance || 0}/10</span>
              <span>Learning time: {item?.learningTime || 'Not specified'}</span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">No items in this group.</p>
    )}
  </div>
);

const StrengthList = ({ items }) => (
  items.length ? (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item?.skill || 'strength'}-${index}`} className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item?.skill || 'Strength'}</p>
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-medium capitalize text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">
              {item?.proficiency || 'strong'}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {item?.uniqueAdvantage || item?.relevance || 'Relevant strength identified in your profile.'}
          </p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-neutral-500 dark:text-neutral-400">No strengths available yet.</p>
  )
);

const RecommendationList = ({ items }) => (
  items.length ? (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="rounded-2xl border border-neutral-200 p-4 text-sm leading-6 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300">
          {item}
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-neutral-500 dark:text-neutral-400">No recommendations available yet.</p>
  )
);

const SkillBreakdownList = ({ items }) => (
  items.length ? (
    <div className="space-y-4">
      {items.slice(0, 10).map((item, index) => (
        <div key={`${item?.skillName || 'skill'}-${index}`}>
          <div className="mb-2 flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
            <span>{item?.skillName || 'Skill'}</span>
            <span>{item?.currentLevel || 0}% to {item?.targetLevel || 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
            <div className="h-full rounded-full bg-primary-600" style={{ width: `${Math.min(100, Math.max(0, item?.currentLevel || 0))}%` }} />
          </div>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-neutral-500 dark:text-neutral-400">No skill progression data available yet.</p>
  )
);

const MiniMeter = ({ label, value }) => (
  <div>
    <div className="flex items-center justify-between text-sm text-neutral-700 dark:text-neutral-300">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
      <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-emerald-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
    <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="font-medium text-neutral-900 dark:text-white">{value}</span>
  </div>
);

export default AnalysisDetailPage;
