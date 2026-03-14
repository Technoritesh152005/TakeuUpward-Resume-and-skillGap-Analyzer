// we not use react use state cause it is valid state only in that component and not globally
// this file is used to manage auth state accrross different parts of our app so that frontend acts according to it
import { create } from 'zustand'
import authService from './authService.js'


const useAuthStore = create((set, get) => ({

    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,

    login: async (credentials) => {

        set({ isLoading: true, error: null })

        try {
            // response will be only send when everything is good
            const response = await authService.login(credentials)
            set(
                {
                    isLoading: false,
                    user: response.data.user,
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
                    error: error.message || 'Failed Login'
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
                    user: response.data,
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
                    error: error.message || 'Signup Login'
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

    // clean error if one error appeared clean it before using next service
    cleanError: () => set({ error: null }),

    // Update user profile
    updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } });
    },
}))

export default useAuthStore;