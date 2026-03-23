import api from '../communication/api.js'

export const createAnalysis = async (data) => {
  const response = await api.post('/analysis/create-analysis', data);
  return response.data;
};

export const compareMultipleRoles = async (data) => {
  const response = await api.post('/analysis/compare-roles', data);
  return response.data;
};

export const getMyAnalyses = async (params = {}) => {
  const response = await api.get('/analysis/all-analysis', { params });
  return response.data;
};

export const getAnalysisById = async (id) => {
  const response = await api.get(`/analysis/${id}`);
  return response.data;
};

export const regenerateAnalysis = async (id, data) => {
  const response = await api.put(`/analysis/${id}`, data);
  return response.data;
};

export const deleteAnalysis = async (id) => {
  const response = await api.delete(`/analysis/${id}`);
  return response.data;
};

export const pollAnalysisStatus = async (analysisId, maxAttempts = 60, interval = 2000) => {
  let attempts = 0;
  return new Promise((resolve, reject) => {
    const poll = setInterval(async () => {
      try {
        attempts++;
        const result = await getAnalysisById(analysisId);
        const analysis = result.data;
        if (analysis.status === 'completed') {
          clearInterval(poll);
          resolve(analysis);
        } else if (analysis.status === 'failed') {
          clearInterval(poll);
          reject(new Error(analysis.error || 'Failed'));
        } else if (attempts >= maxAttempts) {
          clearInterval(poll);
          reject(new Error('Timeout'));
        }
      } catch (error) {
        clearInterval(poll);
        reject(error);
      }
    }, interval);
  });
};

export default { createAnalysis, compareMultipleRoles, getMyAnalyses, getAnalysisById, regenerateAnalysis, deleteAnalysis, pollAnalysisStatus };