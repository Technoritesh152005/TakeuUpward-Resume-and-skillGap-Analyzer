import { userModel } from '../../models/user.model.js'
import ApiError from '../../utils/apiError.js'

const AI_USAGE_DAILY_LIMIT = 4
const AI_USAGE_TIME_ZONE = 'Asia/Kolkata'

// function to get current date in YYYY-MM-DD
const getCurrentAiUsageDay = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: AI_USAGE_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date())
}

// fills all fields which r not filled
const normalizeAiUsage = (aiUsage = {}) => {
    const dailyLimit = Number.isFinite(aiUsage?.dailyLimit) ? aiUsage.dailyLimit : AI_USAGE_DAILY_LIMIT
    const usesRemaining = Number.isFinite(aiUsage?.usesRemaining) ? aiUsage.usesRemaining : dailyLimit

    return {
        dailyLimit,
        usesRemaining,
        usedToday: Math.max(0, dailyLimit - usesRemaining),
        lastResetDate: aiUsage?.lastResetDate || getCurrentAiUsageDay(),
        timeZone: AI_USAGE_TIME_ZONE,
    }
}

const resetAiUsageIfNeeded = async (userId) => {
    const today = getCurrentAiUsageDay()

    // it will reset the limiit if the last reset day is not equal to today date 
    await userModel.updateOne(
        {
            _id: userId,
            // if user last date != today then only reset
            'aiUsage.lastResetDate': { $ne: today },
        },
        {
            $set: {
                'aiUsage.dailyLimit': AI_USAGE_DAILY_LIMIT,
                'aiUsage.usesRemaining': AI_USAGE_DAILY_LIMIT,
                'aiUsage.lastResetDate': today,
            },
        }
    )
}

// reserve the limit and when operation success release it
// this normalize the data and also reserves a limit
const reserveAiUsage = async (userId, serviceName = 'AI service') => {
    await resetAiUsageIfNeeded(userId)

    // if cond not met return null
    const user = await userModel.findOneAndUpdate(
        {
            _id: userId,
            // check if to reserve a limit atleast user have a remaining limit
            'aiUsage.usesRemaining': { $gt: 0 },
        },
        {
            $inc: { 'aiUsage.usesRemaining': -1 },
            $set: {
                'aiUsage.dailyLimit': AI_USAGE_DAILY_LIMIT,
                'aiUsage.lastResetDate': getCurrentAiUsageDay(),
            },
        },
        {
            new: true,
            select: 'aiUsage',
        }
    )

    if (!user) {
        throw new ApiError(429, `Daily AI limit reached. You can use ${serviceName} again after 12:00 AM IST.`)
    }

    return normalizeAiUsage(user.aiUsage)
}

// this is the function that if operation not performed refund the limiit
const refundAiUsage = async (userId) => {
    await resetAiUsageIfNeeded(userId)

    const user = await userModel.findById(userId).select('aiUsage')
    const currentUsage = normalizeAiUsage(user?.aiUsage)
    // we increase the refund remaining. we see with dailylimit and usesremaining + 1
    const refundedRemaining = Math.min(currentUsage.dailyLimit, currentUsage.usesRemaining + 1)

    const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        {
            $set: {
                'aiUsage.dailyLimit': currentUsage.dailyLimit,
                'aiUsage.usesRemaining': refundedRemaining,
                'aiUsage.lastResetDate': getCurrentAiUsageDay(),
            },
        },
        {
            new: true,
            select: 'aiUsage',
        }
    )

    return normalizeAiUsage(updatedUser?.aiUsage)
}

// shows ur limit history for todaty
const getAiUsageSummary = async (userId) => {
    await resetAiUsageIfNeeded(userId)

    const user = await userModel.findById(userId).select('aiUsage')
    return normalizeAiUsage(user?.aiUsage)
}

export {
    reserveAiUsage,
    refundAiUsage,
    getAiUsageSummary,
    getCurrentAiUsageDay,
}
