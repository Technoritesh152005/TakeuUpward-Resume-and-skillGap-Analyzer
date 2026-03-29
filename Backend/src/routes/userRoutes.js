import express from 'express'
const router = express.Router()
import {protectAccess} from '../middleware/authMiddleware.js'
import {
    getMyProfile,
    updateProfile,
    getDashboardStats,
    getUserActivity,
    exportUserData,
    deleteAccount,
    updateNotificationPreference
}
from '../controllers/userController/userController.js'
import { getDashboardData } from '../controllers/dashboardController/dashboardController.js'
import {validateUpdateNotifications, validateUpdateProfile} from '../validation/auth.validation.js'

// routes in user

// 1.get user progile
router.get('/profile',protectAccess,getMyProfile)

// 2.update user profile
router.put('/update-profile',protectAccess,validateUpdateProfile,updateProfile)

// 3.get user dashboard stats
router.get('/stats',protectAccess,getDashboardStats)

// 4.get user activity
router.get('/activity',protectAccess,getUserActivity)

// 4.5 get full dashboard data (stats + skills + roadmap + activities)
router.get('/dashboard',protectAccess,getDashboardData)

// 5.update notification prefrence
router.put('/update-notifications',protectAccess,validateUpdateNotifications,updateNotificationPreference)

// 6.export user data 
router.get('/export-data',protectAccess,exportUserData)

// 7.delete user account
router.delete('/delete-account',protectAccess,deleteAccount)

export default router
