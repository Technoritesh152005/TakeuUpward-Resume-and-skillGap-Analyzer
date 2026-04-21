import asyncHandler from '../../utils/asyncHandler.js'
import analysisModel from "../../models/analysis.model.js"
import resumeModel from "../../models/resume.model.js"
import jobRoleModel from "../../models/jobrole.model.js"
import ApiResponse from '../../utils/apiResponse.js'
import redisClient from '../../config/redis.js'
import ApiError from '../../utils/apiError.js'
import logger from '../../utils/logs.js'
import multiRoleCompareService from '../../services/ai.services/multi_role_compare.js'
import { refundAiUsage, reserveAiUsage } from '../../services/aiQuota/aiQuota.service.js'
import { enqueueAnalysisGeneration, removeQueuedAnalysisJob } from '../../queues/analysis.queue.js'
import { ANALYSIS_PROCESSING_STAGE, ANALYSIS_STATUS } from '../../config/constant.js'
import jobRecommendationService from '../../services/adzunaJobRecomendation/jobRecommendation.service.js'

const clearAnalysisCache = async (userId, analysisId = null) => {
    const normalizedUserId = String(userId);
    // this is used to find pattern of that keys
    // means basically it gets the user all analysis
    const userCacheKeys = await redisClient.keys(`analysis:${normalizedUserId}:*`);
    // if u have such all ananlysiss of user they r removed from cache
    if (userCacheKeys.length) {
        await redisClient.del(...userCacheKeys);
    }
    // if id given delete that particular cache
    if (analysisId) {
        await redisClient.del(`analysis:${normalizedUserId}:${analysisId}`);
    }
};

const buildComparisonFromSavedAnalysis = (analysis) => ({
    jobRole: {
        _id: analysis?.jobRole?._id,
        title: analysis?.jobRole?.title,
        category: analysis?.jobRole?.category,
        experienceLevel: analysis?.jobRole?.experienceLevel,
        salaryRange: analysis?.jobRole?.salaryRange,
    },
    matchPercentage: analysis?.matchScore || 0,
    readinessLevel: analysis?.readinessLevel || 'not-ready',
    estimatedTimeToReady: analysis?.estimatedTimeToReady || { weeks: 0, reason: '' },
    topSkillGaps: [
        ...(analysis?.skillGaps?.critical || []).slice(0, 3),
        ...(analysis?.skillGaps?.important || []).slice(0, 2),
        ...(analysis?.skillGaps?.niceToHave || []).slice(0, 1),
    ],
    strengths: (analysis?.candidateStrength || []).map((item) => item?.skill).filter(Boolean).slice(0, 5),
    summary: analysis?.aiSuggestion?.summary || '',
    source: 'saved-analysis',
});

const buildComparisonFromAiCompare = (jobRole, comparison) => ({
    jobRole: {
        _id: jobRole?._id,
        title: jobRole?.title,
        category: jobRole?.category,
        experienceLevel: jobRole?.experienceLevel,
        salaryRange: jobRole?.salaryRange,
    },
    matchPercentage: comparison?.matchPercentage || 0,
    readinessLevel: comparison?.readinessLevel || 'not-ready',
    estimatedTimeToReady: comparison?.estimatedTimeToReady || { weeks: 0, reason: '' },
    topSkillGaps: Array.isArray(comparison?.topSkillGaps) ? comparison.topSkillGaps : [],
    strengths: Array.isArray(comparison?.strengths) ? comparison.strengths : [],
    summary: comparison?.summary || '',
    source: 'ai-compare',
});

// first create a analysis controller
/*
then take resume id and job role id
check whether this resume and job role id exist and to crea
*/

// ADD THIS CODE TO YOUR EXISTING analysis.controller.js
// Replace the entire createAnalysis function with this:

