import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { ANALYSIS_STATUS } from '../config/constant.js';

const analysisSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'userModel',
            required: true,
            index: true
        },
        resume: {
            type: mongoose.Types.ObjectId,
            ref: 'resumeModel',
            required: true,
            index: true,
        },
        jobRole: {
            type: mongoose.Types.ObjectId,
            ref: 'jobRoleModel',
            required: true,
            index: true,
        },
        matchScore: {
            type: Number,
            required: true,
            min: 1,
            max: 100
        },
        // summar of ur skills matched
        matchBreakDown: {
            criticalSkills: {
                matched: Number,
                total: Number,
                percentage: Number
            },
            importantSkills: {
                matched: Number,
                total: Number,
                percentage: Number
            },
            niceToHaveSkills: {
                matched: Number,
                total: Number,
                percentage: Number
            }
        },

        // skill gaps
        skillGaps: {
            critical: [
                {
                    skill: String,
                    importance: Number,
                    reason: String,
                    learningTime: Number,
                    difficulty: {
                        type: String,
                        enum: ['begineer', 'intermediate', 'advanced']
                    }
                    ,
                    prerequiristes: [String]
                }
            ],
            important: [
                {
                    skill: String,
                    importance: Number,
                    reason: String,
                    learningTime: Number,
                    difficulty: {
                        type: String,
                        enum: ['begineer', 'intermediate', 'advanced']
                    }
                    ,
                    prerequiristes: [String]
                }
            ],
            niceToHave: [
                {
                    skill: String,
                    importance: Number,
                    reason: String,
                    learningTime: Number,
                    difficulty: {
                        type: String,
                        enum: ['begineer', 'intermediate', 'advanced']
                    }
                    ,
                    prerequiristes: [String]
                }
            ],

            // candidate Strength
            candidateStrength: [
                {
                    skill: Number,
                    importance: Number,
                    proficiency: {
                        type: String,
                        enum: ['beginner', 'intermediate', 'advanced']
                    },
                    relevance: [String],
                    uniqueAdvantages: [String]
                }
            ],

            // transferring skills used in other job roles
            transferrableSkills: {
                skill: String,
                relatesTo: [String],
                explanation: String
            },

            // experienceAnalysis
            experienceAnalysis: {
                candidateYears: Number,
                requiredYears: Number,
                gap: Number,
                assessment: String
            },
            // readiniess level
            readinessLevel: {
                type: String,
                enum: ['not-ready', 'nearly-ready', 'ready', 'overqualified'],
                default: 'nearly-ready'
            },
            estimatedTimeToReady: {
                weeks: Number,
                reason: String
            },

            // ats score
            atsScore: {
                overall: Number,
                formating: {
                    score: Number,
                    issues: [String],

                },
                keywords: {
                    score: Number,
                    isMatched: [String],
                    missing: [String],

                },
                structure: {
                    score: Number,
                    issues: [String]
                },
                content: {
                    score: Number,
                    issues: [String]
                }
            },

            aiSuggestion: {
                summary: String,
                recommendation: [String],
                carrerAdvice: String,
                competitiveAnalysis: {
                    percentileRank: Number,
                    comparisonNotes: String,
                },
            },

            // proccessing
            status: {
                type: String,
                enum: Object.values(ANALYSIS_STATUS),
                default: ANALYSIS_STATUS.PENDING,
                index: true,
              },
              processingTime: Number, // in milliseconds
              error: String,
              // Metadata
              version: {
                type: Number,
                default: 1,
              },
              isActive: {
                type: Boolean,
                default: true,
              },
        }
    }, {
    timestamps: true,
    toJson:{virtuals:true},
    toObject:{virtuals:true}
}
)

analysisSchema.plugin(mongoosePaginate);

// calculating total skill gaps
analysisSchema.methods.SkillGaps = function(){
    const critical = SkillGaps.critical?.length || 0
    const important = SkillGaps.important?.length || 0
    const niceToHave = SkillGaps.niceToHave?.length ||0
    const total = critical + important + niceToHave

    return (
        critical,
        important,
        niceToHave,
        total
    )
}

const analysisModel = mongoose.model('analysisModel', analysisSchema);

export default analysisModel;
export { analysisModel };