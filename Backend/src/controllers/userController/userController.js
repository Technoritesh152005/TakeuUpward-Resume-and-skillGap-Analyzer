import redisClient from '../../config/redis.js'
import asyncHandler from '../../utils/asyncHandler.js'
import ApiError from '../../utils/apiError.js'
import ApiResponse from '../../utils/apiResponse.js'
import userModel from '../../models/user.model.js'
import logger from '../../utils/logs.js'
import resumeModel from '../../models/resume.model.js'
import analysisModel from '../../models/analysis.model.js'

// defineing the schema . that whenever data is given we return acc to this schema
const formatProfile = (user) => {
    // we always try to keep it in object
    const profile = user.toObject ? user.toObject() : user

    return {
        _id: profile._id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        avatar: profile.avatar || profile.profilePicture || '',
        profilePicture: profile.profilePicture || profile.avatar || '',
        authProvider: profile.authProvider || 'local',
        isEmailVerified: Boolean(profile.isEmailVerified),
        careerPreferences: profile.careerPreferences || {},
        preferences: profile.preference || profile.preferences || {},
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
    }
}

export const getMyProfile = asyncHandler(async (req, res) => {
    const userId = req.user;
    const user = await userModel.findById(userId._id).select('-password')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    res.status(200).json(
        new ApiResponse(200, formatProfile(user), 'User profile fetched successfully')
    )
})

export const updateProfile = asyncHandler(async (req, res) => {
    const {
        name,
        phone,
        location,
        bio,
        avatar,
        profilePicture,
        preferences,
        careerPreferences,
    } = req.body

    const user = await userModel.findById(req.user._id).select('-password')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }
    // before updating fiels we see whether these values r provided means we check whether they r not empty
    if (name !== undefined) user.name = name
    if (phone !== undefined) user.phone = phone
    if (location !== undefined) user.location = location
    if (bio !== undefined) user.bio = bio
    if (avatar !== undefined) user.avatar = avatar
    if (profilePicture !== undefined) user.profilePicture = profilePicture

    // setting prefernces of analysiss creation
    if (preferences) {
        user.preference = user.preference || {}

        if (preferences.hoursPerWeek !== undefined) {
            user.preference.hoursPerWeek = preferences.hoursPerWeek
        }
        if (preferences.budget !== undefined) {
            user.preference.budget = preferences.budget
        }
        if (preferences.learningStyle !== undefined) {
            user.preference.learningStyle = preferences.learningStyle
        }
    }

    
    if (careerPreferences) {
        user.careerPreferences = user.careerPreferences || {}

        if (careerPreferences.targetRole !== undefined) {
            user.careerPreferences.targetRole = careerPreferences.targetRole
        }
        if (careerPreferences.experienceLevel !== undefined) {
            user.careerPreferences.experienceLevel = careerPreferences.experienceLevel
        }
        if (careerPreferences.preferredJobType !== undefined) {
            user.careerPreferences.preferredJobType = careerPreferences.preferredJobType
        }
        if (careerPreferences.preferredLocation !== undefined) {
            user.careerPreferences.preferredLocation = careerPreferences.preferredLocation
        }
        if (careerPreferences.remotePreference !== undefined) {
            user.careerPreferences.remotePreference = careerPreferences.remotePreference
        }
        if (careerPreferences.industryInterest !== undefined) {
            user.careerPreferences.industryInterest = careerPreferences.industryInterest
        }
    }

    // when save runs before it .pre runs means it checks if password is changed or not.it is just a middleware
    await user.save()

    logger.info(`User profile updated: ${user._id}`)

    res.status(200).json(
        new ApiResponse(200, formatProfile(user), 'User profile updated successfully')
    )
})

