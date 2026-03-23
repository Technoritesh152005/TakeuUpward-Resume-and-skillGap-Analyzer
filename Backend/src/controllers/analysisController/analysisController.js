import asyncHandler from '../../utils/asyncHandler.js'
import analysisModel from "../../models/analysis.model.js"
import roadmapModel from '../../models/roadmap.model.js'
import performRoadmapInstance from '../../services/ai.services/roadmap_planner.js'
import resumeModel from "../../models/resume.model.js"
import jobRoleModel from "../../models/jobrole.model.js"
import skillgapanalysis from "../../services/ai.services/skill_gap_analysis.js"
import ApiResponse from '../../utils/apiResponse.js'
import generateAtsScore from "../../services/ai.services/ats_score_generator.js"
import redisClient from '../../config/redis.js'
import ApiError from '../../utils/apiError.js'
import logger from '../../utils/logs.js'

// first create a analysis controller
/*
then take resume id and job role id
check whether this resume and job role id exist and to crea
*/

// ADD THIS CODE TO YOUR EXISTING analysis.controller.js
// Replace the entire createAnalysis function with this:

export const createAnalysis = asyncHandler(async (req, res) => {
    const { resumeId, jobRoleId } = req.body;

    // Verify resume exists
    const resume = await resumeModel.findOne({ 
        _id: resumeId, 
        user: req.user._id 
    });

    if (!resume) {
        throw new ApiError(400, 'Resume not found to create analysis');
    }
    if (resume.isActive === false) {
        throw new ApiError(400, 'Your resume is inactive');
    }
    if (!resume.parsedData) {
        throw new ApiError(400, 'Resume is not parsed yet');
    }

    // Verify job role exists
    const jobRole = await jobRoleModel.findOne({ _id: jobRoleId });
    if (!jobRole) {
        throw new ApiError(400, 'Job Role not found');
    }

    // Create analysis document
    const analysis = await analysisModel.create({
        resume: resumeId,
        user: req.user._id,
        jobRole: jobRoleId,
        status: 'processing',
    });

    // Clear old cache
    await redisClient.del(`analysis:${req.user._id}`);

    try {
        // Get skill gap analysis from Claude
        const skillGapAnalysisData = await skillgapanalysis.performDeepSkillGapAnalyze(
            resume.parsedData, 
            jobRole
        );

        // Get ATS score
        const atsScore = await generateAtsScore.getAtsScore(
            resume.parsedData, 
            jobRole
        );

        // ========== POPULATE BASIC FIELDS ==========
        analysis.matchScore = skillGapAnalysisData.overallAssessment.matchPercentage;

        // Calculate match breakdown
        // it checks how much ur critical skill gaps matched
        const criticalMatched = jobRole.requiredSkills.critical.length - 
            (skillGapAnalysisData.skillGaps.critical?.length || 0);
        const criticalTotal = jobRole.requiredSkills.critical.length;

        const importantMatched = jobRole.requiredSkills.important.length - 
            (skillGapAnalysisData.skillGaps.important?.length || 0);
        const importantTotal = jobRole.requiredSkills.important.length;

        const niceToHaveMatched = jobRole.requiredSkills.niceToHave.length - 
            (skillGapAnalysisData.skillGaps.niceToHave?.length || 0);
        const niceToHaveTotal = jobRole.requiredSkills.niceToHave.length;

        // summary of ur skills matched
        analysis.matchBreakDown = {
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
        };

        //  setting Skill gaps
        analysis.skillGaps = skillGapAnalysisData.skillGaps;

        // ✅ NEW: Populate extractedSkills
        // extractedskills contains both skill which r present and also which r not means they r required
        const extractedSkills = new Set();

        // Add from skill gaps (skills they're MISSING)
        // pushing every skills which r not present or they r skill gaps
        skillGapAnalysisData.skillGaps.critical?.forEach(item => {
            if (item.skill) extractedSkills.add(item.skill);
        });
        skillGapAnalysisData.skillGaps.important?.forEach(item => {
            if (item.skill) extractedSkills.add(item.skill);
        });
        skillGapAnalysisData.skillGaps.niceToHave?.forEach(item => {
            if (item.skill) extractedSkills.add(item.skill);
        });

        // Add from strengths (skills they HAVE)
        // u r adding the skills u have
        skillGapAnalysisData.strengths?.forEach(item => {
            if (item.skill) extractedSkills.add(item.skill);
        });

        // adding all extracted skills in model fields
        analysis.extractedSkills = Array.from(extractedSkills);

        // ✅ NEW: Create skillBreakdown
        // Detailed progress of each skill → current level vs required level vs gap
        const skillBreakdown = [];

        // Proficiency level mapping
        const levelMap = {
            'beginner': 30,
            'intermediate': 60,
            'advanced': 85,
            'expert': 95
        };

        // Add skills from strengths (skills they HAVE)
        skillGapAnalysisData.strengths?.forEach(strength => {
            // means it take score of ur analysis and map with levelMap
            const currentLevel = levelMap[strength.proficiency] || 50;
            const targetLevel = 95;
            // we will later change the target level based on the importance of skill

            skillBreakdown.push({
                skillName: strength.skill,
                currentLevel: currentLevel,
                targetLevel: targetLevel,
                gap: Math.max(0, targetLevel - currentLevel)
            });
        });

        // Add critical skill gaps (skills they DON'T have)
        skillGapAnalysisData.skillGaps.critical?.forEach(gap => {
            // Don't add if already exists from strengths
            const exists = skillBreakdown.some(s => s.skillName === gap.skill);
            if (!exists) {
                skillBreakdown.push({
                    skillName: gap.skill,
                    currentLevel: 0,
                    targetLevel: gap.importance * 10, // 1-10 → 10-100
                    gap: gap.importance * 10
                });
            }
        });

        // Add important skill gaps
        skillGapAnalysisData.skillGaps.important?.forEach(gap => {
            const exists = skillBreakdown.some(s => s.skillName === gap.skill);
            if (!exists) {
                skillBreakdown.push({
                    skillName: gap.skill,
                    currentLevel: 0,
                    targetLevel: gap.importance * 10,
                    gap: gap.importance * 10
                });
            }
        });
        
        analysis.skillBreakdown = skillBreakdown;

        // Other fields
        analysis.candidateStrength = skillGapAnalysisData.strengths;
        analysis.transferrableSkills = skillGapAnalysisData.transferableSkills;

        // Experience analysis
        const candidateYears = skillGapAnalysisData.experienceGap?.candidateYears || 0;
        const requiredYears = skillGapAnalysisData.experienceGap?.typicalRequirement || 0;

        analysis.experienceAnalysis = {
            candidateYears: candidateYears,
            requiredYears: requiredYears,
            gap: Math.max(0, requiredYears - candidateYears),
            assessment: skillGapAnalysisData.experienceGap?.assessment || ''
        };

        analysis.readinessLevel = skillGapAnalysisData.overallAssessment.readinessLevel;
        analysis.estimatedTimeToReady = skillGapAnalysisData.overallAssessment.estimatedTimeToReady;

        // ATS Score
        analysis.atsScore = {
            overall: atsScore.overallScore,
            formatting: atsScore.breakdown.formatting,
            keywords: {
                score: atsScore.breakdown.keywords.score,
                matched: atsScore.breakdown.keywords.matched,
                missing: atsScore.breakdown.keywords.missing
            },
            structure: atsScore.breakdown.structure,
            content: atsScore.breakdown.content
        };

        // AI Suggestions
        analysis.aiSuggestion = {
            summary: skillGapAnalysisData.overallAssessment.summary,
            recommendations: skillGapAnalysisData.recommendations
        };

        // Mark as completed
        analysis.status = 'completed';
        analysis.processingTime = Date.now() - analysis.createdAt;

        await analysis.save();

        logger.info(`Analysis generated successfully for user: ${req.user._id}`);

        // Populate references
        await analysis.populate('resume', 'fileName originalFileName createdAt');
        await analysis.populate('jobRole', 'title category experienceLevel salaryRange');

        res.status(200).json(
            new ApiResponse(201, analysis, 'Analysis created successfully')
        );

    } catch (error) {
        analysis.error = error.message;
        analysis.status = 'failed';
        await analysis.save();
        
        logger.error(`Error while generating analysis: ${error.message}`);
        throw new ApiError(401, 'Failed to generate analysis');
    }
});

