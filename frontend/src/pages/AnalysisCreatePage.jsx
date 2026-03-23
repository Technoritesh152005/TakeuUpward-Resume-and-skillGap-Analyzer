import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import resumeService from '../services/resumeService.js';
import api from '../communication/api.js';
import { createAnalysis, getAnalysisById } from '../services/analysisService.js';

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
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.docs)) return payload.data.docs;
  return [];
};

const waitForCompletedAnalysis = async (analysisId, maxAttempts = 60, intervalMs = 2000) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts += 1;
    const result = await getAnalysisById(analysisId);
    const analysis = result?.data;

    if (analysis?.status === 'completed') return analysis;
    if (analysis?.status === 'failed') {
      throw new Error(analysis?.error || 'Analysis failed on server');
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error('Analysis is taking longer than expected. Please check Analysis List after a while.');
};

const AnalysisCreatePage = () => {
  const navigate = useNavigate();

  const [resumes, setResumes] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);
  const [selectedJobRole, setSelectedJobRole] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [loadingResumes, setLoadingResumes] = useState(true);
  const [loadingJobRoles, setLoadingJobRoles] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    fetchJobRoles();
  }, []);

  const fetchResumes = async () => {
    try {
      setLoadingResumes(true);
      const response = await resumeService.getMyResume();
      const resumesArray = getResumesFromResponse(response);

      const activeCompletedResumes = resumesArray.filter(
        (resume) => resume?.isActive !== false && resume?.parsedData?.processingStatus === 'completed'
      );

      setResumes(activeCompletedResumes);
    } catch {
      toast.error('Failed to load resumes');
    } finally {
      setLoadingResumes(false);
    }
  };

  const fetchJobRoles = async () => {
    try {
      setLoadingJobRoles(true);
      const response = await api.get('/job-roles');
      setJobRoles(getJobRolesFromResponse(response));
    } catch {
      toast.error('Failed to load job roles');
    } finally {
      setLoadingJobRoles(false);
    }
  };

  const filteredJobRoles = jobRoles.filter((role) => {
    const matchesCategory = !categoryFilter || role.category === categoryFilter;
    const matchesLevel = !experienceLevelFilter || role.experienceLevel === experienceLevelFilter;
    const matchesSearch = !searchQuery
      || role.title?.toLowerCase().includes(searchQuery.toLowerCase())
      || role.description?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesLevel && matchesSearch;
  });

  const categories = [...new Set(jobRoles.map((r) => r.category).filter(Boolean))];
  const experienceLevels = [...new Set(jobRoles.map((r) => r.experienceLevel).filter(Boolean))];

  const handleStartAnalysis = async () => {
    if (!selectedResume?._id) {
      toast.error('Please select a resume');
      return;
    }

    if (!selectedJobRole?._id) {
      toast.error('Please select a job role');
      return;
    }

    try {
      setAnalyzing(true);
      setProgress(5);

      const response = await createAnalysis({
        resumeId: selectedResume._id,
        jobRoleId: selectedJobRole._id,
      });

      const analysisId = response?.data?._id;
      if (!analysisId) {
        throw new Error('Analysis created but ID missing from response');
      }

      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev >= 90 ? prev : prev + Math.random() * 8));
      }, 1000);

      await waitForCompletedAnalysis(analysisId);

      clearInterval(progressInterval);
      setProgress(100);
      toast.success('Analysis completed!');

      setTimeout(() => {
        navigate(`/analysis/${analysisId}`);
      }, 500);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message || 'Analysis failed');
      setAnalyzing(false);
      setProgress(0);
    }
  };

  if (loadingResumes || loadingJobRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-neutral-950">
        <div className="text-center max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-2xl p-8 shadow-sm">
          <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Ready Resume Found</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">Upload a resume and wait for parsing to complete before creating analysis.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Tip: Go to Resume page and confirm status is completed.</p>
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
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Career Analysis</h1>
          <p className="text-gray-600 dark:text-gray-300">Select your resume and target job role to get personalized insights</p>
        </div>

        {analyzing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-neutral-700">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Analyzing Your Profile</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">Our AI is analyzing your skills...</p>

                <div className="w-full bg-gray-200 dark:bg-neutral-700 rounded-full h-3 mb-4">
                  <div className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{Math.round(progress)}% complete</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
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
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : 'border-gray-200 dark:border-neutral-700 hover:border-blue-300'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">{resume.originalFileName || resume.fileName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{resume.parsedData?.personal?.name || 'No name found'}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(resume.createdAt).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                Select Job Role
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search role..."
                  className="px-3 py-2 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg"
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <select
                  value={experienceLevelFilter}
                  onChange={(e) => setExperienceLevelFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white rounded-lg"
                >
                  <option value="">All levels</option>
                  {experienceLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-auto pr-1">
                {filteredJobRoles.map((role) => (
                  <div
                    key={role._id}
                    onClick={() => setSelectedJobRole(role)}
                    className={`rounded-lg border p-4 cursor-pointer transition ${
                      selectedJobRole?._id === role._id
                        ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                        : 'border-gray-200 dark:border-neutral-700 hover:border-green-300'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">{role.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">{role.description}</p>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex gap-2">
                      <span>{role.category}</span>
                      <span>•</span>
                      <span>{role.experienceLevel}</span>
                    </div>
                  </div>
                ))}
                {filteredJobRoles.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">No job roles found for selected filters.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleStartAnalysis}
            disabled={analyzing || !selectedResume || !selectedJobRole}
            className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? 'Analyzing...' : 'Start Analysis'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisCreatePage;