// during creating analysis we just create their analysis id and pass it to enque
export const createAnalysis = asyncHandler(async (req, res) => {
    const { resumeId, jobRoleId, preference } = req.body;
    // reference if not provided takes the prefernece what user sets in profile
    const resolvedPreferences = {
        hoursPerWeek: preference?.hoursPerWeek ?? req.user?.preference?.hoursPerWeek ?? 8,
        budget: preference?.budget ?? req.user?.preference?.budget ?? 'free',
        learningStyle: preference?.learningStyle ?? req.user?.preference?.learningStyle ?? 'mixed',
    };

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
    if (resume.processingStatus !== 'completed') {
        throw new ApiError(400, 'Resume is not parsed yet');
    }
    if (!resume.parsedData) {
        throw new ApiError(400, 'Resume is not parsed yet');
    }

    // Verify job role exists
    const jobRole = await jobRoleModel.findOne({ _id: jobRoleId });
    if (!jobRole) {
        throw new ApiError(400, 'Job Role not found');
    }

    // here we check for existing analysis for same job role and same resume.. This reduces cost. But it is not same for regenerate..even if prefernce change u will have ability to create new analysis
    const existingCompletedAnalysis = await analysisModel.findOne({
        user: req.user._id,
        resume: resumeId,
        jobRole: jobRoleId,
        'userPreferences.hoursPerWeek': resolvedPreferences.hoursPerWeek,
        'userPreferences.budget': resolvedPreferences.budget,
        'userPreferences.learningStyle': resolvedPreferences.learningStyle,
        isActive: true,
        status: ANALYSIS_STATUS.COMPLETED,
    })
        .sort({ completedAt: -1, createdAt: -1 })
        .populate('resume', 'fileName originalFileName createdAt')
        .populate('jobRole', 'title category experienceLevel salaryRange');

        // if ananlysis found existing refund the ai limits
    if (existingCompletedAnalysis) {
        if (req.aiQuotaReserved) {
            req.aiUsage = await refundAiUsage(req.user._id);
            req.aiQuotaReserved = false;
        }

        return res.status(200).json(
            new ApiResponse(200, {
                analysis: existingCompletedAnalysis,
                aiUsage: req.aiUsage,
            }, 'Existing completed analysis found')
        );
    }

    // create analysis for job creation
    const queuedAnalysis = await analysisModel.create({
        resume: resumeId,
        user: req.user._id,
        jobRole: jobRoleId,
        userPreferences: resolvedPreferences,
        matchScore: 0,
        status: ANALYSIS_STATUS.QUEUED,
        processingStage: ANALYSIS_PROCESSING_STAGE.QUEUED,
        queuedAt: new Date(),
    });

    // clear all the cache of the user related analysis
    await clearAnalysisCache(req.user._id);

    try {
        // as analysis id is created this isa a job now so need to be put in queue
        await enqueueAnalysisGeneration({
            analysisId: queuedAnalysis._id,
            resumeId,
            jobRoleId,
            userId: req.user._id,
        });

        await queuedAnalysis.populate('resume', 'fileName originalFileName createdAt');
        await queuedAnalysis.populate('jobRole', 'title category experienceLevel salaryRange');

        // return just the queue data and token taken
        return res.status(202).json(

            new ApiResponse(202, {
                analysis: queuedAnalysis,
                aiUsage: req.aiUsage,
            }, 'Analysis queued successfully')
        );
    } catch (error) {
        // if error occured just refund the limit of the user.Then also do some working
        // then also 
        if (req.aiQuotaReserved) {
            req.aiUsage = await refundAiUsage(req.user._id);
            req.aiQuotaReserved = false;
        }

        queuedAnalysis.error = error.message;
        queuedAnalysis.status = ANALYSIS_STATUS.FAILED;
        queuedAnalysis.processingStage = ANALYSIS_PROCESSING_STAGE.FAILED;
        await queuedAnalysis.save();
        await clearAnalysisCache(req.user._id, queuedAnalysis._id);

        logger.error(`Error while queueing analysis: ${error.message}`);
        throw new ApiError(500, 'Failed to queue analysis');
    }
});

// a user  can have multiple analysis so we will use paginate technique