// a user  can have multiple analysis so we will use paginate technique

export const getMyAnalysis = asyncHandler(async (req, res) => {

    const {
        page = 1,
        limit = 10,
        sort = '-createdAt',
        status,
        resumeId,
        jobRoleId,
        minMatchScore,
        maxMatchScore,
        isActive
    } = req.query

    const userId = req.user._id
    const cacheKey =`analysis:${userId}`

    const cachedData = await redisClient.get(cacheKey)

    if(cachedData){
        const parsed =  JSON.parse(cachedData)
        return res.status(200).json(
            new ApiResponse(200, parsed, 'Fetched from cache')
          );
    }

    const filter = { user: userId }

    if (resumeId) filter.resume = resumeId
    if (jobRoleId) filter.jobRole = jobRoleId
    if (status) filter.status = status
    if (isActive) filter.isActive = isActive

    if (minMatchScore || maxMatchScore) {
        filter.matchScore = {};
        if (minMatchScore) filter.matchScore.$gte = parseFloat(minMatchScore);
        if (maxMatchScore) filter.matchScore.$lte = parseFloat(maxMatchScore);
    }
    
    const analyses = await analysisModel.paginate(filter, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sort,
        populate: [
            { path: 'resume', select: 'fileName originalFileName uploadedAt' },
            { path: 'jobRole', select: 'title category experienceLevel salaryRange' },
        ]
    })
    // let in cache for 5 minutes
    await redisClient.setEx(cacheKey,300,JSON.stringify(analyses))
    if (!analyses) {
        throw new ApiError(401, 'Analysis not found')
    }
    res.status(200).json(
        new ApiResponse(200, analyses, 'Analysis Fetched successfully')
      );
})

