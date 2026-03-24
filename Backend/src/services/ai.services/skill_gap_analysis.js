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

            const structuredData = this.parseJsonResponse(cleanedContent, resumeData, jobRole);

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

    // same all in one block where remove markdown and take content bwn {}
    parseJsonResponse(rawContent, resumeData, jobRole) {
        // array of objects. it tries many way to make op correct
        const attempts = [
            rawContent,
            this.extractJsonObject(rawContent),
            this.normalizeJson(rawContent),
            this.normalizeJson(this.extractJsonObject(rawContent)),
        ].filter(Boolean);

        let lastError = null;

        // try parsing each object
        for (const attempt of attempts) {
            try {
                // Parsing = converting string → usable object
                return JSON.parse(attempt);
            } catch (error) {
                lastError = error;
            }
        }

        logger.warn(`Falling back to deterministic skill gap analysis due to invalid AI JSON: ${lastError?.message || 'unknown parse error'}`);
        return this.buildFallbackAnalysis(resumeData, jobRole);
    }

    // takes content bwn {}
    extractJsonObject(content) {
        const start = content.indexOf('{');
        const end = content.lastIndexOf('}');

        if (start === -1 || end === -1 || end <= start) {
            return content;
        }

        return content.slice(start, end + 1);
    }
// clean content
    normalizeJson(content) {
        if (!content) return content;

        return content
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/([\{\[,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3')
            .replace(/:\s*'([^']*)'/g, ': "$1"')
            .replace(/"\s*\n\s*"/g, '", "')
            .replace(/"\s*\n\s*\{/g, '", {')
            .replace(/\}\s*\n\s*\{/g, '}, {')
            .replace(/\]\s*\n\s*\{/g, '], {')
            .replace(/"\s+\{/g, '", {')
            .replace(/\}\s+\{/g, '}, {')
            .replace(/\r/g, '');
    }

    // used when ai fails during giving op
    // if ai fails ur system also fails . so we add a fallback which atleast provide some analysis data acc to manual analysis
    buildFallbackAnalysis(resumeData, jobRole) {
        // gets all skills of resume like technial , tools
        const candidateSkills = this.extractCandidateSkills(resumeData);
        const strengths = [];
        // skills which r missing
        const skillGaps = {
            critical: [],
            important: [],
            niceToHave: [],
        };
        
        const buckets = [
            ['critical', jobRole?.requiredSkills?.critical || [], 10],
            ['important', jobRole?.requiredSkills?.important || [], 7],
            ['niceToHave', jobRole?.requiredSkills?.niceToHave || [], 5],
        ];

        for (const [bucket, skills, defaultImportance] of buckets) {
            for (const item of skills) {
                const skillName = item?.title || item?.skill || '';
                if (!skillName) continue;

                const hasSkill = candidateSkills.has(skillName.toLowerCase());

                if (hasSkill) {
                    strengths.push({
                        skill: skillName,
                        proficiency: 'intermediate',
                        relevance: `Matched from ${bucket} requirements`,
                        uniqueAdvantage: 'Detected in resume content',
                        importance: item?.importance || defaultImportance,
                    });
                } else {
                    skillGaps[bucket].push({
                        skill: skillName,
                        importance: item?.importance || defaultImportance,
                        reason: item?.description || `Missing ${bucket} skill for this role`,
                        learningTime: bucket === 'critical' ? '4-8 weeks' : '2-6 weeks',
                        difficulty: bucket === 'critical' ? 'advanced' : 'intermediate',
                        prerequisites: [],
                    });
                }
            }
        }

        const requiredCount = buckets.reduce((sum, [, skills]) => sum + skills.length, 0);
        const matchedCount = strengths.length;
        const matchPercentage = requiredCount > 0
            ? Math.max(0, Math.min(100, Math.round((matchedCount / requiredCount) * 100)))
            : 0;

        return {
            overallAssessment: {
                matchPercentage,
                readinessLevel: matchPercentage >= 80
                    ? 'ready'
                    : matchPercentage >= 55
                        ? 'nearly-ready'
                        : 'not-ready',
                estimatedTimeToReady: {
                    weeks: skillGaps.critical.length * 4 + skillGaps.important.length * 2,
                    reason: 'Generated from fallback skill-matching logic because AI JSON was invalid',
                },
                summary: 'Fallback analysis generated from resume and job-role skill matching.',
            },
            skillGaps,
            strengths,
            transferableSkills: [],
            experienceGap: {
                candidateYears: 0,
                typicalRequirement: 0,
                assessment: 'Experience gap estimated using fallback analysis',
            },
            recommendations: [
                'Improve missing critical skills first',
                'Add role-specific keywords to the resume',
                'Build projects that demonstrate required skills',
            ],
        };
    }

    // extract resume skill
    extractCandidateSkills(resumeData) {
        const skillSet = new Set();
        const rawGroups = [
            resumeData?.skills?.technical,
            resumeData?.skills?.tools,
            resumeData?.skills?.frameworks,
            resumeData?.skills?.language,
            resumeData?.skills?.languages,
            resumeData?.skills?.database,
            resumeData?.skills?.others,
        ];

        for (const group of rawGroups) {
            if (!Array.isArray(group)) continue;
            for (const item of group) {
                const value = String(item || '').trim().toLowerCase();
                if (value) skillSet.add(value);
            }
        }

        return skillSet;
    }
}

const skillgapanalysis = new SkillGapAnalysis();
export default skillgapanalysis;
