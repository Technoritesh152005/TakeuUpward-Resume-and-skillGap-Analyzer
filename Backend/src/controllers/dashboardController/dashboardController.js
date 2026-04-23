import asyncHandler from '../../utils/asyncHandler.js'
import ApiResponse from '../../utils/apiResponse.js';
import { resumeModel } from '../../models/resume.model.js';
import { analysisModel } from '../../models/analysis.model.js';
import { roadmapModel } from '../../models/roadmap.model.js';
import progressModel from '../../models/progress.model.js';
import { getAiUsageSummary } from '../../services/aiQuota/aiQuota.service.js';

/**
 * @desc    Get Dashboard Data
 * @route   GET /api/dashboard
 * @access  Private
 */
export const getDashboardData = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Fetch all user data that too in newest
  const [resumes, analyses, roadmap, aiUsage] = await Promise.all([
    resumeModel.find({ user: userId }).sort({ createdAt: -1 }),
    analysisModel.find({ user: userId }).sort({ createdAt: -1 }),
    roadmapModel.findOne({ user: userId, isActive: true }).sort({ createdAt: -1 }),
    getAiUsageSummary(userId),
  ]);

  const progressRecord = roadmap
    ? await progressModel.findOne({ user: userId, roadmap: roadmap._id }).sort({ updatedAt: -1 })
    : await progressModel.findOne({ user: userId }).sort({ updatedAt: -1 });

  // Stats calculation
  const stats = {
    totalResumes: resumes.length,
    analysesCompleted: analyses.length,
    totalSkillsAnalyzed: 0,
    avgMatchScore: 0
  };

  // Calculate unique skills improved
  const allExtractedSkills = new Set();

  analyses.forEach(analysis => {
    if (analysis.extractedSkills && Array.isArray(analysis.extractedSkills)) {
      analysis.extractedSkills.forEach(skill => allExtractedSkills.add(skill));
    }
  });
  stats.skillsImproved = allExtractedSkills.size;

  // Calculate average match score
  const matchScores = analyses.map(a => a.matchScore).filter(score => score > 0);
  if (matchScores.length > 0) {
    stats.avgMatchScore = Math.round(
      matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length
    );
  }

//   recent activities
 
  const activities = [];

  // Add resume uploads
//   takes element o till 4(4 includes)
  resumes.slice(0, 5).forEach(resume => {
    activities.push({
      id: resume._id,
      type: 'resume_upload',
      title: 'Resume uploaded',
      description: resume.fileName || 'New resume',
      timestamp: resume.createdAt
    });
  });

  // Add analyses
  analyses.slice(0, 5).forEach(analysis => {
    activities.push({
      id: analysis._id,
      type: 'analysis_complete',
      title: 'Analysis completed',
      description: `${analysis.matchScore}% match score`,
      timestamp: analysis.createdAt
    });
  });

  // Sort by most recent
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

