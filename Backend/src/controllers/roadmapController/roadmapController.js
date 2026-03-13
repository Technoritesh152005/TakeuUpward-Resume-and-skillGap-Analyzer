import asyncHandler from '../../utils/asyncHandler.js'
import ApiResponse from '../../utils/apiResponse.js'
import { ApiError } from '../../utils/apiError.js'
import analysisModel from '../../models/analysis.model.js'
import performRoadmapInstance from '../../services/ai.services/roadmap_planner.js'
import logger from '../../utils/logs.js'
import resourceModel from '../../models/resources.model.js'
import progressModel from '../../models/progress.model.js'

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

export const getRoadmapByAnalysis = asyncHandler(async(req,res)=>{

    // of one analysis there can be 1 roadmap only

    const roadmap = await roadmapModel.findOne(
        {
            analysis:req.params.analaysisId,
            user:req.user._id
        }
    )
    if(!roadmap){
        throw new ApiError(400,'No roadmap found')
    }

    res.status(200)
    new ApiResponse(200, roadmap, 'Clearly got roadmap from analysis')
})

export const getRoadmapById = asyncHandler(async(req,res)=>{

    const roadmapId = req.params._id

    const roadmap = await roadmapModel.findOne({
        _id:roadmapId,
        user:req.user._id
    })
    .populate('analysis')
    if (!roadmap) {
        throw new ApiError(404, 'Roadmap not found');
      }
    
      res.json(new ApiResponse(200, roadmap, 'Roadmap fetched successfully'));
})

export const markItemComplete = asyncHandler(async(req,res)=>{
    const {phaseIndex , weekIndex , itemIndex} = req.body

    // to marks item complete we need a roadmap 
    const roadmap = await roadmapModel.findOne(
        {
            _id:req.params.id,
            user:req.user_id
        }
    )
    if(!roadmap){
        throw new ApiError(400,'No roadmap found')
    }

    // validate the index provided
    if(phaseIndex >= roadmap.phases.length || weekIndex >= roadmap.weeklyBreakdown.length || itemIndex >= roadmap.learningItems.length ){
        throw new ApiError(400,'The index provided are invalid')
    }

    const item = roadmap.phases[phaseIndex].weeklyBreakdown[weekIndex].learningItems[itemIndex]

    item.completedAt = new Date()
    item.completed = true

    // update user progress
    const progress = await progressModel.findOne({
        user:req.user._id,
        roadmap:roadmap._id
    })
    if(!progress){
        throw new ApiError(400,'No progress found of the user')
    }
    // if progress present update tje mark completeion or maintain streak
    if(progress){
        progress.lastActivityDate = new Date()
        await progress.updateStreak

        // add to progress learned resource that what did he learned and resource used
        console.log(item.resource)
        if(item.resource){
            progress.completedResources.push({
                resource:item.resource,
                completedAt:new Date()
            })
        }
    }
    res.status(200)
    new ApiResponse(201,roadmap,'Item Marked completed')
})

export const updateReference = asyncHandler(async(req,res)=>{

    // requirment from user to change preference
    const {hoursPerWeek , budget , learningStyle} = req.body

   const roadmap = await roadmapModel.findOne({
        user:req.user._id,
        _id:req.params.id
    })

    if(!roadmap){
        throw new ApiError(200,'No roadmap found to update user preference')
    }

    if(hoursPerWeek) roadmap.userPreferences.hoursPerWeek = hoursPerWeek
    if(budget) roadmap.userPreferences.budget = budget
    if(learningStyle) roadmap.userPreferences.learningStyle = learningStyle

    await roadmap.save()
    res.status(200)
    new ApiResponse(201,roadmap,'User preferne updated succesfully')
})

export const getProgressOfUser = asyncHandler(async(req,res)=>{

    // here work is to return the progress of user
    // and also the progress of items completed in roadmap
    // find out the roadmap progress
    const roadmap = await roadmapModel.findOne({
        user:req.user._id,
        _id:req.params.id
    }).select('phases progress')

    if(!roadmap){
        throw new ApiError(400,'Failed to get roadmap')
    }

    const progress = await progressModel.findOne({
        user:req.user.id,
        roadmap:roadmap._id
    })

    res.status(200)
    .json(new ApiResponse(200,
{        roadmapProgress: roadmap.progress,
        userProgress: progress,},
        'Succesfully got progress of user'
    ))
})

export const getMyRoadmaps = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
  
    const roadmaps = await roadmapModel.find({
      user: req.user._id,
      isActive: true,
    })
      .populate({
        path: 'analysis',
        populate: { path: 'jobRole', select: 'title category' },
      })
      .select('duration progress createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
  
    const total = await roadmapModel.countDocuments({
      user: req.user._id,
      isActive: true,
    });
  
    res.json(
      new ApiResponse(
        200,
        {
          roadmaps,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        'Roadmaps fetched successfully'
      )
    );
  });