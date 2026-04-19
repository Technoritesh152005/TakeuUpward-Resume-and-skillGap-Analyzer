import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { ANALYSIS_PROCESSING_STAGE, ANALYSIS_STATUS } from '../config/constant.js';

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
        // number of ur analysis matches with ur job role
        matchScore: {
            type: Number,
            required: true,
            min: 0,
            max: 100
        },
        
        // Summary of skills matched
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

        // Extracted skills for dashboard stats
        extractedSkills: {
            type: [String],
            default: [],
            index: true
        },

        //  Skill breakdown for dashboard charts
        skillBreakdown: [{
            skillName: {
                type: String,
                required: true
            },
            currentLevel: {
                type: Number,
                min: 0,
                max: 100,
                required: true
            },
            targetLevel: {
                type: Number,
                min: 0,
                max: 100,
                required: true
            },
            gap: {
                type: Number,
                required: true
            }
        }],

        // Skill gaps
        skillGaps: {
            critical: [
                {
                    skill: String,
                    importance: Number,
                    reason: String,
                    confidence: {
                        type: String,
                        enum: ['low', 'medium', 'high']
                    },
                    sourceType: {
                        type: String,
                        enum: ['deterministic', 'ai_inferred', 'hybrid']
                    },
                    learningTime: String,
                    difficulty: {
                        type: String,
                        enum: ['beginner', 'medium', 'intermediate', 'advanced']
                    },
                    prerequisites: [String]
                }
            ],
            important: [
                {
                    skill: String,
                    importance: Number,
                    reason: String,
                    confidence: {
                        type: String,
                        enum: ['low', 'medium', 'high']
                    },
                    sourceType: {
                        type: String,
                        enum: ['deterministic', 'ai_inferred', 'hybrid']
                    },
                    learningTime: String,
                    difficulty: {
                        type: String,
                        enum: ['beginner', 'medium', 'intermediate', 'advanced']
                    },
                    prerequisites: [String]
                }
            ],
            niceToHave: [
                {
                    skill: String,
                    importance: Number,
                    reason: String,
                    confidence: {
                        type: String,
                        enum: ['low', 'medium', 'high']
                    },
                    sourceType: {
                        type: String,
                        enum: ['deterministic', 'ai_inferred', 'hybrid']
                    },
                    learningTime: String,
                    difficulty: {
                        type: String,
                        enum: ['beginner', 'medium', 'intermediate', 'advanced']
                    },
                    prerequisites: [String]
                }
            ]
        },

        // Candidate strengths
        candidateStrength: [
            {
                skill: String,
                importance: Number,
                confidence: {
                    type: String,
                    enum: ['low', 'medium', 'high']
                },
                sourceType: {
                    type: String,
                    enum: ['deterministic', 'ai_inferred', 'hybrid']
                },
                proficiency: {
                    type: String,
                    enum: ['beginner', 'intermediate', 'advanced', 'expert']
                },
                relevance: String,
                uniqueAdvantage: String
            }
        ],

        // Transferable skills
        transferrableSkills: {
            skill: String,
            relatesTo: [String],
            explanation: String
        },

        // Experience analysis
        experienceAnalysis: {
            candidateYears: Number,
            requiredYears: Number,
            gap: Number,
            assessment: String
        },

        // Readiness level
        readinessLevel: {
            type: String,
            enum: ['not-ready', 'nearly-ready', 'ready', 'overqualified'],
            default: 'nearly-ready'
        },

        estimatedTimeToReady: {
            weeks: Number,
            reason: String
        },

        // ATS score
        atsScore: {
            overall: Number,
            formatting: {
                score: Number,
                issues: [String],
            },
            keywords: {
                score: Number,
                matched: [String],
                missing: [String],
                recommended: [String],
            },
            structure: {
                score: Number,
                issues: [String]
            },
            content: {
                score: Number,
                issues: [String],
                weakPhrases: [String],
                rewriteSuggestions: [String],
            }
        },

        // AI suggestions
        aiSuggestion: {
            summary: String,
            recommendations: [String],
            careerAdvice: String,
            competitiveAnalysis: {
                percentileRank: Number,
                comparisonNotes: String,
            },
        },

       applicationReadiness:{
        label:{
            type:String,
            // stretch roles means try more or try to do with diff roles
            enum:['apply_now','apply_after_resume_fixes','apply_after_skill_upgrade','stretch_role']
        },
        readinessScore:Number,
        mainBlocker:String,
        topReasons:[String],
        nextAction:String,
       },

       closestWinnableRole: {
        roleId: {
            type: mongoose.Types.ObjectId,
            ref: 'jobRoleModel',
        },
        title: String,
        category: String,
        experienceLevel: String,
        fitScore: Number,
        winnableScore: Number,
        matched: {
            critical: Number,
            important: Number,
            niceToHave: Number,
        },
        gaps: {
            critical: Number,
            important: Number,
            niceToHave: Number,
        },
        missingCriticalSkills: [String],
        missingImportantSkills: [String],
        reasons: [String],
        nextAction: String,
       },

    //    analysis status for quueue
        status:{
            type:String,
            enum:Object.values(ANALYSIS_STATUS),
        default:ANALYSIS_STATUS.QUEUED,
        index:true,
        },
        // processing stage during analysis creation
        processingStage:{
            type:String,
            enum:Object.values(ANALYSIS_PROCESSING_STAGE),
            default: ANALYSIS_PROCESSING_STAGE.QUEUED,
            index:true
        },
        queuedAt:Date,
        processingStartedAt:Date,
        completedAt:Date,
        processingTime:Number,
        error:String,
        
        // Metadata
        version: {
            type: Number,
            default: 1,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    }, 
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

analysisSchema.plugin(mongoosePaginate);

// Index for dashboard queries
analysisSchema.index({ user: 1, createdAt: -1 });
analysisSchema.index({ user: 1, status: 1 });

// Method to calculate total skill gaps
analysisSchema.methods.getTotalSkillGaps = function() {
    const critical = this.skillGaps?.critical?.length || 0;
    const important = this.skillGaps?.important?.length || 0;
    const niceToHave = this.skillGaps?.niceToHave?.length || 0;
    const total = critical + important + niceToHave;

    return {
        critical,
        important,
        niceToHave,
        total
    };
};

const analysisModel = mongoose.model('analysisModel', analysisSchema);

export default analysisModel;
export { analysisModel };
