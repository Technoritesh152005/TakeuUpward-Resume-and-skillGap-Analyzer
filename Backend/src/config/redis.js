import {createClient} from 'redis'
import logger from '../utils/logs' 

const redisClient = createClient(
    {
        // redis runs on 6379 default
        url:'redis://localhost:6379'
    }
)

redisClient.on('error',(err)=>logger.error('Redis Error: ',err))

await redisClient.connect();

export default redisClient