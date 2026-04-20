import { generateContentWithFallback } from '../../config/gemini.js';
import logger from '../../utils/logs.js';
import { extractCandidateSkillSet, matchRoleSkill, expandSkillVariants, skillsOverlap } from './fallbackSkillMatcher.js';

class SkillGapAnalysis {
    normalizeUserPreferences(userPreferences = {}) {
        return {
            hoursPerWeek: this.toNumber(userPreferences?.hoursPerWeek, 8) || 8,
            budget: this.toString(userPreferences?.budget || 'free').toLowerCase() || 'free',
            learningStyle: this.toString(userPreferences?.learningStyle || 'mixed').toLowerCase() || 'mixed',
        };
    }

    buildDebugPreview(value, limit = 600) {
        return String(value || '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, limit);
    }

    toString(value) {
        return String(value || '').trim();
    }

    toNumber(value, fallback = 0) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const parsed = Number(value);
            if (Number.isFinite(parsed)) {
                return parsed;
            }

            const match = value.match(/\d+(\.\d+)?/);
            if (match) {
                const extracted = Number(match[0]);
                if (Number.isFinite(extracted)) {
                    return extracted;
                }
            }
        }

        return fallback;
    }

    toStringArray(value, limit = 10) {
        if (!Array.isArray(value)) return [];

        return value
            .map((item) => {
                if (typeof item === 'string') return this.toString(item);
                return this.toString(item?.title || item?.skill || item?.name);
            })
            .filter(Boolean)
            .slice(0, limit);
    }

    buildCompactResumeSummary(resumeData = {}) {
        const skills = resumeData?.skills || {};
        const experience = Array.isArray(resumeData?.experience) ? resumeData.experience : [];
        const projects = Array.isArray(resumeData?.project || resumeData?.projects)
            ? (resumeData.project || resumeData.projects)
            : [];
        const education = Array.isArray(resumeData?.education || resumeData?.eduaction)
            ? (resumeData.education || resumeData.eduaction)
            : [];
        const certifications = Array.isArray(resumeData?.certifications)
            ? resumeData.certifications
            : resumeData?.certification
                ? [resumeData.certification]
                : [];

        return {
            summary: this.toString(resumeData?.summary),
            skills: {
                technical: this.toStringArray(skills?.technical, 12),
                frameworks: this.toStringArray(skills?.frameworks, 12),
                tools: this.toStringArray(skills?.tools, 12),
                languages: this.toStringArray(skills?.languages || skills?.language, 10),
                databases: this.toStringArray(skills?.database || skills?.databases, 10),
                others: this.toStringArray(skills?.others, 8),
            },
            experience: experience.slice(0, 4).map((item) => ({
                title: this.toString(item?.title),
                company: this.toString(item?.company),
                startDate: this.toString(item?.startDate),
                endDate: item?.current ? 'Present' : this.toString(item?.endDate),
                highlights: this.toStringArray(
                    item?.responsibilities || item?.highlights || item?.achievements,
                    3
                ),
                technologies: this.toStringArray(item?.technologies || item?.skillsUsed, 6),
            })),
            projects: projects.slice(0, 4).map((item) => ({
                title: this.toString(item?.title),
                technologies: this.toStringArray(item?.technologies, 6),
                highlights: this.toStringArray(
                    item?.highlights || item?.description || item?.bulletPoints,
                    2
                ),
            })),
            education: education.slice(0, 2).map((item) => ({
                degree: this.toString(item?.degree || item?.title),
                institution: this.toString(item?.institution || item?.school || item?.college),
                year: this.toString(item?.year || item?.graduationYear || item?.endDate),
            })),
            certifications: certifications.slice(0, 4).map((item) => ({
                title: this.toString(item?.title || item?.name),
                issuer: this.toString(item?.issuer || item?.provider),
            })),
        };
    }

    buildCompactRoleSummary(jobRole = {}) {
        return {
            title: this.toString(jobRole?.title),
            category: this.toString(jobRole?.category),
            experienceLevel: this.toString(jobRole?.experienceLevel),
            responsibilities: this.toStringArray(jobRole?.responsibilities, 8),
            requiredSkills: {
                critical: this.toStringArray(jobRole?.requiredSkills?.critical, 10),
                important: this.toStringArray(jobRole?.requiredSkills?.important, 10),
                niceToHave: this.toStringArray(jobRole?.requiredSkills?.niceToHave, 10),
            },
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

    normalizeGapArray(value, fallback = []) {
        const source = Array.isArray(value) ? value : [];
        const fallbackItems = Array.isArray(fallback) ? fallback : [];

        if (!source.length) {
            return fallbackItems;
        }

        return source.map((item, index) => {
            const safeFallback = fallbackItems[index] || {};
            return {
                skill: this.toString(item?.skill || item?.title || safeFallback.skill),
                importance: Number(item?.importance ?? safeFallback.importance ?? 5),
                reason: this.toString(item?.reason || item?.description || safeFallback.reason),
                learningTime: this.toString(item?.learningTime || safeFallback.learningTime || '2-6 weeks'),
                difficulty: this.toString(item?.difficulty || safeFallback.difficulty || 'intermediate'),
                prerequisites: Array.isArray(item?.prerequisites)
                    ? item.prerequisites.filter(Boolean)
                    : (safeFallback.prerequisites || []),
            };
        }).filter((item) => item.skill);
    }

    normalizeStrengths(value, fallback = []) {
        const source = Array.isArray(value) ? value : [];
        const fallbackItems = Array.isArray(fallback) ? fallback : [];

        if (!source.length) {
            return fallbackItems;
        }

        return source.map((item, index) => {
            const safeFallback = fallbackItems[index] || {};
            return {
                skill: this.toString(item?.skill || item?.title || safeFallback.skill),
                proficiency: this.toString(item?.proficiency || safeFallback.proficiency || 'intermediate'),
                relevance: this.toString(item?.relevance || safeFallback.relevance),
                uniqueAdvantage: this.toString(item?.uniqueAdvantage || safeFallback.uniqueAdvantage),
                importance: Number(item?.importance ?? safeFallback.importance ?? 5),
            };
        }).filter((item) => item.skill);
    }

    normalizeTransferableSkills(value, fallback = []) {
        const source = Array.isArray(value) ? value : [];
        const fallbackItems = Array.isArray(fallback) ? fallback : [];

        if (!source.length) {
            return fallbackItems;
        }

        return source.map((item, index) => {
            const safeFallback = fallbackItems[index] || {};
            return {
                skill: this.toString(item?.skill || safeFallback.skill),
                relatesTo: Array.isArray(item?.relatesTo)
                    ? item.relatesTo.filter(Boolean)
                    : (safeFallback.relatesTo || []),
                explanation: this.toString(item?.explanation || safeFallback.explanation),
            };
        }).filter((item) => item.skill);
    }

    findMatchingSkillItem(items, skillName) {
        const source = Array.isArray(items) ? items : [];
        return source.find((item) => skillsOverlap(
            item?.skill || item?.title || item?.name,
            skillName
        )) || null;
    }

    reasonMentionsSkill(reason, skillName) {
        const safeReason = this.toString(reason).toLowerCase();
        if (!safeReason) return false;

        return expandSkillVariants(skillName)
            .filter((variant) => variant.length >= 3)
            .some((variant) => safeReason.includes(String(variant).toLowerCase()));
    }

    mergeGapItem(aiItem, fallbackItem) {
        const safeFallback = fallbackItem && typeof fallbackItem === 'object' ? fallbackItem : {};
        const safeAi = aiItem && typeof aiItem === 'object' ? aiItem : {};
        const aiReason = this.toString(safeAi.reason || safeAi.description);
        const fallbackReason = this.toString(safeFallback.reason);

        return {
            skill: this.toString(safeFallback.skill || safeAi.skill || safeAi.title),
            importance: Number(safeFallback.importance ?? safeAi.importance ?? 5),
            reason: this.reasonMentionsSkill(aiReason, safeFallback.skill)
                ? aiReason
                : fallbackReason,
            learningTime: this.toString(safeAi.learningTime || safeFallback.learningTime || '2-6 weeks'),
            difficulty: this.toString(safeAi.difficulty || safeFallback.difficulty || 'intermediate'),
            prerequisites: Array.isArray(safeAi.prerequisites) && safeAi.prerequisites.length
                ? safeAi.prerequisites.filter(Boolean)
                : (safeFallback.prerequisites || []),
        };
    }

    mergeStrengthItem(aiItem, fallbackItem) {
        const safeFallback = fallbackItem && typeof fallbackItem === 'object' ? fallbackItem : {};
        const safeAi = aiItem && typeof aiItem === 'object' ? aiItem : {};

        return {
            skill: this.toString(safeFallback.skill || safeAi.skill || safeAi.title),
            proficiency: this.toString(safeAi.proficiency || safeFallback.proficiency || 'intermediate'),
            relevance: this.toString(safeAi.relevance || safeFallback.relevance),
            uniqueAdvantage: this.toString(safeAi.uniqueAdvantage || safeFallback.uniqueAdvantage),
            importance: Number(safeFallback.importance ?? safeAi.importance ?? 5),
        };
    }

    normalizeSkillGapPayload(rawData, fallbackData) {
        const source = rawData && typeof rawData === 'object' ? rawData : {};
        const fallback = fallbackData && typeof fallbackData === 'object'
            ? fallbackData
            : this.buildFallbackAnalysis({}, {});
        const sourceAssessment = source.overallAssessment && typeof source.overallAssessment === 'object'
            ? source.overallAssessment
            : {};
        const fallbackAssessment = fallback.overallAssessment || {};
        const sourceExperienceGap = source.experienceGap && typeof source.experienceGap === 'object'
            ? source.experienceGap
            : {};
        const fallbackExperienceGap = fallback.experienceGap || {};
        const sourceSkillGaps = source.skillGaps && typeof source.skillGaps === 'object'
            ? source.skillGaps
            : {};
        const fallbackSkillGaps = fallback.skillGaps || {};
        const normalizedSourceGaps = {
            critical: this.normalizeGapArray(sourceSkillGaps.critical, []),
            important: this.normalizeGapArray(sourceSkillGaps.important, []),
            niceToHave: this.normalizeGapArray(sourceSkillGaps.niceToHave, []),
        };
        const allAiGapItems = [
            ...normalizedSourceGaps.critical,
            ...normalizedSourceGaps.important,
            ...normalizedSourceGaps.niceToHave,
        ];
        const normalizedSourceStrengths = this.normalizeStrengths(source.strengths, []);

        return {
            overallAssessment: {
                matchPercentage: Math.max(
                    0,
                    Math.min(
                        100,
                        this.toNumber(
                            sourceAssessment.matchPercentage,
                            this.toNumber(fallbackAssessment.matchPercentage, 0)
                        )
                    )
                ),
                readinessLevel: this.toString(
                    sourceAssessment.readinessLevel ||
                    fallbackAssessment.readinessLevel ||
                    'not-ready'
                ),
                estimatedTimeToReady: {
                    weeks: Number(
                        sourceAssessment?.estimatedTimeToReady?.weeks ??
                        fallbackAssessment?.estimatedTimeToReady?.weeks ??
                        0
                    ),
                    reason: this.toString(
                        sourceAssessment?.estimatedTimeToReady?.reason ||
                        fallbackAssessment?.estimatedTimeToReady?.reason
                    ),
                },
                summary: this.toString(sourceAssessment.summary || fallbackAssessment.summary),
            },
            skillGaps: {
                critical: this.normalizeGapArray(fallbackSkillGaps.critical, []).map((item) => this.mergeGapItem(
                    this.findMatchingSkillItem(normalizedSourceGaps.critical, item.skill) ||
                    this.findMatchingSkillItem(allAiGapItems, item.skill),
                    item
                )),
                important: this.normalizeGapArray(fallbackSkillGaps.important, []).map((item) => this.mergeGapItem(
                    this.findMatchingSkillItem(normalizedSourceGaps.important, item.skill) ||
                    this.findMatchingSkillItem(allAiGapItems, item.skill),
                    item
                )),
                niceToHave: this.normalizeGapArray(fallbackSkillGaps.niceToHave, []).map((item) => this.mergeGapItem(
                    this.findMatchingSkillItem(normalizedSourceGaps.niceToHave, item.skill) ||
                    this.findMatchingSkillItem(allAiGapItems, item.skill),
                    item
                )),
            },
            strengths: this.normalizeStrengths(fallback.strengths, []).map((item) => this.mergeStrengthItem(
                this.findMatchingSkillItem(normalizedSourceStrengths, item.skill),
                item
            )),
            transferableSkills: this.normalizeTransferableSkills(
                source.transferableSkills,
                fallback.transferableSkills
            ),
            experienceGap: {
                candidateYears: Number(
                    sourceExperienceGap.candidateYears ??
                    fallbackExperienceGap.candidateYears ??
                    0
                ),
                typicalRequirement: Number(
                    sourceExperienceGap.typicalRequirement ??
                    fallbackExperienceGap.typicalRequirement ??
                    0
                ),
                assessment: this.toString(
                    sourceExperienceGap.assessment ||
                    fallbackExperienceGap.assessment
                ),
            },
            recommendations: Array.isArray(source.recommendations) && source.recommendations.length
                ? source.recommendations.filter(Boolean)
                : (fallback.recommendations || []),
        };
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

    async performDeepSkillGapAnalyze(resumeData, jobRole, userPreferences = {}) {
        try {
            const compactResume = this.buildCompactResumeSummary(resumeData);
            const compactRole = this.buildCompactRoleSummary(jobRole);
            const normalizedPreferences = this.normalizeUserPreferences(userPreferences);

            const prompt = `
You are an expert career coach analyzing a candidate's fit for a job role.

CANDIDATE PROFILE:
${JSON.stringify(compactResume, null, 2)}

TARGET JOB ROLE:
${JSON.stringify(compactRole, null, 2)}

USER PREFERENCES:
${JSON.stringify(normalizedPreferences, null, 2)}

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
        "reason": "Docker matters because this role expects containerized deployment workflows. It is expected in the critical skills and responsibilities, but the resume does not show direct Docker evidence in experience, projects, or tools.",
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
      "relevance": "React is directly relevant because it appears in the role requirements and the resume already shows matching implementation experience.",
      "uniqueAdvantage": "The resume shows production-level React work, which makes this a stronger-than-average match for the role.",
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

Important rules for reasoning quality:
- Every skill gap reason must include:
  1. why the skill matters for this role
  2. where it was expected, such as required skills or responsibilities
  3. what evidence is missing from the resume
- Every strength relevance should explain why it matches the role.
- Every uniqueAdvantage should explain what concrete resume evidence makes that strength valuable.
- Do not use vague reasons like "important skill" or "good to have" without context.
- Stay grounded only in the provided resume and role data.
- estimatedTimeToReady should account for the available hoursPerWeek.
- recommendations should reflect budget and learningStyle when suggesting next actions.

Return ONLY the JSON object, no markdown formatting.
`;

            const result = await generateContentWithFallback({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0,
                    maxOutputTokens: 2500,
                },
            });
            const response = await result.response;
            const rawText = response.text();

            const fallbackData = this.buildFallbackAnalysis(resumeData, jobRole, normalizedPreferences);
            const parsedData = await this.parseJsonResponse(rawText, resumeData, jobRole, normalizedPreferences);
            const structuredData = this.normalizeSkillGapPayload(parsedData, fallbackData, resumeData, jobRole);

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

    async parseJsonResponse(rawContent, resumeData, jobRole, userPreferences = {}) {
        const normalized = this.normalizeJsonString(rawContent);
        const extracted = this.extractJsonBlock(normalized);

        try {
            return this.tryParseJson(extracted);
        } catch (firstError) {
            logger.warn(`Primary skill gap JSON parse failed, attempting Gemini repair: ${firstError.message}`);
            logger.warn(`Skill gap AI raw preview: ${this.buildDebugPreview(rawContent)}`);
            logger.warn(`Skill gap AI extracted preview: ${this.buildDebugPreview(extracted)}`);

            try {
                const repaired = await this.repairJsonWithGemini(extracted);
                logger.warn(`Skill gap AI repaired preview: ${this.buildDebugPreview(repaired)}`);
                return this.tryParseJson(repaired);
            } catch (repairError) {
                logger.warn(`Falling back to deterministic skill gap analysis due to unrecoverable AI JSON: ${repairError.message}`);
                return this.buildFallbackAnalysis(resumeData, jobRole, userPreferences);
            }
        }
    }

    buildFallbackAnalysis(resumeData, jobRole, userPreferences = {}) {
        const normalizedPreferences = this.normalizeUserPreferences(userPreferences);
        const candidateSkills = extractCandidateSkillSet(resumeData);
        const strengths = [];
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

                const hasSkill = matchRoleSkill(candidateSkills, skillName);

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
                        reason: item?.description
                            || `${skillName} matters because it appears in the ${bucket} requirements for ${jobRole?.title || 'this role'}, but the resume does not show clear evidence of it in the listed skills, experience, or projects.`,
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
        const estimatedHours = (skillGaps.critical.length * 20) + (skillGaps.important.length * 10);
        const estimatedWeeks = Math.max(
            1,
            Math.ceil(estimatedHours / Math.max(1, normalizedPreferences.hoursPerWeek))
        );
        const recommendationSeed = normalizedPreferences.budget === 'free'
            ? 'Use high-quality free resources for the missing critical skills first.'
            : normalizedPreferences.budget === 'high'
                ? 'Use premium resources and mentorship where they accelerate the highest-priority gaps.'
                : 'Mix free and paid resources to close the highest-priority gaps efficiently.';
        const styleRecommendationMap = {
            visual: 'Prefer video-first explanations and walkthroughs for the top missing skills.',
            auditory: 'Prefer spoken explanations, guided sessions, and discussion-driven learning for the top gaps.',
            reading: 'Prefer documentation, books, and structured notes for the top gaps.',
            kinesthetic: 'Prefer hands-on projects and exercises that force repeated practice of the missing skills.',
            mixed: 'Mix projects, documentation, and guided tutorials to keep momentum while closing the top gaps.',
        };

        return {
            overallAssessment: {
                matchPercentage,
                readinessLevel: matchPercentage >= 80
                    ? 'ready'
                    : matchPercentage >= 55
                        ? 'nearly-ready'
                        : 'not-ready',
                estimatedTimeToReady: {
                    weeks: estimatedWeeks,
                    reason: `Generated from fallback skill-matching logic using ${normalizedPreferences.hoursPerWeek} study hours per week because AI JSON was invalid`,
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
                recommendationSeed,
                styleRecommendationMap[normalizedPreferences.learningStyle] || styleRecommendationMap.mixed,
            ],
        };
    }
}

const skillgapanalysis = new SkillGapAnalysis();
export default skillgapanalysis;
