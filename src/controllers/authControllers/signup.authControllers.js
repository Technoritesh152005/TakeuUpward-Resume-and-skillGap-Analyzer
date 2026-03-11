import asyncHandler from "../../utils/asyncHandler"
import ApiError from "../../utils/apiError"
import userModel from "../../models/user.model"
import logger from "../../utils/logs"
import refreshTokenModel from "../../models/refreshToken"

export const signup = asyncHandler(async (req, res) => {

    const { email, password, phonenumber, location, name } = req.body

    if (!email) {
        throw new ApiError(400, "Email Not Provided. Please provide email to signup")
    }
    // first check whether that user already exist in db
    const isExistingUser = await userModel.find({ email }).select('-password')

    if (isExistingUser) {
        throw new ApiError(400, 'User already exist with this email. Please try different email')
    }

    const user = await userModel.create(
        {
            name: name,
            email: email,
            password: password,
            phone: phonenumber,
            location: location
        }
    )

    if (!user) {
        throw new ApiError(401, 'Faced difficulty to create New account for User')
    }
    // as user is created first we need to generate access and refresh token also. then only log the user

    const refreshToken = userModel.generateRefreshToken()
    const accessToken = userModel.generateAccessToken()

    if (!(refreshToken && accessToken)) {
        logger.error('Faced difficulty to create refreshToken or accessToken')
        throw new ApiError(400, 'Failed to create refresh or accessToken')
    }



    const rt = await refreshTokenModel.create(
        {
            token: refreshToken,
            user: user_id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdBy: req.ip
        }
    )
    if (!rt) {
        throw new ApiError(401, 'Failed to store Refresh Token in DB')
    }

    logger.info(`New User registered: ${user.email}`)

    res.status(201)
        .json(new ApiResponse(201,
            {
                user: user,
                accessToken,
                refreshToken
            }
            , 'New user registered Successfully'
        ))
})
