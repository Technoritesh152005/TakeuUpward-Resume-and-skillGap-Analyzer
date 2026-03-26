import mongoose from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2';
import { RESOURCE_TYPES } from '../config/constant.js'

const resourceSchema = new mongoose.Schema(
    {
        // 1
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'userModel',
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        resourceType: {
            type: String,
            enum: Object.values(RESOURCE_TYPES),
            required: true,
            index: true
        },
        provider: String,
        url: String,
        description: String,
        skillsCovered: [
            {
                type: String,
                required: true,
                index: true
            }
        ],
        category: {
            type: String,
            required: true,
        },
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            required: true,
            index: true
        },
        duration: {
            value: Number,
            unit: {
                type: String,
                enum: ['minutes', 'hours', 'days', 'weeks', 'months', 'years'],
                required: true,
            }
        },
        estimatedTimeToComplete:Number,
        price:{
            amount:Number,
            currency:{
                type:String,
                enum:['USD','EUR','GBP','INR','CAD','AUD','NZD','CHF','JPY','CNY','RUB','KRW','MXN','BRL','ZAR','SGD','HKD','PHP','THB','MYR','IDR','VND','TRY','PLN','CZK','HUF','BGN','HRK','RON','ISK','NOK','SEK','DKK','ARS','CLP','COP','PEN','NZD','HKD','MXN','BRL','RUB','INR','CNY','JPY','KRW','THB','MYR','IDR','VND','TRY','PLN','CZK','HUF','BGN','HRK','RON','ISK','NOK','SEK','DKK'],
                required:true,
                default:'USD'
            }
        },
        isPremium:{
            type:Boolean,
            default:false,
            required:true,
            index:true,
        },
        hasFreeVersion:Boolean,
        rating:{
            type:Number,
            min:0,
            max:5,
            default:0,
            required:true,
            index:true,
        },
        reviewcount:{
            type:Number,
            default:0,
            min:0,
        },

        // additional info for learning these resources
        prerequisites:[String],
        learningObjectives:[String],
        targetAudience:[String],
        instructor:String,
        platform:String,
        certificateOffered:Boolean,
        language:{
            type:String,
            default:'English',
            required:true,

        },

        // Metadata
        tags:[String],
        keywords:[String],
        isActive:{
            type:Boolean,
            default:true,
            required:true,
            index:true,
        },
        popularity:{
            type:Number,
            default:0,
        },
        lastUpdated:Date,
    }, {
    timestamps: true
}
)

// Indexes
// creates index for skills, difficulty, and isPremium
resourceSchema.index({ skillsCovered: 1, difficulty: 1, isPremium: 1 });
// creates index for category and rating
resourceSchema.index({ category: 1, rating: -1 });
// creates index for title and description
resourceSchema.index({ title: 'text', description: 'text' });

// Pagination plugin
resourceSchema.plugin(mongoosePaginate);

// method to find best resources according to skill and difficulty
resourceSchema.statics.findBestResources = async function (skill,difficulty,options={}){

    const query = {
        skillsCovered:skill,
        difficulty:difficulty,
        isActive:true,
    }

    if(options.freeOnly){
        query.isPremium = false
    }
   try {
    const resources = await this.find(query)
    .sort({rating:-1, popularity:-1})
    .limit(options.limit || 10)
    
    return resources
   } catch (error) {
    throw new Error('Failed to find best resources')
   }

    
}

const resourceModel = mongoose.model('resourceModel', resourceSchema);

export default resourceModel;
export { resourceModel };
