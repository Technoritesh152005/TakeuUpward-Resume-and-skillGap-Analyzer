import express from 'express'
const router = express.Router()
import {getAllJobRoles,
    searchJobRoles,
    getTrendingJobRoles,
    getAllJobCategory,
    getJobRolesByCategory,
    getJobRoleFromSlug,
    getSimilarJobRoles,
    getJobRolesFromId
}
from '../controllers/jobControllers/jobControllers.js'
import {optionalAuth} from '../middleware/authMiddleware.js'
// get all job roles with filters
router.get('/',getAllJobRoles)

// search all job roles
router.get('/search',searchJobRoles)

// get trending job Roles
router.get('/trending-job-roles',getTrendingJobRoles)

// get the all job catgeories list
router.get('/categories-list',getAllJobCategory)

// get job roles by categroy
router.get('/job-from-category/:category',getJobRolesByCategory)

// get job role by slug
router.get('/slug:/slug',optionalAuth,getJobRoleFromSlug)

// to get single job role by id
router.get('/:id',optionalAuth,getJobRolesFromId)

// get similar job roles
router.get('/:id/similar-job-roles',optionalAuth,getSimilarJobRoles)

export default router
