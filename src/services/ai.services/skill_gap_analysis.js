import { claude, CLAUDE_CONFIG } from "../../config/claude"
import logger from "../../../utils/logs"


class SkillGapAnalysis {

    //  in this we provide the resume data that we had extracted from resume parser and target job role he needs
    // so u must analyze the gaps between both which provide them a clear path and let them know how behind r they
    async performDeepSkillGapAnalyze(resumeData, jobRole) {

        try {

            const prompt =
                `
            You are an expert career coach analyzing a candidate's fit for a job role.

            CANDIDATE PROFILE:
            ${JSON.stringify(resumeData)}

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
                "matchPercentage": "number 0-100",
                "readinessLevel": "not-ready|nearly-ready|ready|overqualified",
                "estimatedTimeToReady": {
                "weeks": "number",
                "reason": "string"
                },
                "summary": "string (2-3 sentences)"
            },
            "skillGaps": {
                "critical": [
                {
                    "skill": "string",
                    "importance": "number 1-10",
                    "reason": "why this skill matters for this role",
                    "learningTime": "e.g., 2-3 weeks",
                    "difficulty": "beginner|intermediate|advanced",
                    "prerequisites": ["string"]
                }
                ],
                "important": [],
                "niceToHave": []
            },
            "strengths": [
                {
                "skill": "string",
                "proficiency": "beginner|intermediate|advanced|expert",
                "relevance": "how this helps in target role",
                "uniqueAdvantage": "what makes candidate stand out",
                'importance':'Number'
                }
            ],
            "transferableSkills": [
                {
                "skill": "string",
                "relatesTo": ["required skills this connects to"],
                "explanation": "how to leverage this"
                }
            ],
            "experienceGap": {
                "candidateYears": "number",
                "typicalRequirement": "number",
                "assessment": "string"
            },
            "recommendations": [
                "specific actionable recommendation"
            ]
            }

            Be honest but encouraging. Focus on actionable insights.
            `
            const response = await claude.messages.create(
                {
                    model: CLAUDE_CONFIG.model,
                    max_tokens: CLAUDE_CONFIG.maxTokens,
                    temperature: CLAUDE_CONFIG.temperature,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ]
                }
            )

            const cleanedContent = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();
            // this converts string to js object
            const structuredData = JSON.parse(cleanedContent);

            if (!structuredData) {
                logger.error(`Failed to get response from claude ai for perform deep skill gap analysis.. `)
                throw new Error(`ERROR caused to fetch response for analysis skill gap`);

            }
            logger.info("Deep skill gap analysis done")
            return structuredData

        } catch (error) {
            logger.error(`Failed to perform skill gap analysis of the user`)
            throw new Error("Failed to perform skill gap analysis")
        }
    }
}
const skillgapanalysis = new SkillGapAnalysis();
export default skillgapanalysis;