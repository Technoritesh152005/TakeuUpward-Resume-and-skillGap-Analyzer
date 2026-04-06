class readinessEngine {

    // method to safely takeout the number if string present

    toSafeNumber(value, fallback = 0) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }

        if (typeof value === 'string') {
            const match = value.match(/\d+(\.\d+)?/);
            if (match) {
                return Number(match[0])
            }
        }

        return fallback
    }

    buildReadiness({ matchScore, atsScore, criticalGapCount, importantGapCount, experienceGap, readinessLevel }) {
        const safeMatchScore = this.toSafeNumber(matchScore)
        const safeAtsScore = this.toSafeNumber(atsScore)
        const safeCriticalGapCount = this.toSafeNumber(criticalGapCount)
        const safeImportantGapCount = this.toSafeNumber(importantGapCount)
        const safeExperienceGap = this.toSafeNumber(experienceGap)
        const normalizedReadinessLevel = String(readinessLevel || '').trim().toLowerCase()

        let label = 'stretch_role'
        let mainBlocker = 'Missing critical skills'
        let nextAction = 'Close the highest-impact skill gaps before applying broadly.'

        if (safeAtsScore >= 75 && safeCriticalGapCount <= 1 && safeMatchScore >= 75 && safeExperienceGap <= 1) {
            label = 'apply_now'
            mainBlocker = 'Minor resume polish'
            nextAction = 'Start applying now and tailor the resume to each job posting.'
        } else if (safeMatchScore >= 68 && safeCriticalGapCount <= 1 && safeExperienceGap <= 1.5 && safeAtsScore < 70) {
            label = 'apply_after_resume_fixes'
            mainBlocker = 'ATS weakness'
            nextAction = 'Improve keyword coverage, fix weak phrasing, and strengthen measurable evidence before applying.'
        } else if (
            safeMatchScore >= 55 &&
            safeCriticalGapCount <= 3 &&
            safeExperienceGap <= 2.5
        ){
            label = 'apply_after_skill_upgrade'
            mainBlocker = safeCriticalGapCount > 1 ? 'Missing critical skills' : 'Experience gap'
            nextAction = 'Focus on the top missing skills first, then re-run analysis before applying.'
        }

        if (normalizedReadinessLevel === 'overqualified') {
            label = 'apply_now'
            mainBlocker = 'None'
            nextAction = 'You are already competitive for this role. Prioritize stronger companies or higher-value openings.'
        }

        const readinessScore = Math.max(0, Math.min(100,Math.round(
            (safeMatchScore * 0.5) + 
            (safeAtsScore * 0.25) -
            (safeCriticalGapCount * 8) -
            (safeImportantGapCount * 2) -
            (safeExperienceGap * 6)
        )))

        const topReasons = [
            `Role Match score is ${safeMatchScore}%`,
            `ATS score is ${safeAtsScore}%`,
            `${safeCriticalGapCount} critical skill gaps ${safeCriticalGapCount === 1 ? '' :'s'} identified`,
        ]
        if (safeExperienceGap > 0) {
            topReasons.push(`Experience gap is about ${safeExperienceGap} year${safeExperienceGap === 1 ? '' : 's'}`)
        }

        return {
            label,
            readinessScore,
            mainBlocker,
            topReasons: topReasons.slice(0, 4),
            nextAction,
        }
    }
}

const readinessEngineService = new readinessEngine()
export default readinessEngineService
