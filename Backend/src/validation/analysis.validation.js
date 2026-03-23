import joi from 'joi'
import mongoose from 'mongoose'
import ApiError from '../utils/apiError.js'

const validateAnalysisId = (value, helpers) => {

    if (!mongoose.Types.ObjectId.isValid(value)) {
        return helpers.error('any.invalid')
    }

    return value
}

const validateCreatingAnalysis = (req, res, next) => {

    // means during creating analysis we take fiellds. these ensure r they fields correct
    // u need resume and job role
    // cause in analysis u generate score,roadmpa,stengths,gaps

    const schema = joi.object(
        {
            resumeId: joi.string()
                .custom(validateAnalysisId)
                .required()
                .messages({
                    'any.invalid': 'Invalid resume Id format',
                    'string.empty': 'Please provide resume Id'
                }),

            jobRoleId: joi.string()
                .required()
                .custom(validateAnalysisId)
                .messages({
                    'any.invalid': 'Invalid Job Role Id format',
                    'string.empty': 'Please provide Job Role Id'
                }),

            // during analysis some additional requirment are also required . if user dont provide it we will add default. so there is modification of req.body
            // whole object is optional
            preference: joi.object({
                hoursPerWeek: joi.number()
                    .integer()
                    .optional()
                    .min(10)
                    .max(140)
                    .default(5),

                budget: joi.string()
                    .valid('free', 'low', 'high', 'medium')
                    .default('medium')
                    .optional(),

                learningStyle: joi.string()
                    .valid('visual', 'auditory', 'reading', 'kinesthetic', 'mixed')
                    .optional()
                    .default('mixed'),

            }).optional(),

        }
    )

    // use value whenever u used default , optional joi is adding something if not provided and type conversion
    const { error, value } = schema.validate(req.body)

    if (error) {
        throw new ApiError(401, 'Error occured while validating creating ananlysi', error.details[0].message)
    }

    req.body = value
    next()
}


const validateGetAnalysis = (req, res, next) => {

    // validation of get analysis means we get from req.params. we check limit , sort , pages , status and also mainly
    // we filter also .. means we set resumeId , jobRole , means we get analysis from these factor also if provided. they r optional. also minmacthscore , maxscore
    // if filters or get analysis from these factors also
    const schema = joi.object(
        {
            page: joi.number()
                .integer()
                .min(1)
                .max(5)
                .default(1),

            limit: joi.number()
                .min(1)
                .max(100)
                .optional()
                .default(10),

            sort: joi.string()
                // sort can be done based on score also like we took down
                .valid('createdAt', '-createdAt', 'matchSCore', '-matchScore')
                .default('createdAt')
                .optional(),

            status: joi.string()
                .valid('pending', 'completed', 'processing', 'failed')
                .optional(),

            resumeId: joi.string()
                .custom(validateAnalysisId)
                .optional()
                .messages({
                    'any.inbalid': 'Invalid resume Id'
                }),

            jobRoleId: joi.string()
                .custom(validateAnalysisId)
                .optional()
                .messages({
                    'any.invalid': 'Invalid Job role id format'
                }),

            // means get analysis according to this minimum score
            minMatchScore: joi.number()
                .integer()
                .min(1)
                .max(100)
                .optional(),

            maxMatchScore: joi.number()
                .min(0)
                .max(100)
                .optional(),
        }
    )

    const { error, value } = schema.validate(req.query)

    if (error) {
        throw new ApiError(400, error.details[0].message)
    }

    // if user provided that min match score and max match score means suppose search analysis netween 65 and 90 analysis. this is valid
    // but if user gave search between 70 and 50 . it is wrong
    // ADD THIS LINE after schema.validate
const { minMatchScore, maxMatchScore } = value;

if (minMatchScore && maxMatchScore) {
    if (minMatchScore > maxMatchScore) {
        throw new ApiError(400, "Min Match score cannot be greater than Max Match Score")
    }
}
    req.query = value
    next()
}

const validateCompareRoles = (req, res, next) => {

    // comparing roles means ur role in resume is compared with multiple job roles. so u need to provide job roles resume id
    const schema = joi.object(
        {
            resumeId: joi.string()
                .custom(validateAnalysisId)
                .required()
                .message({
                    'any.inavlid': 'Provided resume id format is wrong',
                    'string.empty': 'Resume Id cannot be empty'
                }),

            jobRolesId: joi.array()
                .items(
                    joi.string()
                        .custom(validateAnalysisId)
                        .message({
                            'any.invalid': 'Invalid Id format',
                        })
                )
                .min(1)
                .max(5)
                .required()
                .required()
                .messages({
                    'array.min': 'Please provide at least 2 job roles to compare',
                    'array.max': 'You can compare maximum 5 job roles at once',
                    'array.base': 'jobRoleIds must be an array',
                }),


        }

    )

    const { errors, value } = schema.validate(req.body)

    if (errors) {
        throw new ApiError(400, errors.details[0].messages)
    }
    // passing corrected values to body
    req.body = value
    next()
}


const validateAnalysisIdIsCorrect = (req, res, next) => {

    const schema = joi.object(
        {
            id: joi.string()
                .custom(validateAnalysisId)
                .required()
                .message({
                    'any.invalid': 'Invalid analysis Id Format'
                })
        }
    )

    const { error } = schema.validate(req.params)

    if (error) {
        throw new ApiError(401, 'Invalid Analysis Id')
    }

    next()
}

const validateRegenerateAnalysis = (req, res, next) => {
    const schema = joi.object({
        preferences: joi.object({
            hoursPerWeek: joi.number()
                .integer()
                .min(1)
                .max(168)
                .optional(),

            budget: joi.string()
                .valid('free', 'low', 'medium', 'high')
                .optional(),

            learningStyle: joi.string()
                .valid('visual', 'auditory', 'reading', 'kinesthetic', 'mixed')
                .optional(),
        }).optional(),
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
        throw new ApiError(400, error.details[0].message);
    }

    req.body = value;

    next();
};

export { validateAnalysisId, validateAnalysisIdIsCorrect, validateCompareRoles, validateCreatingAnalysis, validateGetAnalysis, validateRegenerateAnalysis }
// When we GET analyses, usually we pass page, limit, sort.
// Then why are resumeId, jobRoleId, minMatchScore, maxMatchScore also there?

// Very good backend thinking.

// 🎯 Short Answer

// Because GET API is not just for pagination.

// It also supports filtering.

// 🔎 Pagination vs Filtering
// 🔹 Pagination (basic control)

// page

// limit

// sort

// These control how results are shown.

// 🔹 Filtering (advanced control)

// resumeId

// jobRoleId

// status

// minMatchScore

// maxMatchScore

// These control which results are shown.

// 📌 Example 1 — Normal Admin View
// GET /api/analyses?page=1&limit=10

// Shows:
// All analyses (first 10).

// 📌 Example 2 — Show analyses for one resume only
// GET /api/analyses?resumeId=65abc...

// Shows:
// Only analyses related to that resume.

// Very useful when user opens:

// 👉 "View analyses for my resume"

// 📌 Example 3 — Show analyses for one job role
// GET /api/analyses?jobRoleId=77def...

// Shows:
// All users compared against this job role.

// Useful for admin dashboard.

// 📌 Example 4 — Show high match scores only
// GET /api/analyses?minMatchScore=80

// Shows:
// Only analyses with score ≥ 80.

// Useful for:
// 👉 “Top candidates”

// 📌 Example 5 — Score Range
// GET /api/analyses?minMatchScore=50&maxMatchScore=80

// Shows:
// Analyses between 50–80%.