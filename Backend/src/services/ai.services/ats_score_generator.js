import { claude, CLAUDE_CONFIG } from "../../config/claude.js"
import logger from '../../utils/logs.js'

class AtsScoreGenerator {

    // ats score is calculated on the purpose of resume data and his targeted job role
    async getAtsScore(resumeData, targetJobRole) {

        try {

            const prompt =
                `
            Analyze this resume for ATS (Applicant Tracking System) compatibility.

            RESUME:
            ${resumeText}

            TARGET JOB: ${jobRole.title}
            REQUIRED SKILLS: ${JSON.stringify(jobRole.requiredSkills)}

            Return ONLY valid JSON:

            {
            "overallScore": "number 0-100",
            "breakdown": {
                "formatting": {
                "score": "number 0-100",
                "issues": [
                    "specific formatting issue found"
                ],
                "recommendations": ["how to fix"]
                },
                "keywords": {
                "score": "number 0-100",
                "matched": ["keyword found"],
                "missing": ["critical keyword missing"],
                "suggestions": ["where to add keywords"]
                },
                "structure": {
                "score": "number 0-100",
                "issues": ["structural issue"],
                "recommendations": ["how to improve"]
                },
                "content": {
                "score": "number 0-100",
                "strengths": ["what's good"],
                "improvements": ["what to improve"]
                }
            },
            "topPriorities": [
                "Most important fix to make"
            ],
            "estimatedImprovement": "Expected score after fixes"
            }
            `

            const response = await claude.messages.create(
                {
                    model: CLAUDE_CONFIG.model,
                    max_tokens: CLAUDE_CONFIG.maxTokens,
                    temperature: CLAUDE_CONFIG.temperature,
                    messages:
                        [
                            {
                                role: 'user',
                                content: prompt
                            }
                        ]
                }
            )

            if (!response) {
                logger.error('Failed to get response from claude api')
            }

            logger.info(`Succesfully fetched ats score from claude api`)
            const properdata = JSON.parse(response)

            return properdata

        } catch (error) {
            logger.error("Failed to generate ats score ")
            throw new Error("Failed to generate ats ")
        }
    }
}
const generateAtsScore = new AtsScoreGenerator();

export default generateAtsScore;
export { generateAtsScore };