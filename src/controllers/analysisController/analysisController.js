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

export const getMyAnalysis = asyncHandler (async(req,res)=>{

    const {
        page ,
        limit,
        sort , 
        status,
        resumeId,
        jobRoleId,
        minMatchScore,
        maxMatchScore
    } = req.query

    const filter = {user:req.user._id}

    if(resumeId) filter.resume = resumeId
    if(jobRoleId) filter.jobRole = jobRoleId
    if(status) filter.status = status

    if (minMatchScore || maxMatchScore) {
        filter.matchScore = {};
        if (minMatchScore) filter.matchScore.$gte = parseFloat(minMatchScore);
        if (maxMatchScore) filter.matchScore.$lte = parseFloat(maxMatchScore);
      }

   const analyses =  await analysisModel.paginate(filter,{
        page:parseInt(page),
        limit:parseInt(limit),
        sort:sort,
        populate:[
            { path: 'resumeModel', select: 'filename originalName uploadedAt' },
            { path: 'jobRoleModel', select: 'title category experienceLevel salaryRange' },
        ]
    })
    if(!analyses){
        throw new ApiError(401,'Analysis not found')
    }
    res.json(new ApiResponse(200, analyses, 'Analyses fetched successfully'));
})