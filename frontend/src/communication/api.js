// for every api request this a common config files which helps to communicate with backend
// - Single source of truth for API calls
// - Automatic token injection
// - Automatic token refresh
// - Error handling in one place

// axios is http js based library used to communicate every http request to backend

// every request must go to backend

import axios from 'axios'

const DEFAULT_API_ORIGIN = 'http://localhost:7000'
const DEFAULT_API_VERSION = 'v1'

const normalizeApiBaseUrl = (rawUrl) => {
  const sanitized = String(rawUrl || DEFAULT_API_ORIGIN).trim().replace(/\/+$/, '')

  if (/\/api\/v[^/]+$/i.test(sanitized)) {
    return sanitized
  }

  if (/\/api$/i.test(sanitized)) {
    return `${sanitized}/${DEFAULT_API_VERSION}`
  }

  return `${sanitized}/api/${DEFAULT_API_VERSION}`
}

const getApiOrigin = (baseUrl) => baseUrl.replace(/\/api\/v[^/]+$/i, '')

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
const API_ORIGIN = getApiOrigin(API_BASE_URL)

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


const isAuthEndpoint = (url = '') => {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh-token')
  )
}

// IMPORTANT:
// Backend uses 401 for both auth failures and business validation errors.
// We should refresh token ONLY when the error looks auth/token-related,
// otherwise user gets logged out while using normal features.
const isTokenRelated401 = (error) => {
  if (error?.response?.status !== 401) return false

  const message = String(
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    ''
  ).toLowerCase()

  if (!message) return false
  // So this function filters:
  // ✔ only token-related errors
  return (
    message.includes('token') ||
    message.includes('jwt') ||
    message.includes('unauthorized') ||
    message.includes('not authorized') ||
    message.includes('expired')
  )
}

// handling axios for every request
api.interceptors.request.use(
    // config has all details of the request
    (config) => {
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
      const originalRequest = error.config || {}

    // Never refresh for auth endpoints
    if (isAuthEndpoint(originalRequest?.url || '')) {
      return Promise.reject(error)
    }

    // Refresh only for token-related 401s
    if (
      isTokenRelated401(error) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        )

        return api(originalRequest)
      } catch (refreshError) {
        // logout only when refresh token itself is invalid/expired
        const refreshMessage = String(
          refreshError?.response?.data?.message ||
          refreshError?.response?.data?.error ||
          ''
        ).toLowerCase()

        if (
          refreshMessage.includes('refresh') ||
          refreshMessage.includes('token') ||
          refreshMessage.includes('expired') ||
          refreshError?.response?.status === 401
        ) {
          window.location.href = '/login'
        }

        return Promise.reject(refreshError)
      }
    }

  
      return Promise.reject(error);
    }
  );

export default api
export { API_BASE_URL, API_ORIGIN, normalizeApiBaseUrl }

















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
