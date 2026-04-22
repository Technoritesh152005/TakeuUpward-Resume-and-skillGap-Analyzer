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

// we normalize the api url
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

// every request must go here
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


// this tell wheter the endpoint points to auth certification to generate tokens
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
// Request interceptor runs every time you send a request from frontend to backend, but just before the request actually goes out.
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
    // suppose user applied for login and backend send error. so interceptor see this as an auth endpoint it does not try refresh token it return error
    // this error is then handled in authservice
    if (isAuthEndpoint(originalRequest?.url || '')) {
      return Promise.reject(error)
    }

    // Refresh only for token-related 401s
    if (
      // if the error is related token we get it and we handle refresh token
      isTokenRelated401(error) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true

      // if its related to token error we create a new refresh token
      try {
        await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          { withCredentials: true }
        )

        // then we resend the original request
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
