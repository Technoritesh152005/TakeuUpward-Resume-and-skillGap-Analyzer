import {useEffect , useState , useMemo} from 'react'
import {useNavigate} from 'react-router-dom'
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Trash2,
  FileText,
  Filter,
  Plus,
  Search,
  Target,
  TrendingUp,
} from 'lucide-react'
import {format} from 'date-fns'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import analysisService from '../services/analysisService.js'
import dashboardService from '../services/dashboardServices.js'
import { getSafeAnalysisError } from '../utils/analysisError.js'


// in js u must not have quotes in object keys value
const readinessTone = {
  ready: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  'nearly-ready': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'not-ready': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  overqualified: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
}

const scoreTone = (score)=> {
  if (score >= 75) return 'text-emerald-600 dark:text-emerald-400';
  if (score >=50) return 'text-amber-600 dark:text-amber-400';
  return  'text-red-600 dark:text-red-400';
}

const sortOptions = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  scoreHigh: (a, b) => (b.matchScore || 0) - (a.matchScore || 0),
  scoreLow: (a, b) => (a.matchScore || 0) - (b.matchScore || 0),
};

const getGapTotal = (analysis)=>{
  let total = 
  (analysis?.skillGaps?.critical?.length||0)+
  (analysis?.skillGaps?.important?.length || 0)+
  (analysis?.skillGaps?.niceToHave?.length || 0);
  return total;
}

const getStatusTone = (status) => {
  if (status === 'queued') return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300';
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (status === 'processing') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  if (status === 'failed') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200';
};

const processingStageText = {
  queued: 'Queued for background processing.',
  processing: 'Generating skill-gap and ATS analysis in the background.',
  finalizing: 'Saving the final analysis output.',
}

