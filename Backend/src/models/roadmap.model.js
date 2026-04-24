import mongoose from 'mongoose'
import { ROADMAP_PROCESSING_STAGE, ROADMAP_STATUS } from '../config/constant.js'

const roadmapSchema = mongoose.Schema({

    user: {
        type: mongoose.Types.ObjectId,
        ref: 'userModel',
        required: true,
        index: true
    },
    analysis: {
        type: mongoose.Types.ObjectId,
        ref: 'analysisModel',
        required: true,
        // each analysis will have 1 roadmap only
        unique: true,
    },

    // Dashboard UI shows a roadmap title
    title: {
        type: String,
        default: 'Your Roadmap',
    },
    // Roadmap structure
    duration: {
        weeks: Number,
        startDate: Date,
        endDate: Date
    },
    // phases is a array of objects where can contain multiple phases
    // and in each phase there is a weekly breakdown showing what all items u need to covered
    phases: [

        {
            phaseNumber: Number,
            title: String,
            duration: Number,
            objectives: [String],
            weeklyBreakdown: [
                {
                    week: Number,
                    focus: String,
                    goals: [String],
                    timeCommitment: String,
                    // there can be many learning items to do durink week phases 
                    learningItems: [
                        // learning objects will have multiple objects
                        {
                            type: {
                                type: String,
                                enum: ['course', 'book', 'tutorial', 'project', 'practice'],
                            },
                            title: String,
                            description: String,
                            url: String,
                            estimatedHours: Number,
                            completed: {
                                type: Boolean,
                                default: false,
                            },
                            completedAt: Date,
                            resource: {
                                type: mongoose.Types.ObjectId,
                                ref: 'resourceModel'
                            }
                        }
                    ]
                }
            ]
        }
    ],

    // quickwins helps to do some quickt things which is very helpful
    quickwins: [
        {
            skill: String,
            impact: String,
            timeEstimate: String,
            resources: [
                {
                    type: mongoose.Types.ObjectId,
                    ref: 'resourceModel'
                }
            ]
        }
    ],

    // projects suggested by llm models
    projects: [
        {
            title: String,
            description: String,
            skillsCovered: [String],
            difficulty: String,
            estimatedTime: String,
            guideliness: [String],
            completed: {
                type: Boolean,
                default: false
            },
            completedAt: Date,
            projectUrl: String,
        }
    ],
    // certificationa+s
    certification: [
        {
            title: String,
            provider: String,
            cost: Number,
            duration: String,
            priority: {
                type: String,
                enum: ['high', 'medium', 'low']
            },
            url: String,
            completed: {
                type: Boolean,
                default: false
            },

        }
    ],

    additionalActivities: {
        networking: [String],
        interviewPrep: [String],
        communityInvolvment: [String],

    },

    // this progress describes the item marked completed. it is a seperate part for each roadmap
    progress: {
        overallPercentage: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        completedItems: {
            type: Number,
            default: 0
        },
        totalItems: Number,
        lastUpdated: Date,
        milestones: [{
            title: String,
            completed:{
                type:Boolean,
                default:false
            }
        },
        ]
    },

    // customization from user end
    userPreferences: {
        hoursPerWeek: Number,
        budget: String,
        learningStyle: String,
    },

    // shows status of the roamdpa like queue prcoessing , completed , failed
    // used in queue operations
    status: {
        type: String,
        enum: Object.values(ROADMAP_STATUS),
        default: ROADMAP_STATUS.COMPLETED,
        index: true,
    },
    processingStage: {
        type: String,
        enum: Object.values(ROADMAP_PROCESSING_STAGE),
        default: ROADMAP_PROCESSING_STAGE.COMPLETED,
    },
    queuedAt: Date,
    processingStartedAt: Date,
    completedAt: Date,
    processingTime: Number,
    error: String,
    generationMeta: {
        type: mongoose.Schema.Types.Mixed,
        default: undefined,
    },

    // soft delete for roadmap
    isActive: {
        type: Boolean,
        default: true
    },
    version: {
        type: Number,
        default: 1,
    },


}, {
    timestamps: true
})

// now when user completed 1 or more items in roadmap u need to update it
// this tracks through each item and check the total itemsa and how much they r completed
roadmapSchema.methods.updateProgress = async function () {
    let complete = 0
    let total = 0
    this.progress = this.progress || {}
    for (let phase of this.phases) {
        for (let week of phase.weeklyBreakdown) {
            for (let items of week.learningItems) {
                total++
                if (items.completed) complete++
            }
        }
    }

    this.progress.completedItems = complete,
    this.progress.totalItems = total
    this.progress.overallPercentage = total > 0 ? Math.round((complete / total) * 100) : 0

    this.progress.lastUpdated = new Date();
    return this.save()
}

// methods to mark item as complete
roadmapSchema.methods.markItemComplete = async function (phaseIndex, weeklyBreakdownIndex, learningItemIndex) {

    const item = this.phases[phaseIndex].weeklyBreakdown[weeklyBreakdownIndex].learningItems[learningItemIndex]

    if (!item) {
       throw new Error('Item Not Found!..')
    }
    if (!item.completed) {
        item.completed = true
        item.completedAt = new Date()
        // recalculate progress
        return this.updateProgress()
    }
    // if item is already completed dont do anything return this back
    return this
}
const roadmapModel = mongoose.model('roadmapModel', roadmapSchema);

export default roadmapModel;
export { roadmapModel };