export const getMyAnalysis = asyncHandler(async (req, res) => {

    const {
        page,
        limit,
        sort,
        status,
        resumeId,
        jobRoleId,
        minMatchScore,
        maxMatchScore,
        isActive
    } = req.query
    

    const userId = req.user._id
    // seperate cache key for as per query prefernce
    const cacheKey = `analysis:${String(userId)}:${JSON.stringify({
        page,
        limit,
        sort,
        status,
        resumeId,
        jobRoleId,
        minMatchScore,
        maxMatchScore,
        isActive
    })}`

    const cachedData = await redisClient.get(cacheKey)

    if(cachedData){
        const parsed =  JSON.parse(cachedData)
        return res.status(200).json(
            new ApiResponse(200, parsed, 'Fetched from cache')
          );
    }

    const filter = { user: userId, isActive: true }

    if (resumeId) filter.resume = resumeId
    if (jobRoleId) filter.jobRole = jobRoleId
    if (status) filter.status = status
    if (typeof isActive === 'boolean') filter.isActive = isActive

    if (minMatchScore || maxMatchScore) {
        filter.matchScore = {};
        if (minMatchScore) filter.matchScore.$gte = parseFloat(minMatchScore);
        if (maxMatchScore) filter.matchScore.$lte = parseFloat(maxMatchScore);
    }
    
    // paginate helps to go through deep searching and return docs
    // You use pagination when returning large amounts of data so you don’t send everything at once.
    const analyses = await analysisModel.paginate(filter, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 12,
        sort: sort || '-createdAt',
        populate: [
            { path: 'resume', select: 'fileName originalFileName createdAt' },
            { path: 'jobRole', select: 'title category experienceLevel salaryRange' },
        ]
    })
    // let in cache for 5 minutes
    // cahche of my analysysis is cache based on the prefernce
    await redisClient.setEx(cacheKey,300,JSON.stringify(analyses))
    if (!analyses) {
        throw new ApiError(404, 'Analysis not found')
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
    const cacheKey = `analysis:${String(userId)}:${req.params.id}`

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
        .populate('resume', 'fileName originalFileName parsedData uploadedAt')
        .populate('jobRole')

    if (!analysis) {
        throw new ApiError(404, 'No analysis found of user')
    }
    await redisClient.setEx(cacheKey,300,JSON.stringify(analysis))
    // thid will get that analysis document and also give resume of which analaysis is created with their
    // parsed data and also jobRole target
    res.status(200)
        .json(new ApiResponse(200, analysis, `Successfully fetched analysis for user: ${req.user.email}`))
})

export const getAnalysisStatus = asyncHandler(async (req, res) => {
    const analysis = await analysisModel.findOne({
        user: req.user._id,
        _id: req.params.id,
        isActive: true
    }).select('_id status processingStage error queuedAt processingStartedAt completedAt processingTime')

    if (!analysis) {
        throw new ApiError(404, 'No analysis found of user')
    }

    // this tells browser and proxies to not store this response anywhere
    res.set('Cache-Control', 'no-store')
    res.status(200).json(
        new ApiResponse(200, analysis, 'Analysis status fetched successfully')
    )
})

export const getRecommendedJobsForAnalysis = asyncHandler(async (req, res) => {
    const analysis = await analysisModel.findOne({
        user: req.user._id,
        _id: req.params.id,
        isActive: true,
        status: ANALYSIS_STATUS.COMPLETED,
    })
        .populate('resume', 'parsedData fileName originalFileName')
        .populate('jobRole', 'title category experienceLevel salaryRange')

    if (!analysis) {
        throw new ApiError(404, 'Completed analysis not found for job recommendations')
    }

    const recommendations = await jobRecommendationService.getRecommendationsForAnalysis(analysis)

    res.status(200).json(
        new ApiResponse(200, {
            // based on are job roles and jobs are jobs...........
            basedOn: recommendations?.basedOn || [],
            jobs: recommendations?.jobs || [],
        }, 'Recommended jobs fetched successfully')
    )
})

// controller to delete nalaysis
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
        throw new ApiError(404, 'No analysis Model Found')
    }

    // while deleting the ananlysis if the status of analysis is queue means we remove it from queue
    if (analaysis.status === ANALYSIS_STATUS.QUEUED) {
        await removeQueuedAnalysisJob(analaysis._id)
    }

    analaysis.isActive = false
    await analaysis.save()
    // when deleted the analysis we remove all user analysis cache
    await clearAnalysisCache(userId, analysisId)

    logger.info(201, `User succesfuly deleted his analysis. user is: ${req.user.email}`)

    res.status(200)
        .json(new ApiResponse(200,null,'User deleted succesfully'))
})

