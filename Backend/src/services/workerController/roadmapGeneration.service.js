import analysisModel from '../../models/analysis.model.js'
import progressModel from '../../models/progress.model.js'
import resourceModel from '../../models/resources.model.js'
import roadmapModel from '../../models/roadmap.model.js'
import performRoadmapInstance from '../ai.services/roadmap_planner.js'
import logger from '../../utils/logs.js'
import { logMetric } from '../../utils/metrics.js'
import redisClient from '../../config/redis.js'
import { refundAiUsage } from '../aiQuota.service.js'
import { ROADMAP_PROCESSING_STAGE, ROADMAP_STATUS } from '../../config/constant.js'

const RESOURCE_TYPE_FALLBACKS = {
    course: ['course', 'tutorial', 'documentation', 'article', 'video'],
    tutorial: ['tutorial', 'documentation', 'article', 'video', 'course'],
    practice: ['practice', 'project', 'tutorial', 'course', 'video'],
    project: ['project', 'practice', 'tutorial', 'course'],
    book: ['book', 'article', 'documentation'],
}
const extractNumber = (value, fallback) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const match = value.match(/\d+(\.\d+)?/)
        if (match) return Number(match[0])
    }

    return fallback
}

// used to generate a cache id with analysisid and userid
const roadmapCache = (analysisId, userId) => {
    return `roadmap:analysis:${analysisId}:user:${userId}`
}

// used to delete the roadmap cached data of this analysis and user id
const clearRoadmapCache = async (analysisId, userId) => {
    await redisClient.del(`roadmap:analysis:${analysisId}:user:${userId}`)
}
// It makes user input safe to use inside a regex.
const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// it is ok learning items type in roadmap
const getSkillVariants = (item) => {
    const rawValues = [
        ...(Array.isArray(item?.skillsCovered) ? item.skillsCovered : []),
        item?.title,
    ]
        .filter(Boolean)
        .flatMap((value) => String(value)
            .split(/[,/()|-]/g)
            .map((part) => part.trim())
            .filter(Boolean))

    return [...new Set(rawValues)]
}
const buildResourceSearchLink = (item) => {
    // "React Course hooks"
// → "React%20Course%20hooks"
    const query = encodeURIComponent(`${item?.title || 'learning resource'} ${item?.skillsCovered?.join(' ') || ''}`.trim())

    if (item?.type === 'video' || item?.type === 'tutorial') {
        return `https://www.youtube.com/results?search_query=${query}`
    }

    if (item?.type === 'documentation' || item?.type === 'article') {
        return `https://www.google.com/search?q=${query}`
    }
    return `https://www.google.com/search?q=${query}`
}

const normalizeCertification = (item) => ({
    title: item?.title || item?.name || 'Certification',
    provider: item?.provider || 'No Provider Provided',
    cost: extractNumber(item?.cost, 0),
    duration: item?.duration || '',
    priority: ['high', 'medium', 'low'].includes(item?.priority) ? item.priority : 'medium',
    url: item?.url || item?.credentialUrl || '',
    completed: false,
})

const normalizeMilestone = (item) => ({
    title: item?.title || item?.achievement || `Week ${extractNumber(item?.week, 0)} milestone`,
    completed: false,
})

