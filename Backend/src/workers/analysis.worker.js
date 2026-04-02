import { Worker } from 'bullmq'
import { bullMqConnection } from '../config/bullmq.js'
import { QUEUE_NAMES } from '../config/constant.js'
import logger from '../utils/logs.js'
import { processAnalysisGenerationJob } from '../services/analysisGeneration.service.js'

// creating worker 
// This creates a worker (background processor)
// It listens to your queue and processes jobs
const startAnalysisWorker = () => {

    // contines listen job based on these job-name
    // and starts logic
    const worker = new Worker(
        QUEUE_NAMES.ANALYSIS_GENERATION,

        async (job) => {
            logger.info(`Analysis job received: ${job.id}`)
            return processAnalysisGenerationJob(job.data)
        },
        {
            connection: bullMqConnection,
            // process 2 jobs at  atime
            concurrency: 2,
        }
    )

    // when job finishes
    worker.on('completed', (job) => {
        logger.info(`Analysis job completed: ${job?.id}`)
    })

    worker.on('failed', (job, error) => {
        logger.error(`Analysis job failed: ${job?.id} - ${error?.message || 'unknown error'}`)
    })

    return worker
}

export { startAnalysisWorker }
