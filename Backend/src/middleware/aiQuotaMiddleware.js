import { reserveAiUsage } from '../services/aiQuota.service.js'
import asyncHandler from '../utils/asyncHandler.js'

// middleware reserves one AI use atomically so parallel requests cannot overrun the quota.
const requireAiQuota = (serviceName)=>asyncHandler(async(req,res,next) =>{

    const aiUsage = await reserveAiUsage(req.user._id, serviceName)
    req.aiUsage = aiUsage,
    req.aiQuotaReserved = true
    
    next()
})
export {requireAiQuota}
