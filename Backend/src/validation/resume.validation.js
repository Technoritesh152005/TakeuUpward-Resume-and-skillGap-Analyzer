import joi from 'joi'
import ApiError from "../utils/apiError.js"
import mongoose from 'mongoose'

// checks whether given id is a valid mongodb object/id
// value = actual field value (like req.params.id)
// helpers = Joi internal object used to throw errors
// joi provide value and helpers to handle error
const validateObjectId = (value, helpers) => {
    if (!mongoose.Types.ObejctId.isValid(value)) {
        return helpers.error('any.valid')
    }
}

// we need to validate resume before going to controller that title and content is given
// it is additional

const validateResumeBeforeUpload = (req, res, next) => {

    const schema = joi.object(
        {
            // it is optional
            title: joi.string()
                .optional()
                .max(20)
                .trim(),

            notes: joi.string()
                .optional()
                .max(300)
                .trim()

        }
    )

    const { error } = schema.validate(req.body)

    if (error) {
        throw new ApiError(401, error.details[0].message)
    }

    next()
}

// suppose user send get resume query. we need to validat
// GET /api/resumes?page=2&limit=5&sort=-createdAte it
// Everything after ? is queryparam

const validateGetResumeQuery = (req, res, next) => {

    const schema = joi.object(
        {
            page: joi.number()
                .exist()
                .integer()
                .min(1)
                .optional()
                .default(1),

            limit: joi.number()
                .min(1)
                .max(12)
                .optional()
                .default(1),

            sort: joi.string()
                // - means descending order = newest first
                .valid('createdAt', '-createdAt', 'filename', '-filename')
                .optional()
                .default('-createdAt'),

            processingStatus: joi.string()
                .valid('pending', 'processing', 'completed', 'failed')
                .optional(),

        }
    )

    //validation return value and error also. we take value here cause request comes /resume?page = 2
    // express gives {page:2}
    // joi gives {page:2,limiy:10,sort:createdAt}
    // so here we modify the query we get with the final query from joi
    const { error, value } = schema.validate(req.query)

    if (error) {
        throw new ApiError(401, error.details[0].message)
    }

    req.query = value

    next()
}

// validate resume id params

const validateResumeId = (req, res, next) => {

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, 'Invalid resume ID format');
    }

    next();
};

const validateResumeUpdate = (req, res, next) => {

    // to validate take req.body from user and make atleast one compulsory
    const schema = joi.object(
        {
            titile: joi.string()
                .optional()
                .max(12)
                .trim(),

            notes: joi.string()
                .trim()
                .max(500)
                .optional(),


        }
    )
    console.log(req.body)
    const { error } = schema.validate(req.body)

    if (error) {
        throw new ApiError(400, error.details[0].message)
    }

    if(Object.keys(req.body).length === 0){
        throw new ApiError(401,'Please provide atleast 1 field to update')
    }

    next()
}

export { validateResumeBeforeUpload, validateGetResumeQuery, validateObjectId, validateResumeId, validateResumeUpdate }



// Case 2️⃣ — Where you take { error, value }

// Example:

// const { error, value } = schema.validate(req.query);
// req.query = value;

// Why here?

// Because:

// Query params come as strings.

// Joi converts them to numbers.

// Joi adds default values.

// Example:

// Request:

// GET /api/resumes?page=2

// Express gives:

// req.query = { page: "2" }   // string

// After Joi:

// value = { page: 2, limit: 10, sort: "-createdAt" }

// Now we replace:

// req.query = value;

// So controller gets clean data.

// 🔥 So When Do We Need value?

// Use value when:

// ✔ You use .default()
// ✔ You want type conversion
// ✔ You want cleaned object
// ✔ You use .stripUnknown()

// Otherwise, checking only error is okay.