import {protectAccess} from '../middleware/authMiddleware.js'
import { requireAiQuota } from '../middleware/aiQuotaMiddleware.js'
import express from 'express'
const router = express.Router()

import {
    createRoadmap,
    getMyRoadmaps,
    getRoadmapByAnalysis,
    updateReference,
    getRoadmapById,
    getRoadmapStatus,
    retryRoadmap,
    getProgressOfUser,
    markItemComplete
}
from '../controllers/roadmapController/roadmapController.js'
import {
    validateRoadmapCreate,
    validateRoadmapId,
    validateRoadmapAnalysisId,
    validateMarkItemComplete,
    validateRoadmapPreferencesUpdate,
    validateRoadmapListQuery
}
from '../validation/roadmap.validation.js'
// rouets in roadmap
// 1.generate roadmap
/*
2.get all roadmap
3.get roadmap by analysis id
4.get roadmap by id
5.get users progress on roadmap
6.mark item complete
7.update roadmap preference
*/

// 1. create roadmap for user
router.post('/',protectAccess,validateRoadmapCreate,requireAiQuota('roadmap generation'),createRoadmap)

// 2. get all roadmap
router.get('/',protectAccess,validateRoadmapListQuery,getMyRoadmaps)

// 3.get roadmap by analysis Id
router.get('/analysis/:analysisId',protectAccess,validateRoadmapAnalysisId,getRoadmapByAnalysis)

// 4.get roadmap by id
router.get('/:id/status',protectAccess,validateRoadmapId,getRoadmapStatus)
router.get('/:id',protectAccess,validateRoadmapId,getRoadmapById)
router.post('/:id/retry',protectAccess,validateRoadmapId,requireAiQuota('roadmap retry'),retryRoadmap)

// 5. get users progress on roadmap
router.get('/:id/progress',protectAccess,validateRoadmapId,getProgressOfUser)

// 6. mark item complete
router.put('/:id/mark-item-complete',protectAccess,validateRoadmapId,validateMarkItemComplete,markItemComplete)

// 7.update roadmap prefernce
router.put('/:id/update-preference',protectAccess,validateRoadmapId,validateRoadmapPreferencesUpdate,updateReference)


export default router
