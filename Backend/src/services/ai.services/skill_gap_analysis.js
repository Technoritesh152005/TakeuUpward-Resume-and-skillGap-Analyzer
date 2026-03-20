import { claude, CLAUDE_CONFIG } from '../../config/claude.js';
import logger from '../../utils/logs.js';

class SkillGapAnalysis {
    /**
     * Perform deep skill gap analysis
     * @param {Object} resumeData - Parsed resume data
     * @param {Object} jobRole - Target job role
     * @returns {Object} - Structured analysis data
     */
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

Be honest but encouraging. Focus on actionable insights.
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
            const structuredData = JSON.parse(cleanedContent);

            if (!structuredData || !structuredData.overallAssessment) {
                logger.error('Invalid response structure from Claude AI');
                throw new Error('Failed to get valid analysis from AI');
            }

            logger.info('Deep skill gap analysis completed successfully');
            return structuredData;

        } catch (error) {
            logger.error(`Failed to perform skill gap analysis: ${error.message}`);
            throw new Error(`Failed to perform skill gap analysis: ${error.message}`);
        }
    }
}

const skillgapanalysis = new SkillGapAnalysis();
export default skillgapanalysis;