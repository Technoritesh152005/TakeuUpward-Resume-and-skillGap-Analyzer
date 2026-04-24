import analysisModel from '../../models/analysis.model.js'
import roadmapModel from '../../models/roadmap.model.js'
import performRoadmapInstance from '../ai.services/roadmap_planner.js'
import logger from '../../utils/logs.js'
import { logMetric } from '../../utils/metrics.js'
import { refundAiUsage } from '../aiQuota/aiQuota.service.js'
import { ROADMAP_PROCESSING_STAGE, ROADMAP_STATUS } from '../../config/constant.js'
import { buildResourceSearchLink, clearRoadmapCache, findBestResourceForItem, isGeneratedResourceLink, normalizeRoadmapPayload } from '../roadmap/roadmapShared.service.js'
import { ensureProgressRecord, syncProgressPosition } from '../userProgress/progress.service.js'
import { logMissingResource } from '../../utils/missingResourceLogger.js'

const refundAiUsageSafely = async (userId) => {
    try {
        return await refundAiUsage(userId)
    } catch (error) {
        logger.error(`Failed to refund AI quota for user ${userId}: ${error.message}`)
        return null
    }
}

const buildRoadmapGenerationMeta = (generationMeta) => ({
    provider: 'gemini',
    mode: generationMeta?.mode || 'ai',
    usedFallback: Boolean(generationMeta?.usedFallback),
    usedRepair: Boolean(generationMeta?.usedRepair),
    generatedAt: new Date(),
    fallbackReason: generationMeta?.fallbackReason || '',
    parser: generationMeta || null,
})

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
    roadmap.generationMeta = undefined

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

        const roadmapResult = await performRoadmapInstance.performRoadmap(analysisData, prefernces)
        const roadmapData = roadmapResult?.roadmapData
        const roadmapGenerationMeta = roadmapResult?.generationMeta

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

                    const learningResource = await findBestResourceForItem(item, prefernces, { limit: 10 })
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
                        logMissingResource({
                            item,
                            generatedUrl: item.url,
                            roadmapId: roadmap._id,
                            analysisId,
                            userId,
                            source: 'roadmap_generation',
                        })
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
        roadmap.generationMeta = buildRoadmapGenerationMeta(roadmapGenerationMeta)
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

            const progress = await ensureProgressRecord({
                userId,
                roadmapId: roadmap._id,
            })
            await syncProgressPosition({ roadmap, progress })
            await progress.save()

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

