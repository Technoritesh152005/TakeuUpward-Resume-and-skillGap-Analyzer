import { refreshTokenModel } from '../../models/refreshToken.js';
import { userModel } from '../../models/user.model.js';



import { ApiError } from '../../utils/apiError.js';

import { asyncHandler } from '../../utils/asyncHandler.js';
import logger from '../../utils/logs.js';

export const changePassword = asyncHandler(async (req, res, next) => {

    // to change password we must verify the user and their old password
    // also password in db is stored in hash. so we must compare their hash value

    const { oldPassword, newPassword } = req.body

    const user = await userModel.find(req.user._id).select('+password')

    if (!user) {
        throw new ApiError(401, 'No user found')
    }
    const isOldPasswordTrue = await user.comparePassword(oldPassword)

    // now here we have validated the old password user provided is correct
    // also the avove line proves that user is also genuine otherwise if user was different its id would be different
    if (!isOldPasswordTrue) {
        throw new ApiError(400, 'Your old password is not correct Password')
    }
    user.password = newPassword
    await user.save()
    // also when password is changed you must revoked ur old refreshToken and create new refreshToken

    // means after change password all refresh token which r active gets revoked>?then user need to re login?

    const updated = await refreshTokenModel.updateMany(
        // revoked all token which are active and make them cancelled. and after that make re - login for security purpose
        { user: user._id, revokedAt: null },
        {
            revokedAt: new Date(),
            revokedByIp: req.ip
        }
    )

    if (!updated) {
        throw new ApiError(401, 'Refresh Token failed to be revoked during changing password')
    }

    res.status(200)
        .json(201, 'Old password has been changed to new Password succesfully!.. Please login again')


})

export const getCurrentUser = asyncHandler(async (req, res, next) => {

    // get current user will only be available when u pass through protect middleware . means u need to be authenticated to get ur current user
    const user = await userModel.getById({ id: req.user._id }).select('-password')

    if (!user) {
        throw new ApiError(400, "Failed to fetch current User")
    }
    res.status(200)
        .json(201, 'User Fetched Succesffully ........', user)
})