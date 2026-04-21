import {asyncHandler} from "../../utils/asyncHandler.js"
import {ApiError} from "../../utils/apiError.js"
import {userModel} from "../../models/user.model.js"
import logger from "../../utils/logs.js"
import {refreshTokenModel} from "../../models/refreshToken.js"
import {ApiResponse} from '../../utils/apiResponse.js'
import { setAuthCookies } from "../../utils/authCookies.js"

export const signup = asyncHandler(async (req, res) => {

    const { email, password,  location, name } = req.body
    const normalizedEmail = String(email || '').trim().toLowerCase()

    if (!normalizedEmail) {
        throw new ApiError(400, "Email Not Provided. Please provide email to signup")
    }
    // first check whether that user already exist in db
    const isExistingUser = await userModel.findOne({ email: normalizedEmail })

    if (isExistingUser) {
        throw new ApiError(400, 'User already exist with this email. Please try different email')
    }

    const user = await userModel.create(
        {
            name: name,
            email: normalizedEmail,
            password: password,
            location: location,
            isActive:true,
        }
    )

    if (!user) {
        throw new ApiError(500, 'Faced difficulty to create New account for User')
    }
    // as user is created first we need to generate access and refresh token also. then only log the user

    const refreshToken = user.generateRefreshToken()
    const accessToken = user.generateAccessToken()

    if (!(refreshToken && accessToken)) {
        logger.error('Faced difficulty to create refreshToken or accessToken')
        throw new ApiError(400, 'Failed to create refresh or accessToken')
    }



    const rt = await refreshTokenModel.create(
        {
            token: refreshToken,
            user: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdByIp: req.ip
        }
    )
    if (!rt) {
        throw new ApiError(500, 'Failed to store Refresh Token in DB')
    }

    logger.info(`New User registered: ${user.email}`)
    setAuthCookies(res, { accessToken, refreshToken })

    res.status(201)
        .json(new ApiResponse(201,
            {
                user: user,
            }
            , 'New user registered Successfully'
        ))
})
