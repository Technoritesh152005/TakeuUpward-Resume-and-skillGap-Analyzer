import logger from '../../utils/logs.js';
import { generateContentWithFallback } from '../../config/gemini.js';

class AnalyzeResumeStructure {
  // take the first balanced JSON object/array block only
  // it takes all data which r in nested form also
  extractJsonBlock(content) {
    // it looks for {
    const startIndex = content.search(/[\[{]/);
    if (startIndex === -1) {
      return content.trim();
    }

    const opening = content[startIndex];
    // if { then closing is }
    const closing = opening === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = startIndex; index < content.length; index += 1) {
      const char = content[index];

      if (inString) {
        if (escaped) {
          escaped = false;
          continue;
        }

        if (char === '\\') {
          escaped = true;
          continue;
        }

        if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
        continue;
      }

      if (char === opening) {
        depth += 1;
      } else if (char === closing) {
        depth -= 1;
        if (depth === 0) {
          return content.slice(startIndex, index + 1).trim();
        }
      }
    }

    return content.slice(startIndex).trim();
  }

  // escape raw tabs/newlines inside strings before parsing
  escapeControlCharactersInStrings(content) {
    let escapedContent = '';
    let inString = false;
    let escaped = false;

    for (const char of content) {
      if (inString) {
        if (escaped) {
          escapedContent += char;
          escaped = false;
          continue;
        }

        if (char === '\\') {
          escapedContent += char;
          escaped = true;
          continue;
        }

        if (char === '"') {
          escapedContent += char;
          inString = false;
          continue;
        }

        if (char === '\n') {
          escapedContent += '\\n';
          continue;
        }

        if (char === '\r') {
          escapedContent += '\\r';
          continue;
        }

        if (char === '\t') {
          escapedContent += '\\t';
          continue;
        }

        escapedContent += char;
        continue;
      }

      if (char === '"') {
        inString = true;
      }

      escapedContent += char;
    }

    return escapedContent;
  }

  // to just make data pure json only no markdown nothing and sometimes also has extra fancy quotes
  normalizeJsonString(content) {
    return String(content ?? '')
      .replace(/^\uFEFF/, '')
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/g, '')
      .replace(/[â€œâ€]/g, '"')
      .replace(/[â€˜â€™]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/,\s*([}\]])/g, '$1')
      .trim();
  }

  tryParseJson(content) {
    const normalized = this.normalizeJsonString(content);
    const extracted = this.extractJsonBlock(normalized);
    const candidates = [
      extracted,
      this.escapeControlCharactersInStrings(extracted),
    ];

    let lastError = null;

    for (const candidate of candidates) {
      try {
        return JSON.parse(candidate);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError;
  }

  // this is a fallback if the parser fails
  async repairJsonWithGemini(invalidJson) {
    const repairPrompt = `
You are a JSON repair tool.
Return ONLY valid JSON with double-quoted keys and strings.
Do not add commentary. Do not wrap in markdown.

INVALID JSON:
${invalidJson}
`;

    const result = await generateContentWithFallback({
      contents: [{ role: 'user', parts: [{ text: repairPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });
    const response = await result.response;
    const text = response.text();

    return this.normalizeJsonString(text);
  }

  // all in one block
  // it both does normalization and extract json block
  async parseStructuredJson(rawContent) {
    const normalized = this.normalizeJsonString(rawContent);
    // we use ai cause ai can send extra markup before or after json
    const extracted = this.extractJsonBlock(normalized);

    try {
      // It is used to safely convert a string into a JSON object without crashing the app
      return this.tryParseJson(extracted);

      // if u got error while converting clean js object string to js object  do repairJsonWithGemini
    } catch (firstError) {
      logger.warn(`Primary JSON parse failed, attempting Gemini repair: ${firstError.message}`);

      const repaired = await this.repairJsonWithGemini(extracted);
      return this.tryParseJson(repaired);
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

      const result = await generateContentWithFallback({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });
      const response = await result.response;
      const rawText = response.text();

      // this give the cean structured js object data
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
