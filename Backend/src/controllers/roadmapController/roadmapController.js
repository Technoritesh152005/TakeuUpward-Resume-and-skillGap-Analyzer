import asyncHandler from '../../utils/asyncHandler.js'
import ApiResponse from '../../utils/apiResponse.js'
import { ApiError } from '../../utils/apiError.js'
import analysisModel from '../../models/analysis.model.js'
import performRoadmapInstance from '../../services/ai.services/roadmap_planner.js'
import logger from '../../utils/logs.js'
import resourceModel from '../../models/resources.model.js'
import progressModel from '../../models/progress.model.js'
import roadmapModel from '../../models/roadmap.model.js'
import redisClient from '../../config/redis.js'

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

const normalizeMileStone = (item) => ({
    title: item?.title || item?.achievement || `Week ${extractNumber(item?.week, 0)} milestone`,
    completed: false
})

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
            duration : {
                weeks : extractNumber(roadmapData?.duration?.weeks , 0),
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

    logger.info(200, 'Starting roadmap generation for the analysis')
    // now create a roadmap by using claude service.
    // u need to provide preference and analysis data

    const analysisData = {
        skillGaps: analysis.skillGaps,
        strengths: analysis.candidateStrength,
        transferskills: analysis.transferrableSkills
    }
    const preference = {
        hoursPerWeek: preferences?.hoursPerWeek || req.user?.preferences?.hoursPerWeek || 10,
        budget: preferences?.budget || req.user?.preferences?.budget || 'free',
        learningStyle: preferences?.learningStyle || req.user?.preferences?.learningStyle || 'mixed',
    }
    const roadmapData = await performRoadmapInstance.performRoadmap(analysisData, preference)

    if (!roadmapData) {
        throw new ApiError(400, 'Failed to generate roadmap for the analysis')
    }

    const normalizedRoadmap = normalizeRoadmapPayload(roadmapData)

    // now as u got roamdpa data it will give u plan but u need to find the best learning resource for it
    // it will have multiple phases and multiple week and have multiple learning items.
    // each learning item u need to provide resource from your resources model

    for (const phase of normalizedRoadmap.phases) {
        for (const week of phase.weeklyBreakdown) {
            for (const item of week.learningItems) {
                const query = {
                    resourceType: item.type,
                    isActive: true
                };

                if (Array.isArray(item.skillsCovered) && item.skillsCovered.length > 0) {
                    query.skillsCovered = { $in: item.skillsCovered };
                }

                if (preference.budget === 'free') {
                    query.isPremium = false;
                }

                // get the resource based on resource type and user eference
                const learningResource = await resourceModel.find(query)
                    .sort({ rating: -1, reviewcount: -1 })
                    .limit(1);

                if (learningResource.length > 0) {
                    item.resource = learningResource[0]._id;
                    item.url = learningResource[0].url || item.url;
                    item.title = learningResource[0].title || item.title;
                }
            }
        }
    }
    // now u got roadmap data and also provided resource to itso start to save it

    const roadmap = await roadmapModel.create(
        {
            user: req.user._id,
            analysis: analysisId,
            title: analysis?.jobRole?.title || 'Your Roadmap',
            duration: normalizedRoadmap.duration,
            phases: normalizedRoadmap.phases,
            quickwins: normalizedRoadmap.quickwins,
            projects: normalizedRoadmap.projects,
            certification: normalizedRoadmap.certification,
            progress: {
                totalItems: normalizedRoadmap.phases.reduce((total, phase) => {
                    return (
                        total +
                        phase.weeklyBreakdown.reduce((weekTotal, week) => {
                            return weekTotal + week.learningItems.length;
                        }, 0)
                    );
                }, 0),
                milestones: normalizedRoadmap.milestones,
            },
            userPreferences: preference,
        }
    )
    if (!roadmap) {
        throw new ApiError(400, 'Unable to create roadmap')
    }

    //create  progress also when u create roadmap create progress also
    await progressModel.findOneAndUpdate(
        {
            user: req.user._id,
            roadmap: roadmap._id
        },
        {
            $setOnInsert: {
                user: req.user._id,
                roadmap: roadmap._id
            }
        },
        {
            upsert: true,
            new: true
        }
    )

    await clearRoadmapCache(analysisId, req.user._id);

    res.status(200)
        .json(new ApiResponse(201, roadmap, 'User successfully created roadmap'))

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
        .populate('analysis')
    if (!roadmap) {
        throw new ApiError(404, 'Roadmap not found');
    }

    res.json(new ApiResponse(200, roadmap, 'Roadmap fetched successfully'));
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
        throw new ApiError(400, 'No roadmap found')
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

    item.completedAt = new Date()
    item.completed = true

    // update user progress
    await roadmap.save();

    const progress = await progressModel.findOne({
        user: req.user._id,
        roadmap: roadmap._id
    })
    if (!progress) {
        throw new ApiError(400, 'No progress found of the user')
    }
    // if progress present update tje mark completeion or maintain streak
    if (progress) {
        progress.lastActivityDate = new Date()
        await progress.updateStreak()

        // add to progress learned resource that what did he learned and resource used
        console.log(item.resource)
        if (item.resource) {
            progress.completedResources.push({
                resource: item.resource,
                completedAt: new Date()
            })
        }
        await progress.save()
    }

    await roadmap.updateProgress()
    await clearRoadmapCache(roadmap.analysis, req.user._id)

    res.status(200).json(
        new ApiResponse(201, roadmap, 'Item Marked completed'))
})

export const updateReference = asyncHandler(async (req, res) => {

    // requirment from user to change preference
    const { hoursPerWeek, budget, learningStyle } = req.body

    const roadmap = await roadmapModel.findOne({
        user: req.user._id,
        _id: req.params.id
    })

    if (!roadmap) {
        throw new ApiError(400, 'No roadmap found to update user preference')
    }

    roadmap.userPreferences = roadmap.userPreferences || {}
    if (hoursPerWeek) roadmap.userPreferences.hoursPerWeek = hoursPerWeek
    if (budget) roadmap.userPreferences.budget = budget
    if (learningStyle) roadmap.userPreferences.learningStyle = learningStyle

    await roadmap.save()
    await clearRoadmapCache(roadmap.analysis, req.user._id)
    res.status(200).json(
        new ApiResponse(201, roadmap, 'User preferne updated succesfully'))
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
        throw new ApiError(400, 'Failed to get roadmap')
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
        .select('duration progress createdAt')
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
