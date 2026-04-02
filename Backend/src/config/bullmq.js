const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const bullMqConnection = {
    url: REDIS_URL,
}

export {
    REDIS_URL,
    bullMqConnection,
}
