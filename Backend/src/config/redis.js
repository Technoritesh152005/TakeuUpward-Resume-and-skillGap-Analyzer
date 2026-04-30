import {createClient} from 'redis'
import logger from '../utils/logs.js' 

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

const redisClient = createClient(
    {
        url: redisUrl
    }
)
// .on is a listen event emitter

redisClient.on('error',(err)=>logger.error('Redis Error: ',err))

await redisClient.connect();
logger.info(`Redis connected using ${redisUrl}`)

export default redisClient
