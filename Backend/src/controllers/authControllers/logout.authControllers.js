import {asyncHandler} from "../../utils/asyncHandler.js"
import logger from "../../utils/logs.js"
import {refreshTokenModel} from '../../models/refreshToken.js'
import { ApiResponse } from "../../utils/apiResponse.js"
import { clearAuthCookies, getCookieValue, REFRESH_TOKEN_COOKIE } from "../../utils/authCookies.js"

export const logout = asyncHandler(async (req, res) => {

    const refreshToken = req.body?.refreshToken || getCookieValue(req, REFRESH_TOKEN_COOKIE);

    if (refreshToken) {
        await refreshTokenModel.findOneAndUpdate(
            { token: refreshToken, revokedAt: null },
            { revokedByIp: req.ip, revokedAt: new Date() }
        )
    }

    clearAuthCookies(res)
    logger.info(`User logout completed for IP ${req.ip}`)

    res.status(200)
        .json(new ApiResponse(200, null, 'User Logged Out Succesfully'))
})