// it mormalize the data according to the schema
const normalizeRoadmapPayload = (roadmapData) => {

    const phases = Array.isArray(roadmapData?.phases)
        ? roadmapData.phases.map((phase, phaseIndex) => ({
            phaseNumber: extractNumber(phase?.phaseNumber, phaseIndex + 1),
            title: phase?.title || `Phase ${phaseIndex + 1}`,
            duration: extractNumber(phase?.duration, 0),
            objectives: Array.isArray(phase?.objectives) ? phase.objectives : [],
            weeklyBreakdown: Array.isArray(phase.weeklyBreakdown) ?
                phase.weeklyBreakdown.map((week, weekIndex) => ({
                    week: extractNumber(week?.week, weekIndex + 1),
                    focus: week?.focus || '',
                    goals: Array.isArray(week?.goals) ? week.goals : [],
                    timeCommitment: week?.timeCommitment || '',
                    learningItems: Array.isArray(week?.learningItems) ?
                        week.learningItems.map((item) => ({
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

    const quickwins = Array.isArray(roadmapData?.quickWins)
        ? roadmapData.quickWins.map((item) => ({
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

const isGeneratedResourceLink = (url = '') => {
    if (!url) return false

    return [
        'https://www.youtube.com/results?search_query=',
        'https://www.google.com/search?q=',
    ].some((prefix) => String(url).startsWith(prefix))
}
const findBestResourceForItem = async (item, prefernces) => {

    // check which type of item is this
    const typeOptions = RESOURCE_TYPE_FALLBACKS[item?.type] || [item?.type, 'tutorial', 'course']
    const skillVariants = getSkillVariants(item)

    const regexConditions = skillVariants.map((skill) => ({
        $or: [
            { title: { $regex: escapeRegex(skill), $options: 'i' } },
            { description: { $regex: escapeRegex(skill), $options: 'i' } },
            { skillsCovered: { $regex: escapeRegex(skill), $options: 'i' } },
        ],
    }))

    const baseQuery = {
        isActive: true,
        // resource type must include these resource type
        resourceType: { $in: typeOptions.filter(Boolean) }
    }
    if (prefernces?.budget === 'free') {
        baseQuery.isPremium = false
    }
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
            .limit(10)

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

const refundAiUsageSafely = async (userId) => {
    try {
        return await refundAiUsage(userId)
    } catch (error) {
        logger.error(`Failed to refund AI quota for user ${userId}: ${error.message}`)
        return null
    }
}

export const processRoadmapGenerationJob = async ({ analysisId, userId, roadmapId }) => {
    const roadmap = await roadmapModel.findOne({
        _id: roadmapId,
        analysis: analysisId,
        user: userId,
        isActive: true
    })

    if (!roadmap) {
        throw new Error(`Roadmap ${roadmapId} not found`)
    }
    const analysis = await analysisModel.findOne({
        _id: analysisId,
        user: userId,
        isActive: true
    }).populate('jobRole', 'title')

    if (!analysis) {
        throw new Error(`Analysis Of ${analysisId} not found`)

    }
    if (analysis.status !== 'completed') {
        throw new Error('Analysis has not been in completed status. It must be completed before generating roadmap')
    }
    // now we both found analysis and roadmap id so now put its status in processign and start 
    roadmap.status = ROADMAP_STATUS.PROCESSING
    roadmap.processingStage = ROADMAP_PROCESSING_STAGE.PROCESSING
    roadmap.processingStartedAt = new Date()
    roadmap.error = undefined

    await roadmap.save()
    // when generating new roadmap clear all the old data in cache of this analysis id and user id cause user neeeds to get new roadmap not old one
    await clearRoadmapCache(analysisId, userId)
    logMetric('roadmap.queue_wait_ms', {
        roadmapId: String(roadmapId),
        analysisId: String(analysisId),
        userId: String(userId),
        value: roadmap.queuedAt ? roadmap.processingStartedAt.getTime() - new Date(roadmap.queuedAt).getTime() : undefined,
    })

    try {

        const analysisData = {
            skillGaps: analysis?.skillGaps,
            strengths: analysis?.candidateStrength,
            transferrableSkills: analysis?.transferrableSkills
        }
        const prefernces = {
            hoursPerWeek: roadmap?.userPreferences?.hoursPerWeek || 10,
            budget: roadmap?.userPreferences?.budget || 'free',
            learningStyle: roadmap?.userPreferences?.learningStyle || 'mixed'
        }

        const roadmapData = await performRoadmapInstance.performRoadmap(analysisData, prefernces)

        if (!roadmapData) {
            throw new Error('Failed to generate roadmap for this analysis')
        }

        // normalize the data and fit it to model schema
        const normalizedData = normalizeRoadmapPayload(roadmapData)
        roadmap.processingStage = ROADMAP_PROCESSING_STAGE.FINALIZING
        await roadmap.save()

        // map the phases data according to the model schema in its model
        for (const phase of normalizedData.phases) {
            for (const week of phase.weeklyBreakdown) {
                for (const item of week.learningItems) {

                    const learningResource = await findBestResourceForItem(item, prefernces)
                    // here we check if we have resource and if we dont have we just write a url query for that resource
                    if(learningResource){
                        item.resource = learningResource._id
                        // it checks whether url have url type prefix
                        if(learningResource.url && (!item.url || isGeneratedResourceLink(item.url))){
                            item.url = learningResource.url
                        }
                        item.title = learningResource.title
                    } else if(!item.url){
                        item.url = buildResourceSearchLink(item)
                    }
                }
            }
        }
        roadmap.title = analysis?.jobRole?.title || roadmap.title || 'Your Roadmap'
        roadmap.duration = normalizedData.duration
        roadmap.phases = normalizedData.phases
        roadmap.quickwins = normalizedData.quickwins
        roadmap.projects = normalizedData.projects
        roadmap.certification = normalizedData.certification
        roadmap.progress = {
            // to take nested object reference use ...
            // we all r changing to the copy of this progress. now we need to save this
            ...roadmap.progress,
            overallPercentage: roadmap.progress?.overallPercentage || 0,
            completedItems: roadmap.progress?.completedItems || 0,
            totalItems: normalizedData.phases.reduce((total, phase) => {
                return total + phase.weeklyBreakdown.reduce((weekTotal, week) => {
                    return weekTotal + week.learningItems.length
                }, 0)
            }, 0),
            milestones: normalizedData.milestones,
            lastUpdated: new Date(),
        }

        // make the status finalized
        roadmap.status = ROADMAP_STATUS.COMPLETED
        roadmap.processingStage = ROADMAP_PROCESSING_STAGE.COMPLETED
        roadmap.completedAt = new Date()
        roadmap.processingTime = roadmap.processingStartedAt
            ? roadmap.completedAt.getTime() - roadmap.processingStartedAt.getTime()
            : undefined

	            await roadmap.save()
                logMetric('roadmap.processing_time_ms', {
                    roadmapId: String(roadmapId),
                    analysisId: String(analysisId),
                    userId: String(userId),
                    value: roadmap.processingTime,
                    status: roadmap.status,
                })

	            await progressModel.findOneAndUpdate(
                {
                    user: userId,
                    roadmap: roadmap._id
                },
                {
                    $setOnInsert: {
                        user: userId,
                        roadmap: roadmap._id
                    }
                },
                {
                    upsert: true,
                    new: true
                }
            )

            await clearRoadmapCache(analysisId, userId)
            logger.info(`Roadmap generated successfully for user: ${userId}`)
            return roadmap
    } catch (error) {
        roadmap.error = error.message
        roadmap.status = ROADMAP_STATUS.FAILED
        roadmap.processingStage = ROADMAP_PROCESSING_STAGE.FAILED
        await roadmap.save()
        await clearRoadmapCache(analysisId, userId)
        logMetric('roadmap.processing_time_ms', {
            roadmapId: String(roadmapId),
            analysisId: String(analysisId),
            userId: String(userId),
            value: roadmap.processingStartedAt ? Date.now() - new Date(roadmap.processingStartedAt).getTime() : undefined,
            status: roadmap.status,
        })

        await refundAiUsageSafely(userId)
        logger.error(`Error while generating roadmap: ${error.message}`)
        throw error
    }
}
