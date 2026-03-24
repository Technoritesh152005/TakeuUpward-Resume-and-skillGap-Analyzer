import api from '../communication/api.js';

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.docs)) return value.docs;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
};

const extractPayload = (response) => {
  const raw = response?.data;
  if (!raw) return null;

  if (raw?.data !== undefined) return raw.data;
  if (raw?.result !== undefined) return raw.result;
  return raw;
};

const analysisService = {
  createAnalysis: async ({ resumeId, jobRoleId, preference }) => {
    const response = await api.post('/analysis/create-analysis', {
      resumeId,
      jobRoleId,
      ...(preference ? { preference } : {}),
    });
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
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
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

  getJobRoles: async ({ limit = 12 } = {}) => {
    const safeLimit = Math.min(12, Math.max(1, Number(limit) || 12));

    const response = await api.get(`/job-roles/trending-job-roles?limit=${safeLimit}`);
    const payload = extractPayload(response);

    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.docs)) return payload.docs;
    if (Array.isArray(payload?.jobRoles)) return payload.jobRoles;
    if (Array.isArray(payload?.data)) return payload.data;

    return [];
  },

};

export default analysisService;