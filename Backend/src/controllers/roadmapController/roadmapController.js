import asyncHandler from '../../utils/asyncHandler.js'
import ApiResponse from '../../utils/apiResponse.js'
import { ApiError } from '../../utils/apiError.js'
import analysisModel from '../../models/analysis.model.js'
import logger from '../../utils/logs.js'
import resourceModel from '../../models/resources.model.js'
import progressModel from '../../models/progress.model.js'
import roadmapModel from '../../models/roadmap.model.js'
import redisClient from '../../config/redis.js'
import { refundAiUsage } from '../../services/aiQuota.service.js'
import { enqueueRoadmapGeneration } from '../../queues/roadmap.queue.js'
import { ROADMAP_PROCESSING_STAGE, ROADMAP_STATUS } from '../../config/constant.js'
import { recordLearningItemCompletion, resetProgressTracking } from '../../services/progress.service.js'
import { logMissingResource } from '../../utils/missingResourceLogger.js'

const RESOURCE_TYPE_FALLBACKS = {
    course: ['course', 'tutorial', 'documentation', 'article', 'video'],
    tutorial: ['tutorial', 'documentation', 'article', 'video', 'course'],
    practice: ['practice', 'project', 'tutorial', 'course', 'video'],
    project: ['project', 'practice', 'tutorial', 'course'],
    book: ['book', 'article', 'documentation'],
}

// used to check whether the value is number or not if not then 
const extractNumber = (value, fallback = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    else if (typeof value === 'string') {
        // find the number from the string and return it using regex. it return both decimal and whole number
        const match = value.match(/\d+(\.\d+)?/)
        // converts string to number
        if (match) return Number(match[0])
    }
    return fallback
}

// we will use cache in roadmpa for only getting roadmapbyid of analysis and ofcourse of user
// String(userId) is used to ensure the cache key always contains a proper string, avoiding bugs and inconsistent keys.
const roadmapCachekey = (analysisId, userId) => {
    return `roadmap:analysis:${analysisId}:user:${String(userId)}`
}

const clearRoadmapCache = async (analysisId, userId) => {
    await redisClient.del(roadmapCachekey(analysisId, userId))
}

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

//used to get skills covered in project section and to determine whether it i sarray
const getSkillVariants = (item) => {
    // take all its skillscovered and title of project in one object
    const rawValues = [
        ...(Array.isArray(item?.skillsCovered) ? item.skillsCovered : []),
        item?.title,
    ]
        // removes null undefined or ''
        .filter(Boolean)
        // split text using , / 
        // "React, Node.js" → ["React", " Node.js"]
        // "Frontend Developer (React)" → ["Frontend Developer ", "React"]
        .flatMap((value) => String(value)
            .split(/[,/()|-]/g)
            // clean each part 
            .map((part) => part.trim())
            .filter(Boolean));

    // set removes raw value
    // Spread operator (...) is used when you want to expand or copy values
    return [...new Set(rawValues)]
}

// if resource not found from our resource data then for the sake of fallback we create a query for resource.
const buildResourceSearchLink = (item) => {
    // It is used to convert a string into a safe format for URLs.
    const query = encodeURIComponent(`${item?.title || 'learning resource'} ${item?.skillsCovered?.join(' ') || ''}`.trim())

    // if roadmap 
    if (item?.type === 'video' || item?.type === 'tutorial') {
        return `https://www.youtube.com/results?search_query=${query}`
    }

    // generate query when the type of res is documebtaion or article
    if (item?.type === 'documentation' || item?.type === 'article') {
        return `https://www.google.com/search?q=${query}`
    }

    return `https://www.google.com/search?q=${query}`
}

const isGeneratedResourceLink = (url = '') => {
    if (!url) return false

    return [
        'https://www.youtube.com/results?search_query=',
        'https://www.google.com/search?q=',
    ].some((prefix) => String(url).startsWith(prefix))
}

const scoreResourceMatch = (resource, item, skillVariants) => {
    let score = 0
    let overlapCount = 0

    if (resource?.resourceType === item?.type) score += 40
    if (Array.isArray(resource?.skillsCovered)) {
        const resourceSkills = resource.skillsCovered.map((skill) => String(skill).toLowerCase())
        overlapCount = skillVariants.filter((skill) => resourceSkills.includes(skill.toLowerCase())).length
        score += overlapCount * 20
    }

    const searchableText = `${resource?.title || ''} ${resource?.description || ''} ${resource?.provider || ''}`.toLowerCase()
    let titleOverlap = 0
    for (const variant of skillVariants) {
        if (searchableText.includes(String(variant).toLowerCase())) {
            score += 10
            titleOverlap += 1
        }
    }

    score += Math.round((resource?.rating || 0) * 5)
    score += Math.min(10, resource?.reviewcount || 0)

    return {
        score,
        overlapCount,
        titleOverlap,
        sameType: resource?.resourceType === item?.type,
    }
}

