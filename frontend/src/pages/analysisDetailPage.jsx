import {useEffect, useState , useMemo} from 'react'
import {useNavigate , useParams} from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Cpu,
  Clock3,
  ExternalLink,
  FileText,
  Layers,
  Lightbulb,
  Radar,
  Rocket,
  ScanSearch,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  Zap,
} from 'lucide-react'
import toast from 'react-hot-toast'
import {format} from 'date-fns'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import analysisService from '../services/analysisService.js'
import dashboardService from '../services/dashboardServices.js'
import { getSafeAnalysisError } from '../utils/analysisError.js'
import { motion } from 'framer-motion'


const emptyOverview = {
  matchScore: 0,
  readinessLevel: 'not-ready',
  estimatedTimeToReady: { weeks: 0, reason: '' },
  matchBreakDown: null,
  skillGaps: { critical: [], important: [], niceToHave: [] },
  candidateStrength: [],
  transferrableSkills: [],
  extractedSkills: [],
  skillBreakdown: [],
  experienceAnalysis: {},
  atsScore: null,
  aiSuggestion: { summary: '', recommendations: [], careerAdvice: '', competitiveAnalysis: null },
  applicationReadiness: { topReasons: [] },
  closestWinnableRole: null,
}

const statusTone = {
  queued: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
}

const scoreTone = (score) => {
  if (score >= 75) return 'text-emerald-500'
  if (score >= 50) return 'text-amber-500'
  return 'text-red-500'
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, staggerChildren: 0.1, ease: "easeOut" }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const asArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean)
  return []
}

const asText = (value, fallback = '') => {
  if (typeof value === 'string') return value
  return fallback
}

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const getAnalysisStatusPollMs = (status, processingStage) => {
  if (status !== 'queued' && status !== 'processing' && status !== 'finalizing') {
    return null
  }

  if (processingStage === 'queued' || status === 'queued') {
    return 6000
  }

  if (processingStage === 'finalizing' || status === 'finalizing') {
    return 4000
  }

  return 3000
}

const normalizeAnalysisDetail = (payload) => {
  const clean = payload || {}
  const atsScore = clean?.atsScore || {}
  const keywords = atsScore?.keywords || {}
  const formatting = atsScore?.formatting || {}
  const structure = atsScore?.structure || {}
  const content = atsScore?.content || {}

  return {
    ...emptyOverview,
    ...clean,
    extractedSkills: asArray(clean?.extractedSkills),
    skillBreakdown: asArray(clean?.skillBreakdown),
    candidateStrength: asArray(clean?.candidateStrength),
    transferrableSkills: Array.isArray(clean?.transferrableSkills)
      ? clean.transferrableSkills
      : clean?.transferrableSkills?.skill
        ? [clean.transferrableSkills]
        : [],
    skillGaps: {
      critical: asArray(clean?.skillGaps?.critical),
      important: asArray(clean?.skillGaps?.important),
      niceToHave: asArray(clean?.skillGaps?.niceToHave),
    },
    atsScore: {
      overall: asNumber(atsScore?.overall),
      formatting: {
        ...formatting,
        score: asNumber(formatting?.score),
        issues: asArray(formatting?.issues),
      },
      keywords: {
        ...keywords,
        score: asNumber(keywords?.score),
        matched: asArray(keywords?.matched),
        missing: asArray(keywords?.missing),
        recommended: asArray(keywords?.recommended),
      },
      structure: {
        ...structure,
        score: asNumber(structure?.score),
        issues: asArray(structure?.issues),
      },
      content: {
        ...content,
        score: asNumber(content?.score),
        issues: asArray(content?.issues),
        weakPhrases: asArray(content?.weakPhrases),
        rewriteSuggestions: asArray(content?.rewriteSuggestions),
      },
    },
    aiSuggestion: {
      summary: asText(clean?.aiSuggestion?.summary),
      recommendations: asArray(clean?.aiSuggestion?.recommendations),
      careerAdvice: asText(clean?.aiSuggestion?.careerAdvice),
      competitiveAnalysis: clean?.aiSuggestion?.competitiveAnalysis || null,
    },
    applicationReadiness: {
      ...clean?.applicationReadiness,
      topReasons: asArray(clean?.applicationReadiness?.topReasons),
    },
    closestWinnableRole: clean?.closestWinnableRole || null,
  }
}



