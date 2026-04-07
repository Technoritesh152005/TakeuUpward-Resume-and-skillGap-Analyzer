import adzunaService from './adzuna.service.js'

class RecommendJobs {
    toSafeNumber(value, fallback = 0) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value
        }

        if (typeof value === 'string') {
            const match = value.match(/\d+(\.\d+)?/)
            if (match) {
                return Number(match[0])
            }
        }

        return fallback
    }

    takeLocationDetails(analysis = {}) {
        return (
            analysis?.resume?.parsedData?.contactInfo?.location ||
            analysis?.resume?.parsedData?.personalInfo?.location ||
            analysis?.resume?.parsedData?.profile?.location ||
            ''
        )
    }

    buildJobRoleSearchPlan(analysis = {}) {
        const targetRole = analysis?.jobRole
        const closestRole = analysis?.closestWinnableRole
        const roles = []

        if (targetRole?.title) {
            roles.push({
                type: 'target_role',
                title: String(targetRole.title),
                roleId: String(targetRole?._id || ''),
            })
        }

        if (closestRole?.title) {
            const closestRoleId = String(closestRole?.roleId || '')
            const targetRoleId = String(targetRole?._id || '')

            if (!closestRoleId || closestRoleId !== targetRoleId) {
                roles.push({
                    type: 'closest_winnable_role',
                    roleId: closestRoleId,
                    title: String(closestRole.title),
                })
            }
        }

        return roles
    }

    mapReadinessLabel(label, sourceType) {
        if (sourceType === 'closest_winnable_role' && label === 'stretch_role') {
            return 'apply_after_skill_upgrade'
        }

        return label || 'stretch_role'
    }

    buildReasons(job = {}, analysis = {}, sourceType) {
        const reasons = []
        const readinessLabel = analysis?.applicationReadiness?.label
        const targetRoleTitle = analysis?.jobRole?.title
        const closestRoleTitle = analysis?.closestWinnableRole?.title

        if (sourceType === 'target_role' && targetRoleTitle) {
            reasons.push(`Matches your selected target role: ${targetRoleTitle}`)
        }

        if (sourceType === 'closest_winnable_role' && closestRoleTitle) {
            reasons.push(`Aligned with your closest winnable role: ${closestRoleTitle}`)
        }

        if (job?.location) {
            reasons.push(`Available in ${job.location}`)
        }

        if (readinessLabel === 'apply_after_resume_fixes') {
            reasons.push('Skills look close enough, but resume improvements may be needed first')
        } else if (readinessLabel === 'apply_after_skill_upgrade') {
            reasons.push('Good long-term fit, but you still need to close some missing skills')
        } else if (readinessLabel === 'apply_now') {
            reasons.push('Current analysis suggests you can start applying now')
        }

        return reasons.slice(0, 3)
    }

    scoreJob(job = {}, analysis = {}, sourceType = 'target_role') {
        const readiness = analysis?.applicationReadiness || {}
        const closest = analysis?.closestWinnableRole || {}
        const matchScore = this.toSafeNumber(analysis?.matchScore, 0)
        const readinessScore = this.toSafeNumber(readiness?.readinessScore, 0)
        const atsScore = this.toSafeNumber(analysis?.atsScore?.overall, 0)
        const criticalGapCount = Array.isArray(analysis?.skillGaps?.critical) ? analysis.skillGaps.critical.length : 0
        const importantGapCount = Array.isArray(analysis?.skillGaps?.important) ? analysis.skillGaps.important.length : 0

        const roleBoost = sourceType === 'closest_winnable_role'
            ? this.toSafeNumber(closest?.winnableScore, 0) * 0.35
            : 12

        const baseScore = Math.round(
            (matchScore * 0.35) +
            (readinessScore * 0.30) +
            (atsScore * 0.15) +
            roleBoost -
            (criticalGapCount * 8) -
            (importantGapCount * 3)
        )

        return {
            score: Math.max(0, Math.min(100, baseScore)),
            label: this.mapReadinessLabel(readiness?.label, sourceType),
        }
    }

    removeDuplicateJobs(jobs = []) {
        const seen = new Set()
        const jobArray = []

        for (const job of jobs) {
            const key = job?.externalId || job?.redirectUrl || `${job?.title}:${job?.company}:${job?.location}`
            if (!key || seen.has(key)) {
                continue
            }

            seen.add(key)
            jobArray.push(job)
        }

        return jobArray
    }

    async getRecommendationsForAnalysis(analysis, options = {}) {
        if (!analysis) {
            throw new Error('Analysis is required to recommend jobs')
        }

        const location = options.location || this.takeLocationDetails(analysis)
        const pageSize = options.pageSize || 8
        const rolesToSearch = this.buildJobRoleSearchPlan(analysis)

        if (!rolesToSearch.length) {
            return {
                basedOn: [],
                jobs: [],
            }
        }

        const searchResults = await Promise.all(
            rolesToSearch.map(async (role) => {
                const result = await adzunaService.searchJobs({
                    roleTitle: role.title,
                    location,
                    page: 1,
                    pageSize,
                })

                return {
                    role,
                    jobs: result.jobs.map((job) => ({ ...job, sourceRoleType: role.type })),
                }
            })
        )

        const dedupedJobs = this.removeDuplicateJobs(
            searchResults.flatMap((result) => result.jobs)
        )

        const rankedJobs = dedupedJobs
            .map((job) => {
                const scoring = this.scoreJob(job, analysis, job.sourceRoleType)

                return {
                    ...job,
                    recommendationLabel: scoring.label,
                    recommendationScore: scoring.score,
                    recommendationReasons: this.buildReasons(job, analysis, job.sourceRoleType),
                }
            })
            .sort((a, b) => b.recommendationScore - a.recommendationScore)

        return {
            basedOn: rolesToSearch,
            jobs: rankedJobs,
        }
    }
}

const jobRecommendationService = new RecommendJobs()
export default jobRecommendationService