export const compare_Multiple_Job_Role_With_Resume_And_Get_Analysis = asyncHandler(async (req, res) => {

    const userId = req.user._id
    const { resumeId, jobRolesId } = req.body
    let compareQuotaReserved = false

    const resume = await resumeModel.findOne({
        user: userId,
        isActive: true,
        _id: resumeId,
        processingStatus: 'completed'
    })

    if (!resume) {
        throw new ApiError(404, 'No resume found ')
    }

    const jobRoles = await jobRoleModel.find(
        {
            // it return all jobrole with the id present in array 
            _id: { $in: jobRolesId },
            isActive: true
        }
    )

    if (!jobRoles || jobRoles.length === 0) {
        throw new ApiError(404, 'No Job Roles found to compare')
    }

    // checks whether we already have the analysis for the resume and jobrole pair
    //it checks each ananlysis whether its job roles id is one among them
    const existingAnalyses = await analysisModel.find({
        user: userId,
        resume: resumeId,
        jobRole: { $in: jobRoles.map((jobRole) => jobRole._id) },
        status: 'completed',
        isActive: true,
    }).populate('jobRole', 'title category experienceLevel salaryRange')

    // xplain me this even i dont get this
    const savedAnalysisByRoleId = new Map(
        existingAnalyses.map((analysis) => [String(analysis.jobRole?._id), analysis])
    )

    const comparisons = []
    const missingJobRoles = []

    // for every jobrole id given by user check whether u have analysis for it
    for (const jobRole of jobRoles) {
        const existingAnalysis = savedAnalysisByRoleId.get(String(jobRole._id))
        // if present we push to comparision means these no need to do comparison we already have the data . so pushed to comparision and which r not present only those we do comparision
        if (existingAnalysis) {
            comparisons.push(buildComparisonFromSavedAnalysis(existingAnalysis))
            continue
        }

        missingJobRoles.push(jobRole)
    }

    // if we have some mssingjobroles then only we perform ai operation
    if (missingJobRoles.length > 0) {
        try {
            req.aiUsage = await reserveAiUsage(req.user._id, 'role comparison')
            compareQuotaReserved = true
            req.aiQuotaReserved = true

            // perform ai operation for missing job roles
            const aiCompareResult = await multiRoleCompareService.compareResumeAgainstMultipleRoles(
                resume.parsedData,
                missingJobRoles
            )

            // we list each jobrole with its jobroleid
            const comparisonByRoleId = new Map(
                aiCompareResult.comparisons.map((item) => [String(item.jobRoleId), item])
            )

            // we check that whether for all job roles did they generate the comparision or not
            for (const jobRole of missingJobRoles) {
                const comparison = comparisonByRoleId.get(String(jobRole._id))
                if (!comparison) {
                    throw new Error(`Missing compare output for role ${jobRole.title}`)
                }

                comparisons.push(buildComparisonFromAiCompare(jobRole, comparison))
            }
        } catch (error) {
            if (compareQuotaReserved) {
                req.aiUsage = await refundAiUsage(req.user._id);
                compareQuotaReserved = false;
                req.aiQuotaReserved = false;
            }

            logger.error(`Failed multi-role comparison for user ${userId}: ${error.message}`)
            throw new ApiError(500, 'Failed to compare selected job roles')
        }
    }

    // Sort by match score
    const sortedComparisons = comparisons
        .filter((c) => !c.error)
        .sort((a, b) => b.matchPercentage - a.matchPercentage);

    if (!sortedComparisons.length) {
        throw new ApiError(400, 'No comparison result could be generated')
    }

        // bstFit means the highest matchscore analysis
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
                    sortedComparisons.reduce((sum, c) => sum + c.matchPercentage, 0) /
                    sortedComparisons.length
                ),
                reusedSavedAnalyses: comparisons.filter((item) => item.source === 'saved-analysis').length,
                generatedWithAiCompare: comparisons.filter((item) => item.source === 'ai-compare').length,
            },
            aiUsage: req.aiUsage,
        },
        'Role comparision completed successfullyy')
    )
})

