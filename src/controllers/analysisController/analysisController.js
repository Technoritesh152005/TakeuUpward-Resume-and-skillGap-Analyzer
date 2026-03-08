import asyncHandler from "express-async-handler"
import analysisModel from "../../models/analysis.model"
import resumeModel from "../../models/resume.model"
import jobRoleModel from "../../models/jobrole.model"
import skillgapanalysis from "../../services/ai.services/skill_gap_analysis"
import ApiResponse from '../../utils/apiResponse'
import generateAtsScore from "../../services/ai.services/ats_score_generator"

// first create a analysis controller
/*
then take resume id and job role id
check whether this resume and job role id exist and to crea
*/

export const createAnalysis = asyncHandler(async (req, res) => {

    const { resumeId, jobRoleId } = req.body

    // first verify that atleast resume exist of the user
    const resume = await resumeModel.findOne({ _id: resumeId, user: req.user._id })

    if (!resume) {
        throw new ApiError(400, 'Resume not found to create analysis')
    }
    if (resume.isActive === false) {
        throw new ApiError(400, 'Ur resume is inActive')
    }
    if (!resume.parsedData) {
        throw new ApiError(400, 'Resume is not parsed yet')
    }

    const jobRole = await jobRoleModel.find({ _id: jobRoleId })
    if (!jobRole) {
        throw new ApiError(400, 'Job Role not found')
    }

    // now we have both seen that resume and job role exist
    //so now we create analysis and call our services

    const analysis = await analysisModel.create({
        resume: resumeId,
        user: req.user._id,
        jobRole: jobRoleId,
        status: 'processing',
    })

    // this gets all data of analysis from claude api and store it in skillGapAnalysisData
    try {
        const skillGapAnalysisData = await skillgapanalysis.performDeepSkillGapAnalyze(resume.parsedData, jobRole)

        const atsScore = await generateAtsScore.getAtsScore(resume.parsedData, jobRole)

        analysis.matchScore = skillGapAnalysisData.overallAssessment.matchPercentage
        analysis.matchBreakDown = {
            criticalSkills: {
                // matched skills will be total skills in job role - missing skills in resume
                matched: jobRole.requiredSkills.critical.length - skillGapAnalysisData.skillGaps.critical.length,
                total: jobRole.requiredSkills.critical.length,
                percentage: total > 0 ? Math.round(matched / total * 100) : 0
            },
            importantSkills: {
                matched: jobRole.requiredSkills.important.length - skillGapAnalysisData.skillGaps.important.length,
                total: jobRole.requiredSkills.important.length,
                percentage: total > 0 ? Math.round(matched / total * 100) : 0
            },
            niceToHaveSkills: {
                matched: jobRole.requiredSkills.niceToHave.length - skillGapAnalysisData.skillGaps.niceToHave.length,
                total: jobRole.requiredSkills.niceToHave.length,
                percentage: total > 0 ? Math.round(matched / total * 100) : 0
            }
        }

        analysis.skillGaps = skillGapAnalysisData.skillGaps
        analysis.transfearableSkills = skillGapAnalysisData.transfearableSkills
        analysis.atsScore = {
            overall: atsScore.overallScore,
            keywords: {
                score: atsScore.breakdown.keywords.score,
                isMatched: atsScore.breakdown.keywords.matched,
                missing: atsScore.breakdown.keywords.missing
            }
        }
        analysis.candidateStrength = skillGapAnalysisData.strengths,
            analysis.transferrableSkills = skillGapAnalysisData.transferableSkills,
            analysis.experienceAnalysis = {
                candidateYears: skillGapAnalysisData.experienceGap.candidateYears,
                requiredYears: skillGapAnalysisData.experienceGap.typicalRequirment,
                gap: requiredYears - candidateYears,
                assessment: skillGapAnalysisData.experienceGap.assessment,
            }
        analysis.readinessLevel = skillGapAnalysisData.overallAssessment.readinessLevel
        analysis.estimatedTimeToReady = skillGapAnalysisData.estimatedTimeToReady
        analysis.aiSuggestion = {
            summary: skillGapAnalysisData.overallAssessment.summary,
            recommendation: skillGapAnalysisData.recommendations
        }
        analysis.status = 'completed',
            analysis.processingTime = Date.now() - analysis.createdAt;

        await analysis.save()

        logger.info(200, 'Analysis generated succesfully for the user :'`${req.user._id}`)

        // analysis have only reference of resume and job role like their id
        // so we take some necessary details to show on what resume and job role analysis is done
        await analysis.populate('resumeModel', 'fileName,originalFileName,uploadedAt')
        await analysis.populate('jobRoleModel', 'title category experienceLevel salaryRange');

        res.status(200)
            .json(201, new ApiResponse(201, 'Analysis created succesfully', analysis))
    } catch (error) {
        analysis.error = error.message
        analysis.status = 'failed'
        await analysis.save()
        logger.error(201, 'Error occured while generating analysis')

        throw new ApiError(401, 'Failed to generate analysis')
    }

})

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

    const filter = { user: req.user._id }

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
            { path: 'resumeModel', select: 'filename originalName uploadedAt' },
            { path: 'jobRoleModel', select: 'title category experienceLevel salaryRange' },
        ]
    })
    if (!analyses) {
        throw new ApiError(401, 'Analysis not found')
    }
    res.json(new ApiResponse(200, analyses, 'Analyses fetched successfully'));
})

