import {toast} from 'react-hot-toast'
import {useState , useEffect} from 'react'
import {useNavigate} from 'react-router-dom'
import {getMyAnalysis, deleteAnalysis} from '../services/analysisService'

const allAnalysisPage = ()=>{

    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [analyses, setAnalyses] = useState([])
    const [filter, setFilter] = useState('all')


    useEffect(()=>{
        fetchAllAnalysis()
    },[])
    const fetchAllAnalysis = async()=>{

        try{
            setLoading(true)
            const result = await getMyAnalysis()
            setAnalyses(result.data || [])
        }catch(error){
            toast.error('Failed to fetch ur analysis')
        }finally{
            setLoading(false)
        }
    }

    const handleDelete = async(id)=>{

       if(window.confirm('Are u sure u want to delete the analysis')){

        try{
            await deleteAnalysis(id)
            toast.success('Analysis deleted successfully')
            fetchAllAnalysis()
        }catch(error){
            toast.error('Failed to delete')
        }
       }
    }

    const filteredAnalyses = analyses.filter( a =>{
        if(filter === 'all') return true
        if(filter === 'completed') return a.status==='completed'
        if (filter === 'processing') return a.status === 'processing';
        if (filter === 'failed') return a.status === 'failed';
        return true;
    })

    
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'processing': return 'bg-blue-100 text-blue-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };
  
  const getReadinessColor = (level) => {
    switch (level) {
      case 'ready': return 'text-green-600';
      case 'nearly-ready': return 'text-blue-600';
      case 'not-ready': return 'text-orange-600';
      case 'overqualified': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Analyses</h1>
              <p className="text-gray-600">View all your career analyses</p>
            </div>
            <button onClick={() => navigate('/analysis/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              New Analysis
            </button>
          </div>
          
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'completed', 'processing', 'failed'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}>
                {f.charAt(0).toUpperCase() + f.slice(1)} ({analyses.filter(a => f === 'all' || a.status === f).length})
              </button>
            ))}
          </div>
        </div>
        
        {filteredAnalyses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Analyses Yet</h2>
            <p className="text-gray-600 mb-6">Start your first career analysis to get insights</p>
            <button onClick={() => navigate('/analysis/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Create Analysis
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnalyses.map(analysis => (
              <div key={analysis._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{analysis.jobRole?.title || 'Unknown Role'}</h3>
                      <p className="text-sm text-gray-600">{analysis.resume?.fileName || 'Resume'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analysis.status)}`}>
                      {analysis.status}
                    </span>
                  </div>
                  
                  {analysis.status === 'completed' && (
                    <>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Match Score</span>
                          <span className={`text-2xl font-bold ${
                            analysis.matchScore >= 80 ? 'text-green-600' :
                            analysis.matchScore >= 60 ? 'text-blue-600' :
                            analysis.matchScore >= 40 ? 'text-orange-600' :
                            'text-red-600'
                          }`}>{analysis.matchScore}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`h-2 rounded-full ${
                            analysis.matchScore >= 80 ? 'bg-green-600' :
                            analysis.matchScore >= 60 ? 'bg-blue-600' :
                            analysis.matchScore >= 40 ? 'bg-orange-600' :
                            'bg-red-600'
                          }`} style={{width: `${analysis.matchScore}%`}}></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm mb-4">
                        <span className="text-gray-600">Readiness</span>
                        <span className={`font-medium ${getReadinessColor(analysis.readinessLevel)}`}>
                          {analysis.readinessLevel?.replace('-', ' ').toUpperCase()}
                        </span>
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center text-xs text-gray-500 mb-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={() => navigate(`/analysis/${analysis._id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                      View Details
                    </button>
                    <button onClick={() => handleDelete(analysis._id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default allAnalysisPage