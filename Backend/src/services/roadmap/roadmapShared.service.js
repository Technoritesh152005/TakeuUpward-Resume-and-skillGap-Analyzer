import resourceModel from '../../models/resources.model.js'
import redisClient from '../../config/redis.js'
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
        // "React, Node.js" â†’ ["React", " Node.js"]
        // "Frontend Developer (React)" â†’ ["Frontend Developer ", "React"]
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
const findBestResourceForItem = async (item, preference, options = {}) => {
    const { limit = 12 } = options

    // find the reosurce type it needs
    // if type is tutorial it dont only find tutorial but also doc article
    const typeOptions = RESOURCE_TYPE_FALLBACKS[item?.type] || [item?.type, 'tutorial', 'course']
    const skillVariants = getSkillVariants(item)
    // condition for searching
    const regexConditions = skillVariants.map((skill) => ({
        // â€œany one condition can be trueâ€. this is the search qyery or condition need to search in resource
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
            .limit(limit)

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

export {
    buildResourceSearchLink,
    clearRoadmapCache,
    enrichRoadmapResources,
    extractNumber,
    findBestResourceForItem,
    isGeneratedResourceLink,
    normalizeRoadmapPayload,
    roadmapCachekey,
}
