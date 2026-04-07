import {useState , useEffect , useMemo} from 'react'
import {
  ArrowRight,
  Briefcase,
  Flame,
  Layers3,
  Search,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import jobRoleService from '../services/jobRoleService.js'
import { useNavigate } from 'react-router-dom'

const experienceOptions = ['all' , 'Entry Level' , 'Junior Level' , 'Mid Level', 'Senior Level' ]

const demandTone = {
  'low': 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200',
  'medium': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  'high': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  'very-high': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const jobRolePage = ()=>{

const [loading , setLoading] = useState(false)
const navigate = useNavigate()
const [jobRoles , setJobRoles] = useState([])
const [categories , setCategories] = useState([])
const [searchTerm, setSearchTerm] = useState('')
const [selectedCategory , setSelectedCategory] = useState('all')
const [selectedExperienceLevel, setSelectedExperienceLevel] = useState('all');

useEffect(()=>{
  fetchJobRoles()
},[])

const fetchJobRoles = async ()=>{

  try{
    setLoading(true)
    // we call get jobroles catalog cause it gives better response like pages, limit and not just array
    // ike in getjobroles also we call catgeories so if need to search acc to category we need it first
   const [jobRoesResponse , jobRoleCategories] = await Promise.all([
      jobRoleService.getJobRolesCatalog({page: 1 , limit:80 , sort:'-views'}),
      jobRoleService.getJobRoleCategories()
   ])
   setJobRoles(Array.isArray(jobRoesResponse?.docs) ? jobRoesResponse.docs : [])
   setCategories(Array.isArray(jobRoleCategories) ? jobRoleCategories : [])
  }catch(error){
    console.error(error)
    toast.error('Failed to load job roles')
  }finally{
    setLoading(false)
  }
}

// what fiktered roles does is filter through every item of jobroles and check that it match with filter 
// thrn return those item where 
const filteredRoles = useMemo(()=>{

  const query = searchTerm.trim().toLowerCase()

  return jobRoles.filter((item)=>{
    // we just remove item or jobroles which dont match with the filter. in filter false means remove item
    if(selectedCategory !== 'all' && item.category !== selectedCategory){
      return false
    }

    if(selectedExperienceLevel !== 'all'  && item.experienceLevel !== selectedExperienceLevel){
      return false
    }

    // if we dont have any search query we return the already selected item
    if(!query) return true

    // if search query exist check wehteher the existed roles matches teh query
    return [
      item?.title ,
      item?.category,
      item?.experienceLevel ,
      item?.description
    ].some((value)=> String(value || '') .toLocaleLowerCase().includes(query))
  })


  // it runs when any one dep changes
},[searchTerm , jobRoles , selectedCategory, selectedExperienceLevel])

const summary = useMemo(()=>{
  return {
    total : jobRoles.length,
    categories:categories.length,
    trending:jobRoles.filter((item)=> item?.industryTrend).length,
    highDemand: jobRoles.filter((role) => ['high', 'very-high'].includes(role?.demandLevel)).length,
  }
},[jobRoles,categories])

return (

  <DashboardLayout>

<div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.2),_transparent_32%),linear-gradient(135deg,_#111827,_#0f172a_55%,_#172554)] p-6 text-white shadow-soft dark:border-neutral-700 md:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.16),_transparent_58%)] lg:block" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                <Sparkles className="h-4 w-4" />
                Career Role Explorer
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Browse target roles before you analyze yourself against them</h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80 md:text-base">
                Explore available job-role templates, compare demand and seniority, and decide which role should shape your next analysis and roadmap.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/analysis/create')}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
            >
              <Briefcase className="h-4 w-4" />
              Go to Analysis
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Roles Available" value={summary.total} icon={Briefcase} />
          <SummaryCard label="Categories" value={summary.categories} icon={Layers3} />
          <SummaryCard label="Trending Roles" value={summary.trending} icon={Flame} />
          <SummaryCard label="High Demand" value={summary.highDemand} icon={TrendingUp} />
        </section>

        <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-soft dark:border-neutral-700 dark:bg-neutral-800">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search roles by title, category, or description"
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-neutral-900 outline-none transition focus:border-primary-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item.category} value={item.category}>
                    {item.category} ({item.count || 0})
                  </option>
                ))}
              </select>

              <select
                value={selectedExperienceLevel}
                onChange={(event) => setSelectedExperienceLevel(event.target.value)}
                className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700 outline-none transition focus:border-primary-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              >
                {experienceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All levels' : option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-52 animate-pulse rounded-3xl border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800" />
            ))
          ) : filteredRoles.length > 0 ? (
            filteredRoles.map((role) => (
              <button
                key={role._id}
                type="button"
                onClick={() => navigate(`/job-roles/${role._id}`)}
                className="group w-full rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800 dark:hover:border-primary-700"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/20 dark:text-primary-300">
                        {role?.category || 'General'}
                      </span>
                      <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                        {role?.experienceLevel || 'Any level'}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${demandTone[role?.demandLevel] || demandTone.medium}`}>
                        {role?.demandLevel || 'medium'} demand
                      </span>
                    </div>

                    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                      {role?.title || 'Untitled role'}
                    </h2>

                    <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                      {role?.description || 'No description available for this role yet.'}
                    </p>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        navigate(`/analysis/create?jobRoleId=${role._id}`)
                      }}
                      className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-900/40 dark:bg-primary-900/15 dark:text-primary-300"
                    >
                      Analyze this role
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid min-w-full grid-cols-2 gap-3 lg:min-w-[280px]">
                    <MetricCard label="Views" value={role?.views || 0} />
                    <MetricCard label="Growth" value={role?.growthRate ? `${role.growthRate}%` : 'N/A'} />
                    <MetricCard label="Openings" value={role?.jobOpenings || 'N/A'} />
                    <MetricCard label="Trend" value={role?.industryTrend ? 'Trending' : 'Stable'} />
                  </div>
                </div>

                <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 transition group-hover:translate-x-1 dark:text-primary-400">
                    View role details
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center dark:border-neutral-700 dark:bg-neutral-800">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-700">
                <Briefcase className="h-8 w-8 text-neutral-400" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-white">No job roles matched your filters</h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                Try clearing the search term or switching category and experience filters.
              </p>
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

export default jobRolePage