// what does it do is for every item in roadmap it try to get the best matching resource for that item type and category
const findBestResourceForItem = async (item, preference) => {
    // find the reosurce type it needs
    // if type is tutorial it dont only find tutorial but also doc article
    const typeOptions = RESOURCE_TYPE_FALLBACKS[item?.type] || [item?.type, 'tutorial', 'course']
    const skillVariants = getSkillVariants(item)
    // condition for searching
    const regexConditions = skillVariants.map((skill) => ({
        // “any one condition can be true”. this is the search qyery or condition need to search in resource
        $or: [
            { title: { $regex: escapeRegex(skill), $options: 'i' } },
            { description: { $regex: escapeRegex(skill), $options: 'i' } },
            { skillsCovered: { $regex: escapeRegex(skill), $options: 'i' } },
        ],
    }))

    const baseQuery = {
        isActive: true,
        // only take res type whose type matches
        resourceType: { $in: typeOptions.filter(Boolean) },
    }

    if (preference?.budget === 'free') {
        baseQuery.isPremium = false
    }

    // Start with skill-aware matching, then relax to broader type-only suggestions.
    // creating multiple query startegy starting from best to worst
    const candidateQueries = [
        skillVariants.length ? { ...baseQuery, $or: regexConditions.flatMap((condition) => condition.$or) } : null,
        Array.isArray(item?.skillsCovered) && item.skillsCovered.length
            ? { ...baseQuery, skillsCovered: { $in: item.skillsCovered } }
            : null,
        baseQuery,
    ].filter(Boolean)

    for (const query of candidateQueries) {
        const candidates = await resourceModel.find(query)
            .sort({ rating: -1, reviewcount: -1, popularity: -1 })
            .limit(12)

        if (!candidates.length) continue

        const bestMatch = [...candidates]
            .map((resource) => ({
                resource,
                meta: scoreResourceMatch(resource, item, skillVariants),
            }))
            .sort((a, b) => b.meta.score - a.meta.score)[0]

        if (bestMatch) {
            const hasStrongSkillSignal =
                bestMatch.meta.overlapCount > 0 ||
                bestMatch.meta.titleOverlap > 0

            const strongEnough =
                hasStrongSkillSignal &&
                (
                    bestMatch.meta.overlapCount >= 1 ||
                    (bestMatch.meta.sameType && bestMatch.meta.titleOverlap >= 1)
                ) &&
                bestMatch.meta.score >= 45

            if (strongEnough) {
                return bestMatch.resource
            }
        }
    }

    return null
}

// detailed view of resources
// we do retyr finding best resource for roadmap even when created cause old roadmap may still have roadmap data. so suppose our db is filled with new res we want them also to try our resource if not available
// if the roadmap item dont hve res and url we just try to find it and if not found we just use fallback mechanis
const enrichRoadmapResources = async (roadmap) => {
    if (!roadmap?.phases?.length) return roadmap

    let hasChanges = false

    for (const phase of roadmap.phases) {
        for (const week of phase.weeklyBreakdown || []) {
            for (const item of week.learningItems || []) {
                const hasRealUrl = item?.url && !isGeneratedResourceLink(item.url)

                // if resource exists and url is already a real link, trust the existing enrichment result
                if (item?.resource && hasRealUrl) continue

                const matchedResource = await findBestResourceForItem(item, roadmap.userPreferences || {})

                if (matchedResource && !item.resource) {
                    item.resource = matchedResource._id
                    hasChanges = true
                }

                if (matchedResource?.url && (!item.url || isGeneratedResourceLink(item.url))) {
                    item.url = matchedResource.url
                    hasChanges = true
                }

                if (matchedResource?.title && !item.title) {
                    item.title = matchedResource.title
                    hasChanges = true
                }

                if (!matchedResource && !item.url) {
                    item.url = buildResourceSearchLink(item)
                    logMissingResource({
                        item,
                        generatedUrl: item.url,
                        roadmapId: roadmap._id,
                        analysisId: roadmap.analysis,
                        userId: roadmap.user,
                        source: 'roadmap_enrichment',
                    })
                    hasChanges = true
                }
            }
        }
    }

    // if u found some new data then update the
    if (hasChanges) {
        await roadmap.save()
    }

    return roadmap
}

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

// to return an object body we wrap it with () cause {} is for fxn body
const normalizeCertification = (item) => ({

    title: item?.title || item?.name || 'Certification ',
    provider: item?.provider || 'No Provider Provided',
    cost: extractNumber(item?.cost, 0),
    duration: item?.duration || '',
    // if priorty dont match to this match this to medium
    priority: ['high', 'medium', 'low'].includes(item?.priority) ? item.priority : 'medium',
    url: item?.url || item?.credentialUrl || '',
    completed: false
})

