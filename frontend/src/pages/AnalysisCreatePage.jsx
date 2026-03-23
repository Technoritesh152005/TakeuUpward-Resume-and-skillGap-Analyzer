import {useState , useEffect} from 'react'
import {toast} from 'react-hot-toast'
import {useNavigate} from 'react-router-dom'
import api from '../communication/api.js'
import resumeService from '../services/resumeService.js'
import {createAnalysis , pollAnalysisStatus} from '../services/analysisService.js'

const createAnalysisPage = ()=>{

    const navigate = useNavigate()
    // states
    const [resumes , setResumes] = useState([])
    const [jobRoles , setJobRoles] = useState([])
    const [selectedResume , setSelectedResume] = useState(null)
    const [selectedJobRole, setSelectedJobRole] = useState(null);
    const [preferneces , setPreferences] = useState(
        {
            hoursPerWeek:12,
            budget:'free',
            learningStyle:'mixed'
        }
    )
    // filters
    const [categoryFilter, setCategoryFilter] = useState('');
    const [experienceLevelFilter, setExperienceLevelFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // loading states 
    const [loadingResumes , setLoadingResumes] = useState(false)
    const [loadingJobRoles , setLoadingJobRoles] = useState(false)
    const [analyzing , setAnalyzing] = useState(false)
    const [progress , setProgress] = useState(0)

    useEffect(()=>{
        fetchResumes()
    },[])

    useEffect(()=>{
        fetchJobRoles()
    })

    const fetchResumes = async()=>{

        try{
            setLoadingResumes(true)
            const response = await resumeService.getMyResume()
            // takes only completed or success resumes
            // this filters all resume and gets resume which have processingstatus
            const completedResumes = response.data.filter( r => r.processingStatus === 'completed')
            setResumes(completedResumes)
        }catch(error){
            toast.error('Failed to load resumes');
        }finally{
            setLoadingResumes(false)
        }
    }

    const fetchJobRoles = async()=>{

        try{
            setLoadingJobRoles(true)
            // later change this to method when u create jobrole get service
            const data = await api.get('/job-roles')
            setJobRoles(data.data.data || [])

        }catch(error){
            toast.error('Failed to load Job roles')
        }finally{
            setLoadingJobRoles(false)
        }
    }

    // filter all the job roles accoring to the user provides filter
    const filteredJobRoles = jobRoles.filter( job =>{
        const matchesCategory = !categoryFilter || job.category === categoryFilter
        const matchesExperienceLevel = !experienceLevelFilter || job.experienceLevel === experienceLevelFilter
        const matchesSearch =
            !searchQuery ||
            // in all the job this must include this
            job.tile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.description?.toLowerCase().includes(searchQuery.toLowerCase())

        return matchesCategory && matchesExperienceLevel && matchesSearch
    })

    // Get unique categories and experience levels
  const categories = [...new Set(jobRoles.map(r => r.category))];
  const experienceLevels = [...new Set(jobRoles.map(r => r.experienceLevel))];

  const handleAnalysis = async()=>{

    if(!selectedJobRole){
        toast.error('Job Role choose kar bhosdike')
    }
    if(!selectedResume){
        toast.error('Tu bacchha hai mera par resume toh choose karna padega')

    }

    try{
        setAnalyzing(true)
        setProgress(0)

        const response = await createAnalysis(
            {
                resumeId : selectedResume._id,
                jobRoleId: selectedJobRole._id,
                userPreference : preferneces
            }
        )
        console.log(response)
        const analysisId = response.data.analysisId

        // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 1000);

     const completedAnalysis = await pollAnalysisStatus(analysisId)

     clearInterval(progressInterval)
     setProgress(100)

     toast.success('Analysis successfully created !')

     navigate(`/analysis/${analysisId}`)
    }catch(error){
        toast.error(error.message || 'Analysis failed');
      setAnalyzing(false);
      setProgress(0);
    }
  }

//   checking ui whether u have loadingresume means show loading
if (loadingResumes || loadingJobRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

//   now check whether u dont have any resume- ui for it
if (resumes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">No Resumes Yet</h2>
          <p className="text-gray-600 mb-6">Upload a resume first to start your career analysis</p>
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Career Analysis</h1>
          <p className="text-gray-600">Select your resume and target job role to get personalized insights</p>
        </div>
        
        {/* Progress overlay */}
        {analyzing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Profile</h3>
                <p className="text-gray-600 mb-6">Our AI is analyzing your skills and creating a personalized roadmap...</p>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
                
                {/* Loading messages */}
                <div className="mt-6 space-y-2">
                  {progress < 30 && <p className="text-sm text-gray-600 animate-pulse">🔍 Analyzing your resume...</p>}
                  {progress >= 30 && progress < 60 && <p className="text-sm text-gray-600 animate-pulse">🎯 Identifying skill gaps...</p>}
                  {progress >= 60 && progress < 90 && <p className="text-sm text-gray-600 animate-pulse">📊 Calculating match score...</p>}
                  {progress >= 90 && <p className="text-sm text-gray-600 animate-pulse">🗺️ Creating learning roadmap...</p>}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Resume Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                Select Resume
              </h2>
              
              <div className="space-y-3">
                {resumes.map((resume) => (
                  <div
                    key={resume._id}
                    onClick={() => setSelectedResume(resume)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedResume?._id === resume._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{resume.fileName}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {resume.parsedData?.personal?.name || 'No name found'}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(resume.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {selectedResume?._id === resume._id && (
                        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Preferences */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Learning Preferences (Optional)</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">
                      Hours per week: {preferences.hoursPerWeek}h
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      value={preferences.hoursPerWeek}
                      onChange={(e) => setPreferences({ ...preferences, hoursPerWeek: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Budget</label>
                    <select
                      value={preferences.budget}
                      onChange={(e) => setPreferences({ ...preferences, budget: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="free">Free resources</option>
                      <option value="low">Low ($0-50)</option>
                      <option value="medium">Medium ($50-200)</option>
                      <option value="high">High ($200+)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Learning Style</label>
                    <select
                      value={preferences.learningStyle}
                      onChange={(e) => setPreferences({ ...preferences, learningStyle: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="visual">Visual (videos, diagrams)</option>
                      <option value="reading">Reading (articles, books)</option>
                      <option value="hands-on">Hands-on (projects, practice)</option>
                      <option value="mixed">Mixed approach</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right: Job Role Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                Select Target Job Role
              </h2>
              
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search job roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  value={experienceLevelFilter}
                  onChange={(e) => setExperienceLevelFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Levels</option>
                  {experienceLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              
              {/* Job Roles List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2">
                {filteredJobRoles.map((role) => (
                  <div
                    key={role._id}
                    onClick={() => setSelectedJobRole(role)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedJobRole?._id === role._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{role.title}</h3>
                      {selectedJobRole?._id === role._id && (
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{role.description}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {role.category}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {role.experienceLevel}
                      </span>
                      {role.demandLevel && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          role.demandLevel === 'very-high' ? 'bg-green-100 text-green-700' :
                          role.demandLevel === 'high' ? 'bg-emerald-100 text-emerald-700' :
                          role.demandLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {role.demandLevel} demand
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredJobRoles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">No job roles found matching your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Start Analysis Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleAnalysis}
            disabled={!selectedResume || !selectedJobRole || analyzing}
            className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all ${
              selectedResume && selectedJobRole && !analyzing
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {analyzing ? 'Analyzing...' : 'Start Career Analysis'}
          </button>
        </div>
      </div>
    </div>
  );

}
export default createAnalysisPage