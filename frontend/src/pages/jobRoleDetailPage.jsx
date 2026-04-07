import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Compass,
  Flame,
  Layers3,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import toast from  'react-hot-toast'
import jobRoleService from '../services/jobRoleService.js'
import DashboardLayout from '../components/layout/DashboardLayout.jsx';

const demandTone = {
  'low': 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  'medium': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'high': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'very-high': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const emptyRole = {
  title:'',
  category:'',
  experienceLevel:'',
  description:'',
  responsibilities: [],
  requiredSkills:{
    critical:[],
    important:[],
    niceToHave:[],
  },
  relatedRoles:[],
  demandLevel:'',
  views:0,
  growthRate:0,
  jobOpenings:0,
  industryTrend:false
}

const jobRoleDetailPage = ()=>{

  const [loading , setLoading] = useState(false)
  const [jobRole, setJobRoles] = useState(emptyRole)
  const navigate = useNavigate()
  const {id} = useParams()
  const [similarJobRoles, setSimilarJobRoles] = useState([])

  useEffect(()=>{
    if(id){
      fetchDetailJobRole()
    }
},[id])

const fetchDetailJobRole = async()=>{

  try{

    // tried to get jobrole by id
    setLoading(true)
    const jobRole = await jobRoleService.getJobRoleById(id)
    setJobRoles({...emptyRole , ...jobRole})

    // now also try to get the getsimilarjob service in this only
    try{
      const similar = await jobRoleService.getSimilarJobRoles(id,{
        limit : 6,
        experienceLevel: jobRole?.experienceLevel 
      })
      setSimilarJobRoles(Array.isArray(similar)? similar : similar?.docs || [] )
    }catch(error){
      console.error(error)
      toast.error('Failed to load similar job roles',error)
    }
  }catch(error){
    console.error(error)
    toast.error('Failed to laod detailed view of JobRole')
  }finally{
    setLoading(false)
  }
}

const requiredSkillSummary = useMemo(() => ({
  critical: jobRole?.requiredSkills?.critical?.length || 0,
  important: jobRole?.requiredSkills?.important?.length || 0,
  niceToHave: jobRole?.requiredSkills?.niceToHave?.length || 0,
}), [jobRole]);

return (
  <DashboardLayout>
     <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),linear-gradient(135deg,_#0f172a,_#111827_55%,_#0b3b2e)] p-6 text-white shadow-soft dark:border-neutral-700 md:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.16),_transparent_58%)] xl:block" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <button
                type="button"
                onClick={() => navigate('/job-roles')}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/15"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Job Roles
              </button>

              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Sparkles className="h-4 w-4" />
                Role Blueprint
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                {loading ? 'Loading role...' : jobRole?.title || 'Job role detail'}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/80 md:text-base">
                {jobRole?.description || 'Review the responsibilities, required skills, and market signals for this role before using it in your analysis workflow.'}
              </p>

              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
                <span className="inline-flex items-center gap-2">
                  <Layers3 className="h-4 w-4 text-white/60" />
                  {jobRole?.category || 'General category'}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-white/60" />
                  {jobRole?.experienceLevel || 'Any level'}
                </span>
                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${demandTone[jobRole?.demandLevel] || demandTone.medium}`}>
                  <Flame className="h-3.5 w-3.5" />
                  {jobRole?.demandLevel || 'medium'} demand
                </span>
              </div>

              <button
                type="button"
                onClick={() => navigate(`/analysis/create?jobRoleId=${id}`)}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-primary-300 bg-primary-500/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-500/25"
              >
                Analyze this role
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[420px]">
              <HeroStat label="Views" value={jobRole?.views || 0} />
              <HeroStat label="Growth" value={jobRole?.growthRate ? `${jobRole.growthRate}%` : 'N/A'} />
              <HeroStat label="Openings" value={jobRole?.jobOpenings || 'N/A'} />
              <HeroStat label="Trend" value={jobRole?.industryTrend ? 'Hot' : 'Stable'} />
            </div>
          </div>
        </section>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_340px]">
            <div className="h-[40rem] animate-pulse rounded-[2rem] border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
            <div className="h-[40rem] animate-pulse rounded-[2rem] border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_340px]">
            <div className="space-y-6">
              <Panel title="Responsibilities" icon={Compass}>
                {jobRole?.responsibilities?.length ? (
                  <ul className="space-y-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                    {jobRole.responsibilities.map((item, index) => (
                      <li key={`${item}-${index}`} className="rounded-2xl bg-neutral-50 p-4 dark:bg-neutral-900/60">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyText text="No responsibilities have been listed for this role yet." />
                )}
              </Panel>

              <Panel title="Required Skills" icon={Target}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <SummaryTile label="Critical" value={requiredSkillSummary.critical} tone="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" />
                  <SummaryTile label="Important" value={requiredSkillSummary.important} tone="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300" />
                  <SummaryTile label="Nice to Have" value={requiredSkillSummary.niceToHave} tone="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" />
                </div>

                <div className="mt-6 space-y-5">
                  <SkillBucket title="Critical Skills" items={jobRole?.requiredSkills?.critical || []} tone="border-red-200 dark:border-red-900/40" />
                  <SkillBucket title="Important Skills" items={jobRole?.requiredSkills?.important || []} tone="border-amber-200 dark:border-amber-900/40" />
                  <SkillBucket title="Nice-to-Have Skills" items={jobRole?.requiredSkills?.niceToHave || []} tone="border-blue-200 dark:border-blue-900/40" />
                </div>
              </Panel>
            </div>

            <div className="space-y-6">
              <Panel title="Role Snapshot" icon={TrendingUp}>
                <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
                  <InfoRow label="Category" value={jobRole?.category || 'General'} />
                  <InfoRow label="Experience Level" value={jobRole?.experienceLevel || 'Any level'} />
                  <InfoRow label="Demand Level" value={jobRole?.demandLevel || 'medium'} />
                  <InfoRow label="Industry Trend" value={jobRole?.industryTrend ? 'Trending role' : 'Stable role'} />
                  <InfoRow label="Growth Rate" value={jobRole?.growthRate ? `${jobRole.growthRate}%` : 'Not set'} />
                  <InfoRow label="Job Openings" value={jobRole?.jobOpenings || 'Not set'} />
                </div>
              </Panel>

              <Panel title="Related Roles" icon={ArrowRight}>
                {(jobRole?.relatedRoles?.length || similarJobRoles.length) ? (
                  <div className="space-y-3">
                    {[...(jobRole?.relatedRoles || []), ...similarJobRoles]
                      .filter((role, index, arr) => arr.findIndex((item) => String(item?._id) === String(role?._id)) === index)
                      .slice(0, 6)
                      .map((role) => (
                        <button
                          key={role?._id}
                          type="button"
                          onClick={() => navigate(`/job-roles/${role._id}`)}
                          className="group w-full rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left transition hover:border-primary-300 hover:bg-white dark:border-neutral-700 dark:bg-neutral-900/60 dark:hover:border-primary-700"
                        >
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                            {role?.title || 'Related role'}
                          </p>
                          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                            {role?.category || 'General'} • {role?.experienceLevel || 'Any level'}
                          </p>
                          <span className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-primary-600 transition group-hover:translate-x-1 dark:text-primary-400">
                            Open role
                            <ArrowRight className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      ))}
                  </div>
                ) : (
                  <EmptyText text="No related roles were returned for this role yet." />
                )}
              </Panel>
            </div>
          </section>
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

const HeroStat = ({ label, value }) => (
  <div className="rounded-3xl bg-white/10 px-4 py-5 backdrop-blur-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/65">{label}</p>
    <p className="mt-3 text-2xl font-bold tracking-tight text-white">{value}</p>
  </div>
);

const SummaryTile = ({ label, value, tone }) => (
  <div className={`rounded-2xl p-4 ${tone}`}>
    <p className="text-xs uppercase tracking-[0.18em]">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
);

const SkillBucket = ({ title, items, tone }) => (
  <div>
    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">{title}</h3>
    {items.length ? (
      <div className="mt-3 space-y-3">
        {items.map((item, index) => (
          <div key={`${item?.title || item?.skill || 'skill'}-${index}`} className={`rounded-2xl border bg-neutral-50 p-4 dark:bg-neutral-900/60 ${tone}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {item?.title || item?.skill || 'Skill'}
                </p>
                <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                  {item?.description || 'No description provided.'}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700 shadow-sm dark:bg-neutral-800 dark:text-neutral-200">
                Priority {item?.importance || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <EmptyText text={`No ${title.toLowerCase()} listed.`} />
    )}
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-neutral-50 px-4 py-3 dark:bg-neutral-900/60">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">{label}</span>
    <span className="text-right font-medium text-neutral-900 dark:text-white">{value}</span>
  </div>
);

const EmptyText = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-400">
    {text}
  </div>
);

export default jobRoleDetailPage;