const normalizeMilestone = (item) => ({
    title: item?.title || item?.achievement || `Week ${extractNumber(item?.week, 0)} milestone`,
    completed: false
})

// data directly tranfer here to take proper data
const normalizeRoadmapPayload = (roadmapData) => {
    const phases = Array.isArray(roadmapData?.phases)

        // suppose phase is not there so phaseindex will be 0 + 1 for 1st phase as for every element in map index starts from 0
        ? roadmapData.phases.map((phase, phaseIndex) => ({
            phaseNumber: extractNumber(phase?.phaseNumber, phaseIndex + 1),
            title: phase?.title || `Phase ${phaseIndex + 1}`,
            duration: extractNumber(phase?.duration, 0),
            // check condition       if true follow my down else : []
            objectives: Array.isArray(phase?.objectives) ? phase.objectives : [],
            weeklyBreakdown: Array.isArray(phase.weeklyBreakdown) ?
                phase.weeklyBreakdown.map((week, weekIndex) => ({
                    week: extractNumber(week?.week, weekIndex + 1),
                    focus: week?.focus || '',
                    goals: Array.isArray(week?.goals) ? week.goals : [],
                    timeCommitment: week?.timeCommitment || '',

                    learningItems: Array.isArray(week?.learningItems) ?
                        week.learningItems.map((item, itemIndex) => ({
                            type: ['course', 'book', 'tutorial', 'project', 'practice'].includes(item?.type) ? item.type : 'tutorial',
                            title: item?.title || 'Learning item',
                            description: item?.description || '',
                            url: item?.url || '',
                            estimatedHours: extractNumber(item?.estimatedHours, 0),
                            completed: false,
                            skillsCovered: Array.isArray(item?.skillsCovered) ? item.skillsCovered : [],
                            difficulty: item?.difficulty || 'beginner',

                        })) : []
                })) : []
        })) : []

    const quickwins = Array.isArray(roadmapData?.quickWins) ?
        roadmapData.quickWins.map((item) => ({

            skill: item?.skill || 'Quick Win',
            impact: item?.impact || '',
            timeEstimate: item?.timeEstimate || '',
            resources: [],
        })) : []

    const projects = Array.isArray(roadmapData?.portfolioProjects)
        ? roadmapData.portfolioProjects.map((item) => ({
            title: item?.title || 'Portfolio Project',
            description: item?.description || '',
            skillsCovered: Array.isArray(item?.skillsCovered) ? item.skillsCovered : [],
            difficulty: item?.difficulty || 'beginner',
            estimatedTime: item?.estimatedTime || '',
            guideliness: Array.isArray(item?.guideliness)
                ? item.guideliness
                : Array.isArray(item?.guidelines)
                    ? item.guidelines
                    : [],
            completed: false,
            projectUrl: item?.projectUrl || '',
        }))
        : [];

    const certification = Array.isArray(roadmapData?.recommendedCertifications)
        ? roadmapData.recommendedCertifications.map(normalizeCertification)
        : [];

    const milestones = Array.isArray(roadmapData?.milestones)
        ? roadmapData.milestones.map(normalizeMilestone)
        : [];

    return {
        duration: {
            weeks: extractNumber(roadmapData?.duration?.weeks, 0),
        },
        phases,
        projects,
        quickwins,
        milestones,
        certification,

    }
}
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

    // also check if analysis already have roadmap created
    const existingRoadmap = await roadmapModel.findOne({
        analysis: analysis._id,
        isActive: true
    })
    if (existingRoadmap) {
        throw new ApiError(400, 'Existing roadmap found of this analaysis')
    }

    const preference = {
        hoursPerWeek: preferences?.hoursPerWeek || req.user?.preferences?.hoursPerWeek || 10,
        budget: preferences?.budget || req.user?.preferences?.budget || 'free',
        learningStyle: preferences?.learningStyle || req.user?.preferences?.learningStyle || 'mixed',
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

    if (roadmap.status !== 'FAILED') {
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

    const item = roadmap.phases[phaseIndex].weeklyBreakdown[weekIndex].learningItems[itemIndex]

    if (item.completed) {
        const populatedRoadmap = await roadmapModel.findOne({
            _id: roadmap._id,
            user: req.user._id
        }).populate(roadmapDetailPopulate)

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

    for (const phase of roadmap.phases || []) {
        for (const week of phase.weeklyBreakdown || []) {
            for (const item of week.learningItems || []) {
                item.completed = false
                item.completedAt = undefined
            }
        }
    }

    for (const project of roadmap.projects || []) {
        project.completed = false
        project.completedAt = undefined
    }

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

export const updateReference = asyncHandler(async (req, res) => {

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

export const getMyRoadmaps = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

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
