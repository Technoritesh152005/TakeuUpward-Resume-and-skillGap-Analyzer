import asyncHandler from '../../utils/asyncHandler.js'
import ApiError from '../../utils/apiError.js'
import jobRoleModel from '../../models/jobrole.model.js'

// 
export const getAllJobRoles = asyncHandler(async (req, res) => {

    // to get all job roles we fill use paginate method where we will create a filter object
    const { page = 2, limit = 10, sort = '-views', category, experienceLevel, industryTrend } = req.query

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

    const jobRoles = await jobRoleModel.paginate(filter, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sort,
        select: '-requiredSkills.critical.description -requiredSkills.important.description',
    })

    if (!jobRoles || jobRoles.length == 0) {
        throw new ApiError(401, 'No Job roles found')
    }
    // u should not increment views here cause u r just viewing it in homepage

    res.status(200)
        .json(201, 'All Job Roles Fetched succesfully', jobRoles)
})

// get job role by id
// we will get job roles is from params
export const getJobRolesFromId = asyncHandler(async (req, res, next) => {

    const jobRoleId = req.params.industryTrend
    const getSingleJobRole = await jobRoleModel.findOne({
        _id: jobRoleId,
        isActive: true,
    })
    if (!getSingleJobRole) {
        throw new ApiError(400, 'No Job Role found from this Id')
    }

    console.log(getSingleJobRole)
    getSingleJobRole.views = views + 1
    await getSingleJobRole.save({ validateBeforeSave: false })

    res.status(200)
        .json(201, 'Job role fetched successfully for this ID', getSingleJobRole)
})

export const getJobRoleFromSlug = asyncHandler(async (req, res, next) => {

    const slug = req.params.slug
    // slug return software-enginnering like this
    // we will also return similar job roles
    const jobRole = await jobRoleModel.findOne({
        slug: req.params.slug,
        isActive: true
    }).populate('relatedRoles', 'title', 'description', 'category', 'experienceLevel')

    if (!jobRole) {
        throw new ApiError(401, 'No job role found for it')
    }
    jobRole.views = views + 1
    await jobRole.save({ validateBeforeSave: false })

    res.status(200)
        .json(201, 'Jobs role is fetched from the required slug successfully', jobRole)
})

export const searchJobRoles = asyncHandler(async (req, res, next) => {

    const { q, category, experienceLevel, limit = 10 } = req.query


    if (!q) {
        throw new ApiError(401, 'No search field provided')
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
    await jobRoleModel.paginate(filter, {
        limit: parseInt(limit),
        sort: '-views',
        select: ('title slug category experienceLevel description salaryRange demandLevel')
    })

    res.status(200)
        .json(201, 'All job roles from the searching query fetched successfully',)
})

export const getTrendingJobRoles = asyncHandler(async (req, res, next) => {

    // to get trending job roles we must specify filter
    const { limit = 10 } = req.query

    const trendingJobRole = await jobRoleModel.find({
        industryTrend: true,
        isActive: true

    }).select('title', 'description', 'category', 'salaryRange', 'demandLevel')
        .sort({ views: -1 })
        .limit(parseInt(limit))

    if (!trendingJobRole) {
        throw new ApiError(400, 'No Trending Role Found')
    }

    res.status(200)
        .json(201, 'All trending Job roles gave successfukky', trendingJobRole)
})

export const getJobRolesByCategory = asyncHandler(async (req, res, next) => {

    // to get job roles by category we will use
    const category = req.params
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
        .json(201, 'All jon roles of this category fetched succesfully', jobRoles)

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
            const count = jobRoleModel.findDocuments({
                category: category,
                isActive: true
            })
            // this will get all documents which have this category
            // then we will return catgeory count and category
            return { category, count }
        })
    )

    res.status(200)
        .json('201', 'All job categories fetched succesfully', getAllCategory)

})

// get similarJobRoles.
// first to get similarJobRoles. we need atleast categroy or title
export const getSimilarJobRoles = asyncHandler(async (req, res, next) => {

    // we will first fetch the job
    const job = await jobRoleModel.find(req.params.id)
    const { limit = 10, experienceLevel } = req.query

    const similarJob = await job.getSimilarJobRoles(job.category, limit, job.experienceLevel)

    if (!similarJob) {
        throw new ApiError(400, 'No similar job found for this')
    }

    // getting filtered means dont show current job roles
    const filtered = similarRoles.filter(
        (role) => role._id.toString() !== jobRole._id.toString()
    );

    res.status(200)
        .json(201, 'All similar job roles fetched succesfully for this job', filtered)
})