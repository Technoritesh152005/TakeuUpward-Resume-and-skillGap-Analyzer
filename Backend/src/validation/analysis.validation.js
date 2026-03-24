import Joi from 'joi';
import mongoose from 'mongoose';
import ApiError from '../utils/apiError.js';

const objectId = () =>
  Joi.string().custom((value, helpers) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return helpers.error('any.invalid');
    }
    return value;
  }, 'ObjectId validation');

const analysisIdParamsSchema = Joi.object({
  id: objectId().required().messages({
    'any.invalid': 'Invalid analysis id format',
    'string.empty': 'Analysis id is required',
  }),
});

const createAnalysisSchema = Joi.object({
  resumeId: objectId().required().messages({
    'any.invalid': 'Invalid resume id format',
    'string.empty': 'Resume id is required',
  }),
  jobRoleId: objectId().required().messages({
    'any.invalid': 'Invalid job role id format',
    'string.empty': 'Job role id is required',
  }),
  preference: Joi.object({
    hoursPerWeek: Joi.number().integer().min(1).max(168).optional(),
    budget: Joi.string().valid('free', 'low', 'medium', 'high').optional(),
    learningStyle: Joi.string()
      .valid('visual', 'auditory', 'reading', 'kinesthetic', 'mixed')
      .optional(),
  }).optional(),
});

const getAnalysisSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string()
    .valid('createdAt', '-createdAt', 'matchScore', '-matchScore')
    .default('-createdAt'),
  status: Joi.string().valid('pending', 'completed', 'processing', 'failed').optional(),
  resumeId: objectId().optional().messages({
    'any.invalid': 'Invalid resume id format',
  }),
  jobRoleId: objectId().optional().messages({
    'any.invalid': 'Invalid job role id format',
  }),
  minMatchScore: Joi.number().min(0).max(100).optional(),
  maxMatchScore: Joi.number().min(0).max(100).optional(),
  isActive: Joi.boolean().optional(),
});

const compareRolesSchema = Joi.object({
  resumeId: objectId().required().messages({
    'any.invalid': 'Invalid resume id format',
    'string.empty': 'Resume id is required',
  }),
  jobRolesId: Joi.array()
    .items(
      objectId().messages({
        'any.invalid': 'Invalid job role id format',
      })
    )
    .min(2)
    .max(5)
    .required()
    .messages({
      'array.min': 'Please provide at least 2 job roles to compare',
      'array.max': 'You can compare maximum 5 job roles at once',
      'array.base': 'jobRolesId must be an array',
    }),
  jobRoleId: Joi.any().optional(),
});

const regenerateAnalysisSchema = Joi.object({
  preferences: Joi.object({
    hoursPerWeek: Joi.number().integer().min(1).max(168).optional(),
    budget: Joi.string().valid('free', 'low', 'medium', 'high').optional(),
    learningStyle: Joi.string()
      .valid('visual', 'auditory', 'reading', 'kinesthetic', 'mixed')
      .optional(),
  }).optional(),
});

const validateCreatingAnalysis = (req, res, next) => {
  const { error, value } = createAnalysisSchema.validate(req.body, { abortEarly: true, stripUnknown: true });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.body = value;
  next();
};

const validateGetAnalysis = (req, res, next) => {
  const { error, value } = getAnalysisSchema.validate(req.query, { abortEarly: true, stripUnknown: true });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }

  if (
    value.minMatchScore !== undefined &&
    value.maxMatchScore !== undefined &&
    value.minMatchScore > value.maxMatchScore
  ) {
    throw new ApiError(400, 'Min match score cannot be greater than max match score');
  }

  req.query = value;
  next();
};

const validateCompareRoles = (req, res, next) => {
  const { error, value } = compareRolesSchema.validate(req.body, { abortEarly: true, stripUnknown: true });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.body = value;
  next();
};

const validateAnalysisId = (req, res, next) => {
  const { error, value } = analysisIdParamsSchema.validate(req.params, { abortEarly: true });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.params = value;
  next();
};

const validateAnalysisIdIsCorrect = validateAnalysisId;

const validateRegenerateAnalysis = (req, res, next) => {
  const { error, value } = regenerateAnalysisSchema.validate(req.body, { abortEarly: true, stripUnknown: true });
  if (error) {
    throw new ApiError(400, error.details[0].message);
  }
  req.body = value;
  next();
};

export {
  validateAnalysisId,
  validateAnalysisIdIsCorrect,
  validateCompareRoles,
  validateCreatingAnalysis,
  validateGetAnalysis,
  validateRegenerateAnalysis,
};
