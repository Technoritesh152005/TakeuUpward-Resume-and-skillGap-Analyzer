import { GoogleGenerativeAI } from '@google/generative-ai';
import logger from '../utils/logs.js';

const GEMINI_CONFIG = {
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  fallbackModel: process.env.GEMINI_FALLBACK_MODEL || '',
  temperature: 0.7,
  maxOutputTokens: 3000,
};

// primary model primary keys
const PRIMARY_GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
].filter(Boolean);

// fallback model fallback keys
const FALLBACK_GEMINI_KEYS = [
  process.env.GEMINI_API_KEY_3,
].filter(Boolean);

const RETRYABLE_STATUS_CODES = ['429', '500', '502', '503', '504'];

const extractGeminiErrorMeta = (error) => {
  const message = String(error?.message || '');
  const statusMatch = message.match(/\[(\d{3})[^\]]*\]/);
  const retryDelayMatch = message.match(/retry(?: in|Delay"?\s*:\s*"?)([\d.]+)s/i);

  return {
    message,
    statusCode: statusMatch ? statusMatch[1] : '',
    retryAfterSeconds: retryDelayMatch ? Math.max(1, Math.ceil(Number(retryDelayMatch[1]) || 0)) : null,
  };
};

const buildGeminiFinalError = (attempts = []) => {
  const serviceUnavailableAttempt = attempts.find((attempt) => attempt.meta.statusCode === '503');
  const rateLimitedAttempt = attempts.find((attempt) => attempt.meta.statusCode === '429');
  const timeoutAttempt = attempts.find((attempt) =>
    /timeout|timed out|econnreset|socket hang up/i.test(attempt.meta.message)
  );

  if (serviceUnavailableAttempt && rateLimitedAttempt) {
    const retryAfter = rateLimitedAttempt.meta.retryAfterSeconds;
    return new Error(
      retryAfter
        ? `Primary AI model is temporarily unavailable (503) and fallback quota is exhausted (429). Retry after ${retryAfter}s.`
        : 'Primary AI model is temporarily unavailable (503) and fallback quota is exhausted (429).'
    );
  }

  if (rateLimitedAttempt) {
    const retryAfter = rateLimitedAttempt.meta.retryAfterSeconds;
    return new Error(
      retryAfter
        ? `AI provider quota/rate limit reached (429). Retry after ${retryAfter}s.`
        : 'AI provider quota/rate limit reached (429).'
    );
  }

  if (serviceUnavailableAttempt) {
    return new Error('Primary AI model is temporarily unavailable (503). Please retry shortly.');
  }

  if (timeoutAttempt) {
    return new Error('AI provider connection timed out. Please retry shortly.');
  }

  return null;
};

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
  const attempts = [];

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
      const meta = extractGeminiErrorMeta(error);
      const retryable = isRetryableGeminiError(error);
      attempts.push({ modelName, keyLabel, meta });

      logger.warn(`Gemini request failed on model ${modelName}, ${keyLabel}: ${error.message}`);

      if (!retryable) {
        throw error;
      }
    }
  }

  throw buildGeminiFinalError(attempts) || lastError || new Error('Gemini request failed');
};

export { getModel, GEMINI_CONFIG, generateContentWithFallback };
