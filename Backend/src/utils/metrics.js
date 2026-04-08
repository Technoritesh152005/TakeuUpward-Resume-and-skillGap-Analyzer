import logger from './logs.js'

const logMetric = (name, fields = {}) => {
    const parts = Object.entries(fields)
        .filter(([, value]) => value !== undefined && value !== null && value !== '')
        .map(([key, value]) => `${key}=${value}`)

    logger.info(`[metric] ${name}${parts.length ? ` ${parts.join(' ')}` : ''}`)
}

export {
    logMetric,
}
