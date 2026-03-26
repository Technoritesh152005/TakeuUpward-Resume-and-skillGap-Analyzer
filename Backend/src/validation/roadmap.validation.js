import Joi from 'joi';
import mongoose from 'mongoose';
import ApiError from '../utils/apiError.js';

// validation for id 
const objectId = () =>
  Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'ObjectId validation');

  // validation for prefernce given by user
const preferencesSchema = Joi.object({
  hoursPerWeek: Joi.number().integer().min(1).max(168).optional(),
  budget: Joi.string().valid('free', 'low', 'medium', 'high').optional(),
  learningStyle: Joi.string()
    .valid('visual', 'auditory', 'reading', 'kinesthetic', 'mixed')
    .optional(),
}).optional();

// validstion object to validate analysis id during creating roadmap
const createRoadmapSchema = Joi.object({
  analysisId: objectId().required().messages({
    'any.invalid': 'Invalid analysis id format',
    'string.empty': 'Analysis id is required',
  }),
  preferences: preferencesSchema,
});
// validation during getting roadmap - to check whether the id is valid acc to mongoose
const roadmapIdParamsSchema = Joi.object({
  id: objectId().required().messages({
    'any.invalid': 'Invalid roadmap id format',
    'string.empty': 'Roadmap id is required',
  }),
});

const analysisIdParamsSchema = Joi.object({
  analysisId: objectId().required().messages({
    'any.invalid': 'Invalid analysis id format',
    'string.empty': 'Analysis id is required',
  }),
});

const markItemCompleteSchema = Joi.object({
  phaseIndex: Joi.number().integer().min(0).required(),
  weekIndex: Joi.number().integer().min(0).required(),
  itemIndex: Joi.number().integer().min(0).required(),
});

// validation during updating predernce os user
const updatePreferencesSchema = Joi.object({
  hoursPerWeek: Joi.number().integer().min(1).max(168).optional(),
  budget: Joi.string().valid('free', 'low', 'medium', 'high').optional(),
  learningStyle: Joi.string()
    .valid('visual', 'auditory', 'reading', 'kinesthetic', 'mixed')
    .optional(),
}).min(1);

// this is validation during getting view all roadmap - means validate page and limit given by user
const paginationQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const validateRoadmapCreate = (req, res, next) => {
  const { error, value } = createRoadmapSchema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true,
  });

  // createroadmap will have{
    // analysis id ,
    // prefernces
// }
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.body = value;
  next();
};

const validateRoadmapId = (req, res, next) => {
  const { error, value } = roadmapIdParamsSchema.validate(req.params, { abortEarly: true });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.params = value;
  next();
};

// get roadmap by analysis id
const validateRoadmapAnalysisId = (req, res, next) => {
  const { error, value } = analysisIdParamsSchema.validate(req.params, { abortEarly: true });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.params = value;
  next();
};

const validateMarkItemComplete = (req, res, next) => {
  const { error, value } = markItemCompleteSchema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true,
  });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.body = value;
  next();
};

const validateRoadmapPreferencesUpdate = (req, res, next) => {
  const { error, value } = updatePreferencesSchema.validate(req.body, {
    abortEarly: true,
    stripUnknown: true,
  });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.body = value;
  next();
};

const validateRoadmapListQuery = (req, res, next) => {
  const { error, value } = paginationQuerySchema.validate(req.query, {
    abortEarly: true,
    stripUnknown: true,
  });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.query = value;
  next();
};

export {
  validateRoadmapCreate,
  validateRoadmapId,
  validateRoadmapAnalysisId,
  validateMarkItemComplete,
  validateRoadmapPreferencesUpdate,
  validateRoadmapListQuery,
};
