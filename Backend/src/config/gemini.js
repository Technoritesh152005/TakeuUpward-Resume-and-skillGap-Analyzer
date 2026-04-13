import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logs.js';

const GEMINI_CONFIG = {
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  fallbackModel: process.env.GEMINI_FALLBACK_MODEL || '',
  temperature: 0.7,
  maxOutputTokens: 3000,
};

const PRIMARY_GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean);

const FALLBACK_GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

const RETRYABLE_STATUS_CODES = ['429', '500', '502', '503', '504'];

// checkts whether the error status code is one of the above following
const isRetryableGeminiError = (error) => {
  const message = String(error?.message || '');
  return RETRYABLE_STATUS_CODES.some((code) => message.includes(`[${code}`)) ||
    /timeout|timed out|econnreset|socket hang up/i.test(message);
};

const getModelOptions = (modelName) => ({
  model: modelName,
  generationConfig: {
    temperature: GEMINI_CONFIG.temperature,
    maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
  },
});

const getModel = () => {
  const activeKey = PRIMARY_GEMINI_KEYS[0] || FALLBACK_GEMINI_KEYS[0];

  if (!activeKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(activeKey);
  return genAI.getGenerativeModel(getModelOptions(GEMINI_CONFIG.model));
};

const generateContentWithFallback = async (payload) => {
  if (!PRIMARY_GEMINI_KEYS.length && !FALLBACK_GEMINI_KEYS.length) {
    throw new Error('No Gemini API keys configured');
  }

  let lastError = null;

  const modelKeyPairs = [
    ...PRIMARY_GEMINI_KEYS.map((apiKey, index) => ({
      modelName: GEMINI_CONFIG.model,
      apiKey,
      keyLabel: `primary key ${index + 1}`,
    })),
    ...(GEMINI_CONFIG.fallbackModel
      ? FALLBACK_GEMINI_KEYS.map((apiKey, index) => ({
          modelName: GEMINI_CONFIG.fallbackModel,
          apiKey,
          keyLabel: `fallback key ${index + 1}`,
        }))
      : []),
  ];

  for (const { modelName, apiKey, keyLabel } of modelKeyPairs) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel(getModelOptions(modelName));
      return await model.generateContent(payload);
    } catch (error) {
      lastError = error;
      const retryable = isRetryableGeminiError(error);

      logger.warn(`Gemini request failed on model ${modelName}, ${keyLabel}: ${error.message}`);

      if (!retryable) {
        throw error;
      }
    }
  }

  throw lastError || new Error('Gemini request failed');
};

export { getModel, GEMINI_CONFIG, generateContentWithFallback };
