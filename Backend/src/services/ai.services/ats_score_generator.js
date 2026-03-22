import { getModel } from '../../config/gemini.js';
import logger from '../../utils/logs.js';

class AtsScoreGenerator {
    async getAtsScore(resumeData, jobRole) {
        try {
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

            const model = getModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();

            const cleanedContent = rawText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const properData = JSON.parse(cleanedContent);

            if (!properData || !properData.overallScore) {
                throw new Error('Invalid ATS score response from AI');
            }

            logger.info('ATS score generated successfully with Gemini');
            return properData;

        } catch (error) {
            logger.error(`ATS score generation failed: ${error.message}`);
            throw new Error(`Failed to generate ATS score: ${error.message}`);
        }
    }
}

const generateAtsScore = new AtsScoreGenerator();
export default generateAtsScore;
export { generateAtsScore };