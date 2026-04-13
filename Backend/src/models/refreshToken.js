import mongoose from 'mongoose'


const refreshTokenSchema = new mongoose.Schema({

    // Refresh Token schema. It is created usually 7 day i think........
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

// virtual have access to current document
// it is a checker which checks that is the current time has already passed the expired time
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

// In Mongoose, a virtual is:

// A field that does NOT exist in the database, but is computed or used logically
// A virtual is:

// A computed property based on data that already exists in the same document.

// It does NOT:

// Query DB

// Save anything

// Store result

// It only calculates something from existing fields.