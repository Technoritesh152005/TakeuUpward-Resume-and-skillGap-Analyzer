/*
all function which will be performing in resume controllers
1.upload resume
2.get resume
3.get resume by id
4.delete resume
*/
import asyncHandler from '../../utils/asyncHandler.js'
import ApiError from '../../utils/apiError.js'
import userModel from '../../models/user.model.js'
import resumeModel from '../../models/resume.model.js'
import logger from '../../utils/logs.js'
import resumeParserInstance from '../../services/parser/resume.parser.js'
import redisClient from '../../config/redis.js'
import ApiResponse from '../../utils/apiResponse.js'
import resumeStructureInstance from '../../services/ai.services/analyze_resume_structure.js';

// ...

// inside reparseResume:
// clear cache based on user resume
const clearResumeUserCaches = async (userId) => {
    const keys = await redisClient.keys(`Resume:user:${userId}*`);
    if (keys.length > 0) {
        await redisClient.del(...keys);
    }
};

const clearResumeDetailCache = async (resumeId, userId) => {
    await redisClient.del(`Resume:id:${resumeId}`);
    await redisClient.del(`Resume:id:${resumeId}:user:${userId}`);
};

export const uploadResume = asyncHandler(async (req, res, next) => {

    console.log(req.file)
    if (!req.file) {
        throw new ApiError(400, 'Please upload your resume')
    }
    const { buffer, mimetype, originalname, size } = req.file

    logger.info('Processing uploading of file')
    const { parsedData, wordCount, rawText, pageCount } = await resumeParserInstance.parseResume(buffer, mimetype)
    if (!parsedData) {
        throw new ApiError(401, 'Faced difficulty to parse data from resume')
    }

    const storedFileName = `${Date.now()}-${originalname}`

    const resume = await resumeModel.create({
        user: req.user._id,
        fileName: storedFileName,
        originalFileName: originalname,
        fileUrl: `/uploads/resumes/${storedFileName}`,
        fileSize: String(size),
        mimeType: mimetype,
        storagetType: 'local',
        processingStatus: 'completed',
        rawText,
        wordCount,
        pageCount,
        parsedData: {
            ...parsedData,
        },
    })

    if (!resume) {
        throw new ApiError(401, 'Failed to upload resume')
    }

    logger.info(`Resume uploaded successfully .... for email: ${req.user.email}`)

    // once a new resume is uploaded deleted the old cache
    await clearResumeUserCaches(req.user._id)
    await clearResumeDetailCache(resume._id, req.user._id)

    res.status(200)
        .json(new ApiResponse(201, resume, 'Resume uploaded Succesfully'))
})

export const getMyResume = asyncHandler(async (req, res, next) => {

    // to get my resume u must have user
    // get all resume of user first and first verify
    // const resume = await resumeModel.find({user:req.user._id})
    // console.log(resume)
    // if(!resume || resume.length ==0){
    //     throw new ApiError(400,'No resume found')
    // }

    // res.status(200)
    // .json(201,'All resume of user fetched successfully',resume)
    // the problem in above code is that we return all resume once. there is a other method called paginate where we return data in chinks

    const { limit = 10, page = 1 } = req.query

    const cacheKey = `Resume:user:${req.user._id}:limit:${limit}:page:${page}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(201, data, 'Resume of user fetched from cache successfuly'))
    }
    const resume = await resumeModel.paginate(
        {
            user: req.user._id,
            $or: [{ isActive: true }, { isActive: { $exists: false } }]
        }, {
        page: page,
        limit,
        sort: { createdAt: -1 },
        select: '-rawText',
    }
    )

    await redisClient.setEx(cacheKey, 300, JSON.stringify(resume))
    res.status(200)
        .json(new ApiResponse(201, resume, 'resume of user fetched succesfully'))
})

export const getResumeById = asyncHandler(async (req, res, next) => {

    // get resume id first from params
    // for every resume id there will be only one resume . so no need to paginate as u will get only one resume
    // user id is given cause of security reason
    const cacheKey = `Resume:id:${req.params.id}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(201, data, 'Resume fetched successfully from cache'))
    }
    const resume = await resumeModel.findOne({ _id: req.params.id, user: req.user._id })

    if (!resume) {
        throw new ApiError(404, 'Resume not found')
    }
    if (resume.isActive === false) {
        throw new ApiError(400, 'Resume is not active... u cannot get it')
    }

    await redisClient.setEx(cacheKey, 900, JSON.stringify(resume))
    res.status(200)
        .json(new ApiResponse(201, resume, 'Resume fetched of user succesfully'))
})

// delete resume
// to delete resume u need resume id for sure cause multiple resume can be of user. so resume id is must
// also user id is required
export const deleteResume = asyncHandler(async (req, res, next) => {

    const resume = req.params.id
    const user = req.user

    const resumeData = await resumeModel.findOne({ _id: resume, user: user._id })

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
            .json(new ApiResponse(201, data, 'Resume skill of user fetched from cache'))
    }
    const resume = await resumeModel.findOne({ _id: req.params.id, user: req.user._id })

    if (!resume) {
        throw new ApiError(400, 'No resume found')
    }

    const resumeSkill = await resume.getSkillSummary()

    await redisClient.setEx(cacheKey, 300, JSON.stringify(resumeSkill))

    res.status(200)
        .json(201, 'Resume skill of user fetched succesfully', resumeSkill)
})

export const reparseResume = asyncHandler(async (req, res) => {

    const resume = await resumeModel.findOne({
        _id: req.params.id,
        user: req.user._id,
    }).select('+parsedData.rawText');

    if (!resume) {
        throw new ApiError(404, 'Resume not found');
    }

    const existingRaw = resume.parsedData?.rawText;
    if (!existingRaw) {
        throw new ApiError(400, 'Original resume text not available for re-parsing');
    }

    logger.info(`Re-parsing resume: ${resume._id}`);

    try {
        const structuredData = await resumeStructureInstance.analyzeResumeStructure(existingRaw);

        // prev means get old data
        // if the given data is in mongoose doc convert in js object plain
        const prev = resume.parsedData?.toObject?.() ?? { ...resume.parsedData };
        resume.parsedData = {
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
        };
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
