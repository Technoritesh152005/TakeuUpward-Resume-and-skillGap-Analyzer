import { getModel } from '../../config/gemini.js';
import logger from '../../utils/logs.js';

class AtsScoreGenerator {
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

    parseAtsResponse(rawContent) {
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

        logger.warn(`Falling back to deterministic ATS analysis due to invalid AI JSON: ${lastError?.message || 'unknown parse error'}`);
        return null;
    }

    extractCandidateSkills(resumeData) {
        const groups = [
            resumeData?.skills?.technical,
            resumeData?.skills?.tools,
            resumeData?.skills?.frameworks,
            resumeData?.skills?.language,
            resumeData?.skills?.languages,
            resumeData?.skills?.database,
            resumeData?.skills?.others,
        ];

        const skills = new Set();

        for (const group of groups) {
            if (!Array.isArray(group)) continue;
            for (const item of group) {
                const value = typeof item === 'string' ? item : item?.name || item?.skill || item?.title;
                if (value) {
                    skills.add(String(value).trim().toLowerCase());
                }
            }
        }

        return skills;
    }

    buildFallbackAtsScore(resumeData, jobRole) {
        const candidateSkills = this.extractCandidateSkills(resumeData);
        const requiredSkills = [
            ...(jobRole?.requiredSkills?.critical || []),
            ...(jobRole?.requiredSkills?.important || []),
            ...(jobRole?.requiredSkills?.niceToHave || []),
        ];

        const requiredSkillNames = requiredSkills
            .map((item) => item?.title || item?.skill)
            .filter(Boolean);

        const matched = requiredSkillNames.filter((skill) => candidateSkills.has(String(skill).trim().toLowerCase()));
        const missing = requiredSkillNames.filter((skill) => !candidateSkills.has(String(skill).trim().toLowerCase()));
        const keywordScore = requiredSkillNames.length > 0
            ? Math.round((matched.length / requiredSkillNames.length) * 100)
            : 0;

        const overallScore = Math.max(0, Math.min(100, Math.round((keywordScore * 0.55) + 35)));

        return {
            overallScore,
            breakdown: {
                formatting: {
                    score: 70,
                    issues: ['Fallback ATS analysis used because AI response was invalid'],
                    recommendations: ['Review resume formatting manually for ATS compatibility'],
                },
                keywords: {
                    score: keywordScore,
                    matched,
                    missing,
                    suggestions: missing.slice(0, 3).map((skill) => `Add ${skill} where it truthfully applies in your resume`),
                },
                structure: {
                    score: 72,
                    issues: ['Could not verify full section structure from AI output'],
                    recommendations: ['Use standard resume sections like Summary, Skills, Experience, Education'],
                },
                content: {
                    score: Math.max(40, Math.min(100, keywordScore)),
                    strengths: matched.length ? [`Matched ${matched.length} role keywords from required skills`] : [],
                    improvements: missing.slice(0, 3).map((skill) => `Add evidence for ${skill} if you have worked with it`),
                },
            },
            topPriorities: missing.slice(0, 3).map((skill) => `Address missing keyword: ${skill}`),
            estimatedImprovement: missing.length ? 'Score can improve after adding missing role keywords and clearer ATS formatting' : 'Resume already aligns reasonably with the selected role keywords',
        };
    }

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

            const properData = this.parseAtsResponse(cleanedContent) || this.buildFallbackAtsScore(resumeData, jobRole);

            if (!properData || properData.overallScore === undefined || properData.overallScore === null) {
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
