import progressModel from '../../models/progress.model.js'

const getRoadmapPosition = (roadmap) => {

    const phases = Array.isArray(roadmap?.phases) ? roadmap.phases : []
    if (!phases.length) {
        return {
            currentPhase: 0,
            currentWeek: 0
        }
    }

    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
        const phase = phases[phaseIndex];
        const week = Array.isArray(phase?.weeklyBreakdown) ? phase.weeklyBreakdown : []
        for (let weekIndex = 0; weekIndex < week.length; weekIndex++) {
            const currentweek = week[weekIndex]
            const learningItems = Array.isArray(currentweek?.learningItems) ? currentweek?.learningItems : []
            const hasIncompleteItems = learningItems.some((item) => !item?.completed)

            // this gives u the position of ur roadmap that where u are
            if (hasIncompleteItems) {
                return {
                    currentPhase: phase?.phaseNumber || phaseIndex + 1,
                    currentWeek: currentweek?.week || weekIndex + 1
                }
            }
        }
    }

    // if u reached here means u have all completed items.if u reached means ur at last position
    const phase = phases[phases.length - 1]
    const lastWeeksArray = Array.isArray(phase?.weeklyBreakdown) ? phase.weeklyBreakdown : []
    const lastWeekItem = lastWeeksArray[lastWeeksArray.length - 1]

    return {
        currentPhase: phase?.phaseNumber || phases.length,
        currentWeek: lastWeekItem?.week || lastWeeksArray.length
    }
}

const getWeekStartDate = (date = new Date()) => {
    const bucket = new Date(date)
    bucket.setHours(0, 0, 0, 0)
    const day = bucket.getDay()
    const diffToMonday = (day + 6) % 7
    bucket.setDate(bucket.getDate() - diffToMonday)
    return bucket
}

const addActivityToWeeklyLog = (progress, { date = new Date(), hoursSpent = 0, activityTitle = "" }) => {

    //search first wehteher that week start date exist
    const weekdate = getWeekStartDate(date)
    progress.weeklyTimeLog = Array.isArray(progress.weeklyTimeLog) ? progress.weeklyTimeLog : []

    const existingLog = progress.weeklyTimeLog.find((log) => {
        // search whether u find that log with start weekdate
        // find first checks each condition on array
        // if each object dont have week skip
        if (!log?.week) return false
        return new Date(log.week).getTime() === weekdate.getTime()

    })
    if (existingLog) {
        existingLog.hoursSpent = (existingLog.hoursSpent || 0) + hoursSpent
        // first check whether activity title is been provided and in that object does this title exist
        if (activityTitle && !existingLog.activitiesCompleted?.includes(activityTitle)) {
            existingLog.activitiesCompleted = [...(existingLog.activitiesCompleted || []), activityTitle]
        }
        existingLog.numberOfActivitiesCompleted = (existingLog.activitiesCompleted || []).length
        // we r only modifying in it core so no need to return anthung
        return
    }
    // if u dont get that week
    progress.weeklyTimeLog.push({
        week: weekdate,
        hoursSpent,
        activitiesCompleted: activityTitle ? [activityTitle] : [],
        numberOfActivitiesCompleted: activityTitle ? 1 : 0
    })
}
// update users current roadmap position and if found just return that progress
export const ensureProgressRecord = async ({ userId, roadmapId }) => {

    // if document found it return and if not found it creates new and setoninsert reuns
    return progressModel.findOneAndUpdate(
        {
            user: userId,
            roadmap: roadmapId
        }, {
        // It sets values ONLY when a new document is created
            $setOnInsert: {
                user: userId,
                roadmap: roadmapId
            }
            // if document dont exist create new and call $setoninsert
        }, {
            upsert: true,
            new: true
        }
    )
}

// gets current position of ur roadmap by getRoadmapPosition.sync the roadmap position in it s model .this
export const syncProgressPosition = async ({ roadmap, progress }) => {
    const { currentPhase, currentWeek } = getRoadmapPosition(roadmap)
    progress.currentPhase = currentPhase
    progress.currentWeek = currentWeek
    return progress
}
// it keeps track of what or how much item or its learning resource u have been utilized
export const recordLearningItemCompletion = async ({ userId, roadmap, item }) => {

    // it first checks whether record exist
    const progress = await ensureProgressRecord({
        userId,
        roadmapId: roadmap._id
    })

    progress.completedResources = Array.isArray(progress.completedResources) ? progress.completedResources : []
    progress.weeklyTimeLog = Array.isArray(progress.weeklyTimeLog) ? progress.weeklyTimeLog : []

    await progress.updateStreak()

    let alreadyTracked = false
    if (item?.resource) {
        // this tells in ur completed resource whether u have this data as ur completed resource or not
        alreadyTracked = (progress.completedResources || []).some((entity) => {
            // skip if that item in completedresource dont have resource refernece
            if (!entity?.resource) return false
            return String(entity.resource) === String(item.resource)
        })
    }
    if (item?.resource && !alreadyTracked) {
        progress.completedResources.push({
            resource: item.resource,
            completedAt: new Date(),
            timeSpent: item?.estimatedHours || 0,
        })
    }

    // this adds the activity in the log
    const hoursSpent = Number(item?.estimatedHours) || 0
    progress.totalTimeSpent = (progress.totalTimeSpent || 0) + hoursSpent
    addActivityToWeeklyLog(progress, {
        date: new Date(),
        hoursSpent,
        activityTitle: item?.title || 'Learning item',
    })

    await syncProgressPosition({ roadmap, progress })
    await progress.save()
    return progress
}

export const resetProgressTracking = async ({ userId, roadmap }) => {
    const progress = await ensureProgressRecord({
        userId,
        roadmapId: roadmap._id
    })

    progress.completedResources = []
    progress.totalTimeSpent = 0
    progress.weeklyTimeLog = []
    progress.lastActivityDate = undefined
    progress.currentStreak = 0
    progress.longestStreak = 0

    await syncProgressPosition({ roadmap, progress })
    await progress.save()
    return progress
}

export default {
    ensureProgressRecord,
    syncProgressPosition,
    recordLearningItemCompletion,
    resetProgressTracking
}
