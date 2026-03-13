import { claude, CLAUDE_CONFIG } from '../../config/claude.js'
import logger from '../../utils/logs.js'

class RoadmapAnalysis {

    // we pass userpreference as empty object if user didnt provide antyhing, we use default value
    async performRoadmap(gapAnalysis, userpreference = {}) {

        try {
            const {
                hoursPerWeek = 12,
                budget = 'free',
                learningStyle = 'mixed',
            } = userpreference

            // now to generate roadmap we create roadmap based on skill gap and user strength means roadmap doesnt include strong strength repeatedly
            const prompt = `
            You are an expert career coach creating a personalized learning roadmap.

            SKILL GAPS TO ADDRESS:
            ${JSON.stringify(gapAnalysis.skillGaps, null, 2)}

            CANDIDATE STRENGTHS:
            ${JSON.stringify(gapAnalysis.strengths, null, 2)}

            USER PREFERENCES:
            - Time available: ${userpreference.hoursPerWeek} hours per week
            - Budget: ${userpreference.budget} (free/low/medium/high)
            - Learning style: ${userpreference.learningStyle}

            Create a detailed 90-day roadmap. Return ONLY valid JSON:

            {
            "duration": {
                "weeks": 12,
                "totalEstimatedHours": "number"
            },
            "phases": [
                {
                "phaseNumber": 1,
                "title": "Foundation Building",
                "duration": "4 weeks",
                "objectives": [
                    "Specific learning objective"
                ],
                "weeklyBreakdown": [
                    {
                    "week": 1,
                    "focus": "JavaScript Fundamentals",
                    "goals": [
                        "Master variables and data types",
                        "Understand functions and scope"
                    ],
                    "timeCommitment": "10 hours",
                    "learningItems": [
                        {
                        "type": "course|tutorial|book|practice|project",
                        "title": "Modern JavaScript Fundamentals",
                        "description": "brief description",
                        "skillsCovered": ["JavaScript", "ES6"],
                        "estimatedHours": 8,
                        "difficulty": "beginner|intermediate|advanced",
                        "isFree": true
                        }
                    ],
                    "project": {
                        "title": "Interactive Calculator",
                        "description": "Build a calculator with event handling",
                        "skills": ["JavaScript", "DOM"],
                        "estimatedHours": 4
                    }
                    }
                ]
                }
            ],
            "quickWins": [
                {
                "skill": "Git basics",
                "timeEstimate": "1 week",
                "impact": "Essential for all development jobs",
                "priority": "high|medium|low"
                }
            ],
            "portfolioProjects": [
                {
                "title": "Full Stack Todo Application",
                "description": "CRUD app with authentication",
                "skillsCovered": ["React", "Node.js", "MongoDB"],
                "difficulty": "intermediate",
                "estimatedTime": "2 weeks",
                "importance": "Demonstrates full-stack skills"
                }
            ],
            "recommendedCertifications": [
                {
                "name": "Meta React Basics",
                "provider": "Coursera",
                "cost": "free|paid",
                "duration": "4 weeks",
                "priority": "high|medium|low",
                "reasoning": "why this certification helps"
                }
            ],
            "milestones": [
                {
                "week": 4,
                "achievement": "JavaScript Fundamentals Complete",
                "deliverable": "3 projects built"
                }
            ]
            }

            Make it realistic, achievable, and motivating. Prioritize critical skills first.
            `

            const response = await claude.messages.create(
                {
                    model: CLAUDE_CONFIG.model,
                    temperature: CLAUDE_CONFIG.temperature,
                    max_tokens: CLAUDE_CONFIG.maxTokens,
                    messages: [
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

            logger.info(`Succesfully fetched roadmap from claude api`)
            const properdata = JSON.parse(response)

            return properdata
        } catch (error) {
            logger.error('Error occured while creating roadmap for user')
            throw new Error(`${error.message}`)
        }
    }
}

const performRoadmapInstance = new RoadmapAnalysis();

export default performRoadmapInstance;
export { RoadmapAnalysis, performRoadmapInstance };