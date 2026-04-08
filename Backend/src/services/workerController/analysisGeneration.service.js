import analysisModel from '../../models/analysis.model.js'
import resumeModel from '../../models/resume.model.js'
import jobRoleModel from '../../models/jobrole.model.js'
import skillgapanalysis from '../ai.services/skill_gap_analysis.js'
import generateAtsScore from '../ai.services/ats_score_generator.js'
import redisClient from '../../config/redis.js'
import logger from '../../utils/logs.js'
import { logMetric } from '../../utils/metrics.js'
import { refundAiUsage } from '../aiQuota.service.js'
import { ANALYSIS_PROCESSING_STAGE, ANALYSIS_STATUS } from '../../config/constant.js'
import readinessEngineService from '../readinessEngine.service.js'
import closestWinnableRoleService from '../closestWinnableRole.service.js'

const ANALYSIS_JOB_TIMEOUT_MS = 120000;

const withTimeout = (promise, timeoutMs, message) => (
    Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => reject(new Error(message)), timeoutMs);
        }),
    ])
);

const extractNumericValue = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const matches = value.match(/\d+(\.\d+)?/g);
        if (!matches || matches.length === 0) {
            return 0;
        }

        const numbers = matches.map(Number).filter(Number.isFinite);
        if (numbers.length === 0) {
            return 0;
        }

        return Math.max(...numbers);
    }

    return 0;
};

