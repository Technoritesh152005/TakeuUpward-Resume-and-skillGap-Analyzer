import { generateContentWithFallback } from '../../config/gemini.js';
import logger from '../../utils/logs.js';
import { extractCandidateSkillSet, matchRoleSkill, getRoleSkillList } from './fallbackSkillMatcher.js';

class AtsScoreGenerator {
    // buildOverview - basically shows debug error
    buildDebugPreview(value, limit = 600) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, limit);
    }

    toString(value) {
        return String(value || '').trim();
    }

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
                .map((item) => {
                    if (typeof item === 'string') return this.toString(item);
                    return this.toString(item?.title || item?.skill || item?.name);
                })
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
            recommended: this.toStringArray(
                source.recommended ??
                source.recommendedKeywords ??
                source.priorityKeywords,
                this.toStringArray(fallback.recommended)
            ),
        };
    }

    normalizeContentSection(section, fallback = {}) {
        const normalized = this.normalizeSection(section, fallback);
        const source = section && typeof section === 'object' ? section : {};

        return {
            ...normalized,
            weakPhrases: this.toStringArray(
                source.weakPhrases ??
                source.weak_phrases ??
                source.vaguePhrases,
                this.toStringArray(fallback.weakPhrases)
            ),
            rewriteSuggestions: this.toStringArray(
                source.rewriteSuggestions ??
                source.rewrite_suggestions ??
                source.rewrites,
                this.toStringArray(fallback.rewriteSuggestions)
            ),
        };
    }

    normalizeAtsPayload(rawData, fallbackData) {
        const source = rawData && typeof rawData === 'object' ? rawData : {};
        const fallback = fallbackData && typeof fallbackData === 'object'
            ? fallbackData
            : this.buildFallbackAtsScore({}, {});
        const breakdownSource = source.breakdown && typeof source.breakdown === 'object'
            ? source.breakdown
            : {};
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

        const content = this.normalizeContentSection(
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

    extractJsonBlock(content) {
        const source = String(content ?? '');
        const startIndex = source.search(/[\[{]/);
        if (startIndex === -1) {
            return source.trim();
        }

        const opening = source[startIndex];
        const closing = opening === '{' ? '}' : ']';
        let depth = 0;
        let inString = false;
        let escaped = false;

        for (let index = startIndex; index < source.length; index += 1) {
            const char = source[index];

            if (inString) {
                if (escaped) {
                    escaped = false;
                    continue;
                }

                if (char === '\\') {
                    escaped = true;
                    continue;
                }

                if (char === '"') {
                    inString = false;
                }
                continue;
            }

            if (char === '"') {
                inString = true;
                continue;
            }

            if (char === opening) {
                depth += 1;
            } else if (char === closing) {
                depth -= 1;
                if (depth === 0) {
                    return source.slice(startIndex, index + 1).trim();
                }
            }
        }

        return source.slice(startIndex).trim();
    }

    escapeControlCharactersInStrings(content) {
        let escapedContent = '';
        let inString = false;
        let escaped = false;

        for (const char of String(content ?? '')) {
            if (inString) {
                if (escaped) {
                    escapedContent += char;
                    escaped = false;
                    continue;
                }

                if (char === '\\') {
                    escapedContent += char;
                    escaped = true;
                    continue;
                }

                if (char === '"') {
                    escapedContent += char;
                    inString = false;
                    continue;
                }

                if (char === '\n') {
                    escapedContent += '\\n';
                    continue;
                }

                if (char === '\r') {
                    escapedContent += '\\r';
                    continue;
                }

                if (char === '\t') {
                    escapedContent += '\\t';
                    continue;
                }

                escapedContent += char;
                continue;
            }

            if (char === '"') {
                inString = true;
            }

            escapedContent += char;
        }

        return escapedContent;
    }

    normalizeJsonString(content) {
        return String(content ?? '')
            .replace(/^\uFEFF/, '')
            .replace(/```json\n?/gi, '')
            .replace(/```\n?/g, '')
            .replace(/[Ã¢â‚¬Å“Ã¢â‚¬Â]/g, '"')
            .replace(/[Ã¢â‚¬ËœÃ¢â‚¬â„¢]/g, "'")
            .replace(/[\u201C\u201D]/g, '"')
            .replace(/[\u2018\u2019]/g, "'")
            .replace(/,\s*([}\]])/g, '$1')
            .trim();
    }

    tryParseJson(content) {
        const normalized = this.normalizeJsonString(content);
        const extracted = this.extractJsonBlock(normalized);
        const candidates = [
            extracted,
            this.escapeControlCharactersInStrings(extracted),
        ];

        let lastError = null;

        for (const candidate of candidates) {
            try {
                return JSON.parse(candidate);
            } catch (error) {
                lastError = error;
            }
        }

        throw lastError;
    }

    async repairJsonWithGemini(invalidJson) {
        const repairPrompt = `
You are a JSON repair tool.
Return ONLY valid JSON with double-quoted keys and strings.
Do not add commentary. Do not wrap in markdown.

INVALID JSON:
${invalidJson}
`;

        const result = await generateContentWithFallback({
            contents: [{ role: 'user', parts: [{ text: repairPrompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0,
            },
        });
        const response = await result.response;
        return this.normalizeJsonString(response.text());
    }

    async parseAtsResponse(rawContent) {
        const normalized = this.normalizeJsonString(rawContent);
        const extracted = this.extractJsonBlock(normalized);

        try {
            return this.tryParseJson(extracted);
        } catch (firstError) {
            logger.warn(`Primary ATS JSON parse failed, attempting Gemini repair: ${firstError.message}`);
            logger.warn(`ATS AI raw preview: ${this.buildDebugPreview(rawContent)}`);
            logger.warn(`ATS AI extracted preview: ${this.buildDebugPreview(extracted)}`);

            try {
                const repaired = await this.repairJsonWithGemini(extracted);
                logger.warn(`ATS AI repaired preview: ${this.buildDebugPreview(repaired)}`);
                return this.tryParseJson(repaired);
            } catch (repairError) {
                logger.warn(`Falling back to deterministic ATS analysis due to unrecoverable AI JSON: ${repairError.message}`);
                return null;
            }
        }
    }

    // overview of resume data to pass to llm
    buildCompactResumeSummary(resumeData = {}) {
        const skills = resumeData?.skills || {};
        const experience = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
        const projects = Array.isArray(resumeData?.project || resumeData?.projects)
            ? (resumeData.project || resumeData.projects)
            : [];
        const education = Array.isArray(resumeData?.education || resumeData?.eduaction)
            ? (resumeData.education || resumeData.eduaction)
            : [];

        return {
            summary: this.toString(resumeData?.summary),
            skills: {
                technical: this.toStringArray(skills?.technical).slice(0, 12),
                frameworks: this.toStringArray(skills?.frameworks).slice(0, 12),
                tools: this.toStringArray(skills?.tools).slice(0, 12),
                languages: this.toStringArray(skills?.languages || skills?.language).slice(0, 10),
                databases: this.toStringArray(skills?.database || skills?.databases).slice(0, 10),
            },
            experience: experience.slice(0, 4).map((item) => ({
                title: this.toString(item?.title),
                company: this.toString(item?.company),
                startDate: this.toString(item?.startDate),
                endDate: item?.current ? 'Present' : this.toString(item?.endDate),
                highlights: this.toStringArray(
                    item?.responsibilities || item?.highlights || item?.achievements
                ).slice(0, 3),
            })),
            projects: projects.slice(0, 4).map((item) => ({
                title: this.toString(item?.title),
                technologies: this.toStringArray(item?.technologies).slice(0, 6),
                highlights: this.toStringArray(
                    item?.highlights || item?.description || item?.bulletPoints
                ).slice(0, 2),
            })),
            education: education.slice(0, 2).map((item) => ({
                degree: this.toString(item?.degree || item?.title),
                institution: this.toString(item?.institution || item?.school || item?.college),
            })),
        };
    }

    // compact summary of job role
    buildCompactRoleSummary(jobRole = {}) {
        return {
            title: this.toString(jobRole?.title),
            category: this.toString(jobRole?.category),
            experienceLevel: this.toString(jobRole?.experienceLevel),
            responsibilities: this.toStringArray(jobRole?.responsibilities).slice(0, 8),
            requiredSkills: {
                critical: this.toStringArray(jobRole?.requiredSkills?.critical).slice(0, 10),
                important: this.toStringArray(jobRole?.requiredSkills?.important).slice(0, 10),
                niceToHave: this.toStringArray(jobRole?.requiredSkills?.niceToHave).slice(0, 10),
            },
        };
    }

    buildDeterministicKeywordSection(resumeData, jobRole) {
        const candidateSkills = extractCandidateSkillSet(resumeData);
        const requiredSkillNames = getRoleSkillList(jobRole);
        const matched = [];
        const missing = [];

        requiredSkillNames.forEach((skill) => {
            if (matchRoleSkill(candidateSkills, skill)) {
                matched.push(skill);
                return;
            }

            missing.push(skill);
        });

        const keywordScore = requiredSkillNames.length > 0
            ? Math.round((matched.length / requiredSkillNames.length) * 100)
            : 0;

        return {
            score: keywordScore,
            matched,
            missing,
            suggestions: missing
                .slice(0, 3)
                .map((skill) => `Add ${skill} only where your resume shows real experience with it`),
            recommended: missing.slice(0, 6),
        };
    }

    // this builds fallback ats data according to the schema fields
    buildFallbackAtsScore(resumeData, jobRole) {
        const keywordSection = this.buildDeterministicKeywordSection(resumeData, jobRole);
        const { score: keywordScore, matched, missing, suggestions, recommended } = keywordSection;

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
                    suggestions,
                    recommended,
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
                    weakPhrases: [],
                    rewriteSuggestions: missing.slice(0, 3).map((skill) => `Add a quantified bullet that demonstrates ${skill} through real work or projects`),
                },
            },
            topPriorities: missing.slice(0, 3).map((skill) => `Address missing keyword: ${skill}`),
            estimatedImprovement: missing.length
                ? 'Score can improve after adding missing role keywords and clearer ATS formatting'
                : 'Resume already aligns reasonably with the selected role keywords',
        };
    }

    // This is the main function to generate ats score
    async getAtsScore(resumeData, jobRole) {
        try {
            // we provide only short overview of resume and job role
            const compactResume = this.buildCompactResumeSummary(resumeData);
            const compactRole = this.buildCompactRoleSummary(jobRole);

            const prompt = `
Analyze this resume for ATS (Applicant Tracking System) compatibility.

RESUME:
${JSON.stringify(compactResume, null, 2)}

TARGET JOB:
${JSON.stringify(compactRole, null, 2)}

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
      "recommendedKeywords": ["Docker", "Kubernetes", "AWS", "CI/CD"],
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
      "weakPhrases": [
        "Responsible for team collaboration",
        "Worked on dashboards"
      ],
      "rewriteSuggestions": [
        "Replaced 'Worked on dashboards' with 'Built Tableau dashboards used by sales leadership to track weekly pipeline performance'",
        "Replace vague ownership statements with impact-focused bullet points and metrics"
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

Important rules for ATS guidance quality:
- weakPhrases should identify vague or low-signal resume wording, not generic criticism
- rewriteSuggestions should explain how to rewrite bullets into stronger, evidence-based statements
- suggestions should stay grounded in the provided resume and target role
- recommendedKeywords should prioritize role-relevant terms actually missing from the resume
- avoid generic advice unless the resume data truly gives no better evidence

Return ONLY the JSON object, no markdown formatting.
`;

            const result = await generateContentWithFallback({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0,
                    maxOutputTokens: 2200,
                },
            });
            const response = await result.response;
            const rawText = response.text();

            // we do generate both fallback data and parsed data cz data from ai may be it not present or unexpected shape missign format
            // so if it gave improper format we can atleast provide our fallback data to that fields
            const fallbackData = this.buildFallbackAtsScore(resumeData, jobRole);
            // proper parsed data in js object
            const parsedData = await this.parseAtsResponse(rawText);
            const properData = this.normalizeAtsPayload(parsedData, fallbackData);
            const deterministicKeywords = this.buildDeterministicKeywordSection(resumeData, jobRole);

            properData.breakdown.keywords = deterministicKeywords;
            properData.overallScore = this.toScore(
                Math.round(
                    (
                        properData.breakdown.formatting.score +
                        properData.breakdown.keywords.score +
                        properData.breakdown.structure.score +
                        properData.breakdown.content.score
                    ) / 4
                ),
                fallbackData.overallScore
            );
            properData.topPriorities = Array.from(new Set([
                ...deterministicKeywords.missing
                    .slice(0, 2)
                    .map((skill) => `Add resume evidence for ${skill}`),
                ...this.toStringArray(properData.topPriorities),
            ])).slice(0, 3);

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
