import asyncHandler from '../../utils/asyncHandler.js'
import ApiResponse from '../../utils/apiResponse.js'
import { ApiError } from '../../utils/apiError.js'
import analysisModel from '../../models/analysis.model.js'
import logger from '../../utils/logs.js'
import progressModel from '../../models/progress.model.js'
import roadmapModel from '../../models/roadmap.model.js'
import redisClient from '../../config/redis.js'
import { refundAiUsage } from '../../services/aiQuota.service.js'
import { enqueueRoadmapGeneration } from '../../queues/roadmap.queue.js'
import { ROADMAP_PROCESSING_STAGE, ROADMAP_STATUS } from '../../config/constant.js'
import { recordLearningItemCompletion, resetProgressTracking } from '../../services/progress.service.js'
import { clearRoadmapCache, enrichRoadmapResources, roadmapCachekey } from '../../services/roadmap/roadmapShared.service.js'

const roadmapDetailPopulate = [
    {
        path: 'analysis',
        populate: { path: 'jobRole', select: 'title category' },
    },
    {
        // Populate matched learning resources so the frontend can show more than a bare URL.
        path: 'phases.weeklyBreakdown.learningItems.resource',
        select: 'title provider url platform rating difficulty isPremium estimatedTimeToComplete resourceType',
    },
];

export const createRoadmap = asyncHandler(async (req, res) => {

    // to create roadmap first we need to check whether aalysis is there of user
    const { analysisId, preferences = {} } = req.body

    const analysis = await analysisModel
        .findOne({ _id: analysisId, user: req.user._id })
        .populate('jobRole', 'title')

    if (!analysis) {
        throw new ApiError(400, 'No analysis found only of user to create a roadmap')
    }

    if (analysis.status != 'completed') {
        throw new ApiError(400, 'Analysis has been currently not in completed status. please complete the analsys status')
    }

    const preference = {
        hoursPerWeek: preferences?.hoursPerWeek || req.user?.preferences?.hoursPerWeek || 10,
        budget: preferences?.budget || req.user?.preferences?.budget || 'free',
        learningStyle: preferences?.learningStyle || req.user?.preferences?.learningStyle || 'mixed',
    }

    // one active roadmap per analysis/user.
    // if it already exists, either reuse it or retry it if it failed.
    const existingRoadmap = await roadmapModel.findOne({
        analysis: analysis._id,
        user: req.user._id,
        isActive: true
    })

    // if an existing roadmap exist and if its status is failed we try regenerating it
    if (existingRoadmap) {
        if (existingRoadmap.status === ROADMAP_STATUS.FAILED) {
            existingRoadmap.userPreferences = preference
            existingRoadmap.status = ROADMAP_STATUS.QUEUED
            existingRoadmap.processingStage = ROADMAP_PROCESSING_STAGE.QUEUED
            existingRoadmap.error = ''
            existingRoadmap.queuedAt = new Date()
            existingRoadmap.processingStartedAt = null
            existingRoadmap.completedAt = null
            existingRoadmap.processingTime = null
            await existingRoadmap.save()
            await clearRoadmapCache(analysisId, req.user._id)

            try {
                await enqueueRoadmapGeneration({
                    roadmapId: existingRoadmap._id,
                    analysisId,
                    userId: req.user._id,
                })

                return res.status(202).json(
                    new ApiResponse(
                        202,
                        { roadmap: existingRoadmap, aiUsage: req.aiUsage },
                        'Existing failed roadmap re-queued successfully'
                    )
                )
            } catch (error) {
                if (req.aiQuotaReserved) {
                    req.aiUsage = await refundAiUsage(req.user._id)
                    req.aiQuotaReserved = false
                }

                existingRoadmap.status = ROADMAP_STATUS.FAILED
                existingRoadmap.processingStage = ROADMAP_PROCESSING_STAGE.FAILED
                existingRoadmap.error = error.message
                await existingRoadmap.save()
                await clearRoadmapCache(analysisId, req.user._id)

                throw error
            }
        }

        // if found and even the existing roadmap status is not failed we just refund it
        if (req.aiQuotaReserved) {
            req.aiUsage = await refundAiUsage(req.user._id)
            req.aiQuotaReserved = false
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                { roadmap: existingRoadmap, aiUsage: req.aiUsage },
                'Existing roadmap found'
            )
        )
    }

    logger.info(200, 'Starting roadmap generation for the analysis')

    const queuedRoadmap = await roadmapModel.create({
        user: req.user._id,
        analysis: analysisId,
        title: analysis?.jobRole?.title || 'Your Roadmap',
        userPreferences: preference,
        duration: { weeks: 0 },
        phases: [],
        quickwins: [],
        projects: [],
        certification: [],
        progress: {
            totalItems: 0,
            milestones: [],
        },
        status: ROADMAP_STATUS.QUEUED,
        processingStage: ROADMAP_PROCESSING_STAGE.QUEUED,
        queuedAt: new Date(),
    })

    await clearRoadmapCache(analysisId, req.user._id);

    try {
        await enqueueRoadmapGeneration({
            roadmapId: queuedRoadmap._id,
            analysisId,
            userId: req.user._id,
        })

        return res.status(202)
            .json(new ApiResponse(202, { roadmap: queuedRoadmap, aiUsage: req.aiUsage }, 'Roadmap queued successfully'))
    } catch (error) {
        if (req.aiQuotaReserved) {
            req.aiUsage = await refundAiUsage(req.user._id);
            req.aiQuotaReserved = false;
        }

        queuedRoadmap.error = error.message
        queuedRoadmap.status = ROADMAP_STATUS.FAILED
        queuedRoadmap.processingStage = ROADMAP_PROCESSING_STAGE.FAILED
        await queuedRoadmap.save()
        await clearRoadmapCache(analysisId, req.user._id);

        throw error
    }

})