// analysis.controller.js - CORRECTED
//ananlysis can be regenerated only when its state is not queued or processing
export const regenerateAnalysis = asyncHandler(async (req, res) => {

    const { preferences } = req.body;  // Get preferences from request
  
    const analysis = await analysisModel.findOne({
      _id: req.params.id,
      user: req.user._id,
    }).populate('resume jobRole');
  
    if (!analysis) {
      throw new ApiError(404, 'Analysis not found');
    }

    if ([ANALYSIS_STATUS.QUEUED, ANALYSIS_STATUS.PROCESSING].includes(analysis.status)) {
      throw new ApiError(409, 'Analysis is already running');
    }

    // we reset al the parameter of ananlysis
    analysis.status = ANALYSIS_STATUS.QUEUED;
    analysis.processingStage = ANALYSIS_PROCESSING_STAGE.QUEUED;
    analysis.error = undefined;
    analysis.queuedAt = new Date();
    analysis.processingStartedAt = undefined;
    analysis.completedAt = undefined;
    analysis.processingTime = undefined;
    analysis.version = Number(analysis.version || 1) + 1;
    analysis.userPreferences = {
      hoursPerWeek: preferences?.hoursPerWeek ?? analysis?.userPreferences?.hoursPerWeek ?? 8,
      budget: preferences?.budget ?? analysis?.userPreferences?.budget ?? 'free',
      learningStyle: preferences?.learningStyle ?? analysis?.userPreferences?.learningStyle ?? 'mixed',
    };

    await analysis.save();
    // clear all the analysis cache cause ab naya ayega na bhidu
    await clearAnalysisCache(req.user._id, analysis._id);

    try {
      await enqueueAnalysisGeneration({
        analysisId: analysis._id,
        resumeId: analysis.resume?._id || analysis.resume,
        jobRoleId: analysis.jobRole?._id || analysis.jobRole,
        userId: req.user._id,
      });

      return res.status(202).json(
        new ApiResponse(202, { analysis, aiUsage: req.aiUsage }, 'Analysis regeneration queued successfully')
      );
    } catch (error) {
      if (req.aiQuotaReserved) {
        req.aiUsage = await refundAiUsage(req.user._id);
        req.aiQuotaReserved = false;
      }

      analysis.status = ANALYSIS_STATUS.FAILED;
      analysis.processingStage = ANALYSIS_PROCESSING_STAGE.FAILED;
      analysis.error = error.message;
      await analysis.save();
      await clearAnalysisCache(req.user._id, analysis._id);

      throw error;
    }
    /*
    logger.info(`Regenerating analysis: ${analysis._id}`);
  
    // Re-run gap analysis
    const gapAnalysis = await skillgapanalysis.performDeepSkillGapAnalyze(
      analysis.resume.parsedData,
      analysis.jobRole
    );
    
    // ✅ FIX: If preferences provided, generate NEW roadmap with them
    // prefernce change the structure of roadmap also changes
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
    analysis.skillGaps = {
      critical: (gapAnalysis.skillGaps?.critical || []).map((item) => ({
        ...item,
        difficulty: normalizeDifficulty(item?.difficulty),
      })),
      important: (gapAnalysis.skillGaps?.important || []).map((item) => ({
        ...item,
        difficulty: normalizeDifficulty(item?.difficulty),
      })),
      niceToHave: (gapAnalysis.skillGaps?.niceToHave || []).map((item) => ({
        ...item,
        difficulty: normalizeDifficulty(item?.difficulty),
      })),
    };
    analysis.candidateStrength = (gapAnalysis.strengths || []).map((item) => ({
      ...item,
      proficiency: normalizeProficiency(item?.proficiency),
    }));
    analysis.readinessLevel = normalizeReadinessLevel(gapAnalysis.overallAssessment.readinessLevel);
    analysis.version += 1;
  
    try {
      await analysis.save();

      // after regenerating user cache may have old cache of analysis
      await clearAnalysisCache(req.user._id, analysis._id);
    
      res.status(200).json(new ApiResponse(200, { analysis, aiUsage: req.aiUsage }, 'Analysis regenerated successfully'));
    } catch (error) {
      if (req.aiQuotaReserved) {
        req.aiUsage = await refundAiUsage(req.user._id);
        req.aiQuotaReserved = false;
      }

      throw error;
    }
    */
  });