export const getAnalysisById = asyncHandler(async (req, res) => {

    const analysis = analysisModel.findOne({
        user: req.user._id,
        _id: req.params.id,
        isActive: true
    })
        // u will analysis of that user with the id>< so id is unique means u will find
        // onedocument only of analysis model. populate resume and 
        .populate('resume', 'fileName , originalFileName , parsedData uploadedAt')
        .populate('jobRole')

    // thid will get that analysis document and also give resume of which analaysis is created with their
    // parsed data and also jobRole target
    if (!analysis) {
        throw new ApiError(401, 'No analysis found of user')
    }
    res.json(200)
        .json(201, 'Successfully fetched analysis for user :'`${req.user.email}`, analysis)
})

export const deleteAnalysis = asyncHandler(async (req, res) => {

    const userId = req.user._id
    const analysisId = req.params.id

    const analaysis = analysisModel.findOne(
        { userId, analysisId }, { isActive: true }
    )
    if (!analaysis) {
        throw new ApiError(400, 'No analysis Model Found')
    }

    analaysis.isActive = false
    await analaysis.save()

    logger.info(201, 'User succesfuly deleted his analysis . user is :'`${req.user.email}`)

    res.json(200)
        .json(201, 'Analysis succesfully deleted')
})

export const compare_Multiple_Job_Role_With_Resume_And_Get_Analysis = aysncHandler(async (req, res) => {

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
})

export const regenerateAnalysis = asyncHandler(async (req, res) => {

    // with analysis also get the jobrole and resume
    const analysis = await analysisModel.findOne(
        {
            user: req.user._id,
            _id: req.params.id
        }
    ).populate('resume jobRole')

    if (!analysis) {
        throw new ApiError(400, 'No Analysis found of the user')
    }

    // analysis found so now regenerate the analysis
    const analyze = await skillgapanalysis.performDeepSkillGapAnalyze(
        analysis.resume.parsedData,
        analysis.jobRole
    )
    if (!analyze) {
        throw new ApiError(400, 'Not regenrate analyze performed')
    }
    analysis.skillGaps = analyze.skillGaps,
        analysis.candidateStrength = analyze.strengths,
        analysis.matchscore = analyze.overallAssessment.matchPercentage,
        analysis.readinessLevel = analyze.overallAssessment.readinessLevel;
    analysis.version += 1;

    await analysis.save()

    res.status(200)
        .json(new ApiResponse(200, 'User succcesfully regenerated analysis', analysis))
})