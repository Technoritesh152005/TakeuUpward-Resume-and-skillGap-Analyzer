import { getModel } from '../../config/gemini.js';
import logger from '../../utils/logs.js';

class AtsScoreGenerator {
    toScore(value, fallback = 0) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return Math.max(0, Math.min(100, Math.round(value)));
        }

        if (typeof value === 'string') {
            const match = value.match(/\d+(\.\d+)?/);
            if (match) {
                return this.toScore(Number(match[0]), fallback);
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

    normalizeSection(section, fallback = {}) {
        const source = section && typeof section === 'object' ? section : {};

        return {
            score: this.toScore(
                source.score ??
                source.value ??
                source.rating ??
                source.percentage,
                this.toScore(fallback.score, 0)
            ),
            issues: this.toStringArray(
                source.issues ??
                source.problems ??
                source.concerns ??
                source.improvements ??
                source.strengths,
                this.toStringArray(fallback.issues)
            ),
            recommendations: this.toStringArray(
                source.recommendations ??
                source.suggestions ??
                source.actions ??
                source.nextSteps,
                this.toStringArray(fallback.recommendations)
            ),
        };
    }

    normalizeKeywordSection(section, fallback = {}) {
        const source = section && typeof section === 'object' ? section : {};

        return {
            score: this.toScore(
                source.score ??
                source.value ??
                source.rating ??
                source.percentage,
                this.toScore(fallback.score, 0)
            ),
            matched: this.toStringArray(
                source.matched ??
                source.present ??
                source.found,
                this.toStringArray(fallback.matched)
            ),
            missing: this.toStringArray(
                source.missing ??
                source.absent ??
                source.missingKeywords,
                this.toStringArray(fallback.missing)
            ),
            suggestions: this.toStringArray(
                source.suggestions ??
                source.recommendations ??
                source.actions,
                this.toStringArray(fallback.suggestions)
            ),
        };
    }

    normalizeAtsPayload(rawData, fallbackData) {
        const source = rawData && typeof rawData === 'object' ? rawData : {};
        const fallback = fallbackData && typeof fallbackData === 'object' ? fallbackData : this.buildFallbackAtsScore({}, {});
        const breakdownSource = source.breakdown && typeof source.breakdown === 'object' ? source.breakdown : {};
        const fallbackBreakdown = fallback.breakdown || {};

        const formatting = this.normalizeSection(
            breakdownSource.formatting ?? source.formatting,
            fallbackBreakdown.formatting
        );

        const keywords = this.normalizeKeywordSection(
            breakdownSource.keywords ?? source.keywords,
            fallbackBreakdown.keywords
        );

        const structure = this.normalizeSection(
            breakdownSource.structure ?? source.structure,
            fallbackBreakdown.structure
        );

        const content = this.normalizeSection(
            breakdownSource.content ?? source.content,
            fallbackBreakdown.content
        );

        const derivedOverall = Math.round(
            (formatting.score + keywords.score + structure.score + content.score) / 4
        );

        return {
            overallScore: this.toScore(
                source.overallScore ??
                source.overall_score ??
                source.overall ??
                source.score,
                derivedOverall
            ),
            breakdown: {
                formatting,
                keywords,
                structure,
                content,
            },
            topPriorities: this.toStringArray(
                source.topPriorities ??
                source.priorities ??
                source.recommendations,
                this.toStringArray(fallback.topPriorities)
            ),
            estimatedImprovement: String(
                source.estimatedImprovement ??
                source.estimated_improvement ??
                fallback.estimatedImprovement ??
                ''
            ),
        };
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

            const fallbackData = this.buildFallbackAtsScore(resumeData, jobRole);
            const parsedData = this.parseAtsResponse(cleanedContent);
            const properData = this.normalizeAtsPayload(parsedData, fallbackData);

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
