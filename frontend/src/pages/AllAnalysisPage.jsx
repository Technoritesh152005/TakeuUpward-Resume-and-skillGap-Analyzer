import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getMyAnalyses, deleteAnalysis } from '../services/analysisService.js';
import { formatDistanceToNow } from 'date-fns';

const getAnalysesFromResponse = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
  return [];
};

const AnalysisListPage = () => {
  const navigate = useNavigate();

  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      const response = await getMyAnalyses();
      setAnalyses(getAnalysesFromResponse(response));
    } catch {
      toast.error('Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this analysis?')) return;

    try {
      await deleteAnalysis(id);
      toast.success('Analysis deleted');
      fetchAnalyses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const filteredAnalyses = analyses.filter((a) => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'processing':
      case 'pending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
      case 'failed':
        return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300';
    }
  };

  const getMatchColor = (score = 0) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-blue-600 dark:text-blue-400';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const getProgressColor = (score = 0) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-neutral-950 dark:to-neutral-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Analyses</h1>
              <p className="text-gray-600 dark:text-gray-300">View all your career analyses</p>
            </div>
            <button
              onClick={() => navigate('/analysis/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              New Analysis
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'completed', 'processing', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 border border-gray-200 dark:border-neutral-700'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)} ({analyses.filter((a) => f === 'all' || a.status === f).length})
              </button>
            ))}
          </div>
        </div>

        {filteredAnalyses.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-xl border border-gray-200 dark:border-neutral-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Analyses Yet</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Start your first career analysis to get insights</p>
            <button
              onClick={() => navigate('/analysis/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Analysis
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAnalyses.map((analysis) => (
              <div
                key={analysis._id}
                className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{analysis.jobRole?.title || 'Unknown Role'}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{analysis.resume?.originalFileName || analysis.resume?.fileName || 'Resume'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(analysis.status)}`}>
                      {analysis.status || 'unknown'}
                    </span>
                  </div>

                  {analysis.status === 'completed' && (
                    <>
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Match Score</span>
                          <span className={`text-2xl font-bold ${getMatchColor(analysis.matchScore)}`}>
                            {analysis.matchScore || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${getProgressColor(analysis.matchScore)}`}
                            style={{ width: `${analysis.matchScore || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/analysis/${analysis._id}`)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => handleDelete(analysis._id)}
                      className="px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 text-sm"
                    >
                      Delete
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
};

export default AnalysisListPage;
