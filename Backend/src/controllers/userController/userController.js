// in user controller
/*
1. get by profile
2.update profile like name,phone,loc,bio,pref
3. get dashboard stats-
get the count of resume analysis and analysis
calculate avg match score
get skill count from latest resume
take it from their resume parsed data that how much skill does he have
return all these

4.get user activity - 
get recent activities of user like analysis and resume 
combine multiple resume and analysis and sort them in latest

5. Delete account - 
also soft delete all their resume and analysis
*/
import redisClient from '../../config/redis.js'
import asyncHandler from '../../utils/asyncHandler.js'
import ApiError from '../../utils/apiError.js'
import ApiResponse from '../../utils/apiResponse.js'
import userModel from '../../models/user.model.js'
import logger from '../../utils/logs.js'
import resumeModel from '../../models/resume.model.js'
import analysisModel from '../../models/analysis.model.js'

export const getMyProfile = asyncHandler(async (req, res) => {

    // just return the user from user model
    const user = await userModel.findOne(req.user._id).select('-password')
    if (!user) {
        throw new ApiError(400, 'User not found')
    }

    res.status(200)
        .json(201, user, 'User succesfully been fetched')
})

export const updateProfile = asyncHandler(async (req, res) => {

    const { name, phone, location, bio, preference } = req.body

    const user = userModel.findById(req.user._id).select('-password')

    if (name) user.name = name
    if (phone) user.phone = phone
    if (location) user.location = location
    if (user.bio) user.bio = bio
    if (preference) {
        if (preference.hoursPerWeek) {
            user.preference.hoursPerWeek = hoursPerWeek
        }
        if (preference.budget) {
            user.preference.budget = budget
        }
        if (preference.learningStyle) {
            user.preference.learningStyle = learningStyle
        }
    }

    await user.save()
    logger.info(200, 'User updated his profile')

    res.status(200)
        .json(201, user, 'User details has been successfully changed')
})

