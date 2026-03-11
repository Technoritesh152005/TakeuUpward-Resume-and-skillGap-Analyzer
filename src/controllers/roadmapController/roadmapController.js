import asyncHandler from '../../utils/asyncHandler'
import ApiResponse from '../../utils/apiResponse'
import { ApiError } from '../../utils/apiError'
import analysisModel from '../../models/analysis.model'
import performRoadmapInstance from '../../services/ai.services/roadmap_planner'
import logger from '../../utils/logs'
import resourceModel from '../../models/resources.model'
import progressModel from '../../models/progress.model'

export const createRoadmap = asyncHandler(async (req, res) => {

    // to create roadmap first we need to check whether aalysis is there of user
    const { analaysisId, preferences } = req.query

    const analysis = await analysisModel.findOne(
        {
            _id: analaysisId,
            user: req.user._id
        }
    )

    if (!analysis) {
        throw new ApiError(400, 'No analysis found only of user to create a roadmap')
    }

    if (analysis.status != 'completed') {
        throw new ApiError(400, 'Analysis has been currently not in completed status. please complete the analsys status')
    }

    // also check if analysis already have roadmap created
    const existingRoadmap = await roadmapModel.find({
        analysis: analysis._id,
        isActive: true
    })
    if (existingRoadmap) {
        throw new ApiError(400, 'Existing roadmap found of this analaysis')
    }

    logger.info(200, 'Starting roadmap generation for the analysis')
    // now create a roadmap by using claude service.
    // u need to provide preference and analysis data

    const analysisData = {
        skillGaps: analysis.skillGaps,
        strength: analysis.candidateStrength,
        transferskills: analysis.transferrableSkills
    }
    const preference = {
        hoursPerWeek: preferences?.hoursPerWeek || req.user.preferences.hoursPerWeek || 10,
        budget: preferences?.budget || req.user.preferences.budget || 'free',
        learningStyle: preferences?.learningStyle || req.user.preferences.learningStyle || 'mixed',
    }
    const roadmapData = await performRoadmapInstance(analysisData, preference)

    if (!roadmapData) {
        throw new ApiError(400, 'Failed to generate roadmap for the analysis')
    }

    // now as u got roamdpa data it will give u plan but u need to find the best learning resource for it
    // it will have multiple phases and multiple week and have multiple learning items.
    // each learning item u need to provide resource from your resources model

    for(const phase of roadmapData.phases){
        for (const week of roadmapData.weeklyBreakdown){
            for(const item of roadmapData.learningItems){
                // u will get an array of resource for the item
                const learningResource = await resourceModel.find(
                    {
                        skillsCovered:{$in: item.skillsCovered},
                        resourcType: item.type,
                        title:item.title,
                        isPremium: preferences?.budget ==='free'? false : undefined,
                        isActive:true
                    }
                )
                if(learningResource.length === 0){
                    throw new ApiError('Not found resource for the learning item: '`${item}`)
                }else{
                    item.resource = learningResource[0]._id;
                    item.url = learningResource[0].url;
                    item.title = learningResource[0].title;
                }
            }
        }
    }
    // now u got roadmap data and also provided resource to itso start to save it

    const roadmap = await roadmapModel.create(
        {
            user:req.user._id,
            analaysis:analaysisId,
            duration:roadmapData.duration,
            phases:roadmapData.phases,
            quickWins:roadmapData.quickWins,
            projects:roadmapData.portfolioProjects,
            certification:roadmapData.recommendedCertifications,
            progress: {
                totalItems: roadmapData.phases.reduce((total, phase) => {
                  return (
                    total +
                    phase.weeklyBreakdown.reduce((weekTotal, week) => {
                      return weekTotal + week.learningItems.length;
                    }, 0)
                  );
                }, 0),
              },
        }
    )
    if(!roadmap){
        throw new ApiError(400,'Unable to create roadmap')
    }

    //create  progress also when u create roadmap create progress also
    await progressModel.create(
        {
            user:req.user._id,
            roadmap:roadmap._id
        }
    )

    res.status(200)
    .json(new ApiResponse(201,'User successfully created roadmap',roadmap))
   
})