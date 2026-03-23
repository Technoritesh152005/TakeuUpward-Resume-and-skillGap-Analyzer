import {useState , useEffect} from 'react'
import {toast} from 'react-hot-toast'
import {useNavigate} from 'react-router-dom'
import {getMyResume} from '../services/resumeService'
import {compareMultipleRoles} from '../services/analysisService'

const CompareRolesPage = ()=>{
    const navigate = useNavigate();
  
  const [resumes, setResumes] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(()=>{
    fetchResumes(),
    fetchJobRoles()
  },[])

  const fetchResumes = async()=>{
    try{
       const allResumes =  await getMyResume()
       setResumes(allResumes.data.filter(r => r.processingStatus ==='completed'))

    }catch(error){
        toast.error('failed to load resume in compareRoles')
    }
  }

  const fetchJobRoles = async()=>{
    try{
        const response =await api.get('/job-roles')
        setJobRoles(response.data || [])
    }catch(error){
        toast.error('Failed to load job roles');
    }
  }
  const toggleRole = (role) => {
    if (selectedRoles.find(r => r._id === role._id)) {
      setSelectedRoles(selectedRoles.filter(r => r._id !== role._id));
    } else {
      if (selectedRoles.length >= 5) {
        toast.error('Maximum 5 roles allowed');
        return;
      }
      setSelectedRoles([...selectedRoles, role]);
    }
  };
  

  const handleCompare = async () => {
    if (!selectedResume) {
      toast.error('Please select a resume');
      return;
    }
    
    if (selectedRoles.length < 2) {
      toast.error('Select at least 2 roles to compare');
      return;
    }
    
    try {
      setComparing(true);
      const response = await compareMultipleRoles({
        resumeId: selectedResume._id,
        jobRoleIds: selectedRoles.map(r => r._id)
      });
      
      setComparisonResults(response.data);
      toast.success('Comparison completed!');
    } catch (error) {
      toast.error('Comparison failed');
    } finally {
      setComparing(false);
    }
  };
  
  const filteredRoles = jobRoles.filter(role => {
    const matchesSearch = !searchQuery || role.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || role.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });
  
  const categories = [...new Set(jobRoles.map(r => r.category))];
  
  if (resumes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No resumes available. Upload a resume first.</p>
          <button onClick={() => navigate('/upload')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Upload Resume
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Compare Job Roles</h1>
          <p className="text-gray-600">Compare multiple job roles against your resume</p>
        </div>
        
        {!comparisonResults ? (
          <>
            {/* Resume Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">1. Select Resume</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resumes.map(resume => (
                  <div key={resume._id} onClick={() => setSelectedResume(resume)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedResume?._id === resume._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}>
                    <h3 className="font-medium text-gray-900">{resume.fileName}</h3>
                    <p className="text-sm text-gray-600">{resume.parsedData?.personal?.name}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Role Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">2. Select Roles (2-5)</h2>
                <span className="text-sm text-gray-600">{selectedRoles.length} selected</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input type="text" placeholder="Search roles..."
                  value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">All Categories</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              
              {/* Selected Roles */}
              {selectedRoles.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Selected Roles:</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoles.map(role => (
                      <span key={role._id} className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm flex items-center">
                        {role.title}
                        <button onClick={() => toggleRole(role)} className="ml-2 hover:text-red-200">✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredRoles.map(role => {
                  const isSelected = selectedRoles.find(r => r._id === role._id);
                  return (
                    <div key={role._id} onClick={() => toggleRole(role)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                      }`}>
                      <h3 className="font-medium text-gray-900 mb-1">{role.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">{role.description}</p>
                      <div className="mt-2 flex gap-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{role.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="text-center">
              <button onClick={handleCompare} disabled={!selectedResume || selectedRoles.length < 2 || comparing}
                className={`px-8 py-4 rounded-xl font-semibold text-lg ${
                  selectedResume && selectedRoles.length >= 2 && !comparing
                    ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}>
                {comparing ? 'Comparing...' : 'Compare Roles'}
              </button>
            </div>
          </>
        ) : (
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Comparison Results</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {comparisonResults.comparisons?.map((comp, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">{comp.jobRole?.title}</h3>
                    
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Match Score</span>
                        <span className="text-2xl font-bold text-blue-600">{comp.matchScore}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div className="bg-blue-600 h-3 rounded-full" style={{width: `${comp.matchScore}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Readiness</span>
                        <span className="font-medium">{comp.readinessLevel}</span>
                      </div>
                      {comp.estimatedTimeToReady && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Time to Ready</span>
                          <span className="font-medium">{comp.estimatedTimeToReady.weeks} weeks</span>
                        </div>
                      )}
                    </div>
                    
                    <button onClick={() => navigate(`/analysis/${comp.analysisId}`)}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                      View Full Analysis
                    </button>
                  </div>
                ))}
              </div>
              
              {comparisonResults.recommendation && (
                <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">🎯 Recommended Path</h3>
                  <p className="text-green-800">{comparisonResults.recommendation}</p>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <button onClick={() => { setComparisonResults(null); setSelectedRoles([]); }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                Start New Comparison
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export default CompareRolesPage