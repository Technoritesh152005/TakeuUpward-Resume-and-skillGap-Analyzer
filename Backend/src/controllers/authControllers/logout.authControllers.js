import {asyncHandler} from "../../utils/asyncHandler.js"
import {ApiError} from "../../utils/apiError.js"

import logger from "../../utils/logs.js"
import {refreshTokenModel} from '../../models/refreshToken.js'

export const logout = asyncHandler(async (req, res, next) => {

    // to logout we see first user token
    // if user refresh token is same as in db so we will delete refrezh token
    const refreshToken = req.body;
    if (refreshToken) {

        const updation = await refreshTokenModel.findByIdAndUpdate(
            { refreshToken, user: req.user._id },
            { revokedBy: req.ip, revokedAt: new Date() }
        )
        if (!updation) {
            throw new ApiError(400, 'Failed to update refreshToken Logout')
        }

    } else {
        throw new ApiError(400, 'Refresh Token not found to logout')
    }

    logger.info(`User logout Succesffult of ${req.user.email}`)

    res.status(200)
        .json(new ApiResponse(201, "User Logged Out Succesfully",))
})