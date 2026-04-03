export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  TXT: 'text/plain',
};

export const ANALYSIS_STATUS = {
  QUEUED: 'queued',
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const ANALYSIS_PROCESSING_STAGE = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  FINALIZING: 'finalizing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const ROADMAP_STATUS = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const ROADMAP_PROCESSING_STAGE = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  FINALIZING: 'finalizing',
  COMPLETED: 'completed',
  FAILED: 'failed',
};

export const QUEUE_NAMES = {
  ANALYSIS_GENERATION: 'analysis-generation',
  ROADMAP_GENERATION: 'roadmap-generation',
};

export const JOB_CATEGORIES = {
  SOFTWARE_ENGINEERING: 'Software Engineering',
  DATA_SCIENCE: 'Data Science',
  PRODUCT: 'Product',
  DESIGN: 'Design',
  MARKETING: 'Marketing',
  BUSINESS: 'Business',
};

export const EXPERIENCE_LEVELS = {
  ENTRY: 'Entry Level',
  MID: 'Mid Level',
  SENIOR: 'Senior Level',
  LEAD: 'Lead/Principal',
};

export const GAP_CATEGORIES = {
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  NICE_TO_HAVE: 'nice-to-have',
};

export const RESOURCE_TYPES = {
  COURSE: 'course',
  BOOK: 'book',
  TUTORIAL: 'tutorial',
  VIDEO: 'video',
  ARTICLE: 'article',
  PRACTICE: 'practice',
  PROJECT: 'project',
  CERTIFICATION: 'certification',
  DOCUMENTATION: 'documentation',
};

export const CACHE_TTL = {
  SHORT: 300,
  MEDIUM: 1800,
  LONG: 3600,
  VERY_LONG: 86400,
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export default {
  ROLES,
  FILE_TYPES,
  ANALYSIS_STATUS,
  JOB_CATEGORIES,
  EXPERIENCE_LEVELS,
  GAP_CATEGORIES,
  RESOURCE_TYPES,
  CACHE_TTL,
  PAGINATION,
  ANALYSIS_PROCESSING_STAGE,
  ROADMAP_STATUS,
  ROADMAP_PROCESSING_STAGE,
  QUEUE_NAMES,
};
