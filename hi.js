import { getModel } from '../../config/gemini.js';
import logger from '../../utils/logs.js';

const MAX_PROJECTS = 4;
const MAX_BULLETS_PER_PROJECT = 2;
const MAX_SKILLS_PER_GROUP = 12;
const MAX_ROLE_SKILLS = 10;

const asString = (value) => String(value || '').trim();

const toStringArray = (value, limit = 10) => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => {
            if (typeof item === 'string') return asString(item);
            return asString(item?.title || item?.skill || item?.name);
        })
        .filter(Boolean)
        .slice(0, limit);
};

const extractJsonObject = (content) => {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');

    if (start === -1 || end === -1 || end <= start) {
        return content;
    }

    return content.slice(start, end + 1);
};

const normalizeJson = (content) => {
    if (!content) return content;

    return content
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([\{\[,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/\r/g, '');
};

const toNumber = (value, fallback = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string') {
        const match = value.match(/\d+(\.\d+)?/);
        if (match) return Number(match[0]);
    }

    return fallback;
};

const normalizeTopSkillGaps = (value) => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => ({
            skill: asString(item?.skill || item?.title || item?.name),
            importance: toNumber(item?.importance, 0),
            reason: asString(item?.reason || item?.explanation),
        }))
        .filter((item) => item.skill)
        .slice(0, 6);
};

const normalizeComparison = (item) => {
    return {
        jobRoleId: asString(item?.jobRoleId || item?.roleId || item?.id),
        matchPercentage: Math.max(0, Math.min(100, Math.round(toNumber(item?.matchPercentage ?? item?.matchScore, 0)))),
        readinessLevel: asString(item?.readinessLevel || 'not-ready').toLowerCase() || 'not-ready',
        estimatedTimeToReady: {
            weeks: Math.max(0, Math.round(toNumber(item?.estimatedTimeToReady?.weeks ?? item?.weeksToReady, 0))),
            reason: asString(item?.estimatedTimeToReady?.reason || item?.timeToReadyReason),
        },
        topSkillGaps: normalizeTopSkillGaps(item?.topSkillGaps),
        strengths: toStringArray(item?.strengths, 5),
        summary: asString(item?.summary),
    };
};

class MultiRoleCompareService {
    buildResumeSummary(parsedData = {}) {
        const skills = parsedData?.skills || {};
        const projects = Array.isArray(parsedData?.projects) ? parsedData.projects : [];
        const experience = Array.isArray(parsedData?.experience) ? parsedData.experience : [];
        const education = Array.isArray(parsedData?.education) ? parsedData.education : [];
        const certifications = Array.isArray(parsedData?.certifications) ? parsedData.certifications : [];

        return {
            professionalSummary: asString(parsedData?.summary || parsedData?.objective || parsedData?.profile),
            skills: {
                technical: toStringArray(skills?.technical, MAX_SKILLS_PER_GROUP),
                frameworks: toStringArray(skills?.frameworks, MAX_SKILLS_PER_GROUP),
                tools: toStringArray(skills?.tools, MAX_SKILLS_PER_GROUP),
                languages: toStringArray(skills?.languages || skills?.language, MAX_SKILLS_PER_GROUP),
                databases: toStringArray(skills?.database, MAX_SKILLS_PER_GROUP),
                others: toStringArray(skills?.others, MAX_SKILLS_PER_GROUP),
            },
            experience: experience.slice(0, 4).map((item) => ({
                role: asString(item?.role || item?.title || item?.position),
                company: asString(item?.company),
                startDate: asString(item?.startDate),
                endDate: asString(item?.endDate || (item?.current ? 'Present' : '')),
                highlights: toStringArray(item?.responsibilities || item?.highlights || item?.achievements, 3),
            })),
            projects: projects.slice(0, MAX_PROJECTS).map((item) => ({
                title: asString(item?.title || item?.name),
                technologies: toStringArray(item?.technologies || item?.skillsUsed || item?.techStack, 8),
                highlights: toStringArray(item?.highlights || item?.description || item?.bulletPoints, MAX_BULLETS_PER_PROJECT),
            })),
            education: education.slice(0, 2).map((item) => ({
                degree: asString(item?.degree || item?.title),
                institution: asString(item?.institution || item?.school || item?.college),
                year: asString(item?.year || item?.graduationYear),
            })),
            certifications: certifications.slice(0, 5).map((item) => ({
                title: asString(item?.title || item?.name),
                issuer: asString(item?.issuer || item?.provider),
            })),
        };
    }

