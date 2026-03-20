// for every api request this a common config files which helps to communicate with backend
// - Single source of truth for API calls
// - Automatic token injection
// - Automatic token refresh
// - Error handling in one place

// axios is http js based library used to communicate every http request to backend

// every request must go to backend

import axios from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7000/api'

// reate axios api instance to communicate
const api = axios.create({
    // means every request will go here
    baseURL: API_BASE_URL,
    headers: {
        // send data in json form only
        'Content-Type': 'application/json'
    },
    withCredentials: true
    // “Include cookies when sending requests to the server.”
    // default it dont send bcz of cross origin request cookies so we tell them
})
// handling axios for every request
api.interceptors.request.use(
    // config has all details of the request
    (config) => {
        console.log(config)
        // before sending every req check whether token is present and sent in header
        const token = localStorage.getItem('accessToken')

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    }, (errors) => {
        return Promise.reject(errors)
        // the error goes to catch()
    }
)


// api interceptors for response

api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
  
      // Do NOT refresh on auth endpoints
      const isAuthEndpoint =
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/signup') ||
        originalRequest?.url?.includes('/auth/refresh-token');
  
      // If 401 on auth endpoints, just return the backend error
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
  
      // Only try refresh if we actually have a refresh token
      if (error.response?.status === 401 && !originalRequest._retry) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          return Promise.reject(error); // let UI show the real 401 message
        }
  
        originalRequest._retry = true;
  
        try {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
            { withCredentials: true }
          );
  
          const accessToken = response.data.data.accessToken;
          localStorage.setItem('accessToken', accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
  
      return Promise.reject(error);
    }
  );

export default api

















// Request phase:
// → Axios creates config

// Response phase:
// → If error → error.config is available
// api.interceptors.request.use(
//     (config) => {
//       return config;
//     },
//     (error) => {
//       return Promise.reject(error);
//     }
//   );