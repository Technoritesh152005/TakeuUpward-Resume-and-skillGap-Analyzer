import api from '../communication/api.js';

const extractPayload = (response) => {
  const raw = response?.data;
  if (!raw) return null;

  if (raw?.data !== undefined) return raw.data;
  if (raw?.result !== undefined) return raw.result;
  return raw;
};

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.docs)) return value.docs;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const jobRoleService = {
  getJobRoles: async ({ limit = 60, page = 1, trending = false } = {}) => {
    const safeLimit = Math.min(500, Math.max(1, Number(limit) || 60));
    const safePage = Math.max(1, Number(page) || 1);

    const loadFromEndpoint = async (endpoint) => {
      const response = await api.get(`${endpoint}?page=${safePage}&limit=${safeLimit}`);
     
      return asArray(extractPayload(response));
    };

    if (trending) {
      return loadFromEndpoint('/job-roles/trending-job-roles');
    }

    try {
      return await loadFromEndpoint('/job-roles');
    } catch (error) {
      console.warn('Falling back to trending job roles after full catalog load failed', error);
      return loadFromEndpoint('/job-roles/trending-job-roles');
    }
  },

  getJobRolesCatalog: async (query = {}) => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, value);
      }
    });

    const response = await api.get(`/job-roles${params.toString() ? `?${params.toString()}` : ''}`);
   
    const payload = extractPayload(response);
    
    return {
      raw: payload,
      docs: asArray(payload),
      pagination: payload?.docs ? payload : payload?.pagination ? payload : null,
    };
  },

  searchJobRolesCatalog: async ({ q, category, experienceLevel, limit = 20 } = {}) => {
    const params = new URLSearchParams();

    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (experienceLevel) params.set('experienceLevel', experienceLevel);
    params.set('limit', limit);

    const response = await api.get(`/job-roles/search?${params.toString()}`);
    const payload = extractPayload(response);

    return {
      raw: payload,
      docs: asArray(payload),
      pagination: payload?.docs ? payload : null,
    };
  },

  getJobRoleCategories: async () => {
    const response = await api.get('/job-roles/categories-list');
    return extractPayload(response);
  },

  getJobRoleById: async (jobRoleId) => {
    const response = await api.get(`/job-roles/${jobRoleId}`);
    
    return extractPayload(response);
  },

  getSimilarJobRoles: async (jobRoleId, { limit = 6, experienceLevel } = {}) => {
    const params = new URLSearchParams();
    params.set('limit', limit);
    if (experienceLevel) params.set('experienceLevel', experienceLevel);

    const response = await api.get(`/job-roles/${jobRoleId}/similar-job-roles?${params.toString()}`);
    return extractPayload(response);
  },
};

export default jobRoleService;
