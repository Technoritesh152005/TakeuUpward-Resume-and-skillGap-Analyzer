import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getAnalysisById, regenerateAnalysis, deleteAnalysis } from '../services/analysisService.js';

const AnalysisResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  useEffect(() => {
    fetchAnalysis();
  }, [id]);
  
  const fetchAnalysis = async () => {
    try {
      setLoading(true);
      const response = await getAnalysisById(id);
      setAnalysis(response.data);
    } catch (error) {
      toast.error('Failed to load analysis');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegenerate = async () => {
    if (!window.confirm('Regenerate this analysis?')) return;
    try {
      setRegenerating(true);
      await regenerateAnalysis(id, {});
      toast.success('Regenerated!');
      fetchAnalysis();
    } catch (error) {
      toast.error('Failed to regenerate');
    } finally {
      setRegenerating(false);
    }
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Delete this analysis?')) return;
    try {
      await deleteAnalysis(id);
      toast.success('Deleted');
      navigate('/analysis/list');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };
  
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }
  
  if (!analysis) return null;
  
  const getReadinessColor = (level) => {
    const colors = {
      'ready': 'bg-green-100 text-green-700',
      'nearly-ready': 'bg-blue-100 text-blue-700',
      'not-ready': 'bg-orange-100 text-orange-700',
      'overqualified': 'bg-purple-100 text-purple-700'
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };
  
  const totalGaps = (analysis.skillGaps?.critical?.length || 0) + (analysis.skillGaps?.important?.length || 0) + (analysis.skillGaps?.niceToHave?.length || 0);
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate('/analysis/list')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h1>
              <p className="text-gray-600">{analysis.jobRole?.title}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-medium ${getReadinessColor(analysis.readinessLevel)}`}>
                {analysis.readinessLevel?.replace('-', ' ').toUpperCase()}
              </span>
              <button onClick={handleRegenerate} disabled={regenerating} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
        
        {/* Match Score */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 mb-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-end mb-4">
                <div className="text-7xl font-bold">{analysis.matchScore}%</div>
                <div className="ml-4 mb-2">
                  <div className="text-blue-200 text-sm">Overall Match</div>
                  <div className="font-semibold">{analysis.matchScore >= 80 ? 'Excellent!' : analysis.matchScore >= 60 ? 'Good Match' : 'Needs Work'}</div>
                </div>
              </div>
              <p className="text-blue-100 mb-4">{analysis.aiSuggestion?.summary || 'Analysis completed'}</p>
              {analysis.estimatedTimeToReady && (
                <div className="inline-flex items-center bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Time to ready: {analysis.estimatedTimeToReady.weeks} weeks
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center">
              <div className="relative w-48 h-48">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.2)" strokeWidth="16" fill="none" />
                  <circle cx="96" cy="96" r="88" stroke="white" strokeWidth="16" fill="none"
                    strokeDasharray={`${(analysis.matchScore / 100) * 552.9} 552.9`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-4xl font-bold">{analysis.matchScore}%</div>
                  <div className="text-sm text-blue-200">Match</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {['overview', 'skills', 'ats', 'strengths', 'roadmap'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-sm text-red-600 font-medium mb-1">Critical</div>
                    <div className="text-2xl font-bold text-red-700">{analysis.matchBreakDown?.criticalSkills?.matched || 0}/{analysis.matchBreakDown?.criticalSkills?.total || 0}</div>
                    <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{width: `${analysis.matchBreakDown?.criticalSkills?.percentage || 0}%`}}></div>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="text-sm text-orange-600 font-medium mb-1">Important</div>
                    <div className="text-2xl font-bold text-orange-700">{analysis.matchBreakDown?.importantSkills?.matched || 0}/{analysis.matchBreakDown?.importantSkills?.total || 0}</div>
                    <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{width: `${analysis.matchBreakDown?.importantSkills?.percentage || 0}%`}}></div>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium mb-1">Nice-to-Have</div>
                    <div className="text-2xl font-bold text-green-700">{analysis.matchBreakDown?.niceToHaveSkills?.matched || 0}/{analysis.matchBreakDown?.niceToHaveSkills?.total || 0}</div>
                    <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: `${analysis.matchBreakDown?.niceToHaveSkills?.percentage || 0}%`}}></div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">📊 ATS Score</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-2">{analysis.atsScore?.overall || 0}%</div>
                    <p className="text-sm text-gray-600">Resume optimization</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">🎯 Skill Gaps</h3>
                    <div className="text-3xl font-bold text-orange-600 mb-2">{totalGaps}</div>
                    <p className="text-sm text-gray-600">Skills to learn</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'skills' && (
              <div className="space-y-6">
                {analysis.skillGaps?.critical && analysis.skillGaps.critical.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-red-600 mb-4">Critical Gaps</h3>
                    <div className="space-y-3">
                      {analysis.skillGaps.critical.map((gap, idx) => (
                        <div key={idx} className="border-l-4 border-red-500 bg-red-50 p-4 rounded-r-lg">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900">{gap.skill}</h4>
                            <span className="text-xs font-medium text-red-700 bg-red-200 px-2 py-1 rounded">Priority {gap.importance}/10</span>
                          </div>
                          <p className="text-sm text-gray-700">{gap.reason}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                            <span>⏱️ {gap.learningTime}</span>
                            <span>📊 {gap.difficulty}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.skillGaps?.important && analysis.skillGaps.important.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-orange-600 mb-4">Important Gaps</h3>
                    <div className="space-y-3">
                      {analysis.skillGaps.important.map((gap, idx) => (
                        <div key={idx} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">{gap.skill}</h4>
                          <p className="text-sm text-gray-700">{gap.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'ats' && analysis.atsScore && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl font-bold text-blue-600 mb-2">{analysis.atsScore.overall}%</div>
                  <p className="text-gray-600">ATS Score</p>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <h3 className="font-semibold mb-2">Formatting</h3>
                    <div className="text-2xl font-bold text-blue-600">{analysis.atsScore.formatting}%</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <h3 className="font-semibold mb-2">Keywords</h3>
                    <div className="text-2xl font-bold text-purple-600">{analysis.atsScore.keywords?.score}%</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <h3 className="font-semibold mb-2">Structure</h3>
                    <div className="text-2xl font-bold text-green-600">{analysis.atsScore.structure}%</div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'strengths' && analysis.candidateStrength && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analysis.candidateStrength.map((strength, idx) => (
                  <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{strength.skill}</h4>
                      <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded">{strength.proficiency}</span>
                    </div>
                    <p className="text-sm text-gray-700">{strength.relevance}</p>
                  </div>
                ))}
              </div>
            )}
            
            {activeTab === 'roadmap' && (
              <div className="text-center py-12">
                {analysis.roadmap ? (
                  <>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Learning Roadmap</h3>
                    <button onClick={() => navigate(`/roadmap/${analysis.roadmap}`)}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      View Full Roadmap →
                    </button>
                  </>
                ) : (
                  <p className="text-gray-600">No roadmap generated</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResultsPage;
