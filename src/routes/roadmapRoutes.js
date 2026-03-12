import {protectAccess} from '../middleware/authMiddleware'
import express from 'express'
const router = express.Router()
import protectAccess from '../middleware/authMiddleware'
import {
    createRoadmap,
    getMyRoadmaps,
    getRoadmapByAnalysis,
    updateReference,
    getRoadmapById,
    getProgressOfUser,
    markItemComplete
}
from '../controllers/roadmapController'
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
router.post('/',protectAccess,createRoadmap)

// 2. get all roadmap
router.get('/',protectAccess,getMyRoadmaps)

// 3.get roadmap by analysis Id
router.get('/analysis/:analysisId',protectAccess,getRoadmapByAnalysis)

// 4.get roadmap by id
router.get('/:id',protectAccess,getRoadmapById)

// 5. get users progress on roadmap
router.get('/:id/progress',protectAccess,getProgressOfUser)

// 6. mark item complete
router.put('/:id/mark-item-complete',protectAccess,markItemComplete)

// 7.update roadmap prefernce
router.put('/:id/update-prefrenece',protectAccess,updateReference)

module.exports = router