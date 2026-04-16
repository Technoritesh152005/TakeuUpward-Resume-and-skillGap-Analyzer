import mongoose from 'mongoose'

// this is the progress track of the user
const progressSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'userModel',
            required: true,
            index: true,
        },
        roadmap: {
            type: mongoose.Types.ObjectId,
            ref: 'roadmapModel',
            required: true,
            index: true,
        },
        // in progress a progreess of user is basically from what skills he acquired

        skillsAcquired: [
            {
                skill: String,
                acquiredAt: Date,
                proficiencyLevel: {
                    type: String,
                    enum: ['beginner', 'intermediate', 'advanced'],
                    default: 'beginner',
                    required: true,
                },
                verificationMethod: String,
            }
        ],

        // this shows track of what resource he completed or learned
        completedResources: [
            {
                resource: {
                    type: mongoose.Types.ObjectId,
                    ref: 'resourceModel',
                    required: true
                },
                completedAt: Date,
                timeSpent: Number,
                rating: {
                    type: Number,
                    min: 0,
                    max: 5,
                    default: 1,
                },
                notes: String,

            }
        ],
        completedProjects: [
            {
                title: String,
                liveUrl: String,
                skills: [String],
                description: String,
                githubUrl: String,
                completedAt: Date,
            }
        ],
        certificationsEarned: [
            {
                name: String,
                provider: String,
                earnedAt: Date,
                credentialUrl: String
            }
        ],

        // Time Tracking
        totalTimeSpent: {
            type: Number,
            default: 0,
        },
        weeklyTimeLog: [
            {
                week: Date,
                hoursSpent: Number,
                activitiesCompleted: [String],
                numberOfActivitiesCompleted: Number,
            }
        ],

        // Achievments
        achievments: [
            {
                title: String,
                description: String,
                unLockedAt: Date,
                icon: String,
            }
        ],

        // Current Status 
        currentPhase: Number,
        currentWeek: Number,
        lastActivityDate: Date,
        currentStreak: {
            type: Number,
            default: 0
        },
        longestStreak: {
            type: Number,
            default: 0
        }
    }, {
    timestamps: true,
}
)

progressSchema.methods.updateStreak = function () {
    // set today date to midnight 
    const today = new Date().setHours(0, 0, 0, 0)
    // if user has last activity date convert it to midnight
    const lastActivityDate = this.lastActivityDate ? new Date(this.lastActivityDate).setHours(0, 0, 0, 0) : null

    // if u dont have lastactivity date means ur new and ur current streak will be 1
    if (!lastActivityDate) {
        this.currentStreak = 1
    } else {
        const daydiff = (today - lastActivityDate) / (1000 * 60 * 60 * 24)
        if (daydiff === 1) {
            this.currentStreak = this.currentStreak + 1
        } 
        // now here if user was active today and last active was two days ago means day diff >=1 so streak = 1
        else if (daydiff > 1) {
            this.currentStreak = 1
        }
    }

    if(this.currentStreak > this.longestStreak){
        this.longestStreak = this.currentStreak
    }


    this.lastActivityDate = new Date()
    return this.save()
}

const progressModel = mongoose.model('progressModel', progressSchema);

export default progressModel;
export { progressModel };

/*
we do convert it to midnight cause suppose one user does 1 activity at 18 feb 1230am and last activity is 17 feb 1130 am so this will not consider as a streak cause diff is nearly 2,3 hrs
so we make them to a balanced point which is midnight
if we dont have last activity day means user is new and his streak will start from here so streak =1
no we need to also check r they continue maintaining streak
if day diff = 1 means they maintained streak so add on and if > 1 means set streak to 1
*/
