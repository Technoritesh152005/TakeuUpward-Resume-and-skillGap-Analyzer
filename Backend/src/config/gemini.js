import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini configuration — use a current model id (gemini-pro is retired → 404 on generateContent)
const GEMINI_CONFIG = {
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  temperature: 0.7,
  maxOutputTokens: 8000,
};

// Get model instance
const getModel = () => {
  return genAI.getGenerativeModel({ 
    model: GEMINI_CONFIG.model,
    generationConfig: {
      temperature: GEMINI_CONFIG.temperature,
      maxOutputTokens: GEMINI_CONFIG.maxOutputTokens,
    }
  });
};

export { getModel, GEMINI_CONFIG };