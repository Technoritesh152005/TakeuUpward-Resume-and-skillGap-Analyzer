import { claude, CLAUDE_CONFIG } from '../../config/claude.js';
import logger from '../../utils/logs.js';

class AtsScoreGenerator {
    /**
     * Generate ATS score for resume
     * @param {Object} resumeData - Parsed resume data
     * @param {Object} jobRole - Target job role
     * @returns {Object} - ATS score breakdown
     */
    async getAtsScore(resumeData, jobRole) {
        try {
            // Convert resume data to text format
            const resumeText = JSON.stringify(resumeData, null, 2);

            const prompt = `
Analyze this resume for ATS (Applicant Tracking System) compatibility.

RESUME:
${resumeText}

TARGET JOB: ${jobRole.title}
REQUIRED SKILLS: ${JSON.stringify(jobRole.requiredSkills)}

Return ONLY valid JSON:

{
  "overallScore": 75,
  "breakdown": {
    "formatting": {
      "score": 80,
      "issues": [
        "Uses tables which some ATS can't parse",
        "Complex formatting in header"
      ],
      "recommendations": [
        "Use simple text formatting",
        "Avoid tables and columns"
      ]
    },
    "keywords": {
      "score": 70,
      "matched": ["React", "JavaScript", "Node.js"],
      "missing": ["Docker", "Kubernetes", "AWS"],
      "suggestions": [
        "Add Docker in skills section",
        "Mention cloud platforms in experience"
      ]
    },
    "structure": {
      "score": 85,
      "issues": [
        "Missing clear section headers"
      ],
      "recommendations": [
        "Use standard section names: Experience, Education, Skills"
      ]
    },
    "content": {
      "score": 75,
      "strengths": [
        "Clear work experience descriptions",
        "Quantified achievements"
      ],
      "improvements": [
        "Add more technical keywords",
        "Include certifications section"
      ]
    }
  },
  "topPriorities": [
    "Add missing critical keywords: Docker, Kubernetes",
    "Simplify formatting to avoid ATS parsing issues",
    "Add certifications section"
  ],
  "estimatedImprovement": "Expected score: 85-90 after fixes"
}

Return ONLY the JSON object, no markdown formatting.
`;

            const response = await claude.messages.create({
                model: CLAUDE_CONFIG.model,
                max_tokens: CLAUDE_CONFIG.maxTokens,
                temperature: CLAUDE_CONFIG.temperature,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            });

            // ✅ FIX: Extract text from response properly
            const rawText = response.content[0].text;

            // Clean the response
            const cleanedContent = rawText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            // Parse JSON
            const properData = JSON.parse(cleanedContent);

            if (!properData || !properData.overallScore) {
                logger.error('Invalid ATS score response from Claude AI');
                throw new Error('Failed to get valid ATS score from AI');
            }

            logger.info('Successfully generated ATS score from Claude API');
            return properData;

        } catch (error) {
            logger.error(`Failed to generate ATS score: ${error.message}`);
            throw new Error(`Failed to generate ATS score: ${error.message}`);
        }
    }
}

const generateAtsScore = new AtsScoreGenerator();

export default generateAtsScore;
export { generateAtsScore };