    buildRoleSummary(jobRole) {
        return {
            id: String(jobRole?._id),
            title: asString(jobRole?.title),
            category: asString(jobRole?.category),
            experienceLevel: asString(jobRole?.experienceLevel),
            requiredSkills: {
                critical: toStringArray(jobRole?.requiredSkills?.critical, MAX_ROLE_SKILLS),
                important: toStringArray(jobRole?.requiredSkills?.important, MAX_ROLE_SKILLS),
                niceToHave: toStringArray(jobRole?.requiredSkills?.niceToHave, MAX_ROLE_SKILLS),
            },
        };
    }

    parseResponse(rawContent) {
        const attempts = [
            rawContent,
            extractJsonObject(rawContent),
            normalizeJson(rawContent),
            normalizeJson(extractJsonObject(rawContent)),
        ].filter(Boolean);

        let lastError = null;

        for (const attempt of attempts) {
            try {
                return JSON.parse(attempt);
            } catch (error) {
                lastError = error;
            }
        }

        throw new Error(`Invalid JSON response from multi-role compare model: ${lastError?.message || 'unknown parse error'}`);
    }

    normalizeResponse(rawResponse, jobRoles) {
        const comparisons = Array.isArray(rawResponse?.comparisons)
            ? rawResponse.comparisons.map(normalizeComparison).filter((item) => item.jobRoleId)
            : [];

        if (!comparisons.length) {
            throw new Error('Multi-role compare response did not include valid comparisons');
        }

        const validRoleIds = new Set(jobRoles.map((jobRole) => String(jobRole._id)));
        const filteredComparisons = comparisons.filter((item) => validRoleIds.has(item.jobRoleId));

        if (!filteredComparisons.length) {
            throw new Error('Multi-role compare response did not match requested job roles');
        }

        return {
            comparisons: filteredComparisons,
            bestFitJobRoleId: asString(rawResponse?.bestFitJobRoleId),
            fastestPathJobRoleId: asString(rawResponse?.fastestPathJobRoleId),
            overallSummary: asString(rawResponse?.overallSummary),
        };
    }

    async compareResumeAgainstRoles(resumeParsedData, jobRoles) {
        const compactResume = this.buildResumeSummary(resumeParsedData);
        const compactRoles = jobRoles.map((jobRole) => this.buildRoleSummary(jobRole));

        const prompt = `
You are an expert career coach. Compare ONE candidate against MULTIPLE target job roles.

Return ONLY valid JSON. No markdown. No extra text.

CANDIDATE SUMMARY:
${JSON.stringify(compactResume, null, 2)}

TARGET JOB ROLES:
${JSON.stringify(compactRoles, null, 2)}

Rules:
1. Compare the candidate against every role independently, then rank them comparatively.
2. Use only the provided resume summary and role requirements.
3. Keep topSkillGaps short and high-signal.
4. Use readinessLevel from: "not-ready", "nearly-ready", "ready", "overqualified".
5. estimatedTimeToReady.weeks must be a number.
6. bestFitJobRoleId and fastestPathJobRoleId must match one of the provided role ids.

Return JSON in exactly this shape:
{
  "comparisons": [
    {
      "jobRoleId": "role_id_here",
      "matchPercentage": 78,
      "readinessLevel": "nearly-ready",
      "estimatedTimeToReady": {
        "weeks": 10,
        "reason": "Missing two critical skills"
      },
      "topSkillGaps": [
        {
          "skill": "Docker",
          "importance": 9,
          "reason": "Frequently required for deployment workflows"
        }
      ],
      "strengths": ["React", "JavaScript"],
      "summary": "Strong frontend fit with some deployment gaps"
    }
  ],
  "bestFitJobRoleId": "role_id_here",
  "fastestPathJobRoleId": "role_id_here",
  "overallSummary": "Best fit is ..., fastest path is ..."
}
`;

        const model = getModel();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const rawText = response.text();

        const cleaned = rawText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = this.parseResponse(cleaned);
        const normalized = this.normalizeResponse(parsed, jobRoles);

        logger.info(`Multi-role comparison completed for ${jobRoles.length} roles`);
        return normalized;
    }
}

const multiRoleCompareService = new MultiRoleCompareService();

export default multiRoleCompareService;
