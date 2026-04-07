

// routes in analysis
/*
1.create analysis
2.do compare multiple job roles compare with single resume
3.get all analysis for the user
4.get single analysis of the user by id
5.regenerate analysis with update referenece
6. delete analysis 
*/
import express from 'express'
const router = express.Router()
import { protectAccess } from '../middleware/authMiddleware.js'
import { requireAiQuota } from '../middleware/aiQuotaMiddleware.js'
import {
    createAnalysis,
    compare_Multiple_Job_Role_With_Resume_And_Get_Analysis,
    getMyAnalysis,
    getAnalysisById,
    getAnalysisStatus,
    getRecommendedJobsForAnalysis,
    regenerateAnalysis,
    deleteAnalysis


}from '../controllers/analysisController/analysisController.js'
import {
    validateCompareRoles,
    validateCreatingAnalysis,
    validateGetAnalysis,
    validateAnalysisId,
    validateRegenerateAnalysis
}
from '../validation/analysis.validation.js'

// 1. used to generate a new analysis 
router.post('/create-analysis',protectAccess,validateCreatingAnalysis,requireAiQuota('analysis generation'),createAnalysis)

// 2.compare multipe job roles with one single resume
router.post('/compare-roles',protectAccess,validateCompareRoles,compare_Multiple_Job_Role_With_Resume_And_Get_Analysis)

// 3.get analysis of the user
router.get('/all-analysis',protectAccess,validateGetAnalysis,getMyAnalysis)

// 4.get single analsysi f the resume or user
router.get('/:id/status',protectAccess,validateAnalysisId,getAnalysisStatus)

// 4b.get recommended live jobs for a completed analysis
router.get('/:id/recommended-jobs',protectAccess,validateAnalysisId,getRecommendedJobsForAnalysis)

// 4.get single analsysi f the resume or user
router.get('/:id',protectAccess,validateAnalysisId,getAnalysisById)

// 5.regenrate analysis with updated refrence
// if preference is given (optional) it will create roadmap also.else analyze is done of the resume data
router.put('/:id',protectAccess,validateAnalysisId,validateRegenerateAnalysis,requireAiQuota('analysis regeneration'),regenerateAnalysis)

// 6. delete the analysis
router.delete('/:id',protectAccess,validateAnalysisId,deleteAnalysis)

export default router
