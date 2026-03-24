import logger from '../../utils/logs.js';
import { getModel } from '../../config/gemini.js';

class AnalyzeResumeStructure {


  // take all the conten which lies bwn { }
  extractJsonBlock(content) {
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return content;
    }

    return content.slice(firstBrace, lastBrace + 1);
  }

  // to just make data pure json only no markdown nothing and sometimes also has extra fancy quotes
  normalizeJsonString(content) {
    return content
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, '$1')
      .trim();
  }

  async repairJsonWithGemini(invalidJson) {
    const repairPrompt = `
  You are a JSON repair tool.
  Return ONLY valid JSON with double-quoted keys and strings.
  Do not add commentary. Do not wrap in markdown.
  
  INVALID JSON:
  ${invalidJson}
  `;
  
  // way to communicate to gemini
    const model = getModel();
    const result = await model.generateContent(repairPrompt);
    const response = await result.response;
    const text = response.text();
  
    return this.normalizeJsonString(text);
  }

// all in one block
  async parseStructuredJson(rawContent) {
    // remove trailling commas
  const normalized = this.normalizeJsonString(rawContent);
  // take content of json only
  const extracted = this.extractJsonBlock(normalized);

  try {
    return JSON.parse(extracted);
  } catch (firstError) {
    logger.error(`Primary JSON parse failed: ${firstError.message}`);

    const repaired = await this.repairJsonWithGemini(extracted);
    const repairedExtract = this.extractJsonBlock(repaired);
    return JSON.parse(repairedExtract);
  }
}

  async analyzeResumeStructure(resumeText) {
    try {
      const prompt = `
You are an expert resume analyzer. Extract structured information from this resume.

RESUME TEXT:
${resumeText}

Extract and return ONLY valid JSON (no markdown, no explanations) with this exact structure:
{
  "personal": {
    "name": "string or null",
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null",
    "github": "string or null",
    "portfolio": "string or null"
  },
  "summary": "string or null",
  "education": [
    {
      "degree": "string",
      "major": "string",
      "institution": "string",
      "location": "string or null",
      "gpa": "number or null",
      "startDate": "string or null",
      "endDate": "string or null",
      "current": "boolean",
      "achievements": ["string"]
    }
  ],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string or null",
      "startDate": "string or null",
      "endDate": "string or null",
      "current": "boolean",
      "description": "string",
      "responsibilities": ["string"],
      "achievements": ["string"],
      "skillsUsed": ["string"]
    }
  ],
  "skills": {
    "technical": ["string"],
    "tools": ["string"],
    "languages": ["string"],
    "frameworks": ["string"],
    "databases": ["string"],
    "soft": ["string"]
  },
  "projects": [
    {
      "title": "string",
      "description": "string",
      "technologies": ["string"],
      "url": "string or null",
      "github": "string or null",
      "startDate": "string or null",
      "endDate": "string or null",
      "highlights": ["string"]
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "issueDate": "string or null",
      "expiryDate": "string or null",
      "credentialId": "string or null",
      "url": "string or null"
    }
  ],
  "achievements": ["string"],
  "languages": [
    {
      "language": "string",
      "proficiency": "basic|intermediate|fluent|native"
    }
  ]
}

IMPORTANT:
- Return ONLY the JSON object
- Use null for missing fields
- Keep all arrays even if empty []
- Be thorough in extraction
`;

// configuration to set our prompt to gemini
      const model = getModel();
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();

      // usually llm model structure are not proper
      const structuredData = await this.parseStructuredJson(rawText);

      if (structuredData) {
        logger.info('Resume structure analyzed successfully with Gemini');
        return structuredData;
      }
    } catch (err) {
      logger.error(`Failed to analyze resume structure: ${err.message}`);
      throw new Error('Failed to analyze resume structure');
    }
  }
}

const resumeStructureInstance = new AnalyzeResumeStructure();
export default resumeStructureInstance;