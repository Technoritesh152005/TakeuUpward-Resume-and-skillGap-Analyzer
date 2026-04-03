import { Worker } from 'bullmq'
import { bullMqConnection } from '../config/bullmq.js'
import { QUEUE_NAMES } from '../config/constant.js'
import logger from '../utils/logs.js'
import { processRoadmapGenerationJob } from '../services/workerController/roadmapGeneration.service.js'

// create new worker
const startRoadmapWorker = () => {

    const worker = new Worker(
        QUEUE_NAMES.ROADMAP_GENERATION,
        async (job) => {
            logger.info(`Roadmap job received: ${job.id}`)
            // call to the worker logic
            return processRoadmapGenerationJob(job.data)
        },
        {
            connection: bullMqConnection,
            concurrency: 1,
        }
    )

    worker.on('completed', (job) => {
        logger.info(`Roadmap job completed: ${job?.id}`)
    })

    worker.on('failed', (job, error) => {
        logger.error(`Roadmap job failed: ${job?.id} - ${error?.message || 'unknown error'}`)
    })

    return worker
}

export { startRoadmapWorker }
