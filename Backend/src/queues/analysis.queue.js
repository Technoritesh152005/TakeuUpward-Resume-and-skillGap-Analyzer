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

    // /put the data into queue
    return analysisQueue.add('generate-analysis',
        {
        analysisId:String(analysisId),
        resumeId:String(resumeId),
        jobRoleId:String(jobRoleId),
        userId:String(userId)
    },{
        jobId:`analysis-${String(analysisId)}`
    }
)
}

export {
    analysisQueue,
    enqueueAnalysisGeneration
}
