// for every api request this a common config files which helps to communicate with backend
// - Single source of truth for API calls
// - Automatic token injection
// - Automatic token refresh
// - Error handling in one place

// axios is http js based library used to communicate every http request to backend

// every request must go to backend

import axios from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

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
    // if the status code is 201,201 then onli it will return response
    (response) => response,
    async (error) => {
        // if axios got error it attach error with original request
        console.log(error)
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {

                const refreshToken = localStorage.getItem('refreshToken')
                if (!refreshToken) {
                    throw new Error('No refresh found')
                }

                // calling refresh token givin =g it token and taking new access token
                // we not use api.post cause api has only req and resp interceptor. it would trigger only interceptor causing infinite loop

                const response = await axios.post(
                    `${API_BASE_URL}/auth/refresh-token`,
                    { refreshToken },
                    { withCredentials: true }
                )
                console.log(response)
                const accessToken = response.data.data.accessToken
                localStorage.setItem('accessToken', accessToken)

                // retry the original request
                originalRequest.headers.Authorization = `Bearer ${accessToken}`
                // ur sending a new req so axios treat it as request interceptors
                return api(originalRequest)
            } catch (error) {

                // refresh token failed - logout user
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                window.location.href = '/login'

                return Promise.reject(error)
            }
        }
        return Promise.reject(error)
    }
)



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