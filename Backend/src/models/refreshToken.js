import mongoose from 'mongoose'


const refreshTokenSchema = new mongoose.Schema({

    user:{
        type:mongoose.Types.ObjectId,
        ref:'userModel',
        required:true,
        index:true
    },
    token:{
        type:String,
        required:true,
        unique:true,
        index:true,
    },
    expiresAt:{
        type:Date,
        required:true,
       
    },
    createdByIp:String,
    revokedAt: Date,
    revokedByIp: String,
    replacedByToken: String,
}
,
{
    timestamps:true
})

// Index for automatic cleanup of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// virtual have access to current documeny
refreshTokenSchema.virtual('isExpired').get(function(){
    return Date.now() >= this.expiresAt.getTime()   
})
// Virtual for checking if token is active
refreshTokenSchema.virtual('isActive').get(function () {
    return !this.revokedAt && !this.isExpired;
  });

const refreshTokenModel = mongoose.model('refreshTokenModel', refreshTokenSchema);

export default refreshTokenModel;
export { refreshTokenModel };

// A virtual is:

// A computed property based on data that already exists in the same document.

// It does NOT:

// Query DB

// Save anything

// Store result

// It only calculates something from existing fields.