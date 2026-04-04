import mongoose from 'mongoose'
import mongoosePaginate from "mongoose-paginate-v2";

const resumeSchema = mongoose.Schema(
    {

        user:{
            type:mongoose.Types.ObjectId,
            ref:'userModel',
            required:true,
            index:true
        },
        fileName:{
            type:String,
            required:true
        },
        originalFileName:{
            type:String,
            required:true
        },
        fileUrl:{
            type:String,
            required:true
        },
        fileSize:{
            type:String,
            required:true,
        },
        // mime type means jpg or pdf or docx
        mimeType:{
            type:String,
            required:true,
        },
        storageType:{
            type:String,
            enum:['local','s3'],
            default:'local'
        },

        // now whenever user uploads resumem we extract the necessary field and put them in our fields
        parsedData:{
            // each user dont have multiple personal details but eduaction can be multiple so we put them in array

            personal:{
                name:String,
                email:String,
                phone:String,
                location:String,
                Linkedin:String,
                Github:String,
                personalPortfolio:String,

            },
            summary:{
                type:String,
            },
            education:[{
                degree:String,
                major:String,
                startDate:Date,
                endDate:Date,
                instituition: String,
                location:String,
                cgpa:String,
                currentStatus:Boolean,
                achievments:[String],
            }],
            experience:[{
                title: String,
                company: String,
                location: String,
                startDate: Date,
                endDate: Date,
                current: Boolean,
                description: String,
                responsibilities: [String],
                achievements: [String],
                skillsUsed: [String],
            }],
            skills:{
                technical:[String],
                tools:[String],
                frameworks:[String],
                language:[String],
                database:[String],
                others:[String],
            },
            project:[{
                title:String,
                description:String,
                technologies:[String],
                liveUrl:String,
                github:String,
                startDate:Date,
                endDate:Date,
                highlights:[String],
            }],
            certification:{
                name: String,
                issuer: String,
                issueDate: Date,
                expiryDate: Date,
                credentialId: String,
                url: String,
            },
            achievments:[String],
            language:[

                {language:String,
                    proficiency:{
                    enum:['basic','intermediate','fluent','native']
                    }
                }
            ],
            
        },
        // resume processing status
        processingStatus:{
            type:String,
            enum:['pending','completed','processing','failed'],
            default:'pending',
            },
            processError:String,
            // all the text of the ocr based text extraction are stored here
            ocrText: {
                type: String,
                select: false,
            },
            // states whether ocr have been used or not
            ocrUsed: {
                type: Boolean,
                default: false,
            },
            // if ocr used show its status
            ocrStatus: {
                type: String,
                enum: ['not_needed', 'processing', 'completed', 'failed'],
                default: 'not_needed',
            },
            // textextraction source means whether the text extraction is done by native or ocr
            textExtractionSource: {
                type: String,
                enum: ['native', 'ocr'],
                default: 'native',
            },
            // raw text means the text extracted from the resume by native or ocr
            rawText:{
                type: String,
                select: false,
            },
            wordCount: Number,
            pageCount: Number,
            version: {
            type: Number,
            default: 1,
            },
            isActive: {
            type: Boolean,
            default: true,
            },
    }
    ,
    {
        timestamps:true,
        toObject:{virtuals:true},
        toJson:{virtuals:true},
    }
)
// sort this user resume in newest form
resumeSchema.index({ user: 1, createdAt: -1 });
// finding pending resumes
resumeSchema.index({ processingStatus: 1 });
resumeSchema.index({ 'parsedData.skills.technical': 1 });

resumeSchema.plugin(mongoosePaginate);

resumeSchema.virtual('analyses',{
    ref:'Analysis',
    localField:'_id',
    foreignField:'resume'
})

// method to get skill count so that u can show in ur dashboard
resumeSchema.methods.getSkillSummary = function () {

    const technical = this.parsedData?.skills?.technical?.length || 0;
    const tools = this.parsedData?.skills?.tools?.length || 0;
    const languages =
        this.parsedData?.skills?.languages?.length ||
        this.parsedData?.skills?.language?.length ||
        0;

    return {
        technical,
        tools,
        languages,
        total: technical + tools + languages
    };
};

const resumeModel = mongoose.model('resumeModel', resumeSchema);

export default resumeModel;
export { resumeModel };
