/*
all function which will be performing in resume controllers
1.upload resume
2.get resume
3.get resume by id
4.delete resume
*/
import asyncHandler from '../../utils/asyncHandler.js'
import ApiError from '../../utils/apiError.js'
import resumeModel from '../../models/resume.model.js'
import logger from '../../utils/logs.js'
import resumeParserInstance, { normalizeResumeDateFields } from '../../services/parser/resume.parser.js'
import redisClient from '../../config/redis.js'
import ApiResponse from '../../utils/apiResponse.js'
import resumeStructureInstance from '../../services/ai.services/analyze_resume_structure.js';
import path from 'path'
import fs from 'fs/promises'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const resumeUploadDirectory = path.resolve(__dirname, '../../../uploads/resume')

// ...

// inside reparseResume:
// clear cache based on user resume
const clearResumeUserCaches = async (userId) => {
    const keys = await redisClient.keys(`Resume:user:${String(userId)}*`);
    if (keys.length > 0) {
        await redisClient.del(...keys);
    }
};

const clearResumeDetailCache = async (resumeId, userId) => {
    await redisClient.del(`Resume:id:${resumeId}`);
    await redisClient.del(`Resume:id:${resumeId}:user:${String(userId)}`);
};

export const uploadResume = asyncHandler(async (req, res, next) => {

    if (!req.file) {
        throw new ApiError(400, 'Please upload your resume')
    }
    const { mimetype, originalname, size, path: uploadedFilePath, filename } = req.file

    if (!uploadedFilePath || !filename) {
        throw new ApiError(500, 'Uploaded file was not persisted correctly')
    }

    let buffer

    try {
        buffer = await fs.readFile(uploadedFilePath)
    } catch (error) {
        logger.error(`Failed to read uploaded resume from disk: ${uploadedFilePath}`)
        throw new ApiError(500, 'Failed to read uploaded resume')
    }

    logger.info('Processing uploading of file')
    try {
        const quickPreview = await resumeParserInstance.quickParse(buffer, mimetype)

        if (!quickPreview || quickPreview.wordcount === 0) {
            throw new ApiError(400, 'Uploaded file has no extractable resume text')
        }

        const {
            parsedData,
            wordCount,
            rawText,
            pageCount,
            ocrText,
            ocrUsed,
            ocrStatus,
            textExtractionSource,
        } = await resumeParserInstance.parseResume(buffer, mimetype)
        if (!parsedData) {
            throw new ApiError(500, 'Faced difficulty to parse data from resume')
        }

        const resume = new resumeModel({
            user: req.user._id,
            fileName: filename,
            originalFileName: originalname,
            fileUrl: 'pending',
            fileSize: String(size),
            mimeType: mimetype,
            storageType: 'local',
            processingStatus: 'completed',
            rawText,
            ocrText,
            ocrUsed,
            ocrStatus,
            textExtractionSource,
            wordCount,
            pageCount,
            parsedData: {
                ...parsedData,
            },
        })

        resume.fileUrl = `/api/${process.env.API_VERSION || 'v1'}/resumes/${resume._id}/file`
        await resume.save()

        logger.info(`Resume uploaded successfully .... for email: ${req.user.email}`)

        // once a new resume is uploaded deleted the old cache
        await clearResumeUserCaches(req.user._id)
        await clearResumeDetailCache(resume._id, req.user._id)

        res.status(201)
            .json(new ApiResponse(201, {
                resume,
                quickPreview,
            }, 'Resume uploaded Succesfully'))
    } catch (error) {
        try {
            await fs.unlink(uploadedFilePath)
        } catch (unlinkError) {
            logger.warn(`Failed to clean up uploaded file after error: ${uploadedFilePath}`)
        }

        throw error
    }
})

export const getResumeFile = asyncHandler(async (req, res) => {
    const resume = await resumeModel.findOne({
        _id: req.params.id,
        user: req.user._id,
        isActive: true,
    }).select('fileName originalFileName mimeType storageType')

    if (!resume) {
        throw new ApiError(404, 'Resume not found')
    }

    if (resume.storageType !== 'local') {
        throw new ApiError(400, 'Only local resume files are supported')
    }

    const filePath = path.join(resumeUploadDirectory, resume.fileName)

    try {
        await fs.access(filePath)
    } catch {
        logger.warn(`Resume file missing on disk for resume ${resume._id}`)
        throw new ApiError(404, 'Resume file is not available')
    }

    res.setHeader('Content-Type', resume.mimeType || 'application/octet-stream')
    res.setHeader(
        'Content-Disposition',
        `inline; filename="${encodeURIComponent(resume.originalFileName || resume.fileName)}"`
    )

    return res.sendFile(filePath)
})