const parseMonthYearToDate = (value) => {
    if (!value) return null;

    const raw = String(value).trim();
    if (!raw) return null;

    if (/present|current|now/i.test(raw)) {
        return new Date();
    }

    const normalized = raw
        .replace(/\./g, ' ')
        .replace(/,/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const numericMonthYearMatch = raw.match(/^\s*(\d{1,2})\s*[-/]\s*(\d{4})\s*$/);
    if (numericMonthYearMatch) {
        const month = Number(numericMonthYearMatch[1]);
        const year = Number(numericMonthYearMatch[2]);

        if (month >= 1 && month <= 12 && Number.isFinite(year)) {
            return new Date(year, month - 1, 1);
        }
    }

    const numericYearMonthMatch = raw.match(/^\s*(\d{4})\s*[-/]\s*(\d{1,2})\s*$/);
    if (numericYearMonthMatch) {
        const year = Number(numericYearMonthMatch[1]);
        const month = Number(numericYearMonthMatch[2]);

        if (month >= 1 && month <= 12 && Number.isFinite(year)) {
            return new Date(year, month - 1, 1);
        }
    }

    const direct = new Date(normalized);
    if (!Number.isNaN(direct.getTime())) {
        return new Date(direct.getFullYear(), direct.getMonth(), 1);
    }

    const monthMap = {
        jan: 0, january: 0,
        feb: 1, february: 1,
        mar: 2, march: 2,
        apr: 3, april: 3,
        may: 4,
        jun: 5, june: 5,
        jul: 6, july: 6,
        aug: 7, august: 7,
        sep: 8, sept: 8, september: 8,
        oct: 9, october: 9,
        nov: 10, november: 10,
        dec: 11, december: 11,
    };

    const monthYearMatch = normalized.match(/([A-Za-z]+)\s+(\d{4})/);
    if (monthYearMatch) {
        const month = monthMap[monthYearMatch[1].toLowerCase()];
        const year = Number(monthYearMatch[2]);
        if (month !== undefined && Number.isFinite(year)) {
            return new Date(year, month, 1);
        }
    }

    const yearOnlyMatch = normalized.match(/\b(19|20)\d{2}\b/);
    if (yearOnlyMatch) {
        return new Date(Number(yearOnlyMatch[0]), 0, 1);
    }

    return null;
};

const calculateExperienceYearsFromResume = (parsedData) => {
    const experience = Array.isArray(parsedData?.experience) ? parsedData.experience : [];
    if (!experience.length) return 0;

    const intervals = experience
        .map((item) => {
            const start = parseMonthYearToDate(item?.startDate);
            const end = item?.current ? new Date() : parseMonthYearToDate(item?.endDate);

            if (!start || !end || end < start) {
                return null;
            }

            return {
                start: new Date(start.getFullYear(), start.getMonth(), 1),
                end: new Date(end.getFullYear(), end.getMonth(), 1),
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);

    if (!intervals.length) return 0;

    const merged = [];

    for (const interval of intervals) {
        const last = merged[merged.length - 1];

        if (!last || interval.start > last.end) {
            merged.push({ ...interval });
            continue;
        }

        if (interval.end > last.end) {
            last.end = interval.end;
        }
    }

    const totalMonths = merged.reduce((sum, interval) => {
        const months = ((interval.end.getFullYear() - interval.start.getFullYear()) * 12) +
            (interval.end.getMonth() - interval.start.getMonth()) + 1;
        return sum + Math.max(0, months);
    }, 0);

    return Math.round((totalMonths / 12) * 10) / 10;
};

const clearAnalysisCache = async (userId, analysisId = null) => {
    const normalizedUserId = String(userId);
    const userCacheKeys = await redisClient.keys(`analysis:${normalizedUserId}:*`);
    if (userCacheKeys.length) {
        await redisClient.del(...userCacheKeys);
    }

    if (analysisId) {
        await redisClient.del(`analysis:${normalizedUserId}:${analysisId}`);
    }
};

const normalizeDifficulty = (value) => {
    const raw = String(value || '').trim().toLowerCase();

    if (!raw) return 'beginner';
    if (raw === 'easy') return 'beginner';
    if (raw === 'medium') return 'intermediate';
    if (raw === 'hard') return 'advanced';
    if (['beginner', 'intermediate', 'advanced'].includes(raw)) return raw;

    return 'beginner';
};

const normalizeReadinessLevel = (value) => {
    const raw = String(value || '').trim().toLowerCase();

    if (!raw) return 'not-ready';
    if (raw.includes('over')) return 'overqualified';
    if (raw.includes('nearly') || raw.includes('moderately') || raw.includes('almost')) {
        return 'nearly-ready';
    }
    if (raw === 'ready' || raw.includes('job ready')) return 'ready';
    if (raw.includes('not')) return 'not-ready';

    return 'not-ready';
};

const normalizeProficiency = (value) => {
    const raw = String(value || '').trim().toLowerCase();

    if (!raw) return 'beginner';
    if (['beginner', 'novice', 'basic'].includes(raw)) return 'beginner';
    if (['intermediate', 'medium'].includes(raw)) return 'intermediate';
    if (['advanced', 'proficient', 'proficiency'].includes(raw)) return 'advanced';
    if (['expert', 'fluent', 'native'].includes(raw)) return 'expert';

    return 'beginner';
};

const buildMatchBreakdown = (jobRole, skillGapAnalysisData) => {
    const criticalMatched = jobRole.requiredSkills.critical.length -
        (skillGapAnalysisData.skillGaps.critical?.length || 0);
    const criticalTotal = jobRole.requiredSkills.critical.length;
    const importantMatched = jobRole.requiredSkills.important.length -
        (skillGapAnalysisData.skillGaps.important?.length || 0);
    const importantTotal = jobRole.requiredSkills.important.length;
    const niceToHaveMatched = jobRole.requiredSkills.niceToHave.length -
        (skillGapAnalysisData.skillGaps.niceToHave?.length || 0);
    const niceToHaveTotal = jobRole.requiredSkills.niceToHave.length;

    return {
        criticalSkills: {
            matched: criticalMatched,
            total: criticalTotal,
            percentage: criticalTotal > 0 ? Math.round((criticalMatched / criticalTotal) * 100) : 0
        },
        importantSkills: {
            matched: importantMatched,
            total: importantTotal,
            percentage: importantTotal > 0 ? Math.round((importantMatched / importantTotal) * 100) : 0
        },
        niceToHaveSkills: {
            matched: niceToHaveMatched,
            total: niceToHaveTotal,
            percentage: niceToHaveTotal > 0 ? Math.round((niceToHaveMatched / niceToHaveTotal) * 100) : 0
        }
    }
}

const buildSkillArtifacts = (skillGapAnalysisData) => {
    const normalizedSkillGaps = {
        critical: (skillGapAnalysisData.skillGaps?.critical || []).map((item) => ({
            ...item,
            difficulty: normalizeDifficulty(item?.difficulty),
        })),
        important: (skillGapAnalysisData.skillGaps?.important || []).map((item) => ({
            ...item,
            difficulty: normalizeDifficulty(item?.difficulty),
        })),
        niceToHave: (skillGapAnalysisData.skillGaps?.niceToHave || []).map((item) => ({
            ...item,
            difficulty: normalizeDifficulty(item?.difficulty),
        })),
    };

    const normalizedStrengths = (skillGapAnalysisData.strengths || []).map((item) => ({
        ...item,
        proficiency: normalizeProficiency(item?.proficiency),
    }));

    const extractedSkills = new Set();
    normalizedSkillGaps.critical?.forEach((item) => {
        if (item.skill) extractedSkills.add(item.skill);
    });
    normalizedSkillGaps.important?.forEach((item) => {
        if (item.skill) extractedSkills.add(item.skill);
    });
    normalizedSkillGaps.niceToHave?.forEach((item) => {
        if (item.skill) extractedSkills.add(item.skill);
    });
    normalizedStrengths.forEach((item) => {
        if (item.skill) extractedSkills.add(item.skill);
    });

    const levelMap = {
        beginner: 30,
        intermediate: 60,
        advanced: 85,
        expert: 95
    };

    const skillBreakdown = [];

    normalizedStrengths.forEach((strength) => {
        const currentLevel = levelMap[strength.proficiency] || 50;
        const targetLevel = 95;

        skillBreakdown.push({
            skillName: strength.skill,
            currentLevel,
            targetLevel,
            gap: Math.max(0, targetLevel - currentLevel)
        });
    });

    normalizedSkillGaps.critical?.forEach((gap) => {
        const exists = skillBreakdown.some((item) => item.skillName === gap.skill);
        if (!exists) {
            skillBreakdown.push({
                skillName: gap.skill,
                currentLevel: 0,
                targetLevel: gap.importance * 10,
                gap: gap.importance * 10
            });
        }
    });

    normalizedSkillGaps.important?.forEach((gap) => {
        const exists = skillBreakdown.some((item) => item.skillName === gap.skill);
        if (!exists) {
            skillBreakdown.push({
                skillName: gap.skill,
                currentLevel: 0,
                targetLevel: gap.importance * 10,
                gap: gap.importance * 10
            });
        }
    });

    return {
        normalizedSkillGaps,
        normalizedStrengths,
        extractedSkills: Array.from(extractedSkills),
        skillBreakdown,
    }
}

const refundAiUsageSafely = async (userId) => {
    try {
        return await refundAiUsage(userId)
    } catch (error) {
        logger.error(`Failed to refund AI quota for user ${userId}: ${error.message}`)
        return null
    }
}

export const processAnalysisGenerationJob = async ({ analysisId, userId, resumeId, jobRoleId }) => {
    const analysis = await analysisModel.findOne({
        _id: analysisId,
        user: userId,
        isActive: true
    })

    if (!analysis) {
        throw new Error(`Analysis ${analysisId} not found`)
    }

    const resume = await resumeModel.findOne({
        _id: resumeId,
        user: userId,
        isActive: true,
        processingStatus: 'completed'
    })

    if (!resume || !resume.parsedData) {
        throw new Error('Resume not found or not parsed yet')
    }

    const jobRole = await jobRoleModel.findOne({
        _id: jobRoleId,
        isActive: true
    })

    if (!jobRole) {
        throw new Error('Job Role not found')
    }

    analysis.status = ANALYSIS_STATUS.PROCESSING
    analysis.processingStage = ANALYSIS_PROCESSING_STAGE.PROCESSING
    analysis.processingStartedAt = new Date()
    analysis.error = undefined
    await analysis.save()
    await clearAnalysisCache(userId, analysisId)
    logMetric('analysis.queue_wait_ms', {
        analysisId: String(analysisId),
        userId: String(userId),
        value: analysis.queuedAt ? analysis.processingStartedAt.getTime() - new Date(analysis.queuedAt).getTime() : undefined,
    })

    try {
        const skillGapPromise = skillgapanalysis.performDeepSkillGapAnalyze(
            resume.parsedData,
            jobRole
        )

        const atsPromise = generateAtsScore.getAtsScore(
            resume.parsedData,
            jobRole
        )

        const [skillGapAnalysisData, atsScore] = await withTimeout(
            Promise.all([
                skillGapPromise,
                atsPromise,
            ]),
            ANALYSIS_JOB_TIMEOUT_MS,
            'Analysis generation timed out. Please retry.'
        )

        analysis.processingStage = ANALYSIS_PROCESSING_STAGE.FINALIZING
        await analysis.save()

        analysis.matchScore = skillGapAnalysisData.overallAssessment.matchPercentage
        analysis.matchBreakDown = buildMatchBreakdown(jobRole, skillGapAnalysisData)

        const {
            normalizedSkillGaps,
            normalizedStrengths,
            extractedSkills,
            skillBreakdown,
        } = buildSkillArtifacts(skillGapAnalysisData)

        analysis.skillGaps = normalizedSkillGaps
        analysis.extractedSkills = extractedSkills
        analysis.skillBreakdown = skillBreakdown
        analysis.candidateStrength = normalizedStrengths
        analysis.transferrableSkills = skillGapAnalysisData.transferableSkills

        const parsedExperienceYears = calculateExperienceYearsFromResume(resume.parsedData)
        const aiCandidateYears = extractNumericValue(skillGapAnalysisData.experienceGap?.candidateYears)
        const candidateYears = parsedExperienceYears || aiCandidateYears
        const requiredYears = extractNumericValue(skillGapAnalysisData.experienceGap?.typicalRequirement)

        analysis.experienceAnalysis = {
            candidateYears,
            requiredYears,
            gap: Math.max(0, requiredYears - candidateYears),
            assessment: skillGapAnalysisData.experienceGap?.assessment || ''
        }

        analysis.readinessLevel = normalizeReadinessLevel(
            skillGapAnalysisData.overallAssessment.readinessLevel
        )
        analysis.estimatedTimeToReady = skillGapAnalysisData.overallAssessment.estimatedTimeToReady

        analysis.atsScore = {
            overall: atsScore.overallScore,
            formatting: atsScore.breakdown.formatting,
            keywords: {
                score: atsScore.breakdown.keywords.score,
                matched: atsScore.breakdown.keywords.matched,
                missing: atsScore.breakdown.keywords.missing,
                recommended: atsScore.breakdown.keywords.recommended
            },
            structure: atsScore.breakdown.structure,
            content: {
                ...atsScore.breakdown.content,
                weakPhrases: atsScore.breakdown.content.weakPhrases,
                rewriteSuggestions: atsScore.breakdown.content.rewriteSuggestions,
            }
        }

        analysis.aiSuggestion = {
            summary: skillGapAnalysisData.overallAssessment.summary,
            recommendations: skillGapAnalysisData.recommendations
        }

        analysis.applicationReadiness = readinessEngineService.buildReadiness({
            matchScore: analysis.matchScore,
            atsScore: analysis.atsScore?.overall,
            criticalGapCount: analysis.skillGaps?.critical?.length || 0,
            importantGapCount: analysis.skillGaps?.important?.length || 0,
            experienceGap: analysis.experienceAnalysis?.gap || 0,
            readinessLevel: analysis.readinessLevel,
        })

        const relatedRoleIds = Array.isArray(jobRole?.relatedRoles) ? jobRole.relatedRoles : []
        const nearbyRoles = await jobRoleModel.find({
            isActive: true,
            _id: { $ne: jobRole._id },
            $or: [
                { _id: { $in: relatedRoleIds } },
                {
                    category: jobRole.category,
                    experienceLevel: jobRole.experienceLevel,
                },
            ],
        })
            .limit(8)

        analysis.closestWinnableRole = closestWinnableRoleService.findClosestWinnableRole({
            resumeData: resume.parsedData,
            currentAnalysis: {
                applicationReadiness: analysis.applicationReadiness,
            },
            targetRole: jobRole,
            candidateRoles: nearbyRoles,
        })

        analysis.status = ANALYSIS_STATUS.COMPLETED
        analysis.processingStage = ANALYSIS_PROCESSING_STAGE.COMPLETED
        analysis.completedAt = new Date()
        analysis.processingTime = analysis.processingStartedAt
            ? analysis.completedAt.getTime() - analysis.processingStartedAt.getTime()
            : undefined

        await analysis.save()
        await clearAnalysisCache(userId, analysisId)
        logMetric('analysis.processing_time_ms', {
            analysisId: String(analysisId),
            userId: String(userId),
            value: analysis.processingTime,
            status: analysis.status,
        })

        logger.info(`Analysis generated successfully for user: ${userId}`)
        return analysis
    } catch (error) {
        analysis.error = error.message
        analysis.status = ANALYSIS_STATUS.FAILED
        analysis.processingStage = ANALYSIS_PROCESSING_STAGE.FAILED
        await analysis.save()
        await clearAnalysisCache(userId, analysisId)
        logMetric('analysis.processing_time_ms', {
            analysisId: String(analysisId),
            userId: String(userId),
            value: analysis.processingStartedAt ? Date.now() - new Date(analysis.processingStartedAt).getTime() : undefined,
            status: analysis.status,
        })

        await refundAiUsageSafely(userId)
        logger.error(`Error while generating analysis: ${error.message}`)
        throw error
    }
}
