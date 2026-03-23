import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import resumeService from '../services/resumeService.js';
import { compareMultipleRoles, createAnalysis } from '../services/analysisService.js';
import api from '../communication/api.js';

const getResumesFromResponse = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
  return [];
};

const getJobRolesFromResponse = (response) => {
  const payload = response?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
  return [];
};

const getComparisonPayload = (response) => {
  const payload = response?.data;
  if (payload?.comparisons) return payload;
  if (payload?.data?.comparisons) return payload.data;
  return { comparisons: [] };
};

const CompareRolesPage = () => {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [comparing, setComparing] = useState(false);
  const [comparisonResults, setComparisonResults] = useState(null);
  const [creatingAnalysisForRoleId, setCreatingAnalysisForRoleId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    fetchResumes();
    fetchJobRoles();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await resumeService.getMyResume();
      const resumeList = getResumesFromResponse(response).filter(
        (resume) => resume?.isActive !== false && resume?.parsedData?.processingStatus === 'completed'
      );
      setResumes(resumeList);
    } catch {
      toast.error('Failed to load resumes');
    }
  };

  const fetchJobRoles = async () => {
    try {
      const response = await api.get('/job-roles');
      setJobRoles(getJobRolesFromResponse(response));
    } catch {
      toast.error('Failed to load job roles');
    }
  };

  const toggleRole = (role) => {
    if (selectedRoles.find((r) => r._id === role._id)) {
      setSelectedRoles(selectedRoles.filter((r) => r._id !== role._id));
      return;
    }

    if (selectedRoles.length >= 5) {
      toast.error('Maximum 5 roles allowed');
      return;
    }

    setSelectedRoles([...selectedRoles, role]);
  };

  const handleCompare = async () => {
    if (!selectedResume?._id) {
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
        jobRoleId: selectedRoles.map((role) => role._id),
      });

      const parsed = getComparisonPayload(response);
      if (!parsed.comparisons?.length) {
        throw new Error('No comparison data returned from backend');
      }

      setComparisonResults(parsed);
      toast.success('Comparison completed!');
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const handleCreateAnalysisForRole = async (jobRoleId) => {
    if (!selectedResume?._id) return;

    try {
      setCreatingAnalysisForRoleId(jobRoleId);
      const response = await createAnalysis({
        resumeId: selectedResume._id,
        jobRoleId,
      });

      const analysisId = response?.data?._id;
      if (!analysisId) throw new Error('Could not create analysis for this role');

      toast.success('Analysis created!');
      navigate(`/analysis/${analysisId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Failed to create analysis');
    } finally {
      setCreatingAnalysisForRoleId(null);
    }
  };

  const filteredRoles = jobRoles.filter((role) => {
    const matchesSearch = !searchQuery || role.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || role.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(jobRoles.map((r) => r.category).filter(Boolean))];

  if (resumes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-neutral-950">
        <div className="text-center max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-8 shadow-sm">
          <p className="text-gray-700 dark:text-gray-200 mb-4">No completed resume found. Upload a resume first.</p>
          <button
            onClick={() => navigate('/upload')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Upload Resume
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Compare Job Roles</h1>
          <p className="text-gray-600 dark:text-gray-300">Compare multiple job roles against your resume</p>
        </div>

        {!comparisonResults ? (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">1. Select Resume</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {resumes.map((resume) => (
                  <div
                    key={resume._id}
                    onClick={() => setSelectedResume(resume)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedResume?._id === resume._id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-neutral-700 hover:border-blue-300'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">{resume.originalFileName || resume.fileName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{resume.parsedData?.personal?.name || 'No name found'}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">2. Select Roles (2-5)</h2>
                <span className="text-sm text-gray-600 dark:text-gray-300">{selectedRoles.length} selected</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-gray-900 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {selectedRoles.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">Selected Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoles.map((role) => (
                      <button
                        key={role._id}
                        onClick={() => toggleRole(role)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                      >
                        {role.title} ✕
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredRoles.map((role) => {
                  const isSelected = selectedRoles.find((r) => r._id === role._id);
                  return (
                    <div
                      key={role._id}
                      onClick={() => toggleRole(role)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                          : 'border-gray-200 dark:border-neutral-700 hover:border-blue-300'
                      }`}
                    >
                      <h3 className="font-medium text-gray-900 dark:text-white mb-1">{role.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{role.description}</p>
                      <span className="mt-2 inline-block px-2 py-1 bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 text-xs rounded">
                        {role.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={handleCompare}
                disabled={!selectedResume || selectedRoles.length < 2 || comparing}
                className={`px-8 py-4 rounded-xl font-semibold text-lg ${
                  selectedResume && selectedRoles.length >= 2 && !comparing
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {comparing ? 'Comparing...' : 'Compare Roles'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Comparison Results</h2>

              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-blue-900 dark:text-blue-300">
                  Compared: {comparisonResults?.summary?.totalCompared || comparisonResults?.comparisons?.length || 0}
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-lg p-3 text-emerald-900 dark:text-emerald-300">
                  Best Fit: {comparisonResults?.bestFit?.title || 'N/A'}
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 text-purple-900 dark:text-purple-300">
                  Fastest Path: {comparisonResults?.fastestPath?.title || 'N/A'}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {comparisonResults?.comparisons?.map((comparison, idx) => {
                  const matchValue = comparison.matchPercentage ?? comparison.matchScore ?? 0;
                  const roleId = comparison?.jobRole?._id;

                  return (
                    <div key={`${roleId}-${idx}`} className="border border-gray-200 dark:border-neutral-700 rounded-lg p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{comparison.jobRole?.title}</h3>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Match Score</span>
                          <span className="text-2xl font-bold text-blue-600">{matchValue}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-3">
                          <div className="bg-blue-600 h-3 rounded-full" style={{ width: `${matchValue}%` }}></div>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-300">Readiness</span>
                          <span className="font-medium text-gray-900 dark:text-white">{comparison.readinessLevel || 'N/A'}</span>
                        </div>
                        {comparison.estimatedTimeToReady && (
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">Time to Ready</span>
                            <span className="font-medium text-gray-900 dark:text-white">{comparison.estimatedTimeToReady.weeks} weeks</span>
                          </div>
                        )}
                      </div>

                      <button
                        disabled={!roleId || creatingAnalysisForRoleId === roleId}
                        onClick={() => handleCreateAnalysisForRole(roleId)}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
                      >
                        {creatingAnalysisForRoleId === roleId ? 'Creating Analysis...' : 'Create Full Analysis'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  setComparisonResults(null);
                  setSelectedRoles([]);
                }}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Start New Comparison
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CompareRolesPage;
