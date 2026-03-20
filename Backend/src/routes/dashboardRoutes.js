import express from 'express';
import { getDashboardData, getRecentActivities } from '../controllers/dashboardController/dashboardController.js'
import  {protectAccess}  from '../middleware/authMiddleware.js'

const router = express.Router();

// All dashboard routes require authentication
router.use(protectAccess);

// @route   GET /api/dashboard
// @desc    Get complete dashboard data
// @access  Private
router.get('/', getDashboardData);

// @route   GET /api/dashboard/activities
// @desc    Get recent activities only
// @access  Private
router.get('/activities', getRecentActivities);

export default router;