export const getMyResume = asyncHandler(async (req, res, next) => {

    // to get my resume u must have user
    // get all resume of user first and first verify
    // const resume = await resumeModel.find({user:req.user._id})
    // if(!resume || resume.length ==0){
    //     throw new ApiError(400,'No resume found')
    // }

    // res.status(200)
    // .json(201,'All resume of user fetched successfully',resume)
    // the problem in above code is that we return all resume once. there is a other method called paginate where we return data in chinks

    const { limit = 10, page = 1, sort = '-createdAt', processingStatus } = req.query

    const cacheKey = `Resume:user:${req.user._id}:limit:${limit}:page:${page}:sort:${sort}:processingStatus:${processingStatus || 'all'}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(200, data, 'Resume of user fetched from cache successfuly'))
    }
    // keep inactive resumes hidden across the list API as this powers the main resume UI
    const filter = {
        user: req.user._id,
        $or: [{ isActive: true }, { isActive: { $exists: false } }]
    }

    if (processingStatus) {
        filter.processingStatus = processingStatus
    }

    const resume = await resumeModel.paginate(
        filter, {
        page: page,
        limit,
        sort,
        select: '-rawText',
    }
    )

    await redisClient.setEx(cacheKey, 300, JSON.stringify(resume))
    res.status(200)
        .json(new ApiResponse(200, resume, 'resume of user fetched succesfully'))
})

export const getResumeById = asyncHandler(async (req, res, next) => {

    // get resume id first from params
    // for every resume id there will be only one resume . so no need to paginate as u will get only one resume
    // user id is given cause of security reason
    const cacheKey = `Resume:id:${req.params.id}:user:${String(req.user._id)}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(200, data, 'Resume fetched successfully from cache'))
    }
    const resume = await resumeModel.findOne({
        _id: req.params.id,
        user: req.user._id,
        $or: [{ isActive: true }, { isActive: { $exists: false } }]
    })

    if (!resume) {
        throw new ApiError(404, 'Resume not found')
    }
    await redisClient.setEx(cacheKey, 900, JSON.stringify(resume))
    res.status(200)
        .json(new ApiResponse(200, resume, 'Resume fetched of user succesfully'))
})

// delete resume
// to delete resume u need resume id for sure cause multiple resume can be of user. so resume id is must
// also user id is required
export const deleteResume = asyncHandler(async (req, res, next) => {

    const resume = req.params.id
    const user = req.user

    const resumeData = await resumeModel.findOne({
        _id: resume,
        user: user._id,
        $or: [{ isActive: true }, { isActive: { $exists: false } }]
    })

    if (!resumeData) {
        throw new ApiError(400, 'No resume found of user')
    }

    // soft delete
    resumeData.isActive = false;

    logger.info(`Resume deleted successfully for :${user.email}`)

    await resumeData.save()
    await clearResumeUserCaches(user._id)
    await clearResumeDetailCache(resume, user._id)
    await redisClient.del(`ResumeSkill:resume:${resume}:user:${user._id}`)

    res.status(200)
        .json(new ApiResponse(200, null, 'Resume deleted successfully'))

})

// to get resumeskill u must have access to resume
export const getResumeSkill = asyncHandler(async (req, res, next) => {


    const cacheKey = `ResumeSkill:resume:${req.params.id}:user:${req.user._id}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(200, data, 'Resume skill of user fetched from cache'))
    }
    // deleted resumes should behave as unavailable for downstream summary reads too
    const resume = await resumeModel.findOne({
        _id: req.params.id,
        user: req.user._id,
        $or: [{ isActive: true }, { isActive: { $exists: false } }]
    })

    if (!resume) {
        throw new ApiError(400, 'No resume found')
    }

    const resumeSkill = await resume.getSkillSummary()

    await redisClient.setEx(cacheKey, 300, JSON.stringify(resumeSkill))

    res.status(200)
        .json(new ApiResponse(200, resumeSkill, 'Resume skill of user fetched succesfully'))
})

export const reparseResume = asyncHandler(async (req, res) => {

    const resume = await resumeModel.findOne({
        _id: req.params.id,
        user: req.user._id,
        $or: [{ isActive: true }, { isActive: { $exists: false } }]
    }).select('+rawText');

    if (!resume) {
        throw new ApiError(404, 'Resume not found');
    }

    const existingRaw = resume.rawText;
    if (!existingRaw) {
        throw new ApiError(400, 'Original resume text not available for re-parsing');
    }

    logger.info(`Re-parsing resume: ${resume._id}`);

    try {
        const structuredData = await resumeStructureInstance.analyzeResumeStructure(existingRaw);

        // prev means get old data
        // if the given data is in mongoose doc convert in js object plain
        const prev = resume.parsedData?.toObject?.() ?? { ...resume.parsedData };
        resume.parsedData = normalizeResumeDateFields({
            // means old or new data ko spread karo as u can further pick any key
            ...prev,
            ...structuredData,
            // means old kept as it is and new added
            personal: {
                ...(prev.personal || {}),
                ...(structuredData.personal || {}),
            },
            skills: {
                ...(prev.skills || {}),
                ...(structuredData.skills || {}),
            },
            version: (prev.version ?? 1) + 1,
        });
        resume.rawText = existingRaw;
        resume.processingStatus = 'completed';

        // now as u done reparse means u dont need to have old data 
        await resume.save();
        await clearResumeDetailCache(req.params.id, req.user._id)
        await redisClient.del(`ResumeSkill:resume:${req.params.id}:user:${req.user._id}`)
        await clearResumeUserCaches(req.user._id)
        logger.info(`Resume re-parsed successfully: ${resume._id}`);


        res.json(new ApiResponse(200, resume, 'Resume re-parsed successfully'));
    } catch (error) {
        logger.error(`Re-parsing failed: ${error.message}`);
        throw new ApiError(500, 'Failed to re-parse resume');
    }
})


// cache u have of resume
// const cacheKey = `Resume:user:${req.user._id}:limit:${limit}:page:${page}`
// const cacheKey = `Resume:id:${req.params.id}`
