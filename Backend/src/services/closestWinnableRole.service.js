import { extractCandidateSkillSet, matchRoleSkill } from './ai.services/fallbackSkillMatcher.js';

class ClosestWinnableRoleService {
    
    toSafeNumber(value, fallback = 0) {
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

    buildRoleSkillBuckets(jobRole = {}) {
        return {
            critical: Array.isArray(jobRole?.requiredSkills?.critical) ? jobRole.requiredSkills.critical : [],
            important: Array.isArray(jobRole?.requiredSkills?.important) ? jobRole.requiredSkills.important : [],
            niceToHave: Array.isArray(jobRole?.requiredSkills?.niceToHave) ? jobRole.requiredSkills.niceToHave : [],
        };
    }

    scoreRoleFit(candidateSkillSet, jobRole) {
        const buckets = this.buildRoleSkillBuckets(jobRole);
        const scoreWeights = {
            critical: 14,
            important: 7,
            niceToHave: 3,
        };

        const matched = {
            critical: 0,
            important: 0,
            niceToHave: 0,
        };

        const gaps = {
            critical: 0,
            important: 0,
            niceToHave: 0,
        };

        let weightedScore = 0;
        let maxScore = 0;

        for (const bucket of Object.keys(buckets)) {
            for (const item of buckets[bucket]) {
                const title = item?.title || item?.skill;
                if (!title) continue;

                const weight = this.toSafeNumber(item?.importance, scoreWeights[bucket]);
                maxScore += weight;

                if (matchRoleSkill(candidateSkillSet, title)) {
                    matched[bucket] += 1;
                    weightedScore += weight;
                } else {
                    gaps[bucket] += 1;
                }
            }
        }

        const fitScore = maxScore > 0
            ? Math.max(0, Math.min(100, Math.round((weightedScore / maxScore) * 100)))
            : 0;

        return {
            fitScore,
            matched,
            gaps,
        };
    }

    buildReasons(jobRole, roleFit) {
        const reasons = [];

        if (roleFit.matched.critical > 0) {
            reasons.push(`Matches ${roleFit.matched.critical} critical skill${roleFit.matched.critical === 1 ? '' : 's'} for ${jobRole.title}`);
        }

        if (roleFit.gaps.critical === 0) {
            reasons.push('No critical role blockers were detected');
        } else {
            reasons.push(`${roleFit.gaps.critical} critical skill gap${roleFit.gaps.critical === 1 ? '' : 's'} still remain`);
        }

        if (roleFit.matched.important > 0) {
            reasons.push(`Already covers ${roleFit.matched.important} important supporting skill${roleFit.matched.important === 1 ? '' : 's'}`);
        }

        return reasons.slice(0, 3);
    }

    buildNextAction(roleFit) {
        if (roleFit.gaps.critical === 0 && roleFit.gaps.important <= 1) {
            return 'Tailor resume evidence for this role and start applying selectively.';
        }

        if (roleFit.gaps.critical <= 1) {
            return 'Close the last critical gap and improve role-specific resume keywords before applying.';
        }

        return 'Focus on the top missing critical skills before treating this as a primary target role.';
    }

    findClosestWinnableRole({ resumeData, currentAnalysis, targetRole, candidateRoles = [] }) {
        const roles = Array.isArray(candidateRoles) ? candidateRoles : [];
        if (!resumeData || !roles.length) {
            return null;
        }

        const candidateSkillSet = extractCandidateSkillSet(resumeData);
        const targetRoleId = String(targetRole?._id || '');
        const targetCategory = String(targetRole?.category || '').toLowerCase();
        const targetExperienceLevel = String(targetRole?.experienceLevel || '').toLowerCase();
        const currentReadinessScore = this.toSafeNumber(currentAnalysis?.applicationReadiness?.readinessScore, 0);

        const scoredRoles = roles
            .filter((role) => role && String(role._id || '') !== targetRoleId)
            .map((role) => {
                const roleFit = this.scoreRoleFit(candidateSkillSet, role);
                const categoryBonus = String(role?.category || '').toLowerCase() === targetCategory ? 8 : 0;
                const levelBonus = String(role?.experienceLevel || '').toLowerCase() === targetExperienceLevel ? 5 : 0;
                const atsPenalty = currentReadinessScore < 60 ? 6 : 0;
                const winnableScore = Math.max(
                    0,
                    Math.min(
                        100,
                        Math.round(
                            roleFit.fitScore +
                            categoryBonus +
                            levelBonus -
                            (roleFit.gaps.critical * 12) -
                            (roleFit.gaps.important * 4) -
                            atsPenalty
                        )
                    )
                );

                return {
                    roleId: role._id,
                    title: role.title,
                    category: role.category,
                    experienceLevel: role.experienceLevel,
                    fitScore: roleFit.fitScore,
                    winnableScore,
                    matched: roleFit.matched,
                    gaps: roleFit.gaps,
                    reasons: this.buildReasons(role, roleFit),
                    nextAction: this.buildNextAction(roleFit),
                };
            })
            .sort((a, b) => b.winnableScore - a.winnableScore);

        return scoredRoles[0] || null;
    }
}

const closestWinnableRoleService = new ClosestWinnableRoleService();
export default closestWinnableRoleService;
