import express from 'express'
const router = express.Router()
import {protectAccess} from '../middleware/authMiddleware'
import {
    getMyProfile,
    updateProfile,
    getDashboardStats,
    getUserActivity,
    exportUserData,
    deleteAccount,
}
from '../controllers/userController/userController'
import {validateUpdateProfile} from '../validation/auth.validation'

// routes in user

// 1.get user progile
router.get('/profile',protectAccess,getMyProfile)

// 2.update user profile
router.put('/update-profile',protectAccess,validateUpdateProfile,updateProfile)

// 3.get user dashboard stats
router.get('/stats',protectAccess,getDashboardStats)

// 4.get user activity
router.get('/activity',protectAccess,getUserActivity)

// 5.update notification prefrence
router.put('/update-notifications',protectAccess,updateNotificationPreference)

// 6.export user data 
router.get('/export-data',protectAccess,exportUserData)

// 7.delete user account
router.delete('/delete-account',protectAccess,deleteAccount)

module.exports = router;