export const getDashboardStats = asyncHandler(async (req, res) => {
    // for dashboard stats u need first user? no dont need
    // gets first get count of how much resume and analysis u created and show them their analysis
    // promise . all runs all query at once 

    const cacheKey = `Dashboard:user:${req.user._id}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(201, data, 'Dashboard cache data fetched succesfully'))
    }

    const [resumeCount, analysisCount, analysis] = await Promise.all(
        [
            resumeModel.countDocuments({ user: req.user._id, isActive: true }),
            analysisModel.countDocuments({ user: req.user._id, isActive: true }),
            analysisModel.find({ user: req.user._id, isActive: true })
                .limit(5)
                .sort({ createdAT: -1 })
                .populate('jobRole', 'title category')
                .select('matchScore  readinesslevel createdAt'),
        ]
    )

    let avgMatchScore = 0;

    if (analysis.length > 0) {
        const totalScore = analysis.reduce((sum, a) => sum + a.matchScore, 0);
        avgMatchScore = Math.round(totalScore / analysis.length);
    }

    // get skill count from latest resume
    const latestResume = resumeModel.findOne({
        user: req.user._id,
        isActive: true,
        processingStatus: 'completed'
    }).sort({ createdAt: -1 })

    if (!latestResume) {
        throw new ApiError(400, 'Resume not found')
    }
    const skillCount = 0;
    if (latestResume?.parsedData?.skills) {
        // skill has a pinter to skill object in resume
        const skill =
            latestResume.parsedData.skills
        console.log(skill)

        skillCount = (skill.technical?.length || 0) +
            (skill.language?.length || 0) +
            (skill.tools?.length || 0)
    }

    const data = {
        resumeUploadedCount: resumeCount,
        analysisUploadedCount: analysisCount,
        rececntAnalysis: analysis,
        averageMatchScore: avgMatchScore,
        skillsCount: skillCount
    }
    await redisClient.setEx(cacheKey,1200,JSON.stringify(data))
    res.status(200)
        .json(201,
            {
                resumeUploadedCount: resumeCount,
                analysisUploadedCount: analysisCount,
                rececntAnalysis: analysis,
                averageMatchScore: avgMatchScore,
                skillsCount: skillCount
            },
            'All stats of dashboard have been taken successfully'
        )
})

export const getUserActivity = asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query

    const cacheKey = `userActivity:user:${req.user._id}:limit:${limit}`
    const cachedData = await redisClient.get(cacheKey)

    if(cachedData){
        const data = await JSON.parse(cachedData)
        return res.status(200)
        .json(new ApiResponse(201,data,'User activity cached data fetched succesfully'))
    }
    const [resume, analysis] = await Promise.all(
        [
            await resumeModel.find({
                user: req.user._id,
                status: isActive,
            }).sort({ createdAt: -1 })
                .limit(parseInt(limit))
                .select('fileName originalFileName createdAt processingStatus'),

            await analysisModel.find({
                user: req.user._id,
                isActive: true,
            })
                .sort({ createdAt: -1 })
                .select('matchScore status createdAt')
                .populate('jobRole', 'title category')
                .limit(parseInt(limit))

        ]
    )
    // Combine and sort by date
    const activities = [
        ...resume.map((r) => ({
            type: 'resume_upload',
            data: r,
            timestamp: r.createdAt,
        })),
        ...analysis.map((a) => ({
            type: 'analysis',
            data: a,
            timestamp: a.createdAt,
        })),
    ].sort((a, b) => b.timestamp - a.timestamp);

    await redisClient.setEx(cacheKey,300, JSON.stringify(activities))
    res.status(200)
        .json(new ApiResponse(201, activities, 'Sucesfully got the user activity'))
})

export const deleteAccount = asyncHandler(async (req, res) => {
    const { password } = req.body

    if (!password) {
        throw new ApiError('Password not provided. Please Provide password')
    }

    const user = await userModel.findById(req.user._id).select('+password')
    if (!user) {
        throw new ApiError(400, 'No user found')
    }

    const isPasswordTrue = await user.comparePassword(password)

    if (!isPasswordTrue) {
        throw new ApiError(400, 'Password is wrong!.. Please Provide correct password')
    }

    user.isActive = false;
    await user.save()

    await Promise.all([
        resumeModel.updateMany({ user: req.user._id }, { isActive: true },
            analysisModel.updateMany({ user: req.user._id }, { isActive: false }),
        )
    ]
    )

    logger.info('Successfully deleted the account of the user: '`${req.user._id}`)

    res.status(200)
        .json(new ApiResponse(201, null, 'User account successfully got DELETED'))
})

export const exportUserData = asyncHandler(async (req, res) => {

    const user = await userModel.findById(req.user._id).select('-password')
    if (!user) {
        throw new ApiError(400, 'No user found')
    }

    const [resumedata, analysisdata] = await Promise.all([
        resumeModel.find({ user: req.user._id }),
        analysisModel.find({ user: req.user._id }).populate('jobRole')
    ])

    const exportData = {
        userData: user,
        resumeData: resumedata,
        analysisData: analysisdata,
        exportedAt: new Date()
    }

    res.status(200)
        .json(201, exportData, 'User data has been successfully exported')

})

export const updateNotificationPreference = asyncHandler(async (req, res) => {

    const { email, roadMapUpdates, weeklyProgess } = req.body

    const user = await resumeModel.findById(req.user._id).select('-password')
    console.log(user)

    if (email) {
        user.preference.notification.email = email
    }
    if (roadMapUpdates) {
        user.preference.notification.roadMapUpdates = roadMapUpdates
    }
    if (weeklyProgess) {
        user.preference.notification.weeklyProgess = weeklyProgess
    }

    await user.save()
    res.status(200)
        .json(new ApiResponse(201, user, 'user notification succesfully updated'))
})