//   skill progress data
  let skillProgress = [];
  
  if (analyses.length > 0) {
    const latestAnalysis = analyses[0];
    
    // Use skillBreakdown from YOUR model
    if (latestAnalysis.skillBreakdown && latestAnalysis.skillBreakdown.length > 0) {
      skillProgress = latestAnalysis.skillBreakdown.slice(0, 6).map(skill => ({
        name: skill.skillName,
        current: skill.currentLevel,
        target: skill.targetLevel,
        gap: skill.gap
      }));
    }
  }

  const analysisHistory = analyses
    .slice()
    .reverse()
    .map((analysis, index) => ({
      label: `Analysis ${index + 1}`,
      date: analysis.createdAt,
      matchScore: analysis.matchScore || 0,
      criticalGaps: analysis.skillGaps?.critical?.length || 0,
      importantGaps: analysis.skillGaps?.important?.length || 0,
      niceToHaveGaps: analysis.skillGaps?.niceToHave?.length || 0,
      totalGaps:
        (analysis.skillGaps?.critical?.length || 0) +
        (analysis.skillGaps?.important?.length || 0) +
        (analysis.skillGaps?.niceToHave?.length || 0),
    }));

  //SKILL GAPS SUMMARY 
  let skillGapsSummary = null;
  
  if (analyses.length > 0) {
    const latestAnalysis = analyses[0];
    
    if (latestAnalysis.skillGaps) {
      skillGapsSummary = {
        critical: latestAnalysis.skillGaps.critical?.length || 0,
        important: latestAnalysis.skillGaps.important?.length || 0,
        niceToHave: latestAnalysis.skillGaps.niceToHave?.length || 0,
        total: (latestAnalysis.skillGaps.critical?.length || 0) +
               (latestAnalysis.skillGaps.important?.length || 0) +
               (latestAnalysis.skillGaps.niceToHave?.length || 0)
      };
    }
  }

  // ROADMAP PREVIEW 
  let roadmapPreview = null;
  
  if (roadmap) {
    const roadmapItems = [];

    roadmap.phases?.forEach((phase, phaseIndex) => {
      phase?.weeklyBreakdown?.forEach((week, weekIndex) => {
        week?.learningItems?.forEach((item, itemIndex) => {
          roadmapItems.push({
            id: item?._id || `${phaseIndex}-${weekIndex}-${itemIndex}`,
            title: item?.title || 'Learning item',
            completed: Boolean(item?.completed),
            completedAt: item?.completedAt,
            estimatedHours: item?.estimatedHours || 0,
            phase: phase?.title || `Phase ${phase?.phaseNumber || phaseIndex + 1}`,
            week: week?.week || weekIndex + 1,
          });
        });
      });
    });

    const totalItems = roadmapItems.length;
    const completedItems = roadmapItems.filter((item) => item.completed).length;
    
    const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    const upcomingItems = roadmapItems
      .filter((item) => !item.completed)
      .slice(0, 3)
      .map((item) => ({
        id: item.id,
        title: item.title,
        phase: item.phase,
        estimatedHours: item.estimatedHours,
        week: item.week,
      }));

    const recentCompleted = roadmapItems
      .filter((item) => item.completed && item.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 2)
      .map((item) => ({
        id: item.id,
        title: item.title,
        phase: item.phase,
        completedAt: item.completedAt,
      }));

    roadmapPreview = {
      title: roadmap.title || 'Learning Roadmap',
      progress,
      totalItems,
      completedItems,
      upcomingItems: upcomingItems.slice(0, 3),
      recentCompleted,
    };
  }

  const userProgress = progressRecord
    ? {
        currentStreak: progressRecord.currentStreak || 0,
        longestStreak: progressRecord.longestStreak || 0,
        completedResources: progressRecord.completedResources?.length || 0,
        totalTimeSpent: progressRecord.totalTimeSpent || 0,
        currentPhase: progressRecord.currentPhase || 0,
        currentWeek: progressRecord.currentWeek || 0,
        activeWeeksLogged: progressRecord.weeklyTimeLog?.length || 0,
        lastActivityDate: progressRecord.lastActivityDate || null,
      }
    : null;

  // SEND RESPONSE
  res.status(200).json(
    new ApiResponse(200, {
      stats,
      aiUsage,
      activities: activities.slice(0, 10),
      skillProgress,
      skillGapsSummary,
      analysisHistory,
      roadmap: roadmapPreview,
      userProgress,
    }, 'Dashboard data fetched successfully')
  );
});

/**
 * @desc    Get Recent Activities
 * @route   GET /api/dashboard/activities
 * @access  Private
 */
export const getRecentActivities = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit = parseInt(req.query.limit) || 20;

  const [resumes, analyses] = await Promise.all([
    resumeModel.find({ user: userId }).sort({ createdAt: -1 }).limit(limit),
    analysisModel.find({ user: userId }).sort({ createdAt: -1 }).limit(limit)
  ]);

  const activities = [];

  resumes.forEach(resume => {
    activities.push({
      id: resume._id,
      type: 'resume_upload',
      title: 'Resume uploaded',
      description: resume.fileName || 'New resume',
      timestamp: resume.createdAt
    });
  });

  analyses.forEach(analysis => {
    activities.push({
      id: analysis._id,
      type: 'analysis_complete',
      title: 'Analysis completed',
      description: `${analysis.matchScore}% match`,
      timestamp: analysis.createdAt
    });
  });

  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.status(200).json(
    new ApiResponse(200, activities.slice(0, limit), 'Activities fetched')
  );
});

// ========== HELPER FUNCTIONS ==========

export default {
  getDashboardData,
  getRecentActivities
};