// we cache the dashboard stats caused why to run same operation everytime?just cache it
export const getDashboardStats = asyncHandler(async (req, res) => {
    const cacheKey = `Dashboard:user:${req.user._id}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200).json(
            new ApiResponse(200, data, 'Dashboard cache data fetched successfully')
        )
    }

    // promise . all runs all process in parallel
    const [resumeCount, analysisCount, analyses, latestResume] = await Promise.all([

        resumeModel.countDocuments({ user: req.user._id, isActive: true }),
        analysisModel.countDocuments({ user: req.user._id, isActive: true }),
        analysisModel.find({ user: req.user._id, isActive: true })
            .limit(5)
            .sort({ createdAt: -1 })
            .populate('jobRole', 'title category')
            .select('matchScore readinessLevel createdAt'),

        resumeModel.findOne({
            user: req.user._id,
            isActive: true,
            processingStatus: 'completed'
        }).sort({ createdAt: -1 }),
    ])

    let avgMatchScore = 0

    // avg match score is calculated based on the latest 5 analysis
    if (analyses.length > 0) {
        const totalScore = analyses.reduce((sum, item) => sum + (item.matchScore || 0), 0)
        avgMatchScore = Math.round(totalScore / analyses.length)
    }

    let skillCount = 0
    const skills = latestResume?.parsedData?.skills

    if (skills) {
        skillCount =
            (skills.technical?.length || 0) +
            (skills.language?.length || 0) +
            (skills.tools?.length || 0)
    }

    const data = {
        resumeUploadedCount: resumeCount,
        analysisUploadedCount: analysisCount,
        rececntAnalysis: analyses,
        averageMatchScore: avgMatchScore,
        skillsCount: skillCount
    }
    // await redisClient.set(key, value);
    // save data in redis for 20 min
    await redisClient.setEx(cacheKey, 1200, JSON.stringify(data))

    res.status(200).json(
        new ApiResponse(200, data, 'All dashboard stats fetched successfully')
    )
})


export const getUserActivity = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query
    const parsedLimit = Number.parseInt(limit, 10) || 10

    const cacheKey = `userActivity:user:${req.user._id}:limit:${parsedLimit}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200).json(
            new ApiResponse(200, data, 'User activity cached data fetched successfully')
        )
    }

    // we get resume and analysis of user based on limit
    const [resumes, analyses] = await Promise.all([
        resumeModel.find({
            user: req.user._id,
            isActive: true,
        }).sort({ createdAt: -1 })
            .limit(parsedLimit)
            .select('fileName originalFileName createdAt processingStatus'),

        analysisModel.find({
            user: req.user._id,
            isActive: true,
        })
            .sort({ createdAt: -1 })
            .select('matchScore status createdAt')
            .populate('jobRole', 'title category')
            .limit(parsedLimit)
    ])

    // push it to activities. It basically show user latest activity
    const activities = [
        ...resumes.map((resume) => ({
            type: 'resume_upload',
            data: resume,
            timestamp: resume.createdAt,
        })),
        ...analyses.map((analysis) => ({
            type: 'analysis',
            data: analysis,
            timestamp: analysis.createdAt,
        })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    await redisClient.setEx(cacheKey, 300, JSON.stringify(activities))

    res.status(200).json(
        new ApiResponse(200, activities, 'Successfully got the user activity')
    )
})

export const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body

    if (!password) {
        throw new ApiError(400, 'Password not provided. Please provide password')
    }

    const user = await userModel.findById(req.user._id).select('+password')

    if (!user) {
        throw new ApiError(404, 'No user found')
    }

    const isPasswordTrue = await user.isPasswordCorrect(password)

    if (!isPasswordTrue) {
        throw new ApiError(400, 'Password is wrong. Please provide correct password')
    }

    user.isActive = false
    await user.save()

    // after making the user inactive make all the documents of the user inactive
    await Promise.all([
        resumeModel.updateMany({ user: req.user._id }, { isActive: false }),
        analysisModel.updateMany({ user: req.user._id }, { isActive: false }),
    ])

    logger.info(`Successfully deleted the account of the user: ${req.user._id}`)

    res.status(200).json(
        new ApiResponse(200, null, 'User account successfully deleted')
    )
})

// if user wants to export data it exports ananlyssi and resume
export const exportUserData = asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user._id).select('-password')

    if (!user) {
        throw new ApiError(404, 'No user found')
        
    }

    const [resumedata, analysisdata] = await Promise.all([
        resumeModel.find({ user: req.user._id }),
        analysisModel.find({ user: req.user._id }).populate('jobRole')
    ])

    const exportData = {
        userData: formatProfile(user),
        resumeData: resumedata,
        analysisData: analysisdata,
        exportedAt: new Date()
    }

    res.status(200).json(
        new ApiResponse(200, exportData, 'User data has been successfully exported')
    )
})

export const updateNotificationPreference = asyncHandler(async (req, res) => {
    const { email, roadMapUpdates, weeklyProgess } = req.body

    const user = await userModel.findById(req.user._id).select('-password')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    user.preference = user.preference || {}
    user.preference.notification = user.preference.notification || {}

    if (email !== undefined) {
        user.preference.notification.email = email
    }
    if (roadMapUpdates !== undefined) {
        user.preference.notification.roadMapUpdates = roadMapUpdates
    }
    if (weeklyProgess !== undefined) {
        user.preference.notification.weeklyProgess = weeklyProgess
    }

    await user.save()

    res.status(200).json(
        new ApiResponse(200, formatProfile(user), 'User notification preferences updated successfully')
    )
})
