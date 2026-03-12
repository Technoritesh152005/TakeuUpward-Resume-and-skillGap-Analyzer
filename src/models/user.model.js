import mongoose from 'mongoose'

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
            required: [true, "Please ensure to fill your Password"],
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
            type: String,
            default: false,
        },
        avatar: {
            type: String,
        },
        phone: {
            type: Number,
            maxLength: [12, "Phone number must be 12 or less than 12 number"]
        },
        location: {
            type: String
        },
        bio: {
            type: String,
            maxLength: [300, "Should be less than 300 characters"]
        },
        preference: {
            hoursPerWeek: {
                type: Number,
                default: 8,
                min: 1,
                max: 10
            }
            ,
            budget: {
                type: String,
                enum: ["free", "low", "medium", "high"],
                default: "free",
            },
            learningStyle: {
                type: String,
                enum: ["mixed", "auditory", "visual", "reading", "kinesthetic"]
            },
            notification: {
            email: {
                type: Boolean,
                default: true,
            },
            roadMapUpdates: {
                type: Boolean,
                default: true,
            },
            weeklyProgess: {
                type: Boolean,
                default: true
            }
        },
        },

        
        lastLogin: {
            type: Date,
        }
    },
    {
        timestamps: true,
        toJson: {
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
userSchema.virtual("resumes", {
    ref: "Resume",
    // use the _id of user
    localField: '_id',
    // in Resume collection look at user field and match local field
    foreignField: 'user'
})

userSchema.virtual('virtuals', {
    ref: 'Virtuals',

})

// pre is a middleware before svaing to db and 'save is a hook'
userSchema.pre('save', async () => {
    // if password is not modified means only other details are modifief like email , name.. so no need to calculate hash
    if (!this.password.isModified()) {
        next()
    }
    // 10 rounds of hashing  genSalt means generate random salt 10 times
    // here even if password has same password , hash will be different
    const salt = await bcrypt().genSalt(10)
    // to hash we require salt
    this.password = await bcrypt.hash(this.password, salt)
})

// .methods means add a custom methods to document
userSchema.methods.comparePassword = async function (eneteredPassword) {
    return await bcrypt.compare(this.password, eneteredPassword)
}

// now u need to create jwt access and refresh tokens
userSchema.methods.generateAccessToken = async function () {

    return jwt.sign(
        {
            _id: this.id,
            email: this.email,
            name: this.name,
            role: this.role
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function () {

    return jwt.sign(

        {
            _id: this.id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: REFRESH_TOKEN_EXPIRY
        }
    )
}

export const userModel = mongoose.model('userModel', userSchema)