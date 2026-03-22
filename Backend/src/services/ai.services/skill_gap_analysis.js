import { getModel } from '../../config/gemini.js';
import logger from '../../utils/logs.js';

class SkillGapAnalysis {
    async performDeepSkillGapAnalyze(resumeData, jobRole) {
        try {
            const prompt = `
You are an expert career coach analyzing a candidate's fit for a job role.

CANDIDATE PROFILE:
${JSON.stringify(resumeData, null, 2)}

TARGET JOB ROLE: ${jobRole.title}
CATEGORY: ${jobRole.category}
EXPERIENCE LEVEL: ${jobRole.experienceLevel}

REQUIRED SKILLS:
Critical: ${JSON.stringify(jobRole.requiredSkills.critical)}
Important: ${JSON.stringify(jobRole.requiredSkills.important)}
Nice-to-Have: ${JSON.stringify(jobRole.requiredSkills.niceToHave)}

Perform comprehensive gap analysis and return ONLY valid JSON:

{
  "overallAssessment": {
    "matchPercentage": 85,
    "readinessLevel": "nearly-ready",
    "estimatedTimeToReady": {
      "weeks": 12,
      "reason": "Need to learn 3 critical skills"
    },
    "summary": "Strong foundation with gaps in deployment tools"
  },
  "skillGaps": {
    "critical": [
      {
        "skill": "Docker",
        "importance": 9,
        "reason": "Essential for containerization",
        "learningTime": "4-6 weeks",
        "difficulty": "intermediate",
        "prerequisites": ["Linux basics", "CLI"]
      }
    ],
    "important": [],
    "niceToHave": []
  },
  "strengths": [
    {
      "skill": "React",
      "proficiency": "advanced",
      "relevance": "Core requirement for frontend",
      "uniqueAdvantage": "3 years production experience",
      "importance": 9
    }
  ],
  "transferableSkills": [
    {
      "skill": "JavaScript",
      "relatesTo": ["TypeScript", "Node.js"],
      "explanation": "Strong JS foundation helps learn TS quickly"
    }
  ],
  "experienceGap": {
    "candidateYears": 3,
    "typicalRequirement": 5,
    "assessment": "Slightly below typical requirement but skills compensate"
  },
  "recommendations": [
    "Focus on Docker and Kubernetes first",
    "Build 2-3 full-stack projects",
    "Get AWS certification"
  ]
}

Return ONLY the JSON object, no markdown formatting.
`;

            // Get Gemini model
            const model = getModel();

            // Generate content
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();

            // Clean the response
            const cleanedContent = rawText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            // Parse JSON
            const structuredData = JSON.parse(cleanedContent);

            if (!structuredData || !structuredData.overallAssessment) {
                throw new Error('Invalid response from AI');
            }

            logger.info('Skill gap analysis completed with Gemini');
            return structuredData;

        } catch (error) {
            logger.error(`Skill gap analysis failed: ${error.message}`);
            throw new Error(`Failed to perform skill gap analysis: ${error.message}`);
        }
    }
}

const skillgapanalysis = new SkillGapAnalysis();
export default skillgapanalysis;