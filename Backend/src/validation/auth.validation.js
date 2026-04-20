// in this validation we will check all the credentials r given before going to bussineess logic
// these validation checker contains of only auth in this file
import joi from 'joi'
import { ApiError } from '../utils/apiError.js'

// joi is not an midlleware we wrap it with middleware


const validateSignUp = (req, res, next) => {
    const validateSignUpSchema = joi.object({
        name: joi
            .string()
            .min(2)
            .max(30)
            .required()
            .messages({
                'string.empty': 'Name is required',
                'string.min': 'Name must be at least 2 character',
                'string.max': 'Name cannot exceed 30 characters'
            }),

        email: joi
            .string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.empty': 'Email cannot be empty. Please provide email',
                'string.lowercase': 'Email must be in lowercase letters  ',
                'string.email': 'given email dont suit email format'
            }),

        password: joi.
            string()
            .required()
            .min(8)
            .max(128)
            .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
            .messages(
                {
                    'password.empty': 'Password cannot be empty',
                    'password.min': 'Password should be min 8 characters',
                    'password.max': 'Password cannot exceed more than 128 characters',
                    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
                }
            ),

       

        location: joi
            .string()
            .trim()
            .max(100)
            .optional(),


    })

    // if any error during this we need to handle.. u may get object of array
    const { error } = validateSignUpSchema.validate(req.body)

    // now map through each error obj and return it in apierror
    if (error) {
        const errormsg = error.details.map((err) => err.message)
        //['invalid email format, 'phone number is less']
        throw new ApiError(400, errormsg.join(', '))
    }

    
    next()
}

// **
//  * Validate login request
//  */
const validateLogin = (req, res, next) => {
    const schema = joi.object({
        email: joi.string()
            .email()
            .lowercase()
            .trim()
            .required()
            .messages({
                'string.empty': 'Email is required',
                'string.email': 'Please provide a valid email address',
            }),

        password: joi.string()
            .required()
            .messages({
                'string.empty': 'Password is required',
            }),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        // for better ux we display only 1 validation at a time
        throw new ApiError(400, error.details[0].message);
    }

    next();
};

/**
 * Validate password change request
 */
// const validatePasswordChange = (req, res, next) => {
//     const schema = joi.object({
//         currentPassword: joi.string()
//             .required()
//             .messages({
//                 'string.empty': 'Current password is required',
//             }),

//         newPassword: joi.string()
//             .min(8)
//             .max(128)
//             .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
//             .required()
//             .messages({
//                 'string.empty': 'New password is required',
//                 'string.min': 'New password must be at least 8 characters',
//                 'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
//             }),
//     });

//     const { error } = schema.validate(req.body);

//     if (error) {
//         throw new ApiError(400, error.details[0].message);
//     }

//     next();
// };

/**
 * Validate update profile request
 */
const validateUpdateProfile = (req, res, next) => {
    const schema = joi.object({
        name: joi.string()
            .trim()
            .min(2)
            .max(50)
            .optional(),

      
        location: joi.string()
            .trim()
            .max(100)
            .optional(),

        bio: joi.string()
            .trim()
            .max(500)
            .optional(),

        preferences: joi.object({
            hoursPerWeek: joi.number()
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

        careerPreferences: joi.object({
            targetRole: joi.string()
                .trim()
                .max(100)
                .optional(),

            experienceLevel: joi.string()
                .valid('student', 'fresher', 'junior', 'mid', 'senior', 'lead')
                .optional(),

            preferredJobType: joi.string()
                .valid('full-time', 'internship', 'contract', 'freelance', 'part-time')
                .optional(),

            preferredLocation: joi.string()
                .trim()
                .max(100)
                .optional(),

            remotePreference: joi.string()
                .valid('remote', 'hybrid', 'onsite', 'flexible')
                .optional(),

            industryInterest: joi.array()
                .items(joi.string().trim().max(100))
                .optional(),
        }).optional(),

        avatar: joi.string()
            .trim()
            .uri()
            .optional(),

        profilePicture: joi.string()
            .trim()
            .uri()
            .optional(),
    });

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map((detail) => detail.message);
        throw new ApiError(400, errors.join(', '));
    }

    next();
};

const validateUpdateNotifications = (req, res, next) => {
    const schema = joi.object({
        email: joi.boolean().optional(),
        roadMapUpdates: joi.boolean().optional(),
        weeklyProgess: joi.boolean().optional(),
    }).min(1);

    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const errors = error.details.map((detail) => detail.message);
        throw new ApiError(400, errors.join(', '));
    }

    next();
};

export { validateLogin, validateSignUp, validateUpdateProfile, validateUpdateNotifications }