export const getRoadmapByAnalysis = asyncHandler(async (req, res) => {

    // of one analysis there can be 1 roadmap only
    const cacheKey = roadmapCachekey(req.params.analysisId, req.user._id)

    const cachedData = await redisClient.get(cacheKey)
    if (cachedData) {
        return res.status(200)
            .json(new ApiResponse(200, JSON.parse(cachedData), 'Roadmap fetched from cache successfully'))
    }
    const roadmap = await roadmapModel.findOne(
        {
            analysis: req.params.analysisId,
            user: req.user._id
        }
    )

    if (!roadmap) {
        throw new ApiError(400, 'No roadmap found')
    }
    await redisClient.setEx(cacheKey, 300, JSON.stringify(roadmap))

    res.status(200).json(
        new ApiResponse(200, roadmap, 'Clearly got roadmap from analysis'))
})

export const getRoadmapById = asyncHandler(async (req, res) => {

    const roadmapId = req.params.id

    const roadmap = await roadmapModel.findOne({
        _id: roadmapId,
        user: req.user._id
    })
    if (!roadmap) {
        throw new ApiError(404, 'Roadmap not found');
    }

    await enrichRoadmapResources(roadmap)

    // it goes deep down to toadmap - phases - week - items - resource :id
    // “Populate replaces referenced ObjectIds with actual documents from another collection, allowing us to fetch related data in a single query.”
    const populatedRoadmap = await roadmapModel.findOne({
        _id: roadmapId,
        user: req.user._id
    }).populate(roadmapDetailPopulate)

    if (!populatedRoadmap) {
        throw new ApiError(404, 'Roadmap not found');
    }

    res.json(new ApiResponse(200, populatedRoadmap, 'Roadmap fetched successfully'));
})

export const getRoadmapStatus = asyncHandler(async (req, res) => {
    const roadmap = await roadmapModel.findOne({
        _id: req.params.id,
        user: req.user._id
        // we only transfer selected data not whole payload
    }).select('_id analysis title status processingStage error queuedAt processingStartedAt completedAt processingTime userPreferences')

    if (!roadmap) {
        throw new ApiError(404, 'Roadmap not found');
    }

    res.set('Cache-Control', 'no-store')
    res.status(200).json(
        new ApiResponse(200, roadmap, 'Roadmap status fetched successfully')
    )
})