export const getAnalysisById = asyncHandler(async (req, res) => {

    // caching the get analysis first with key
    // analysis:analysisId
    // cause each analysis is of some id
    const userId = req.user._id
    const cacheKey = `analysis:${req.params.id}`

    const cachedData = await redisClient.get(cacheKey)
    if(cachedData){
        const parsed = JSON.parse(cachedData)
        return res.status(200)
        .json(new ApiResponse(200,parsed,'Cached data fetched succesfully'))
    }

    const analysis = await analysisModel.findOne({
        user: userId,
        _id: req.params.id,
        isActive: true
    })
        // u will analysis of that user with the id>< so id is unique means u will find
        // onedocument only of analysis model. populate resume and 
        .populate('resume', 'fileName , originalFileName , parsedData uploadedAt')
        .populate('jobRole')

    await redisClient.setEx(cacheKey,300,JSON.stringify(analysis))
    // thid will get that analysis document and also give resume of which analaysis is created with their
    // parsed data and also jobRole target
    if (!analysis) {
        throw new ApiError(401, 'No analysis found of user')
    }
    res.status(200)
        .json(
            new ApiResponse(
                200,
                analysis,
                `Successfully fetched analysis for user: ${req.user.email}`
            )
        )
})

export const deleteAnalysis = asyncHandler(async (req, res) => {

    const userId = req.user._id
    const analysisId = req.params.id

    const analaysis = await analysisModel.findOne(
        {
            user:userId,
            _id:analysisId,
            isActive:true
        }
    )
    if (!analaysis) {
        throw new ApiError(400, 'No analysis Model Found')
    }

    analaysis.isActive = false
    await analaysis.save()

    logger.info(201, 'User succesfuly deleted his analysis . user is :'`${req.user.email}`)

    res.status(200)
        .json(new ApiResponse(201,'User deleted succesfully'))
})