const AnalysisListPage = ()=>{

  const navigate = useNavigate()
  const [loading , setLoading] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [analyses , setAnalyses] = useState([])
  const [searchTerm , setSearchTerm] = useState('')
  const [statusFilter , setStatusFilter] = useState('all')
  const [sortBy , setSortBy] = useState('newest')
  const [deletingId, setDeletingId] = useState('')
  const [regeneratingId, setRegeneratingId] = useState('')
  const [aiUsage, setAiUsage] = useState(null)
  const isAiLimitReached = (aiUsage?.usesRemaining ?? 0) === 0

  useEffect(() => {
    fetchAnalysis()
    fetchAiUsage()
  }, [])

  useEffect(() => {
    if (!analyses.some((item) => ['queued', 'processing'].includes(item?.status))) {
      return undefined
    }

    const interval = window.setInterval(() => {
      fetchAnalysis({ silent: true })
    }, 5000)

    return () => window.clearInterval(interval)
  }, [analyses])

  const fetchAnalysis = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      const response = await analysisService.getMyAnalyses({
        page: 1,
        limit: 50,
        sort: '-createdAt'
      })
      setAnalyses(Array.isArray(response?.docs) ? response.docs : [])
      setHasLoadedOnce(true)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load analysis')
    } finally {
      if (!silent) {
        setLoading(false)
      }
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

  const handleDeleteAnalysis = async (analysisId) => {
    const confirmed = window.confirm('Delete this analysis? This will remove it from your active analysis history.')

    if (!confirmed) return

    try {
      setDeletingId(analysisId)
      await analysisService.deleteAnalysis(analysisId)
      setAnalyses((current) => current.filter((item) => item?._id !== analysisId))
      toast.success('Analysis deleted successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete analysis')
    } finally {
      setDeletingId('')
    }
  }

  const handleRegenerateAnalysis = async (event, analysisId) => {
    event.stopPropagation()

    if (isAiLimitReached) {
      toast.error('Daily AI limit reached. Resets at 12:00 AM IST')
      return
    }

    try {
      setRegeneratingId(analysisId)
      const payload = await analysisService.regenerateAnalysis(analysisId)
      const updatedAnalysis = payload?.analysis || payload?.data || payload
      if (payload?.aiUsage) setAiUsage(payload.aiUsage)
      setAnalyses((current) => current.map((item) => item?._id === analysisId ? { ...item, ...updatedAnalysis } : item))
      toast.success(updatedAnalysis?.status === 'queued' ? 'Analysis retry queued successfully' : 'Analysis regenerated successfully')
    } catch (error) {
      console.error(error)
      toast.error(error?.response?.data?.message || 'Failed to regenerate analysis')
    } finally {
      setRegeneratingId('')
    }
  }
	  
  // what useMemo does is when dependencies that is all dep when changes this runs
  const filteredAnalyses = useMemo(()=>{
    // searchTerm = what user types in the search input box
    const query = searchTerm.trim().toLowerCase()

    // measn if statusfilter is not all means we need to search based on status so we continue from here
    return [...analyses]
    // select analyses which match with query
    .filter((analysis)=>{
      
      if (statusFilter !== 'all' && analysis.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      const title = analysis?.jobRole?.title || '';
      const category = analysis?.jobRole?.category || '';
      const resumeName = analysis?.resume?.originalFileName || analysis?.resume?.fileName || '';
      const readiness = analysis?.readinessLevel || '';

      // what some does is in array check every value  whether it matches with quetry. if yes true and filter select this analysis
      return [title, category , resumeName , readiness]
      .some((value)=> String(value).toLowerCase().includes(query))
    })
    .sort(sortOptions[sortBy] || sortOptions.newest);
  } 
, [analyses , searchTerm , sortBy , statusFilter])

// useMemo	returns a value (for calculation)
// useEffect	runs side effects (no return value used)

// whenever some analyses adds or deletes do this summary count
const summary = useMemo(()=>{
  const completed = analyses.filter((item) => item.status === 'completed')
  const totalScore = completed.reduce((sum, item) => sum + (item.matchScore || 0), 0)
  const averageScore = completed.length ? Math.round(totalScore / completed.length) : 0

  return {
    total : analyses.length,
    completed:completed.length,
    avgScore : averageScore,
    highFit : completed.filter((item)=> (item.matchScore || 0) >= 75) .length
  }
},[analyses])

return (
  <DashboardLayout>
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(135deg,_#0f172a,_#111827_55%,_#0b3b2e)] p-6 text-white shadow-soft dark:border-neutral-700 md:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.18),_transparent_58%)] lg:block" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <ClipboardList className="h-4 w-4" />
              Saved Analyses
            </p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">View every analysis in one clean workspace</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
              Browse completed analysis runs, check fit scores at a glance, and open any result in a dedicated detailed view.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/analysis/create')}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
          >
            <Plus className="h-4 w-4" />
            Create New Analysis
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Analyses" value={summary.total} icon={ClipboardList} />
        <SummaryCard label="Completed" value={summary.completed} icon={Target} />
        <SummaryCard label="Average Score" value={`${summary.avgScore}%`} icon={TrendingUp} />
        <SummaryCard label="High-Fit Roles" value={summary.highFit} icon={ArrowRight} />
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by role, category, resume, or readiness"
              className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
              <Filter className="h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="bg-transparent outline-none"
              >
                <option value="all">All status</option>
                <option value="queued">Queued</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </label>

            <label className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-3 text-sm text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
              <CalendarDays className="h-4 w-4" />
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="bg-transparent outline-none"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="scoreHigh">Highest score</option>
                <option value="scoreLow">Lowest score</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        {loading && !hasLoadedOnce ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-44 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
          ))
        ) : filteredAnalyses.length > 0 ? (
          filteredAnalyses.map((analysis) => (
            <div
              key={analysis._id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/analysis/${analysis._id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/analysis/${analysis._id}`);
                }
              }}
              className="group w-full rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-700"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${readinessTone[analysis.readinessLevel] || 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200'}`}>
                      {String(analysis.readinessLevel || 'unknown').replace('-', ' ')}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusTone(analysis.status)}`}>
                      {analysis.status || 'unknown'}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {analysis.createdAt ? format(new Date(analysis.createdAt), 'dd MMM yyyy') : 'No date'}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                    {analysis?.jobRole?.title || 'Untitled analysis'}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="inline-flex items-center gap-2">
                      <FileText className="h-4 w-4 text-neutral-400" />
                      {analysis?.resume?.originalFileName || analysis?.resume?.fileName || 'Resume unavailable'}
                    </span>
                    <span>{analysis?.jobRole?.category || 'General role'}</span>
                    <span>{analysis?.jobRole?.experienceLevel || 'Any level'}</span>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {analysis.status === 'failed'
                      ? getSafeAnalysisError(analysis?.error)
                      : analysis.status === 'queued'
                        ? (processingStageText[analysis?.processingStage] || 'Analysis is queued and will start shortly.')
                      : analysis.status === 'processing'
                        ? (processingStageText[analysis?.processingStage] || 'Analysis is still running. Metrics can be incomplete until processing finishes.')
                        : analysis?.aiSuggestion?.summary || 'Open this analysis to review detailed strengths, gaps, ATS signals, and recommendations.'}
                  </p>
                </div>

                <div className="grid min-w-full grid-cols-2 gap-3 lg:min-w-[320px]">
                  <MetricCard
                    label="Match Score"
                    value={analysis.status === 'completed' ? `${analysis.matchScore || 0}%` : 'Pending'}
                    valueClass={analysis.status === 'completed' ? scoreTone(analysis.matchScore || 0) : 'text-neutral-500 dark:text-neutral-400'}
                  />
                  <MetricCard
                    label="Time to Ready"
                    value={analysis.status === 'completed' ? `${analysis?.estimatedTimeToReady?.weeks || 0} weeks` : 'Pending'}
                  />
                  <MetricCard
                    label="Skill Gaps"
                    value={analysis.status === 'completed' ? getGapTotal(analysis) : 'Pending'}
                  />
                  <MetricCard
                    label="ATS Score"
                    value={analysis.status === 'completed' ? `${analysis?.atsScore?.overall || 0}%` : 'Pending'}
                  />
                </div>
              </div>

                <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4 text-sm dark:border-neutral-700">
                  <div className="flex flex-wrap gap-2">
                    {(analysis?.candidateStrength || []).slice(0, 3).map((item, index) => (
                    <span
                      key={`${item?.skill || 'strength'}-${index}`}
                      className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    >
                      {item?.skill || 'Strength'}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {['completed', 'failed'].includes(analysis?.status) ? (
                    <button
                      type="button"
                      onClick={(event) => handleRegenerateAnalysis(event, analysis._id)}
                      disabled={regeneratingId === analysis._id || isAiLimitReached}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-900/40 dark:bg-blue-900/15 dark:text-blue-300"
                    >
                      {regeneratingId === analysis._id ? 'Retrying...' : analysis?.status === 'failed' ? 'Retry Analysis' : 'Regenerate'}
                    </button>
                  ) : null}

                  {analysis?.status === 'completed' ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/roadmap/create?analysisId=${analysis._id}`);
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-900/40 dark:bg-primary-900/15 dark:text-primary-300"
                    >
                      Build roadmap
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteAnalysis(analysis._id);
                    }}
                    disabled={deletingId === analysis._id}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/40 dark:bg-red-900/15 dark:text-red-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === analysis._id ? 'Deleting...' : 'Delete'}
                  </button>

                  <span className="inline-flex items-center gap-2 font-semibold text-primary-600 transition group-hover:translate-x-1 dark:text-primary-400">
                    View details
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-700 dark:bg-neutral-800">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-700">
              <ClipboardList className="h-8 w-8 text-neutral-400" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-white">No analyses match these filters</h2>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              Try a different search term, or create a new analysis to start building your history.
            </p>
            <button
              type="button"
              onClick={() => navigate('/analysis/create')}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              <Plus className="h-4 w-4" />
              Create Analysis
            </button>
          </div>
        )}
      </section>
    </div>
  </DashboardLayout>
);
}

const SummaryCard = ({ label, value, icon: Icon }) => (
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

const MetricCard = ({ label, value, valueClass = 'text-neutral-900 dark:text-white' }) => (
  <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
    <p className={`mt-2 text-lg font-semibold ${valueClass}`}>{value}</p>
  </div>
);

export default AnalysisListPage;
