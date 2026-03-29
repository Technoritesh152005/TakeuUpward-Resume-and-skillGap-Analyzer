import mongoose from 'mongoose'

const tokenSchema = mongoose.Schema(
    {
        user:
        {
            type: mongoose.Types.ObjectId,
            ref: 'userModel',
            required: true,
            index: true,
        },
        tokenHash:{
            type:String,
            required:true,
            index: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        used:{
            type:Boolean,
            default:false,
        },
        createdAt:{
            type:Date,
            default:Date.now,
        }
    }
)
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
const tokenModel = mongoose.model('tokenModel',tokenSchema)
export default tokenModel
