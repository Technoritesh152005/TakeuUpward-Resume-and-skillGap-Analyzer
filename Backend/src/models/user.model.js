import mongoose from 'mongoose'
import { ROLES } from '../config/constant.js'
import jwt from 'jsonwebtoken'
import bcrypt from "bcrypt"

const DEFAULT_DAILY_AI_LIMIT = 4
const DEFAULT_AI_USAGE_TIMEZONE = 'Asia/Kolkata'

// function to show the limit of ai uasge
const getCurrentAiUsageDay = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: DEFAULT_AI_USAGE_TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date())
}


// maintained during the analysis creation or roadmap
const learningPreferenceSchema = new mongoose.Schema(
    {
        hoursPerWeek: {
            type: Number,
            default: 8,
            min: 1,
            max: 168
        },
        budget: {
            type: String,
            enum: ["free", "low", "medium", "high"],
            default: "free",
        },
        learningStyle: {
            type: String,
            enum: ["mixed", "auditory", "visual", "reading", "kinesthetic"],
            default: "mixed",
        }
    },
    { _id: false }
)

const careerPreferenceSchema = new mongoose.Schema(
    {
        targetRole: {
            type: String,
            trim: true,
            default: '',
        },
        experienceLevel: {
            type: String,
            enum: ['student', 'fresher', 'junior', 'mid', 'senior', 'lead'],
            default: 'student',
        },
        preferredJobType: {
            type: String,
            enum: ['full-time', 'internship', 'contract', 'freelance', 'part-time'],
            default: 'full-time',
        },
        preferredLocation: {
            type: String,
            trim: true,
            default: '',
        },
        remotePreference: {
            type: String,
            enum: ['remote', 'hybrid', 'onsite', 'flexible'],
            default: 'flexible',
        },
        industryInterest: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
)

const aiUsageSchema = new mongoose.Schema(
    {
        dailyLimit: {
            type: Number,
            default: DEFAULT_DAILY_AI_LIMIT,
            min: 0,
        },
        usesRemaining: {
            type: Number,
            default: DEFAULT_DAILY_AI_LIMIT,
            min: 0,
        },
        lastResetDate: {
            type: String,
            default: getCurrentAiUsageDay,
        },
    },
    // this is to show that no id need to create for this schema
    { _id: false }
)

const userSchema = mongoose.Schema(
    
    {

        name: {
            type: String,
            required: [true, "Please provide your name"],
            trim: true,
            maxLength: [30, "Size cannot exceed more than 30 characters"],
        },
        email: {
            type: String,
            required: [true, "Please provide your email"],
            trim: true,
            maxLength: [25, "Size cannot exceed more than 25 chaacters"],
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please provide a valid email',
            ],
            lowercase: true,
            unique: true,
        },
        password: {
            type: String,
            // required: [true, "Please ensure to fill your Password"],
            minLength: [8, "Size cannot be less than 8 Characters"],
            // anyone should not be able to sleect this
            select: false,
        },
        role: {
            type: String,
            // enum means takes properties from ROLES
            enum: Object.values(ROLES),
            default: ROLES.USER,
        },
        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        avatar: {
            type: String,
        },
        googleId: {
            type: String,
            sparse: true,
            unique: true,
          },
          
          profilePicture: {
            type: String,
          },
          
        authProvider: {
            type: String,
            enum: ['local', 'google'],
            default: 'local',
          },
        location: {
            type: String
        },
        bio: {
            type: String,
            maxLength: [300, "Should be less than 300 characters"]
        },
        preference: {
            type: learningPreferenceSchema,
            default: () => ({})
        },
        careerPreferences: {
            type: careerPreferenceSchema,
            default: () => ({})
        },
        // ai usage is a object or thing which calls aiUsageSchema to tkae fields regarding it
        aiUsage: {
            type: aiUsageSchema,
            default: () => ({})
        },

        isActive:{
            type:Boolean,
            default:false
        },
        lastLogin: {
            type: Date,
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true
        },
        toObject: {
            virtuals: true
        }
    }
)

userSchema.index({ createdAt: -1 })
// instead of suppose user can create multiple resume so if we want user partcular resume which is in other collection we use virtuals
// virtuals takes collection name and searchacc tto user_id
// helps not to call db everytime by db.findbyid(id).populate("resume")

// resumes is name of virtual field
// virtual means link the user document with this.it is used when we need to populate
userSchema.virtual("resumes", {
    ref: "Resume",
    // use the _id of user
    localField: '_id',
    // in Resume collection look at user field and match local field
    foreignField: 'user'
})

// Frontend dashboard welcome banner expects `fullName`.
// Backend stores the name as `user.name`, so expose a virtual alias.
userSchema.virtual('fullName').get(function () {
    return this.name;
});

userSchema.virtual('preferences')
    .get(function () {
        return this.preference;
    })
    .set(function (value) {
        this.preference = value;
    });


// pre is a middleware before svaing to db and 'save is a hook'

    // if password is not modified means only other details are modifief like email , name.. so no need to calculate hash
    // if (!this.password.isModified()) {
    //     next()
    // }
    userSchema.pre('save', async function (next) {

        if (!this.isModified('password')) {
            return next()
        }
        
        // calculate hash only when password is modified
        
        const salt = await bcrypt.genSalt(10)
        this.password =  await bcrypt.hash(this.password, salt)
    
        next()
    })
    // 10 rounds of hashing  genSalt means generate random salt 10 times
    // here even if password has same password , hash will be different
    // const salt = await bcrypt().genSalt(10)
    // to hash we require salt
    // this.password = await bcrypt.hash(this.password, salt)


// .methods means add a custom methods to document
// in compare method we hash the new password and check their hash value
userSchema.methods.comparePassword = async function (eneteredPassword) {
    return await bcrypt.compare(eneteredPassword,this.password)
}

// now u need to create jwt access and refresh tokens
// But jwt.sign() is synchronous, so async makes the function return a Promise.
// jwt.sign() is synchronous by default
userSchema.methods.generateAccessToken =  function () {

    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            name: this.name,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken =  function () {

    return jwt.sign(

        {
            _id: this.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const userModel = mongoose.model('userModel', userSchema);

export default userModel;
export { userModel };
