// we not use react use state cause it is valid state only in that component and not globally
// this file is used to manage auth state accrross different parts of our app so that frontend acts according to it
import { create } from 'zustand'
import authService from './authService.js'

const getAuthErrorMessage = (error, fallback) => {
    return (
        error?.message ||
        error?.error ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        fallback
    )
}

const useAuthStore = create((set, get) => ({

    user: null,
    isAuthenticated: false,
    isLoading: false,
    hasCheckedAuth: false,
    error: null,

    login: async (credentials) => {

        set({ isLoading: true, error: null })

        try {
            // response will be only send when everything is good
            const response = await authService.login(credentials)
            set(
                {
                    isLoading: false,
                    user: response.data.data.user,
                    error: null,
                    isAuthenticated: true
                }
            )
            return response
        } catch (error) {
            set(
                {
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: getAuthErrorMessage(error, 'Failed Login')
                }
            )
            throw error
        }
    },

    signup: async (userData) => {

        // cleaning previous error
        set({ isLoading: true, error: null })

        try {
            const resp = await authService.signup(userData)
            set(
                {
                    isLoading: false,
                    user: resp.data.data.user,
                    error: null,
                    isAuthenticated: true
                }
            )
            return resp;
        } catch (error) {
            set(
                {
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                    error: getAuthErrorMessage(error, 'Signup Failed')
                }
            )
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true, error: null })

        try {
            await authService.logout()
            set(
                {
                    isLoading: false,
                    user: null,
                    error: null,
                    isAuthenticated: false
                }
            )
        } catch (error) {
            set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        }
    },

    
   

      // Clear error
  clearError: () => set({ error: null }),
 
  // Update user profile
  updateUser: (userData) => {
    set({ user: { ...get().user, ...userData } });
  },

  // Load user from token (check if already logged in)
  loadUser: async () => {
    set({ isLoading: true });
    try {
      const response = await authService.getCurrentUser();
      // Backend returns ApiResponse: { data, message, success, statusCode } -> user is in data
      const userData = response.data?.data ?? response.data;
      set({
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      });
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        hasCheckedAuth: true,
        error: null,
      });
    }
  },
}))

export default useAuthStore;