const AnalysisDetailPage = ()=>{

  const navigate = useNavigate()
  const {id} = useParams()
  const [loading , setLoading] = useState(true)
  const [analysis , setAnalysis] = useState(emptyOverview)
  const [deleting , setDeleting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [aiUsage, setAiUsage] = useState(null)
  const [recommendedJobs, setRecommendedJobs] = useState([])
  const [jobRecommendationMeta, setJobRecommendationMeta] = useState({ basedOn: [] })
  const [jobsLoading, setJobsLoading] = useState(false)
  const isAiLimitReached = (aiUsage?.usesRemaining ?? 0) === 0
  const isAnalysisRunning = ['queued', 'processing', 'finalizing'].includes(analysis?.status)
  const isAnalysisDeleteBlocked = ['processing', 'finalizing'].includes(analysis?.status)

  // whenever there is a change in id in params call these means someone want analysis detail
  useEffect(()=>{
    if(id){
      fetchAnalysis()
    }
  },[id])

  useEffect(() => {
    fetchAiUsage()
  }, [])

  // whenever there is change in id or analysis staus 
  // automatically checking analsus status every 3 sec
  // if analysis not finished keep retrying
  useEffect(() => {
    if (!id) return undefined
    if (!['queued', 'processing', 'finalizing'].includes(analysis?.status)) return undefined

    const pollMs = getAnalysisStatusPollMs(analysis?.status, analysis?.processingStage)
    if (!pollMs) return undefined

    const runPoll = () => {
      if (document.hidden) return
      fetchAnalysisStatus()
    }

    const interval = window.setInterval(runPoll, pollMs)

    return () => window.clearInterval(interval)
  }, [id, analysis?.status, analysis?.processingStage])

  const fetchAnalysis = async({ silent = false } = {})=>{

    try{
      if (!silent) {
        setLoading(true)
      }
      const payload = await analysisService.getAnalysisById(id)
      const cleandata = payload?.data || payload
      if (silent && ['queued', 'processing', 'finalizing'].includes(cleandata?.status)) {
        setAnalysis((current) => ({
          ...current,
          status: cleandata?.status || current?.status,
          processingStage: cleandata?.processingStage || current?.processingStage,
          error: cleandata?.error || current?.error,
          completedAt: cleandata?.completedAt || current?.completedAt,
          processingTime: cleandata?.processingTime || current?.processingTime,
        }))
      } else {
        // if cleaneddata key exist in emptyoverview the cleaned data value will override it
        setAnalysis(normalizeAnalysisDetail(cleandata))
        if (cleandata?.status === 'completed') {
          fetchRecommendedJobs()
        } else {
          setRecommendedJobs([])
          setJobRecommendationMeta({ basedOn: [] })
        }
      }
    }catch(error){
      toast.error('failed to fetch your analysis detail.. Sorry for Inconveince. also sorry for spelling mistake')
    }finally{
      if (!silent) {
        setLoading(false)
      }
	  }
  }

  const fetchAnalysisStatus = async () => {
    try {
      const payload = await analysisService.getAnalysisStatus(id)
      const statusData = payload?.data || payload

      setAnalysis((current) => ({
        ...current,
        status: statusData?.status || current?.status,
        processingStage: statusData?.processingStage || current?.processingStage,
        error: statusData?.error || current?.error,
        queuedAt: statusData?.queuedAt || current?.queuedAt,
        processingStartedAt: statusData?.processingStartedAt || current?.processingStartedAt,
        completedAt: statusData?.completedAt || current?.completedAt,
        processingTime: statusData?.processingTime || current?.processingTime,
      }))

      if (statusData?.status === 'completed' || statusData?.status === 'failed') {
        fetchAnalysis({ silent: true })
      }
    } catch (error) {
    }
  }

  const fetchAiUsage = async () => {
    try {
      const response = await dashboardService.getDashboardData()
      setAiUsage(response?.data?.aiUsage || null)
    } catch (error) {
    }
  }

  const fetchRecommendedJobs = async () => {
    try {
      setJobsLoading(true)
      const payload = await analysisService.getRecommendedJobs(id)
      const clean = payload?.data || payload
      setRecommendedJobs(Array.isArray(clean?.jobs) ? clean.jobs : [])
      setJobRecommendationMeta({
        basedOn: Array.isArray(clean?.basedOn) ? clean.basedOn : [],
      })
    } catch (error) {
      setRecommendedJobs([])
      setJobRecommendationMeta({ basedOn: [] })
    } finally {
      setJobsLoading(false)
    }
  }

  const skillGapSummary = useMemo(() => ({
    critical: analysis?.skillGaps?.critical?.length || 0,
    important: analysis?.skillGaps?.important?.length || 0,
    niceToHave: analysis?.skillGaps?.niceToHave?.length || 0,
  }), [analysis]);

  const atsKeywords = useMemo(() => ({
    matched: asArray(analysis?.atsScore?.keywords?.matched),
    missing: asArray(analysis?.atsScore?.keywords?.missing),
    recommended: asArray(analysis?.atsScore?.keywords?.recommended),
  }), [analysis])

  const atsIssues = useMemo(() => ({
    formatting: asArray(analysis?.atsScore?.formatting?.issues),
    structure: asArray(analysis?.atsScore?.structure?.issues),
    content: asArray(analysis?.atsScore?.content?.issues),
    weakPhrases: asArray(analysis?.atsScore?.content?.weakPhrases),
    rewriteSuggestions: asArray(analysis?.atsScore?.content?.rewriteSuggestions),
  }), [analysis])

  const handleDeleteAnalysis = async()=> {
    const confirmed = window.confirm('Delete this analysis? This will remove it from your active analysis history.')

    if (!confirmed) return

    try{
      setDeleting(true)
      await analysisService.deleteAnalysis(id)
      toast.success('Analysis deleted successfully')
      navigate('/analysis')
    }catch(error){
      toast.error('Failed to delete analysis')
    }finally{
      setDeleting(false)
	  }
  }

  const handleRegenerateAnalysis = async () => {
    if (isAiLimitReached) {
      toast.error('Daily AI credits exhausted. Resets at 12:00 AM IST')
      return
    }

    try {
      setRegenerating(true)
      const payload = await analysisService.regenerateAnalysis(id)
      const clean = payload?.analysis || payload?.data || payload
      setAnalysis(normalizeAnalysisDetail(clean))
      if (payload?.aiUsage) setAiUsage(payload.aiUsage)
      toast.success(clean?.status === 'queued' ? 'Analysis retry queued successfully' : 'Analysis regenerated successfully')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to regenerate analysis')
    } finally {
      setRegenerating(false)
    }
  }

  return (
    <DashboardLayout>
    <div className="space-y-8">
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/5 bg-neutral-900 p-8 md:p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-4">
            <button
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Analysis List
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white capitalize">
                  {loading ? 'Loading...' : analysis?.jobRole?.title || 'Analysis Overview'}
                </h1>
                {analysis?.status && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusTone[analysis.status]}`}>
                    <div className="w-1.5 h-1.5 bg-current rounded-full" />
                    {analysis.status}
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-5 text-sm font-medium text-neutral-500">
              <span className="inline-flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary-500" />
                {analysis?.jobRole?.category || 'Role Category'}
              </span>
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-500" />
                {analysis?.resume?.originalFileName || analysis?.resume?.fileName || 'Resume File'}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-neutral-500" />
                {analysis?.createdAt ? format(new Date(analysis.createdAt), 'MMM dd, yyyy') : 'No Date'}
              </span>
            </div>

            <p className="max-w-3xl text-base text-neutral-400 leading-relaxed font-medium">
              {analysis?.aiSuggestion?.summary || 'Reviewing your resume strengths and areas for improvement based on the selected role requirements.'}
            </p>
          </div>


          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRegenerateAnalysis}
              disabled={regenerating || isAiLimitReached || !['completed', 'failed'].includes(analysis?.status)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-30"
            >
              <Target className="h-4 w-4 text-primary-400" />
              {regenerating ? 'Updating...' : 'Refresh Analysis'}
            </button>
            <button
              onClick={() => navigate(`/analysis/create?resumeId=${analysis?.resume?._id || ''}`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-500 shadow-lg shadow-primary-900/20"
            >
              <ArrowRight className="h-4 w-4" />
              New Comparison
            </button>

            <button
              onClick={handleDeleteAnalysis}
              disabled={deleting || isAnalysisDeleteBlocked}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

          {isAiLimitReached ? (
            <p className="mt-4 text-xs font-medium text-red-500 dark:text-red-400">Daily AI credits exhausted. Resets at 12:00 AM IST.</p>
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
      </motion.section>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="h-96 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800 xl:col-span-2" />
          <div className="h-96 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
        </div>
      ) : ['queued', 'processing', 'finalizing'].includes(analysis?.status) ? (
        <AnalysisProcessingState analysis={analysis} />
      ) : analysis?.status === 'failed' ? (
        <AnalysisFailedState
          analysis={analysis}
          regenerating={regenerating}
          isAiLimitReached={isAiLimitReached}
          onRetry={handleRegenerateAnalysis}
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <StatCard label="Match Score" value={analysis?.status === 'completed' ? `${analysis.matchScore || 0}%` : 'Pending'} icon={Target} tone={analysis?.status === 'completed' ? scoreTone(analysis.matchScore || 0) : 'text-neutral-500'} />
            <StatCard label="Readiness" value={analysis?.status === 'completed' ? String(analysis.readinessLevel || 'not-ready').replace('-', ' ') : 'Pending'} icon={Rocket} />
            <StatCard label="Time to Ready" value={analysis?.status === 'completed' ? `${analysis?.estimatedTimeToReady?.weeks || 0} weeks` : 'Pending'} icon={Clock3} />
            <StatCard label="ATS Score" value={analysis?.status === 'completed' ? `${analysis?.atsScore?.overall || 0}%` : 'Pending'} icon={ScanSearch} />
          </section>


          <section className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.6fr)_360px]">
            <div className="space-y-8">
              <Panel
                title="Quick Summary"
                icon={Lightbulb}
                description="A simple view of where you match well and where you need to improve."
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <SummaryMetric
                    label="Strong Areas"
                    value={analysis?.candidateStrength?.length || 0}
                    tone="emerald"
                  />
                  <SummaryMetric
                    label="Skills To Improve"
                    value={skillGapSummary.critical + skillGapSummary.important + skillGapSummary.niceToHave}
                    tone="amber"
                  />
                  <SummaryMetric
                    label="Weeks To Ready"
                    value={analysis?.estimatedTimeToReady?.weeks || 0}
                    suffix=" weeks"
                    tone="blue"
                  />
                </div>
                <div className="mt-6 rounded-2xl border border-white/5 bg-white/5 p-5">
                  <p className="text-sm leading-7 text-neutral-300">
                    {analysis?.aiSuggestion?.summary || 'This report shows how your resume matches the role and what to improve next.'}
                  </p>
                </div>
              </Panel>

              <Panel
                title="Skill Gaps"
                icon={TrendingUp}
                description="These are the skills that need attention before you apply with confidence."
              >
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <GapSummaryCard label="Critical" value={skillGapSummary.critical} className="bg-red-500/10 text-red-300" />
                  <GapSummaryCard label="Important" value={skillGapSummary.important} className="bg-amber-500/10 text-amber-300" />
                  <GapSummaryCard label="Nice To Have" value={skillGapSummary.niceToHave} className="bg-blue-500/10 text-blue-300" />
                </div>

                {skillGapSummary.critical + skillGapSummary.important + skillGapSummary.niceToHave === 0 ? (
                  <EmptyPanelState
                    title="No skill gaps found"
                    description={`Your resume already covers the main skills for ${analysis?.jobRole?.title || 'this role'}.`}
                    tone="success"
                  />
                ) : (
                  <div className="mt-8 space-y-8">
                    <GapList
                      title="Critical Gaps"
                      items={analysis?.skillGaps?.critical || []}
                      type="critical"
                      emptyTitle="No critical gaps"
                      emptyDescription="You already cover the most important skills for this role."
                    />
                    <GapList
                      title="Important Gaps"
                      items={analysis?.skillGaps?.important || []}
                      type="important"
                      emptyTitle="No important gaps"
                      emptyDescription="Your resume is in good shape for the core supporting skills."
                    />
                    <GapList
                      title="Nice To Have"
                      items={analysis?.skillGaps?.niceToHave || []}
                      type="niceToHave"
                      emptyTitle="No extra gaps"
                      emptyDescription="You are not missing any optional skills worth highlighting here."
                    />
                  </div>
                )}
              </Panel>

              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <Panel
                  title="Your Strengths"
                  icon={CheckCircle2}
                  description="Skills and experience that already match this role well."
                >
                  <StrengthList items={analysis?.candidateStrength || []} />
                </Panel>
                <Panel
                  title="What To Do Next"
                  icon={Lightbulb}
                  description="Simple actions that can improve your chances."
                >
                  <RecommendationList items={analysis?.aiSuggestion?.recommendations || []} />
                </Panel>
              </div>

              <Panel
                title="Match Breakdown"
                icon={Radar}
                description="How well your profile covers the key skill groups for this job."
              >
                <BreakdownBlock breakdown={analysis.matchBreakDown} />
              </Panel>

              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                <Panel
                  title="Extracted Resume Skills"
                  icon={Cpu}
                  description="Structured skills saved from your resume and used while generating this analysis."
                >
                  <AtsTagSection
                    title="Detected Skills"
                    items={analysis?.extractedSkills || []}
                    emptyText="No extracted resume skills were saved for this analysis."
                    tone="emerald"
                  />
                </Panel>
                <Panel
                  title="Skill Progress"
                  icon={Layers}
                  description="Current and target skill levels from the role comparison."
                >
                  <SkillBreakdownList items={analysis?.skillBreakdown || []} />
                </Panel>
              </div>

              {analysis?.transferrableSkills?.length ? (
                <Panel
                  title="Transferable Skills"
                  icon={TrendingUp}
                  description="These skills can help you move into this role even if they came from a different background."
                >
                  <TransferableSkillsList items={analysis?.transferrableSkills} />
                </Panel>
              ) : null}

              {(analysis?.aiSuggestion?.careerAdvice || analysis?.aiSuggestion?.competitiveAnalysis) ? (
                <Panel
                  title="Career Insight"
                  icon={Lightbulb}
                  description="Advice and market context returned with this analysis."
                >
                  <CareerInsightCard insight={analysis?.aiSuggestion} />
                </Panel>
              ) : null}

            </div>

            <div className="space-y-8 xl:sticky xl:top-24 xl:self-start">
              <Panel
                title="ATS Details"
                icon={ScanSearch}
                description="This shows how easy your resume is for hiring systems to read."
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-neutral-400">Overall ATS Score</p>
                    <span className="text-2xl font-bold text-white">{analysis?.atsScore?.overall || 0}%</span>
                  </div>
                  <div className="space-y-4">
                    <MiniMeter label="Formatting" value={analysis?.atsScore?.formatting?.score || 0} />
                    <MiniMeter label="Keywords" value={analysis?.atsScore?.keywords?.score || 0} />
                    <MiniMeter label="Structure" value={analysis?.atsScore?.structure?.score || 0} />
                    <MiniMeter label="Content" value={analysis?.atsScore?.content?.score || 0} />
                  </div>
                  <div className="space-y-5 rounded-2xl border border-white/5 bg-white/5 p-4">
                    <AtsTagSection
                      title="Matched Keywords"
                      items={atsKeywords.matched}
                      emptyText="No matched ATS keywords were returned."
                      tone="emerald"
                    />
                    <AtsTagSection
                      title="Missing Keywords"
                      items={atsKeywords.missing}
                      emptyText="No missing keywords were flagged."
                    />
                    <AtsTagSection
                      title="Recommended Keywords"
                      items={atsKeywords.recommended}
                      emptyText="No ATS recommended keywords were returned."
                    />
                  </div>
                  <div className="space-y-5">
                    <AtsListSection title="Formatting Issues" items={atsIssues.formatting} emptyText="No formatting issues found." />
                    <AtsListSection title="Structure Issues" items={atsIssues.structure} emptyText="No structure issues found." />
                    <AtsListSection title="Content Issues" items={atsIssues.content} emptyText="No content issues found." />
                    <AtsListSection title="Weak Phrases" items={atsIssues.weakPhrases} emptyText="No weak phrases were flagged." />
                    <AtsListSection title="Rewrite Suggestions" items={atsIssues.rewriteSuggestions} emptyText="No rewrite suggestions available." />
                  </div>
                </div>
              </Panel>

              <Panel
                title="Application Readiness"
                icon={Rocket}
                description="A quick answer to how ready you are to apply."
              >
                <ApplicationReadinessCard readiness={analysis?.applicationReadiness} />
              </Panel>

              <Panel
                title="Experience Match"
                icon={Briefcase}
                description="How your experience compares with the role requirement."
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                     <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-neutral-500 uppercase font-bold">You</p>
                        <p className="text-lg font-bold text-white">{analysis?.experienceAnalysis?.candidateYears || 0}y</p>
                     </div>
                     <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-neutral-500 uppercase font-bold">Needed</p>
                        <p className="text-lg font-bold text-white">{analysis?.experienceAnalysis?.requiredYears || 0}y</p>
                     </div>
                     <div className="text-center p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[10px] text-neutral-500 uppercase font-bold">Gap</p>
                        <p className={`text-lg font-bold ${analysis?.experienceAnalysis?.gap > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {analysis?.experienceAnalysis?.gap || 0}y
                        </p>
                     </div>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed font-medium">
                    {analysis?.experienceAnalysis?.assessment || 'No experience notes are available yet.'}
                  </p>
                </div>
              </Panel>

              {analysis?.closestWinnableRole?.title ? (
                <Panel
                  title="Closest Winnable Role"
                  icon={Target}
                  description="A nearby role that looks more achievable right now."
                >
                  <ClosestRoleCard role={analysis?.closestWinnableRole} />
                </Panel>
              ) : null}
            </div>
          </section>

          <Panel
            title="Related Job Matches"
            icon={Briefcase}
            description="Live roles that look close to your current profile."
          >
            <RecommendedJobsCard
              jobs={recommendedJobs}
              jobsLoading={jobsLoading}
              basedOn={jobRecommendationMeta?.basedOn || []}
            />
          </Panel>
        </>
      )}
    </div>
  </DashboardLayout>

  )
}

