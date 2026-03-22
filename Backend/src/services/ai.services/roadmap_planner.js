import { getModel } from '../../config/gemini.js';
import logger from '../../utils/logs.js';

class RoadmapAnalysis {
    /**
     * Generate personalized learning roadmap using Gemini
     * @param {Object} gapAnalysis - Skill gap analysis result
     * @param {Object} userpreference - User preferences
     * @returns {Object} - Structured roadmap data
     */
    async performRoadmap(gapAnalysis, userpreference = {}) {
        try {
            const {
                hoursPerWeek = 12,
                budget = 'free',
                learningStyle = 'mixed',
            } = userpreference;

            const prompt = `
You are an expert career coach creating a personalized learning roadmap.

SKILL GAPS TO ADDRESS:
${JSON.stringify(gapAnalysis.skillGaps, null, 2)}

CANDIDATE STRENGTHS:
${JSON.stringify(gapAnalysis.strengths, null, 2)}

USER PREFERENCES:
- Time available: ${hoursPerWeek} hours per week
- Budget: ${budget} (free/low/medium/high)
- Learning style: ${learningStyle}

Create a detailed 90-day roadmap. Return ONLY valid JSON:

{
  "duration": {
    "weeks": 12,
    "totalEstimatedHours": 144
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
              "type": "course",
              "title": "Modern JavaScript Fundamentals",
              "description": "brief description",
              "skillsCovered": ["JavaScript", "ES6"],
              "estimatedHours": 8,
              "difficulty": "beginner",
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
      "priority": "high"
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
      "cost": "free",
      "duration": "4 weeks",
      "priority": "high",
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
Return ONLY the JSON object, no markdown formatting.
`;

            // Get Gemini model
            const model = getModel();

            // Generate roadmap
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();

            // Clean response
            const cleanedContent = rawText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            // Parse JSON
            const properData = JSON.parse(cleanedContent);

            if (!properData || !properData.duration) {
                throw new Error('Invalid roadmap response from AI');
            }

            logger.info('Successfully generated roadmap with Gemini');
            return properData;

        } catch (error) {
            logger.error(`Error creating roadmap: ${error.message}`);
            throw new Error(`Failed to create roadmap: ${error.message}`);
        }
    }
}

const performRoadmapInstance = new RoadmapAnalysis();

export default performRoadmapInstance;
export { RoadmapAnalysis, performRoadmapInstance };