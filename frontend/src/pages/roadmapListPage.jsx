import roadmapService from "../services/roadmapService"; 
import {useEffect , useState , useMemo} from 'react'
import {useNavigate} from 'react-router-dom'
import {toast } from 'react-hot-toast'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Map,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react'
import {format} from 'date-fns'
import DashboardLayout from "../components/layout/DashboardLayout";

const getProgressValue = (roadmap)=> roadmap?.progress?.overallPercentage || 0

const getDurationValue = (roadmap)=>{
  const weeks = roadmap?.duration?.weeks || 0;
  return weeks? `${weeks} Weeks` : 'Not - estimated'
}

const roadmapListPage = ()=>{

  const navigate = useNavigate()
  const [loading , setLoading] = useState(false)
  const [roadmap , setRoadmap] = useState([])

  useEffect(()=>{
    fetchAllRoadmap()
  },[])

  const fetchAllRoadmap = async()=>{

    try{
      setLoading(true)
      const response = await roadmapService.getMyRoadmaps(
        {
          page:1,
          limit :24,
        }
      )
      console.log(response,'Im at roadmapListPage seeing my roadmap structure')
      // pagination when used it always return docs means documents
      setRoadmap(Array.isArray(response?.docs) ? response.docs : [])
    }catch(error){
      console.error(error)
      toast.error('failed to load roadmap')
    }finally{
      setLoading(false)
    }
  }

  // now whenever some new roadmap or old roadmap has been reoved then just usememeo so that for every change in roadmap u recalculate their summary
  const summary = useMemo(()=>{

    const total = roadmap.length;
    // we not used map cause map return array and it is used to make some change
    // but reduce is used when we want op in a single value
    const completedItems = roadmap.reduce((sum,item)=> sum + (item?.progress?.completedItems || 0) ,0) 
    const totalItems = roadmap.reduce((sum,item)=> sum + (item?.progress?.totalItems || 0) ,0)
    const avgProgress = total ? Math.round(roadmap.reduce((sum, item) => sum + getProgressValue(item), 0) / total) : 0;

    return {
      total,
      completedItems,
      totalItems,
      avgProgress
    }
  },[roadmap])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.2),_transparent_34%),linear-gradient(135deg,_#0f172a,_#12263f_56%,_#0f766e)] p-6 text-white shadow-soft dark:border-neutral-700 md:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.16),_transparent_58%)] lg:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Sparkles className="h-4 w-4" />
                Learning Roadmaps
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Track every roadmap in one place</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                Review progress, jump back into weekly learning plans, and continue from the right phase without digging through analysis history.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/analysis')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
            >
              <Plus className="h-4 w-4" />
              Create From Analysis
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total Roadmaps" value={summary.total} icon={Map} />
          <SummaryCard label="Average Progress" value={`${summary.avgProgress}%`} icon={Target} />
          <SummaryCard label="Completed Items" value={summary.completedItems} icon={CheckCircle2} />
          <SummaryCard label="Tracked Items" value={summary.totalItems} icon={Clock3} />
        </section>

        <section className="space-y-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
            ))
          ) : roadmap.length > 0 ? (
            roadmap.map((roadmap) => (
              <button
                key={roadmap._id}
                type="button"
                onClick={() => navigate(`/roadmap/${roadmap._id}`)}
                className="group w-full rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-700"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                        {getDurationValue(roadmap)}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {roadmap?.createdAt ? format(new Date(roadmap.createdAt), 'dd MMM yyyy') : 'No date'}
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                      {roadmap?.title || roadmap?.analysis?.jobRole?.title || 'Learning roadmap'}
                    </h2>

                    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                      <span className="inline-flex items-center gap-2">
                        <Target className="h-4 w-4 text-neutral-400" />
                        {roadmap?.analysis?.jobRole?.title || 'Role unavailable'}
                      </span>
                      <span>{roadmap?.analysis?.jobRole?.category || 'General role'}</span>
                      <span>{roadmap?.progress?.milestones?.length || 0} milestones</span>
                    </div>

                    <p className="mt-4 line-clamp-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      {roadmap?.userPreferences?.hoursPerWeek
                        ? `Built for ${roadmap.userPreferences.hoursPerWeek} hours/week with a ${roadmap.userPreferences.budget || 'custom'} budget and ${roadmap.userPreferences.learningStyle || 'mixed'} learning style.`
                        : 'Open this roadmap to review phases, weekly learning items, portfolio projects, and certifications.'}
                    </p>
                  </div>

                  <div className="grid min-w-full grid-cols-2 gap-3 lg:min-w-[320px]">
                    <MetricCard label="Progress" value={`${getProgressValue(roadmap)}%`} />
                    <MetricCard label="Completed" value={roadmap?.progress?.completedItems || 0} />
                    <MetricCard label="Total Items" value={roadmap?.progress?.totalItems || 0} />
                    <MetricCard label="Milestones" value={roadmap?.progress?.milestones?.length || 0} />
                  </div>
                </div>

                <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-700">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary-600 to-emerald-500"
                      style={{ width: `${Math.min(100, Math.max(0, getProgressValue(roadmap)))}%` }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {roadmap?.progress?.completedItems || 0} of {roadmap?.progress?.totalItems || 0} learning items completed
                    </span>
                    <span className="inline-flex items-center gap-2 font-semibold text-primary-600 transition group-hover:translate-x-1 dark:text-primary-400">
                      View roadmap
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-700 dark:bg-neutral-800">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-700">
                <Map className="h-8 w-8 text-neutral-400" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-white">No roadmaps yet</h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Create a roadmap from a completed analysis, then come back here to track your weekly progress.
              </p>
              <button
                type="button"
                onClick={() => navigate('/analysis')}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
              >
                <Plus className="h-4 w-4" />
                Go to Analysis
              </button>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
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

const MetricCard = ({ label, value }) => (
  <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{label}</p>
    <p className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">{value}</p>
  </div>
);

export default roadmapListPage