const Panel = ({ title, icon: Icon, description, children }) => (
  <motion.div 
    variants={itemVariants}
    className="rounded-3xl border border-white/5 bg-neutral-900/40 p-8 shadow-xl backdrop-blur-xl relative overflow-hidden group hover:bg-neutral-900/60 transition-colors duration-300"
  >
    <div className="mb-6 flex items-center gap-4">
      <div className="rounded-2xl bg-white/5 p-3 border border-white/5">
        <Icon className="h-5 w-5 text-primary-400" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-neutral-400">{description}</p>
        ) : null}
      </div>
    </div>
    <div className="relative z-10">
      {children}
    </div>
  </motion.div>
);

const AnalysisProcessingState = ({ analysis }) => {
  const stages = [
    { key: 'queued', label: 'In Queue', icon: Layers },
    { key: 'processing', label: 'Analyzing', icon: Cpu },
    { key: 'finalizing', label: 'Finalizing', icon: Zap },
    { key: 'completed', label: 'Ready', icon: ShieldCheck },
  ]

  const currentStage = analysis?.processingStage || analysis?.status || 'queued'
  const matchedStageIndex = stages.findIndex((stage) => stage.key === currentStage)
  const currentIndex = matchedStageIndex >= 0 ? matchedStageIndex : 0
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const baseTime = analysis?.processingStartedAt || analysis?.queuedAt || analysis?.createdAt
    if (!baseTime) {
      setElapsedSeconds(0)
      return undefined
    }

    const updateElapsed = () => {
      const diffMs = Date.now() - new Date(baseTime).getTime()
      setElapsedSeconds(Math.max(0, Math.floor(diffMs / 1000)))
    }

    updateElapsed()

    if (!['queued', 'processing', 'finalizing'].includes(analysis?.status)) {
      return undefined
    }

    const interval = window.setInterval(updateElapsed, 1000)
    return () => window.clearInterval(interval)
  }, [analysis?.processingStartedAt, analysis?.queuedAt, analysis?.createdAt, analysis?.status])

  const progressWidth = currentStage === 'completed'
    ? 100
    : currentStage === 'finalizing'
      ? 86
      : currentStage === 'processing'
        ? 58
        : 24

  const elapsedLabel = elapsedSeconds < 60
    ? `${elapsedSeconds}s`
    : `${Math.floor(elapsedSeconds / 60)}m ${String(elapsedSeconds % 60).padStart(2, '0')}s`

  const statusGuidance = {
    queued: {
      title: 'Waiting In Queue',
      description: 'Your analysis request is saved and waiting for the next available worker.',
      detail: 'You can leave this page and come back later. The analysis will continue in the background.',
    },
    processing: {
      title: 'Analysis In Progress',
      description: 'The worker is matching your resume against the selected role and generating fit insights.',
      detail: 'Scores, ATS signals, and recommendations will appear once processing is finished.',
    },
    finalizing: {
      title: 'Final Results Are Being Saved',
      description: 'The analysis is almost done and the final response is being prepared.',
      detail: 'This step usually finishes shortly after the main analysis completes.',
    },
    completed: {
      title: 'Analysis Ready',
      description: 'Your results are available now.',
      detail: 'Open the sections below to review strengths, gaps, and ATS guidance.',
    },
  }

  const activeGuidance = statusGuidance[currentStage] || statusGuidance.queued

  return (
    <section className="grid grid-cols-1 gap-8 xl:grid-cols-[1.4fr_0.8fr]">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="rounded-3xl border border-white/5 bg-neutral-900/40 p-8 md:p-12 backdrop-blur-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="flex items-start gap-6">
          <div className="rounded-2xl bg-primary-500/10 p-4 border border-primary-500/20">
            <ScanSearch className="h-6 w-6 text-primary-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Reviewing Your Profile</h2>
            <p className="max-w-xl text-base text-neutral-400 font-medium">
              The AI is currently comparing your resume skills and experience against the target role requirements.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-white/5 bg-white/5 p-8 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Processing Time</p>
              <p className="text-xs text-neutral-500 font-medium">
                Time elapsed: {elapsedLabel}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-neutral-950 px-4 py-2 border border-white/5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" />
              </span>
              <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Active Analysis</span>
            </div>
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-neutral-950 border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressWidth}%` }}
              className="h-full rounded-full bg-primary-600 relative"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
            <span>Stage: {String(currentStage).replaceAll('_', ' ')}</span>
            <span>Estimated time: 20s - 40s</span>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stages.map((stage, index) => {
            const isDone = index < currentIndex || currentStage === 'completed'
            const isActive = stage.key === currentStage
            const StageIcon = stage.icon

            return (
              <motion.div 
                key={stage.key}
                variants={itemVariants}
                className={`rounded-2xl border p-6 transition-all duration-300 ${
                  isActive 
                  ? 'border-primary-500/30 bg-primary-500/10 shadow-lg' 
                  : 'border-white/5 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-300 ${
                    isDone 
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                    : isActive 
                      ? 'bg-primary-600 border-primary-500 text-white' 
                      : 'bg-neutral-800 border-white/5 text-neutral-600'
                  }`}>
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : <StageIcon className={`h-5 w-5 ${isActive ? 'animate-pulse' : ''}`} />}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isActive ? 'text-white' : 'text-neutral-500'}`}>{stage.label}</p>
                    <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">
                      {isDone ? 'Finished' : isActive ? 'In Progress' : 'Waiting'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      <div className="space-y-6">
        <Panel title="Analysis Details" icon={Zap}>
          <div className="space-y-4">
            <InfoRow label="Current Status" value={String(analysis?.status || 'queued')} />
            <InfoRow label="Stage" value={String(currentStage).replaceAll('_', ' ')} />
            <InfoRow label="File" value={analysis?.resume?.originalFileName || 'Resume.pdf'} />
            <InfoRow label="Role" value={analysis?.jobRole?.title || 'Selected Role'} />
          </div>
        </Panel>

        <Panel title="What to Expect" icon={Clock3}>
          <div className="space-y-4 text-xs font-medium leading-relaxed text-neutral-500">
            <p className="flex gap-2">
              <span className="text-primary-500">•</span>
              Match score and role-fit summary
            </p>
            <p className="flex gap-2">
              <span className="text-blue-500">•</span>
              Skill gaps and candidate strengths
            </p>
            <p className="flex gap-2">
              <span className="text-emerald-500">•</span>
              ATS readiness insights and next-step recommendations
            </p>
            <p className="flex gap-2">
              <span className="text-amber-500">â€¢</span>
              Live job suggestions based on the target role or closest winnable role
            </p>
          </div>
        </Panel>
      </div>
    </section>
  )
}

