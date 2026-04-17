import api from '../communication/api.js'

class AuthService {

    async signup(userData) {

        try {
            const response = await api.post('/auth/signup', userData)
            return response
        } catch (err) {
            console.log(err)
            throw err.response?.data || err
        }
    }

    async login(credentials) {

        try {
            const response = await api.post('/auth/login', credentials)
            return response
        } catch (error) {
            throw error.response?.data || error
        }
    }
    async logout(){
        try{
            await api.post('/auth/logout')
        }catch(error){
            console.error('Logout error: ',error)
        }
    }

    async getCurrentUser(){
        try{
            // there is a route as /auth/me in auth routes which calls get current user method controller
            const response = await api.get('/auth/me')
            return response
        }catch(error){
            throw error.response?.data || error
        }
    }

    async getProfile() {
        try {
            const response = await api.get('/user/profile')
            return response
        } catch (error) {
            throw error.response?.data || error
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await api.put('/user/update-profile', profileData)
            return response
        } catch (error) {
            throw error.response?.data || error
        }
    }

   async forgotPassword (email){

    try{
        const response = await api.post('/auth/forgot-password',{email})
        return response;
    }catch(error){
        throw error.message
    }
   }

   async resetPassword ({token,newPassword}){
    try{
        const response = await api.post('/auth/reset-password',{
            token,
            newPassword
        })
        return response;
    }catch(error){
        throw error.response?.data || error
    }
   }

    isAuthenticated(){
        return false
    }

    getAccessToken (){
        return null
    }

    getRefreshToken(){
        return null
    }
}

// we r passing class instance
export default new AuthService()
