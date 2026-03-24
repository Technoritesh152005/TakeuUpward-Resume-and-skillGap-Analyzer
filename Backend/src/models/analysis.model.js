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

        // ✅ NEW: Extracted skills for dashboard stats
        extractedSkills: {
            type: [String],
            default: [],
            index: true
        },

        // ✅ NEW: Skill breakdown for dashboard charts
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

        // Processing status
        status: {
            type: String,
            enum: Object.values(ANALYSIS_STATUS),
            default: ANALYSIS_STATUS.PENDING,
            index: true,
        },
        processingTime: Number,
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