export const retryRoadmap = asyncHandler(async (req, res) => {

    const roadmap = await roadmapModel.findOne({
        _id: req.params.id,
        user: req.user._id,
        isActive: true,
    }).select('_id analysis status processingStage error user queuedAt processingStartedAt completedAt processingTime')

    if (!roadmap) {
        throw new ApiError(404, 'Roadmap not found')
    }

    if (roadmap.status !== ROADMAP_STATUS.FAILED) {
        throw new ApiError(400, 'Only failed roadmaps can be retried')
    }

    roadmap.status = ROADMAP_STATUS.QUEUED
    roadmap.processingStage = ROADMAP_PROCESSING_STAGE.QUEUED
    roadmap.error = ''
    roadmap.queuedAt = new Date()
    roadmap.processingStartedAt = null
    roadmap.completedAt = null
    roadmap.processingTime = null
    await roadmap.save()

    // clear this roadmap from cache if added 
    await clearRoadmapCache(roadmap.analysis, req.user._id)

    try {
        // enqueu the roadmap in the queue
        await enqueueRoadmapGeneration({
            roadmapId: roadmap._id,
            analysisId: roadmap.analysis,
            userId: req.user._id
        })

        return res.status(202)
            .json(new ApiResponse(202, { roadmap, aiUsage: req.aiUsage }, 'Roadmap retry queued sucessfully'))
    } catch (error) {
        if (req.aiQuotaReserved) {
            req.aiUsage = await refundAiUsage(req.user._id)
            req.aiQuotaReserved = false
        }
        roadmap.status = ROADMAP_STATUS.FAILED
        roadmap.processingStage = ROADMAP_PROCESSING_STAGE.FAILED
        roadmap.error = error.message
        await roadmap.save()
        await clearRoadmapCache(roadmap.analysis, req.user._id)
        throw error
    }
})

export const markItemComplete = asyncHandler(async (req, res) => {
    const { phaseIndex, weekIndex, itemIndex } = req.body

    // to marks item complete we need a roadmap 
    const roadmap = await roadmapModel.findOne(
        {
            _id: req.params.id,
            user: req.user._id
        }
    )
    if (!roadmap) {
        throw new ApiError(404, 'No roadmap found')
    }

    // validate the index provided
    if (
        phaseIndex >= roadmap.phases.length ||
        weekIndex >= roadmap.phases[phaseIndex].weeklyBreakdown.length ||
        itemIndex >= roadmap.phases[phaseIndex].weeklyBreakdown[weekIndex].learningItems.length
    ) {
        throw new ApiError(400, 'Index is wrong')
    }

    // getting the item to makrk
    const item = roadmap.phases[phaseIndex].weeklyBreakdown[weekIndex].learningItems[itemIndex]

    if (item.completed) {
        const populatedRoadmap = await roadmapModel.findOne({
            _id: roadmap._id,
            user: req.user._id
        }).populate(roadmapDetailPopulate)

        console.log(populatedRoadmap)
        return res.status(200).json(
            new ApiResponse(200, populatedRoadmap || roadmap, 'Item already marked completed'))
    }

    item.completedAt = new Date()
    item.completed = true

    // update user progress
    await roadmap.save();

    await roadmap.updateProgress()
    await recordLearningItemCompletion({
        roadmap,
        userId: req.user._id,
        item,
    })
    await clearRoadmapCache(roadmap.analysis, req.user._id)

    const populatedRoadmap = await roadmapModel.findOne({
        _id: roadmap._id,
        user: req.user._id
    }).populate(roadmapDetailPopulate)

    res.status(200).json(
        new ApiResponse(200, populatedRoadmap || roadmap, 'Item Marked completed'))
})

