// this will simply call ai and pass text and get proper structured format details from it
import logger from '../../utils/logs.js';
import { claude, CLAUDE_CONFIG } from '../../config/claude.js';

class AnalyzeResumeStructure {
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

      const response = await claude.messages.create({
        model: CLAUDE_CONFIG.model,
        temperature: CLAUDE_CONFIG.temperature,
        maxTokens: CLAUDE_CONFIG.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const result = response.content[0].text;

      // converts or remove those json backticks
      const cleanedContent = result
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      // this converts string to js object
      const structuredData = JSON.parse(cleanedContent);
      if (structuredData) {
        logger.info(`Successfully analyzed resume structure ${result}`);
        return structuredData;
      }
    } catch (err) {
      logger.error(`Failed to analyze resume structure ${err.message}`);
      throw new Error('Failed to analyze resume structure');
    }
  }
}

const resumeStructureInstance = new AnalyzeResumeStructure();

export default resumeStructureInstance;