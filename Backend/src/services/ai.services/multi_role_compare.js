import { generateContentWithFallback } from '../../config/gemini.js'
import logger from '../../utils/logs.js'

const MAX_PROJECTS = 4;
const MAX_BULLETS_PER_PROJECT = 2;
const MAX_SKILLS_PER_GROUP = 12
const MAX_ROLE_SKILLS = 10;

const makeString = (value) => String(value || '').trim()

const toStringArray = (value, limit = 10) => {

    if (!Array.isArray(value)) return []

    return value.map((item) => {
        // if item is already string retrun it
        if (typeof item === 'string') return makeString(item)
        return makeString(item?.title || item?.skill || item?.name)
    })
        // keep only valid data
        .filter(Boolean)
        .slice(0, limit)
}

// its receiving array
const extractJsonObject = (data) => {
    const start = data.indexOf('{')
    const end = data.lastIndexOf('}')

    // means they r already at proper data
    if (start === -1 || end === -1 || end <= start) {
        return data
    }
    return data.slice(start, end + 1)
}

const extractJsonBlock = (content) => {
    const source = String(content ?? '')
    const startIndex = source.search(/[\[{]/)

    if (startIndex === -1) {
        return source.trim()
    }

    const opening = source[startIndex]
    const closing = opening === '{' ? '}' : ']'
    let depth = 0
    let inString = false
    let escaped = false

    for (let index = startIndex; index < source.length; index += 1) {
        const char = source[index]

        if (inString) {
            if (escaped) {
                escaped = false
                continue
            }

            if (char === '\\') {
                escaped = true
                continue
            }

            if (char === '"') {
                inString = false
            }
            continue
        }

        if (char === '"') {
            inString = true
            continue
        }

        if (char === opening) {
            depth += 1
        } else if (char === closing) {
            depth -= 1
            if (depth === 0) {
                return source.slice(startIndex, index + 1).trim()
            }
        }
    }

    return source.slice(startIndex).trim()
}

const normalizeJson = (content) => {
    if (!content) return content;

    return content
        .replace(/^\uFEFF/, '')
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/([\{\[,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)/g, '$1"$2"$3')
        .replace(/:\s*'([^']*)'/g, ': "$1"')
        .replace(/\r/g, '');
};

const escapeControlCharactersInStrings = (content) => {
    let escapedContent = ''
    let inString = false
    let escaped = false

    for (const char of String(content ?? '')) {
        if (inString) {
            if (escaped) {
                escapedContent += char
                escaped = false
                continue
            }

            if (char === '\\') {
                escapedContent += char
                escaped = true
                continue
            }

            if (char === '"') {
                escapedContent += char
                inString = false
                continue
            }

            if (char === '\n') {
                escapedContent += '\\n'
                continue
            }

            if (char === '\r') {
                escapedContent += '\\r'
                continue
            }

            if (char === '\t') {
                escapedContent += '\\t'
                continue
            }
        } else if (char === '"') {
            inString = true
        }

        escapedContent += char
    }

    return escapedContent
}

const toNumber = (data, fallback) => {
    if (typeof data === 'number' && Number.isFinite(data)) return data

    if (typeof data === 'string') {
        // removes the number value from string
        const match = data.match(/\d+(\.\d+)?/);
        if (match) return Number(match[0])
    }
    return fallback
}

const normalizeTopSkillGaps = (value) => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => ({
            skill: makeString(item?.skill || item?.title || item?.name),
            importance: toNumber(item?.importance, 0),
            reason: makeString(item?.reason || item?.explanation),
        }))
        .filter((item) => item.skill)
        .slice(0, 6);
};

const normalizeComparison = (item) => {
    return {
        jobRoleId: makeString(item?.jobRoleId),
        matchPercentage: Math.max(0, Math.min(100, Math.round(toNumber(item?.matchPercentage ?? item?.matchScore, 0)))),
        readinessLevel: makeString(item?.readinessLevel || 'not-ready').toLowerCase(),
        estimatedTimeToReady: {
            weeks: Math.max(0, Math.round(toNumber(item?.estimatedTimeToReady?.weeks ?? item?.weeksToReady, 0))),
            reason: makeString(item?.estimatedTimeToReady?.reason || item?.timeToReadyReason),
        },
        topSkillGaps: normalizeTopSkillGaps(item?.topSkillGaps),
        strengths:toStringArray(item?.strengths , 5),
        summary: makeString(item?.summary),
    }
}

class MultiRoleCompareAnalysis {

    // the resume parsed data u provide we make the summary of it
    buildResumeSummary(parsedData = {}) {

        const skills = parsedData?.skills || {}
        const experience = Array.isArray(parsedData?.experience) ? parsedData.experience : []
        const projects = Array.isArray(parsedData?.projects) ? parsedData.projects : []
        const education = Array.isArray(parsedData?.eduaction) ? parsedData.eduaction : []
        const certifications = Array.isArray(parsedData?.certifications) ? parsedData.certifications : []

        return {

            professionalSummary: makeString(parsedData?.summary || ''),
            skills: {
                technical: toStringArray(skills?.technical, MAX_SKILLS_PER_GROUP),
                frameworks: toStringArray(skills?.frameworks, MAX_SKILLS_PER_GROUP),
                tools: toStringArray(skills?.tools, MAX_SKILLS_PER_GROUP),
                languages: toStringArray(skills?.languages || skills?.language, MAX_SKILLS_PER_GROUP),
                databases: toStringArray(skills?.database, MAX_SKILLS_PER_GROUP),
                others: toStringArray(skills?.others, MAX_SKILLS_PER_GROUP),
            },
            // taking only 4 fields of experience
            experience: experience.slice(0, 4).map((item) => ({
                title: makeString(item?.title),
                company: makeString(item?.company),
                startDate: makeString(item?.startDate),
                endDate: makeString(item?.endDate),
                highlights: toStringArray(item?.responsibilities || item?.highlights || item?.achievements, 3),

            })),
            projects: projects.slice(0, MAX_PROJECTS).map((item) => ({

                title: makeString(item?.title),
                technologies: toStringArray(item?.technologies, 5),
                highlights: toStringArray(item?.highlights || item?.description || item?.bulletPoints, MAX_BULLETS_PER_PROJECT),
            })),
            eduaction: education.slice(0, 2).map((item) => ({
                degree: makeString(item?.degree || item?.title),
                institution: makeString(item?.institution || item?.school || item?.college),
                year: makeString(item?.year || item?.graduationYear),
            })),
            certifications: certifications.slice(0, 5).map((item) => ({
                title: makeString(item?.title || item?.name),
                issuer: makeString(item?.issuer || item?.provider),
            })),
        }
    }

    // for every jobroleItem. we just validate.. also remember we only need to send this much data only
    buildRoleSummary(jobRole) {
        return {
            id: String(jobRole?._id),
            title: makeString(jobRole?.title),
            category: makeString(jobRole?.category),
            experienceLevel: makeString(jobRole?.experienceLevel),
            requiredSkills: {
                critical: toStringArray(jobRole?.requiredSkills?.critical, MAX_ROLE_SKILLS),
                important: toStringArray(jobRole?.requiredSkills?.important, MAX_ROLE_SKILLS),
                niceToHave: toStringArray(jobRole?.requiredSkills?.niceToHave, MAX_ROLE_SKILLS),
            },
        };
    }

    parseResponse(content) {
        const normalized = normalizeJson(content)
        const extracted = extractJsonBlock(normalized)
        const attempts = [
            content,
            extractJsonObject(content),
            normalized,
            extracted,
            escapeControlCharactersInStrings(extracted),
            normalizeJson(extractJsonObject(content))

        ].filter(Boolean)

        let lastError = null;

        for (const attempt of attempts) {
            try {
                return JSON.parse(attempt)
            } catch (error) {
                lastError = error
            }
        }
        throw new Error(`Invalid JSON response from multi-role compare model: ${lastError?.message || 'unknown parse error'}`);
    }

    // here in normalize response u basically do is check the number of job role response
    normalizeResponse(rawResponse, jobRoles) {
        // comparision will have job role id of all comapred jobs
        const comparisons = Array.isArray(rawResponse?.comparisons)
            ? rawResponse.comparisons.map(normalizeComparison).filter((item) => item.jobRoleId)
            : [];

        if (!comparisons.length) {
            throw new Error('Multi-role compare response did not include valid comparisons');
        }

        // now take valid role ids means how many user did job selected
        const validRoleIds = new Set(jobRoles.map((jobRole) => String(jobRole._id)));
        const filteredComparisons = comparisons.filter((item) => validRoleIds.has(item.jobRoleId));

        if (!filteredComparisons.length) {
            throw new Error('Multi-role compare response did not match requested job roles');
        }

        return {
            comparisons: filteredComparisons,
            bestFitJobRoleId: makeString(rawResponse?.bestFitJobRoleId),
            fastestPathJobRoleId: makeString(rawResponse?.fastestPathJobRoleId),
            overallSummary: makeString(rawResponse?.overallSummary),
        };
    }

    async compareResumeAgainstMultipleRoles(resumeParsedData, jobRoles) {

        const compactResume = this.buildResumeSummary(resumeParsedData)
        // compact roles is an array of objects
        const compactRoles = jobRoles.map((jobRole) => this.buildRoleSummary(jobRole))
        console.log('See this compact resume', compactResume)
        console.log('see also this compact jobroles', compactRoles)

        const prompt =
            `
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
        `

        const result = await generateContentWithFallback(prompt)
        
        const response = await result.response
        const rawText = response.text()
        logger.info(`Multi-role compare raw response preview: ${String(rawText || '').replace(/\s+/g, ' ').trim().slice(0, 300)}`)
        const parsed = this.parseResponse(rawText)
        const normalized = this.normalizeResponse(parsed, jobRoles)
        logger.info(`Multi-role comparison completed for ${jobRoles.length} roles`);
        return normalized;
    }
}
const multiRoleCompareService = new MultiRoleCompareAnalysis();

export default multiRoleCompareService;
