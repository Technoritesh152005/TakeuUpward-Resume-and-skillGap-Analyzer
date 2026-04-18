/*
1.get all resume of user
2.get resume by id
3.get resume skill summary
4.reparse existing resume
*/

import express from 'express';
import { protectAccess } from '../middleware/authMiddleware.js';
const router = express.Router();
import { uploadResumeOnDiskMiddleware, validateBeforeUpload } from '../middleware/multerMiddleware.js'
import {
    validateGetResumeQuery,
    validateResumeBeforeUpload,
    validateResumeId
} from '../validation/resume.validation.js'
import {
    uploadResume,
    getResumeById,
    getMyResume,
    getResumeSkill,
    deleteResume,
    reparseResume,
    getResumeFile
} from '../controllers/resumeControllers/AllResumeControllers.js'

// route to upload resume
router.post(
    '/upload',
    protectAccess,
    uploadResumeOnDiskMiddleware,
    validateBeforeUpload,
    validateResumeBeforeUpload,
    uploadResume
)

// get all resume of the user
router.get('/',protectAccess,validateGetResumeQuery,getMyResume)

// get resume bt id
router.get('/:id',protectAccess, validateResumeId ,  getResumeById)

// get the uploaded resume file through an ownership-checked route
router.get('/:id/file', protectAccess, validateResumeId, getResumeFile)

// get resume skills summary
router.get('/:id/summary-skills', protectAccess, validateResumeId, getResumeSkill)

// reparse existing resume or re analyze of this resume
router.put('/:id/resume-reparse',protectAccess,validateResumeId,reparseResume )

// delete resume
router.delete('/:id',protectAccess,validateResumeId, deleteResume)

export default router
