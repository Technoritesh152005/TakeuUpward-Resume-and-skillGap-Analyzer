import { getModel } from '../../config/gemini.js';
import logger from '../../utils/logs.js';

class RoadmapAnalysis {
    toNumber(value, fallback = 0) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const match = value.match(/\d+(\.\d+)?/);
            if (match) {
                return Number(match[0]);
            }
        }

        return fallback;
    }

    toStringArray(value, fallback = []) {
        if (Array.isArray(value)) {
            return value
                .map((item) => String(item || '').trim())
                .filter(Boolean);
        }

        if (typeof value === 'string' && value.trim()) {
            return [value.trim()];
        }

        return fallback;
    }

    extractJsonObject(content) {
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');

        if (start === -1 || end === -1 || end <= start) {
            return content;
        }

        return content.slice(start, end + 1);
    }

    normalizeJson(content) {
        if (!content) return content;

        return content
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/([\{\[,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3')
            .replace(/:\s*'([^']*)'/g, ': "$1"')
            .replace(/\r/g, '');
    }

    parseRoadmapResponse(rawContent) {
        // Try progressively cleaned variants because LLMs often add minor JSON mistakes.
        const attempts = [
            rawContent,
            this.extractJsonObject(rawContent),
            this.normalizeJson(rawContent),
            this.normalizeJson(this.extractJsonObject(rawContent)),
        ].filter(Boolean);

        let lastError = null;

        for (const attempt of attempts) {
            try {
                return JSON.parse(attempt);
            } catch (error) {
                lastError = error;
            }
        }

        logger.warn(`Falling back to deterministic roadmap due to invalid AI JSON: ${lastError?.message || 'unknown parse error'}`);
        return null;
    }

    normalizeLearningItem(item, index = 0) {
        const source = item && typeof item === 'object' ? item : {};

        return {
            type: ['course', 'book', 'tutorial', 'project', 'practice'].includes(source.type) ? source.type : 'tutorial',
            title: String(source.title || `Learning item ${index + 1}`),
            description: String(source.description || 'Complete the planned learning task for this week.'),
            skillsCovered: this.toStringArray(source.skillsCovered),
            estimatedHours: this.toNumber(source.estimatedHours, 4),
            difficulty: String(source.difficulty || 'beginner'),
            isFree: Boolean(source.isFree),
        };
    }

    normalizeWeek(week, index = 0) {
        const source = week && typeof week === 'object' ? week : {};
        const learningItems = Array.isArray(source.learningItems)
            ? source.learningItems.map((item, itemIndex) => this.normalizeLearningItem(item, itemIndex))
            : [];

        return {
            week: this.toNumber(source.week, index + 1),
            focus: String(source.focus || `Week ${index + 1} focus`),
            goals: this.toStringArray(source.goals),
            timeCommitment: String(source.timeCommitment || ''),
            learningItems,
        };
    }

    normalizePhase(phase, index = 0) {
      
        const source = phase && typeof phase === 'object' ? phase : {};
        const weeklyBreakdown = Array.isArray(source.weeklyBreakdown)
            ? source.weeklyBreakdown.map((week, weekIndex) => this.normalizeWeek(week, weekIndex))
            : [];

        return {
            phaseNumber: this.toNumber(source.phaseNumber, index + 1),
            title: String(source.title || `Phase ${index + 1}`),
            duration: String(source.duration || ''),
            objectives: this.toStringArray(source.objectives),
            weeklyBreakdown,
        };
    }

    // both takes fallback data and raw data and if some fiels of rawdata not present we add fallbackdata
    normalizeRoadmapPayload(rawData, fallbackData) {
        const source = rawData && typeof rawData === 'object' ? rawData : {};
        const fallback = fallbackData && typeof fallbackData === 'object' ? fallbackData : this.buildFallbackRoadmap({}, {});

        const phases = Array.isArray(source.phases) && source.phases.length
            ? source.phases.map((phase, index) => this.normalizePhase(phase, index))
            : fallback.phases;

        return {
            duration: {
                weeks: this.toNumber(source?.duration?.weeks, fallback?.duration?.weeks || 12),
                totalEstimatedHours: this.toNumber(
                    source?.duration?.totalEstimatedHours,
                    fallback?.duration?.totalEstimatedHours || 0
                ),
            },
            phases,
            quickWins: Array.isArray(source.quickWins) && source.quickWins.length
                ? source.quickWins
                : fallback.quickWins,
            portfolioProjects: Array.isArray(source.portfolioProjects) && source.portfolioProjects.length
                ? source.portfolioProjects
                : fallback.portfolioProjects,
            recommendedCertifications: Array.isArray(source.recommendedCertifications) && source.recommendedCertifications.length
                ? source.recommendedCertifications
                : fallback.recommendedCertifications,
            milestones: Array.isArray(source.milestones) && source.milestones.length
                ? source.milestones
                : fallback.milestones,
        };
    }

    // if there is a problem to generate a roadmap we must atleast have a fallback or a dummy type roadmap structure for system not to crash
    buildFallbackRoadmap(gapAnalysis, userpreference = {}) {
        const {
            hoursPerWeek = 12,
            budget = 'free',
        } = userpreference;

        // prioritizing skill from high priority to low priority
        const prioritizedSkills = [
            ...(gapAnalysis?.skillGaps?.critical || []),
            ...(gapAnalysis?.skillGaps?.important || []),
            ...(gapAnalysis?.skillGaps?.niceToHave || []),
        ]
            .map((item) => item?.skill || item?.title)
            .filter(Boolean);

        const selectedSkills = prioritizedSkills.slice(0, 6);
        // divide skill in 3 phases like each phase will have 2 items skill
        // ["React", "Node", "Mongo", "Docker", "AWS", "DSA"]
        // [
        //   ["React", "Node"],
        //   ["Mongo", "Docker"],
        //   ["AWS", "DSA"]
        // ]

        const chunkSize = Math.max(1, Math.ceil(selectedSkills.length / 3));
        // it creates an array where inside array there r three phase of array and inside each array there is 2 element
        const phaseSkills = [
            selectedSkills.slice(0, chunkSize),
            selectedSkills.slice(chunkSize, chunkSize * 2),
            selectedSkills.slice(chunkSize * 2),
        ].filter((items) => items.length > 0);

        // critical array ke 1st element 
        const phases = phaseSkills.map((skills, phaseIndex) => ({
            phaseNumber: phaseIndex + 1,
            title: phaseIndex === 0 ? 'Core Gaps' : phaseIndex === 1 ? 'Applied Practice' : 'Portfolio Readiness',
            duration: '4 weeks',
            objectives: skills.map((skill) => `Build working knowledge in ${skill}`),
            weeklyBreakdown: skills.map((skill, weekIndex) => ({
                week: (phaseIndex * 4) + weekIndex + 1,
                focus: skill,
                goals: [
                    `Understand the fundamentals of ${skill}`,
                    `Apply ${skill} in a small practical task`,
                ],
                timeCommitment: `${hoursPerWeek} hours`,
                learningItems: [
                    {
                        type: 'tutorial',
                        title: `${skill} guided learning`,
                        description: `Study the concepts and complete a focused practice exercise for ${skill}.`,
                        skillsCovered: [skill],
                        estimatedHours: Math.max(2, Math.round(hoursPerWeek * 0.6)),
                        difficulty: 'intermediate',
                        isFree: budget === 'free',
                    },
                    {
                        type: 'practice',
                        title: `${skill} practice task`,
                        description: `Reinforce ${skill} with a hands-on implementation task.`,
                        skillsCovered: [skill],
                        estimatedHours: Math.max(1, Math.round(hoursPerWeek * 0.4)),
                        difficulty: 'intermediate',
                        isFree: true,
                    },
                ],
            })),
        }));

        return {
            duration: {
                weeks: 12,
                totalEstimatedHours: hoursPerWeek * 12,
            },
            // agar phases fallback nhi aya toh dummy data dalo
            phases: phases.length ? phases : 
            
            [
                {
                    phaseNumber: 1,
                    title: 'Foundation Building',
                    duration: '4 weeks',
                    objectives: ['Strengthen the most important role gaps first'],
                    weeklyBreakdown: [
                        {
                            week: 1,
                            focus: 'Core skill practice',
                            goals: ['Review key concepts', 'Complete one hands-on task'],
                            timeCommitment: `${hoursPerWeek} hours`,
                            learningItems: [
                                {
                                    type: 'tutorial',
                                    title: 'Focused roadmap practice',
                                    description: 'Fallback roadmap generated because AI JSON was invalid.',
                                    skillsCovered: [],
                                    estimatedHours: hoursPerWeek,
                                    difficulty: 'beginner',
                                    isFree: budget === 'free',
                                },
                            ],
                        },
                    ],
                },
            ],
            quickWins: selectedSkills.slice(0, 3).map((skill) => ({
                skill,
                timeEstimate: '1 week',
                impact: `Improves progress toward the target role by addressing ${skill}.`,
                priority: 'high',
            })),
            portfolioProjects: [
                {
                    title: 'Role-aligned capstone project',
                    description: 'Build one project that demonstrates the strongest newly learned skills.',
                    skillsCovered: selectedSkills.slice(0, 4),
                    difficulty: 'intermediate',
                    estimatedTime: '2-3 weeks',
                    importance: 'Demonstrates practical application for interviews and portfolio review',
                },
            ],
            recommendedCertifications: [],
            milestones: [
                {
                    week: 4,
                    achievement: 'First learning phase complete',
                    deliverable: 'At least one practice artifact or mini project',
                },
                {
                    week: 8,
                    achievement: 'Second learning phase complete',
                    deliverable: 'Applied implementation using target skills',
                },
                {
                    week: 12,
                    achievement: 'Roadmap complete',
                    deliverable: 'Portfolio-ready project and revised role readiness',
                },
            ],
        };
    }

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

            const model = getModel();
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const rawText = response.text();

            const cleanedContent = rawText
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            const fallbackData = this.buildFallbackRoadmap(gapAnalysis, userpreference);
            const parsedData = this.parseRoadmapResponse(cleanedContent);
            const properData = this.normalizeRoadmapPayload(parsedData, fallbackData);

            if (!properData || !Array.isArray(properData.phases) || properData.phases.length === 0) {
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
