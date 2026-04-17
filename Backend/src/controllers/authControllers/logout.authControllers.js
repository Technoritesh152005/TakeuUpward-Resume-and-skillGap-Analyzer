import {asyncHandler} from "../../utils/asyncHandler.js"
import {ApiError} from "../../utils/apiError.js"
import logger from "../../utils/logs.js"
import {refreshTokenModel} from '../../models/refreshToken.js'
import { ApiResponse } from "../../utils/apiResponse.js"
import { clearAuthCookies, getCookieValue, REFRESH_TOKEN_COOKIE } from "../../utils/authCookies.js"

export const logout = asyncHandler(async (req, res, next) => {

    // to logout we see first user token
    // if user refresh token is same as in db so we will delete refrezh token
    const refreshToken = req.body?.refreshToken || getCookieValue(req, REFRESH_TOKEN_COOKIE);
    if (refreshToken) {

        const updation = await refreshTokenModel.findOneAndUpdate(
            { token: refreshToken, user: req.user._id, revokedAt: null },
            { revokedBy: req.ip, revokedAt: new Date() }
        )
        if (!updation) {
            throw new ApiError(400, 'Failed to update refreshToken Logout')
        }

    } else {
        throw new ApiError(400, 'Refresh Token not found to logout')
    }

    logger.info(`User logout Succesffult of ${req.user.email}`)
    clearAuthCookies(res)

    res.status(200)
        .json(new ApiResponse(200, null, 'User Logged Out Succesfully'))
})