const StatCard = ({ label, value, icon: Icon, tone = 'text-white' }) => (
  <motion.div 
    variants={itemVariants}
    className="rounded-3xl border border-white/5 bg-neutral-900/40 p-6 md:p-8 shadow-xl backdrop-blur-xl group transition-all duration-300"
  >
    <div className="flex items-center justify-between">
      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">{label}</p>
      <div className="rounded-xl bg-white/5 p-3 border border-white/5 text-neutral-500 group-hover:text-primary-400 transition-colors duration-300">
        <Icon className="h-5 w-5" />
      </div>
    </div>
    <p className={`mt-6 text-3xl font-bold tracking-tight capitalize leading-none ${tone}`}>{value}</p>
  </motion.div>
);

const BreakdownBlock = ({ breakdown }) => {
  const rows = [
    { label: 'Essential Skills', key: 'criticalSkills', col: 'bg-primary-600' },
    { label: 'Core Skills', key: 'importantSkills', col: 'bg-blue-600' },
    { label: 'Additional Skills', key: 'niceToHaveSkills', col: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-8 py-2">
      {rows.map((row) => {
        const item = breakdown?.[row.key] || { matched: 0, total: 0, percentage: 0 };
        return (
          <div key={row.key} className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
              <span className="text-neutral-400">{row.label}</span>
              <span className="text-white">
                {item.matched} / {item.total} Matched
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-950 border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage || 0}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${row.col} relative`}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              <span>Coverage</span>
              <span className="text-primary-400">{item.percentage || 0}% Match</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AnalysisFailedState = ({ analysis, regenerating, isAiLimitReached, onRetry }) => (
  <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.15fr)_340px]">
    <Panel title="Analysis Generation Failed" icon={Target}>
      <div className="rounded-3xl border border-red-200 bg-red-50 p-5 dark:border-red-900/40 dark:bg-red-900/15">
        <p className="text-lg font-semibold text-red-800 dark:text-red-200">The analysis job did not complete.</p>
        <p className="mt-2 text-sm leading-6 text-red-700 dark:text-red-300">
          {getSafeAnalysisError(analysis?.error)}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onRetry}
            disabled={regenerating || isAiLimitReached}
            className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {regenerating ? 'Retrying...' : 'Retry Analysis'}
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-900/40 dark:bg-transparent dark:text-red-300"
          >
            Refresh Status
          </button>
        </div>
        {isAiLimitReached ? (
          <p className="mt-4 text-xs font-medium text-red-600 dark:text-red-300">Daily AI credits exhausted. Resets at 12:00 AM IST.</p>
        ) : null}
      </div>
    </Panel>

    <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
      <Panel title="Failure Details" icon={Clock3}>
        <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
          <InfoRow label="Status" value={String(analysis?.status || 'failed')} />
          <InfoRow label="Stage" value={String(analysis?.processingStage || 'failed').replaceAll('_', ' ')} />
          <InfoRow label="Role" value={analysis?.jobRole?.title || 'Selected role'} />
        </div>
      </Panel>
    </div>
  </section>
)

const GapSummaryCard = ({ label, value, className }) => (
  <div className={`rounded-3xl px-6 py-8 border border-white/5 text-center transition-all hover:scale-105 duration-300 ${className}`}>
    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</p>
    <p className="text-4xl font-black tracking-tighter leading-none">{value}</p>
  </div>
);

const EmptyPanelState = ({ title, description, tone = 'neutral' }) => {
  const toneMap = {
    neutral: 'bg-white/5 border-white/5 text-neutral-300',
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
  }

  return (
    <div className={`mt-6 rounded-3xl border p-6 ${toneMap[tone] || toneMap.neutral}`}>
      <div className="flex items-start gap-4">
        <div className="mt-1 rounded-2xl bg-black/10 p-2">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-bold text-white">{title}</p>
          <p className="text-sm leading-6 text-neutral-300">{description}</p>
        </div>
      </div>
    </div>
  )
}

const SummaryMetric = ({ label, value, suffix = '', tone = 'blue' }) => {
  const toneMap = {
    emerald: 'text-emerald-300 bg-emerald-500/10',
    amber: 'text-amber-300 bg-amber-500/10',
    blue: 'text-blue-300 bg-blue-500/10',
  }

  return (
    <div className={`rounded-3xl border border-white/5 p-5 ${toneMap[tone] || toneMap.blue}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">
        {value}
        {suffix}
      </p>
    </div>
  )
}

const GapList = ({ title, items, type = 'important', emptyTitle, emptyDescription }) => {
  const isCritical = type === 'critical';
  const isImportant = type === 'important';
  const toneClass = isCritical
    ? 'bg-red-500/5 border-red-500/10 hover:border-red-500/20'
    : isImportant
      ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/20'
      : 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/20'
  const tagClass = isCritical
    ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : isImportant
      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  
  if (!items.length) {
    return (
      <div className="space-y-3">
        {title ? <h3 className="text-sm font-bold text-white">{title}</h3> : null}
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
          <p className="text-sm font-semibold text-white">{emptyTitle || 'No gaps found'}</p>
          <p className="mt-1 text-sm text-neutral-400">
            {emptyDescription || 'Nothing important is missing in this section.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title ? <h3 className="text-sm font-bold text-white">{title}</h3> : null}
      <div className="grid grid-cols-1 gap-4">
        {items.map((item, index) => (
          <motion.div 
            key={`${item?.skill || 'gap'}-${index}`} 
            whileHover={{ y: -2 }}
            className={`rounded-2xl border p-6 transition-all group ${toneClass}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white tracking-tight">{item?.skill || 'Skill Gap'}</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {item?.difficulty && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Difficulty: {item.difficulty}
                    </span>
                  )}
                  {item?.learningTime && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Time: {item.learningTime}
                    </span>
                  )}
                </div>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${tagClass}`}>
                {isCritical ? 'High Priority' : isImportant ? 'Core Skill' : 'Bonus Skill'}
              </span>
            </div>
            <p className="mt-4 text-sm font-medium leading-relaxed text-neutral-300 group-hover:text-white transition-colors">
              {item?.reason || 'This skill is still missing from your profile for this role.'}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};


const StrengthList = ({ items }) => (
  items.length ? (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.div 
          key={`${item?.skill || 'strength'}-${index}`} 
          whileHover={{ scale: 1.01 }}
          className="rounded-2xl bg-emerald-500/5 border border-emerald-500/10 p-5 flex items-start gap-4 transition-all"
        >
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 mt-0.5">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-bold text-white tracking-tight">{item?.skill || 'Professional Strength'}</p>
              {item?.proficiency && (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
                  {item.proficiency}
                </span>
              )}
            </div>
            <p className="text-sm font-medium leading-relaxed text-neutral-400">
              {item?.uniqueAdvantage || item?.relevance || 'Key advantage identified in your professional profile.'}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  ) : (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
      <p className="text-sm font-semibold text-white">No strengths listed yet</p>
      <p className="mt-1 text-sm text-neutral-400">The analysis did not return highlighted strengths for this role.</p>
    </div>
  )
);


const RecommendationList = ({ items }) => (
  items.length ? (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item}-${index}`} className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm leading-7 text-neutral-300">
          {item}
        </div>
      ))}
    </div>
  ) : (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
      <p className="text-sm font-semibold text-white">No recommendations yet</p>
      <p className="mt-1 text-sm text-neutral-400">There are no action items in this analysis right now.</p>
    </div>
  )
);

const TransferableSkillsList = ({ items }) => {
  const normalizedItems = Array.isArray(items)
    ? items
    : items?.skill
      ? [items]
      : []

  return normalizedItems.length ? (
    <div className="space-y-3">
      {normalizedItems.map((item, index) => (
        <div key={`${item?.skill || 'transferable'}-${index}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-700">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">{item?.skill || 'Transferable skill'}</p>
            {Array.isArray(item?.relatesTo) && item.relatesTo.length ? (
              <div className="flex flex-wrap gap-2">
                {item.relatesTo.slice(0, 4).map((relatedSkill, relatedIndex) => (
                  <span
                    key={`${relatedSkill}-${relatedIndex}`}
                    className="rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
                  >
                    {relatedSkill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {item?.explanation || 'This existing skill supports movement into related role requirements.'}
          </p>
        </div>
      ))}
    </div>
  ) : (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-5">
      <p className="text-sm font-semibold text-white">No transferable skills listed</p>
      <p className="mt-1 text-sm text-neutral-400">This analysis did not identify clear cross-role skills.</p>
    </div>
  )
}

const CareerInsightCard = ({ insight }) => (
  <div className="space-y-4 text-sm leading-6 text-neutral-300">
    {insight?.careerAdvice ? (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Career Advice</p>
        <p className="mt-2">{insight.careerAdvice}</p>
      </div>
    ) : null}

    {insight?.competitiveAnalysis?.comparisonNotes || insight?.competitiveAnalysis?.percentileRank ? (
      <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Competitive Insight</p>
          {typeof insight?.competitiveAnalysis?.percentileRank === 'number' ? (
            <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">
              Top {Math.max(0, 100 - insight.competitiveAnalysis.percentileRank)}%
            </span>
          ) : null}
        </div>
        <p className="mt-2">
          {insight?.competitiveAnalysis?.comparisonNotes || 'No competitive notes available yet.'}
        </p>
      </div>
    ) : null}
  </div>
)

const ApplicationReadinessCard = ({ readiness }) => {
  if (!readiness?.label) {
    return (
      <p className="text-sm text-neutral-500">
        Readiness details will appear once the analysis is complete.
      </p>
    )
  }

  const labelMap = {
    apply_now: 'Strong Match - Apply Now',
    apply_after_resume_fixes: 'Match with Resume Improvements',
    apply_after_skill_upgrade: 'Requires Skill Upgrades',
    stretch_role: 'Stretch Role',
  }

  const toneMap = {
    apply_now: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    apply_after_resume_fixes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    apply_after_skill_upgrade: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    stretch_role: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <span className={`inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-bold text-center ${toneMap[readiness.label] || 'bg-neutral-800 text-neutral-400'}`}>
          {labelMap[readiness.label] || readiness.label}
        </span>
        <div className="flex items-center justify-between px-2">
          <span className="text-sm font-semibold text-neutral-400 uppercase tracking-wider">Readiness Score</span>
          <span className="text-xl font-bold text-white">{readiness?.readinessScore || 0}%</span>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Primary Blocker</p>
        <p className="text-sm font-medium text-white p-3 rounded-xl bg-white/5 border border-white/5">
          {readiness?.mainBlocker || 'No major blockers identified.'}
        </p>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Key Actions</p>
        <p className="text-sm font-medium text-neutral-400 leading-relaxed bg-primary-500/5 p-4 rounded-xl border border-primary-500/10 italic">
          "{readiness?.nextAction || 'Regularly update your resume with recent achievements.'}"
        </p>
      </div>

      <AtsListSection
        title="Why This Readiness Was Given"
        items={Array.isArray(readiness?.topReasons) ? readiness.topReasons : []}
        emptyText="No supporting readiness reasons were returned."
      />
    </div>
  )
}


const SkillBreakdownList = ({ items }) => (
  items.length ? (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={`${item?.skillName || 'skill'}-${index}`}>
          <div className="mb-2 flex items-center justify-between text-sm text-neutral-300">
            <span>{item?.skillName || 'Skill'}</span>
            <span>{item?.currentLevel || 0}% to {item?.targetLevel || 0}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-primary-600" style={{ width: `${Math.min(100, Math.max(0, item?.currentLevel || 0))}%` }} />
          </div>
          <p className="mt-2 text-xs font-medium text-neutral-500">
            Gap: {item?.gap || 0}%
          </p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-neutral-500">No skill progression data available yet.</p>
  )
);

const MiniMeter = ({ label, value }) => (
  <div>
    <div className="flex items-center justify-between text-sm text-neutral-300">
      <span>{label}</span>
      <span className="font-medium">{value}%</span>
    </div>
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
      <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-emerald-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  </div>
);

const AtsTagSection = ({ title, items, emptyText, tone = 'blue' }) => {
  const toneClass = tone === 'red'
    ? 'border border-red-500/20 bg-red-500/10 text-red-300'
    : tone === 'emerald'
      ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      : 'border border-blue-500/20 bg-blue-500/10 text-blue-300'

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h3>
      {items.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item, index) => (
            <span
              key={`${title}-${item}-${index}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${toneClass}`}
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">{emptyText}</p>
      )}
    </div>
  )
}

const AtsListSection = ({ title, items, emptyText }) => (
  <div>
    <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{title}</h3>
    {items.length ? (
      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <div
            key={`${title}-${index}`}
            className="rounded-2xl border border-white/5 bg-white/5 p-4 text-sm leading-6 text-neutral-300"
          >
            {item}
          </div>
        ))}
      </div>
    ) : (
      <p className="mt-3 text-sm text-neutral-500">{emptyText}</p>
    )}
  </div>
)

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between rounded-2xl bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
    <span className="text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="font-medium text-neutral-900 dark:text-white">{value}</span>
  </div>
);

const getConfidenceTone = (confidence) => {
  if (confidence === 'high') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  if (confidence === 'medium') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  return 'bg-red-500/10 text-red-400 border-red-500/20'
}

const RecommendedJobsCard = ({ jobs, jobsLoading }) => {
  if (jobsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="animate-pulse rounded-2xl border border-white/5 p-6 bg-white/5">
            <div className="h-4 w-40 rounded bg-white/10" />
            <div className="mt-3 h-3 w-24 rounded bg-white/5" />
            <div className="mt-6 h-2 w-full rounded bg-white/5" />
          </div>
        ))}
      </div>
    )
  }

  if (!jobs?.length) {
    return (
      <div className="rounded-2xl p-8 text-center border border-dashed border-white/10 bg-white/5">
        <p className="text-sm font-medium text-neutral-500">
          No live job matches found for this specific analysis.
        </p>
      </div>
    )
  }

  const labelTone = {
    apply_now: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    apply_after_resume_fixes: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    apply_after_skill_upgrade: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    stretch_role: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.slice(0, 6).map((job, index) => (
          <div 
            key={job?.externalId || job?.redirectUrl || index} 
            className="rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/10 group flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white tracking-tight group-hover:text-primary-400 transition-colors truncate">
                    {job?.title || 'Open Position'}
                  </h3>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mt-1">
                    {job?.company || 'Confidential'} {job?.location ? `• ${job.location}` : ''}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${labelTone[job?.recommendationLabel] || 'bg-neutral-800 text-neutral-400 border-white/5'}`}>
                  {job?.recommendationLabel ? String(job.recommendationLabel).replaceAll('_', ' ') : 'Review'}
                </span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-bold text-white border border-white/5">
                  Match: {job?.recommendationScore || 0}%
                </span>
              </div>

              {job?.description && (
                <p className="text-xs font-medium leading-relaxed text-neutral-500 line-clamp-2">
                  {job.description}
                </p>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                {job?.salaryMin ? `₹${Math.round(job.salaryMin).toLocaleString('en-IN')}${job?.salaryMax ? '+' : ''}` : 'Competitive Salary'}
              </div>
              
              {job?.redirectUrl && (
                <a
                  href={job.redirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors uppercase tracking-widest"
                >
                  Apply 
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const ClosestRoleCard = ({ role }) => (
  <div className="space-y-5">
    <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-white">{role?.title || 'Recommended role'}</p>
          <p className="mt-1 text-sm text-neutral-400">
            {[role?.category, role?.experienceLevel].filter(Boolean).join(' • ') || 'Career path suggestion'}
          </p>
        </div>
        <span className="rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-1 text-xs font-bold text-primary-300">
          Fit {role?.fitScore || 0}%
        </span>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <InfoRow label="Winnable Score" value={`${role?.winnableScore || 0}%`} />
      <InfoRow label="Critical Gaps" value={role?.gaps?.critical || 0} />
      <InfoRow label="Important Gaps" value={role?.gaps?.important || 0} />
      <InfoRow label="Nice To Have Gaps" value={role?.gaps?.niceToHave || 0} />
    </div>

    <AtsListSection
      title="Why This Role"
      items={Array.isArray(role?.reasons) ? role.reasons : []}
      emptyText="No supporting role reasons were returned."
    />

    <AtsTagSection
      title="Critical Skills To Fix First"
      items={Array.isArray(role?.missingCriticalSkills) ? role.missingCriticalSkills : []}
      emptyText="No critical blockers were identified for this closest role."
      tone="red"
    />

    <AtsTagSection
      title="Important Skills To Add"
      items={Array.isArray(role?.missingImportantSkills) ? role.missingImportantSkills : []}
      emptyText="No additional important gaps were identified for this closest role."
    />

    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">Next Action</p>
      <p className="mt-2 text-sm leading-6 text-white">{role?.nextAction || 'No next action was returned for this role.'}</p>
    </div>
  </div>
)


export default AnalysisDetailPage;
