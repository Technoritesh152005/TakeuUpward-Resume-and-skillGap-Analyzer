import {Queue} from 'bullmq'
import {bullMqConnection} from '../config/bullmq.js'
import {QUEUE_NAMES} from '../config/constant.js'

// it takes which service this queue for and take connection details
const analysisQueue = new Queue(QUEUE_NAMES.ANALYSIS_GENERATION , {
    connection:bullMqConnection,
    defaultJobOptions:{
        // keep first queue rollout simple so quota refund stays accurate.
        attempts:1,
        backoff:{
            type:'exponential',
            delay:5000
        },
        // keep only 100jobs
        removeOnComplete:100,
        // keep last 200 jobs used specially for debugging
        removeOnFail:200,
    }
})

// first id will be generated and passed to queue
const enqueueAnalysisGeneration = async({analysisId , resumeId , jobRoleId,userId}) =>{
    const normalizedAnalysisId = String(analysisId)
    const jobId = `analysis-${normalizedAnalysisId}`
    const existingJob = await analysisQueue.getJob(jobId)

    // BullMQ keeps failed/completed jobs for debugging. Remove the stale terminal job
    // so retrying the same analysis id can enqueue a fresh job again.
    if (existingJob) {
        const existingState = await existingJob.getState()

        if (['failed', 'completed'].includes(existingState)) {
            await existingJob.remove()
        }
    }

    // /put the data into queue
    return analysisQueue.add('generate-analysis',
        {
        analysisId:normalizedAnalysisId,
        resumeId:String(resumeId),
        jobRoleId:String(jobRoleId),
        userId:String(userId)
    },{
        jobId
    }
)
}

export {
    analysisQueue,
    enqueueAnalysisGeneration
}

export const removeQueuedAnalysisJob = async (analysisId) => {
    const jobId = `analysis-${String(analysisId)}`
    const existingJob = await analysisQueue.getJob(jobId)

    if (!existingJob) {
        return false
    }

    const jobState = await existingJob.getState()

    if (['waiting', 'delayed', 'prioritized'].includes(jobState)) {
        await existingJob.remove()
        return true
    }

    return false
}
