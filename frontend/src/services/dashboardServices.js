import api from '../communication/api.js'

const dashboardService = {
  // Get complete dashboard data
  getDashboardData: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  // Get recent activity
  getRecentActivity: async (limit = 20) => {
    const response = await api.get(`/dashboard/activities?limit=${limit}`);
    return response.data;
  },
};

export default dashboardService;