import api from '../communication/api.js';

// it makes sure you get is always array
const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.docs)) return value.docs;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
};

// removes data 
const extractPayload = (response) => {
  const raw = response?.data;
  if (!raw) return null;

  if (raw?.data !== undefined) return raw.data;
  if (raw?.result !== undefined) return raw.result;
  return raw;
};

const analysisService = {
  // create analysis
  createAnalysis: async ({ resumeId, jobRoleId, preference }) => {
    const response = await api.post('/analysis/create-analysis', {
      resumeId,
      jobRoleId,
      ...(preference ? { preference } : {}),
    });
    console.log('im at analysis create',response)
    return extractPayload(response);
  },

  compareRoles: async ({ resumeId, jobRoleIds }) => {
    const payload = {
      resumeId,
      jobRolesId: jobRoleIds,
      jobRoleId: jobRoleIds,
    };
    const response = await api.post('/analysis/compare-roles', payload);
    return extractPayload(response);
  },

  getMyAnalyses: async (query = {}) => {

    // This helps convert object → URL query string
    const params = new URLSearchParams();
    // loops through each query and converts { page: 1, limit: 10 } to [ ["page",1], ["limit",10] ]
    Object.entries(query).forEach(([key, value]) => {
      // helps to avoid uneccesary or usely params like search =''-> rject this
      if (value !== undefined && value !== null && value !== '') {
        // builds query string ?page=1&limit=10
        params.set(key, value);
      }
    });

    const response = await api.get(`/analysis/all-analysis${params.toString() ? `?${params.toString()}` : ''}`);
    const payload = extractPayload(response);
    return {
      raw: payload,
      docs: asArray(payload),
    };
  },

  getAnalysisById: async (analysisId) => {
    const response = await api.get(`/analysis/${analysisId}`);
    return extractPayload(response);
  },

  getAnalysisStatus: async (analysisId) => {
    const response = await api.get(`/analysis/${analysisId}/status`);
    return extractPayload(response);
  },

  regenerateAnalysis: async (analysisId, preferences) => {
    const response = await api.put(`/analysis/${analysisId}`, {
      ...(preferences ? { preferences } : {}),
    });
    return extractPayload(response);
  },

  deleteAnalysis: async (analysisId) => {
    const response = await api.delete(`/analysis/${analysisId}`);
    return extractPayload(response);
  },
};

export default analysisService;