export const resetRoadmapProgress = asyncHandler(async (req, res) => {
    const roadmap = await roadmapModel.findOne({
        _id: req.params.id,
        user: req.user._id,
    })

    if (!roadmap) {
        throw new ApiError(404, 'No roadmap found')
    }

    // amrk all the item in phases as false
    for (const phase of roadmap.phases || []) {
        for (const week of phase.weeklyBreakdown || []) {
            for (const item of week.learningItems || []) {
                item.completed = false
                item.completedAt = undefined
            }
        }
    }

    // same for projects
    for (const project of roadmap.projects || []) {
        project.completed = false
        project.completedAt = undefined
    }

    // 
    for (const item of roadmap.certification || []) {
        item.completed = false
    }

    if (roadmap?.progress?.milestones?.length) {
        roadmap.progress.milestones = roadmap.progress.milestones.map((item) => ({
            ...item.toObject(),
            completed: false,
        }))
    }

    roadmap.progress.completedItems = 0
    roadmap.progress.overallPercentage = 0
    roadmap.progress.lastUpdated = new Date()

    await roadmap.save()

    await resetProgressTracking({
        roadmap,
        userId: req.user._id,
    })

    await clearRoadmapCache(roadmap.analysis, req.user._id)

    const populatedRoadmap = await roadmapModel.findOne({
        _id: roadmap._id,
        user: req.user._id
    }).populate(roadmapDetailPopulate)

    res.status(200).json(
        new ApiResponse(200, populatedRoadmap || roadmap, 'Roadmap progress reset successfully'))
})

// any prefernce from user are updated in the roadmap
export const updatePrefernce = asyncHandler(async (req, res) => {

    // requirment from user to change preference
    const { hoursPerWeek, budget, learningStyle } = req.body

    const roadmap = await roadmapModel.findOne({
        user: req.user._id,
        _id: req.params.id
    })

    if (!roadmap) {
        throw new ApiError(404, 'No roadmap found to update user preference')
    }

    roadmap.userPreferences = roadmap.userPreferences || {}
    if (hoursPerWeek) roadmap.userPreferences.hoursPerWeek = hoursPerWeek
    if (budget) roadmap.userPreferences.budget = budget
    if (learningStyle) roadmap.userPreferences.learningStyle = learningStyle

    await roadmap.save()
    await clearRoadmapCache(roadmap.analysis, req.user._id)
    res.status(200).json(
        new ApiResponse(200, roadmap, 'User preferne updated succesfully'))
})

export const getProgressOfUser = asyncHandler(async (req, res) => {

    // here work is to return the progress of user
    // and also the progress of items completed in roadmap
    // find out the roadmap progress
    const roadmap = await roadmapModel.findOne({
        user: req.user._id,
        _id: req.params.id
    }).select('phases progress')

    if (!roadmap) {
        throw new ApiError(404, 'Failed to get roadmap')
    }

    const progress = await progressModel.findOne({
        user: req.user._id,
        roadmap: roadmap._id
    })

    res.status(200)
        .json(new ApiResponse(200,
            {
                roadmapProgress: roadmap.progress,
                userProgress: progress,
            },
            'Succesfully got progress of user'
        ))
})

// 
export const getMyRoadmaps = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    // we do populate cause we need to know for this analysis what was the target job role
    const roadmaps = await roadmapModel.find({
        user: req.user._id,
        isActive: true,
    })
        .populate({
            path: 'analysis',
            populate: { path: 'jobRole', select: 'title category' },
        })
        .select('title duration progress createdAt status processingStage userPreferences')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

    const total = await roadmapModel.countDocuments({
        user: req.user._id,
        isActive: true,
    });

    res.json(
        new ApiResponse(
            200,
            {
                roadmaps,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
            'Roadmaps fetched successfully'
        )
    );
});

export const deleteRoadmap = asyncHandler(async (req, res) => {
    const roadmap = await roadmapModel.findOne({
        _id: req.params.id,
        user: req.user._id,
        isActive: true,
    })

    if (!roadmap) {
        throw new ApiError(404, 'Roadmap not found')
    }

    roadmap.isActive = false
    await roadmap.save()
    await clearRoadmapCache(roadmap.analysis, req.user._id)

    res.status(200).json(
        new ApiResponse(200, { roadmapId: roadmap._id }, 'Roadmap deleted successfully')
    )
})

