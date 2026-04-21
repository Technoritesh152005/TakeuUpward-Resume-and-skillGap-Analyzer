import asyncHandler from '../../utils/asyncHandler.js'
import ApiError from '../../utils/apiError.js'
import jobRoleModel from '../../models/jobrole.model.js'
import redisClient from '../../config/redis.js'
import ApiResponse from '../../utils/apiResponse.js'

// 
export const getAllJobRoles = asyncHandler(async (req, res) => {

    // to get all job roles we fill use paginate method where we will create a filter object
    const { page = 1, limit = 60, sort = '-views', category, experienceLevel, industryTrend } = req.query

    const cacheKey = `jobRole:list:${JSON.stringify(req.query)}`
    const cachedData = await redisClient.get(cacheKey)


    if (cachedData) {                                                                                                      
        const parsedCache = JSON.parse(cachedData)                                                                         
         return res.status(200)                                                                                             
            .json(new ApiResponse(200, parsedCache, 'cached data of jobrole fetched succesfully'))                         
     }  
    const filter = { isActive: true }

    if (category) {
        // we r adding new properties to existing object
        filter.category = category
    }
    if (experienceLevel) {
        filter.experienceLevel = experienceLevel
    }

    // query params arrive as strings, so accept "true"/"false" too
    if (industryTrend !== undefined) {
        filter.industryTrend = industryTrend === true || industryTrend === 'true'
    }

    if (cachedData) {                                                                                                      
               const parsedCache = JSON.parse(cachedData)                                                                         
                return res.status(200)                                                                                             
                   .json(new ApiResponse(200, parsedCache, 'cached data of jobrole fetched succesfully'))                         
            }  
            
    const jobRoles = await jobRoleModel.paginate(filter, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sort,
        select: '-requiredSkills.critical.description -requiredSkills.important.description',
    })
    if (!jobRoles || !Array.isArray(jobRoles.docs) || jobRoles.docs.length === 0) {
        throw new ApiError(404, 'No Job roles found')
    }
    await redisClient.setEx(cacheKey, 600, JSON.stringify(jobRoles))
    // u should not increment views here cause u r just viewing it in homepage

    res.status(200)
       .json(new ApiResponse(200,jobRoles,'All Job roles fetched succss'))
})

// get job role by id
// we will get job roles is from params
export const getJobRolesFromId = asyncHandler(async (req, res, next) => {

    const jobRoleId = req.params.id

    const cacheKey = `jobRole:${jobRoleId}`
    const cachedData = await redisClient.get(cacheKey)
    if (cachedData) {
        const parsedCache = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(200, parsedCache, 'Cached data of job role by id succesfully fetched'))
    }
    const getSingleJobRole = await jobRoleModel.findOne({
        _id: jobRoleId,
        isActive: true,
    }).populate('relatedRoles', 'title slug category experienceLevel description')
    if (!getSingleJobRole) {
        throw new ApiError(400, 'No Job Role found from this Id')
    }

    getSingleJobRole.views = (getSingleJobRole.views || 0) + 1
    await getSingleJobRole.save({ validateBeforeSave: false })

    await redisClient.setEx(cacheKey, 500, JSON.stringify(getSingleJobRole))

    res.status(200)
        .json(new ApiResponse(200, getSingleJobRole, 'Job role fetched successfully for this ID'))
})