export const compare_Multiple_Job_Role_With_Resume_And_Get_Analysis = asyncHandler(async (req, res) => {

    const userId = req.user._id
    const { resumeId, jobRoleId } = req.body

    const resume = await resumeModel.findOne({
        user: userId,
        isActive: true,
        _id: resumeId,
        processingStatus: 'completed'
    })

    if (!resume) {
        throw new ApiError(401, 'No resume found ')
    }

    const jobRoles = await jobRoleModel.find(
        {
            // it return all jobrole with the id present in array 
            _id: { $in: jobRoleId },
            isActive: true
        }
    )

    if (!jobRoles) {
        throw new ApiError(401, 'No Job Roles found to compare')
    }

    const comparisons = await Promise.all(
        jobRoles.map((jobRole) => {
            try {

                // this only keeps response of comparision. no save in database
                const analysis = skillgapanalysis.performDeepSkillGapAnalyze(
                    resume, jobRole
                )
                // return inside map() doesn't exit the function - it returns the value for that array item!
                return {
                    jobRole: {
                        _id: jobRole._id,
                        title: jobRole.title,
                        category: jobRole.category,
                        experienceLevel: jobRole.experienceLevel,
                        salaryRange: jobRole.salaryRange
                    },

                    matchPercentage: analysis.overallAssessment.matchPercentage,
                    readinessLevel: analysis.overallAssessment.readinessLevel,
                    estimatedTimeToReady: analysis.overallAssessment.estimatedTimeToReady,
                    topSkillGaps: [
                        ...analysis.skillGaps.critical.slice(0, 3),
                        ...analysis.skillGaps.important.slice(0, 3),
                        ...analysis.skillGaps.niceToHave.slice(0, 3)
                    ]

                }
            } catch (error) {
                logger.error(`Failed to analyze role ${jobRole.title}: ${error.message}`);
                throw new ApiError('Failed to create job analaysis for this job :', `${jobRole.title}`, 401)

            }
        })
    )

    // Sort by match score
    const sortedComparisons = comparisons
        .filter((c) => !c.error)
        .sort((a, b) => b.matchScore - a.matchScore);

    const bestFit = sortedComparisons[0];
    const fastestPath = sortedComparisons.reduce((fastest, current) => {
        return current.estimatedTimeToReady.weeks < fastest.estimatedTimeToReady.weeks
            ? current
            : fastest;
    });

    res.status(200)
    .json(
    new ApiResponse(200,
        {
            comparisons: sortedComparisons,
            bestFit: bestFit.jobRole,
            fastestPath: fastestPath.jobRole,
            summary: {
                totalCompared: sortedComparisons.length,
                averageMatch: Math.round(
                    sortedComparisons.reduce((sum, c) => sum + c.matchScore, 0) /
                    sortedComparisons.length
                ),
            },
        },
        'Role comparision completed successfullyy')
    )
})

// analysis.controller.js - CORRECTED

export const regenerateAnalysis = asyncHandler(async (req, res) => {

    const { preferences } = req.body;  // ← Get preferences from request
  
    const analysis = await Analysis.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('resume jobRole');
  
    if (!analysis) {
      throw new ApiError(404, 'Analysis not found');
    }
  
    logger.info(`Regenerating analysis: ${analysis._id}`);
  
    // Re-run gap analysis
    const gapAnalysis = await claudeService.performGapAnalysis(
      analysis.resume.parsedData,
      analysis.jobRole
    );
    
    // ✅ FIX: If preferences provided, generate NEW roadmap with them
    if (preferences) {
      const roadmap = await roadmapModel.findOne({ analysis: analysis._id });
      
      if (roadmap) {
        // Update roadmap preferences
        roadmap.userPreferences = {
          hoursPerWeek: preferences.hoursPerWeek || roadmap.userPreferences.hoursPerWeek,
          budget: preferences.budget || roadmap.userPreferences.budget,
          learningStyle: preferences.learningStyle || roadmap.userPreferences.learningStyle,
        };
        
        // Regenerate roadmap with new preferences
        const newRoadmapData = await RoadmapAnalysis.performRoadmap(
          gapAnalysis,
          roadmap.userPreferences  // ← Use updated preferences
        );
        
        // Update roadmap phases
        roadmap.phases = newRoadmapData.phases;
        roadmap.quickWins = newRoadmapData.quickWins;
        roadmap.portfolioProjects = newRoadmapData.portfolioProjects;
        
        await roadmap.save();
      }
    }
  
    // Update analysis
    analysis.matchScore = gapAnalysis.overallAssessment.matchPercentage;
    analysis.skillGaps = gapAnalysis.skillGaps;
    analysis.strengths = gapAnalysis.strengths;
    analysis.readinessLevel = gapAnalysis.overallAssessment.readinessLevel;
    analysis.version += 1;
  
    await analysis.save();

    // after regenerating user cache may have old cache of analysis
    
    await redisClient.del(`analysis:${analysis._id}`);
    await redisClient.del(`analysis:${req.user._id}`);
  
    res.status(200).json(new ApiResponse(200, analysis, 'Analysis regenerated successfully'));
  });