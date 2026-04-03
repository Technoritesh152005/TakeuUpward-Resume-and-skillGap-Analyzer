import api from '../communication/api.js';

const extractPayload = (response) => {
  const raw = response?.data;
  if (!raw) return null;

  if (raw?.data !== undefined) return raw.data;
  if (raw?.result !== undefined) return raw.result;
  return raw;
};

const asArray = (value, fallbackKey = 'roadmaps') => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.[fallbackKey])) return value[fallbackKey];
  return [];
};

const buildQueryString = (query = {}) => {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

const roadmapService = {
  createRoadmap: async (analysisId, preferences) => {
    const response = await api.post('/roadmap', {
      analysisId,
      ...(preferences ? { preferences } : {}),
    });

    return extractPayload(response);
  },

  getMyRoadmaps: async (query = {}) => {
    const response = await api.get(`/roadmap${buildQueryString(query)}`);
    const payload = extractPayload(response);

    return {
      raw: payload,
      docs: asArray(payload, 'roadmaps'),
      pagination: payload?.pagination || null,
    };
  },

  getRoadmapById: async (id) => {
    const response = await api.get(`/roadmap/${id}`);
    return extractPayload(response);
  },

  getRoadmapStatus: async (id) => {
    const response = await api.get(`/roadmap/${id}/status`);
    return extractPayload(response);
  },

  getRoadmapByAnalysis: async (analysisId) => {
    const response = await api.get(`/roadmap/analysis/${analysisId}`);
    return extractPayload(response);
  },
  
  getRoadmapProgress: async (roadmapId) => {
    const response = await api.get(`/roadmap/${roadmapId}/progress`);
    return extractPayload(response);
  },

  markItemComplete: async ({ roadmapId, phaseIndex, weekIndex, itemIndex }) => {
    const response = await api.put(`/roadmap/${roadmapId}/mark-item-complete`, {
      phaseIndex,
      weekIndex,
      itemIndex,
    });

    return extractPayload(response);
  },

  updatePreference: async ({ roadmapId, hoursPerWeek, budget, learningStyle }) => {
    const response = await api.put(`/roadmap/${roadmapId}/update-preference`, {
      ...(hoursPerWeek !== undefined ? { hoursPerWeek } : {}),
      ...(budget ? { budget } : {}),
      ...(learningStyle ? { learningStyle } : {}),
    });

    return extractPayload(response);
  },
};

export default roadmapService;