export const getJobRoleFromSlug = asyncHandler(async (req, res, next) => {

    const slug = req.params.slug
    // slug return software-enginnering like this
    // we will also return similar job roles

    const cacheKey = `jobRole:${slug}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const cache = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(200, cache, 'Cache data succesfully fetchhed for job role from slug'))
    }
    const jobRole = await jobRoleModel.findOne({
        slug: slug,
        isActive: true
    }).populate('relatedRoles', 'title description category experienceLevel slug')

    if (!jobRole) {
        throw new ApiError(404, 'No job role found for it')
    }
    jobRole.views = (jobRole.views || 0) + 1
    await jobRole.save({ validateBeforeSave: false })

    await redisClient.setEx(cacheKey, 300, JSON.stringify(jobRole))
    res.status(200)
        .json(new ApiResponse(200, jobRole, 'Jobs role is fetched from the required slug successfully'))
})

export const searchJobRoles = asyncHandler(async (req, res, next) => {
    // no need to cache -- to many variations
    const { q, category, experienceLevel, limit = 10 } = req.query


    if (!q) {
        throw new ApiError(400, 'No search field provided')
    }
    // regex searches character casing but $text searches full words
    const filter = { isActive: true, $text: { $search: q } }


    if (category) {
        filter.category = category
    }
    if (experienceLevel) {
        filter.experienceLevel = experienceLevel
    }

    // u cannot use select after paginate cause it alreadys send u that much only req data. so while getting first clearify them
    const results = await jobRoleModel.paginate(filter, {
        page: 1,
        limit: parseInt(limit),
        sort: '-views',
        select: ('title slug category experienceLevel description salaryRange demandLevel')
    })

    res.status(200)
        .json(new ApiResponse(200, results, 'All job roles from the searching query fetched successfully'))
})

export const getTrendingJobRoles = asyncHandler(async (req, res, next) => {

    // to get trending job roles we must specify filter
    const { limit = 10 } = req.query

    const cacheKey = `jobRoleTrending:${limit}`
    const cachedData = await redisClient.get(cacheKey)
    

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(200, data, 'Cached data of trending job roles fetched succesfully'))
    }
    // gives e trending + active job roles
    let trendingJobRole = await jobRoleModel.find({
        industryTrend: true,
        isActive: true

    }).select('title description category salaryRange demandLevel')
        .sort({ views: -1 })
        .limit(parseInt(limit))
        

   // so Analysis page always has role options.  
//    If no trending roles exist, you don’t want to return empty data.
// it is basically a fallback mechanism
   if (!Array.isArray(trendingJobRole) || trendingJobRole.length === 0) {
    trendingJobRole = await jobRoleModel.find({ isActive: true })
        .select('title description category salaryRange demandLevel')
        .sort({ views: -1, createdAt: -1 })
        .limit(parseInt(limit))
}
if (!Array.isArray(trendingJobRole) || trendingJobRole.length === 0) {
    throw new ApiError(400, 'No active job roles found')
}
await redisClient.setEx(cacheKey, 300, JSON.stringify(trendingJobRole))
    res.status(200)
        .json(new ApiResponse(200, trendingJobRole,'All trending Job roles gave successfukky'))
})

export const getJobRolesByCategory = asyncHandler(async (req, res, next) => {

    // to get job roles by category we will use
    const category = req.params.category
    const { experienceLevel, limit = 10 } = req.query

    const filter = { isActive: true }

    if (category) {
        filter.category = category
    }
    if (experienceLevel) {
        filter.experienceLevel = experienceLevel
    }

    const jobRoles = await jobRoleModel.find(filter)
        .select('title slug experienceLevel salaryRange demandLevel views')
        .sort({ views: -1 })
        .limit(parseInt(limit));

    res.status(200)
        .json(new ApiResponse(200, jobRoles ,'All jon roles of this category fetched succesfully'))

})

export const getAllJobCategory = asyncHandler(async (req, res, next) => {

    // first get all categories availavb;e
    // distinct gets unique elements  from all documents


    const categories = await jobRoleModel.distinct('category', { isActive: true })
    // we get all categories in array format
    // now we will map through each categoreis and find its count 

    if (!categories || categories.length == 0) {
        throw new ApiError(400, 'No category job roles founded f')
    }
    const getAllCategory = await Promise.all(
        categories.map(async (category) => {
            const count = await jobRoleModel.countDocuments({
                category: category,
                isActive: true
            })
            // this will get all documents which have this category
            // then we will return catgeory count and category
            return { category, count }
        })
    )

    res.status(200)
        .json(new ApiResponse(200, getAllCategory, 'All job categories fetched succesfully'))

})

// get similarJobRoles.
// first to get similarJobRoles. we need atleast categroy or title
export const getSimilarJobRoles = asyncHandler(async (req, res, next) => {

    // we will first fetch the job

    // req.params.id = abc123
    // req.query.limit = 6
    // i just want to say that to take id they do like this and also for limit and exp level as they r sent in obj
    // so query value comes from url only
    const job = await jobRoleModel.findOne({ _id: req.params.id, isActive: true })
    const { limit = 10, experienceLevel } = req.query

    const cacheKey = `SimilarJobRoles:${req.params.id}:limit:${limit}`
    const cachedData = await redisClient.get(cacheKey)

    if (cachedData) {
        const data = JSON.parse(cachedData)
        return res.status(200)
            .json(new ApiResponse(200, data, 'Cached data of get similar job roles fetched'))
    }

    if (!job) {
        throw new ApiError(404, 'Job role not found')
    }

    const similarJob = await jobRoleModel.findSimilarRoles(
        job.category,
        parseInt(limit),
        experienceLevel || job.experienceLevel
    )

    if (!Array.isArray(similarJob) || similarJob.length === 0) {
        throw new ApiError(400, 'No similar job found for this')
    }

    // getting filtered means dont show current job roles
    const filtered = similarJob.filter(
        (role) => role._id.toString() !== job._id.toString()
    );

    await redisClient.setEx(cacheKey, 500, JSON.stringify(filtered));
    res.status(200)
        .json(new ApiResponse(200, filtered, 'All similar job roles fetched succesfully for this job'))
})
