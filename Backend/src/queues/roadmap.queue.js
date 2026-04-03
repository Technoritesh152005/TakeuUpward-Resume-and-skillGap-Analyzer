import { Queue } from 'bullmq'
import { bullMqConnection } from '../config/bullmq.js'
import { QUEUE_NAMES } from '../config/constant.js'

// new quque for roadmap
const roadmapQueue = new Queue(QUEUE_NAMES.ROADMAP_GENERATION, {
    connection: bullMqConnection,
    defaultJobOptions: {
        attempts: 1,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: 100,
        removeOnFail: 200,
    }
})

// adding job in queueu
const enqueueRoadmapGeneration = async ({ roadmapId, analysisId, userId }) => {
    return roadmapQueue.add(
        'generate-roadmap',
        {
            roadmapId: String(roadmapId),
            analysisId: String(analysisId),
            userId: String(userId),
        },
        {
            jobId: `roadmap-${String(roadmapId)}`
        }
    )
}

export {
    roadmapQueue,
    enqueueRoadmapGeneration,
}
