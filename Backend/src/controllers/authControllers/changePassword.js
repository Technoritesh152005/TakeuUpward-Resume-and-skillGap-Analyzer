import { refreshTokenModel } from '../../models/refreshToken.js';
import { userModel } from '../../models/user.model.js';
import tokenModel from '../../models/tokenSchema.js'
import crypto from 'crypto'

import { ApiError } from '../../utils/apiError.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import logger from '../../utils/logs.js';
import { sendPasswordResetEmail } from '../../utils/sendEmail.js';
import { clearAuthCookies } from '../../utils/authCookies.js';



export const getCurrentUser = asyncHandler(async (req, res, next) => {

    // get current user will only be available when u pass through protect middleware . means u need to be authenticated to get ur current user
    const user = await userModel.findById(req.user._id).select('-password')

    if (!user) {
        throw new ApiError(400, "Failed to fetch current User")
    }

    res.status(200).json(new ApiResponse(200, user, 'User fetched successfully'))
})

export const changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, 'Old password and new password are required')
    }

    const user = await userModel.findById(req.user._id).select('+password')

    if (!user) {
        throw new ApiError(404, 'User not found')
    }

    if (!user.password) {
        throw new ApiError(400, 'Password change is not available for this account')
    }

    const isPasswordCorrect = await user.comparePassword(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, 'Current password is incorrect')
    }

    user.password = newPassword
    await user.save()

    await refreshTokenModel.updateMany(
        { user: user._id, revokedAt: null },
        {
            revokedAt: new Date(),
            revokedByIp: req.ip,
        }
    )

    logger.info(`Password changed successfully for user: ${user.email}`)
    clearAuthCookies(res)

    res.status(200).json(
        new ApiResponse(200, null, 'Password changed successfully. Please login again')
    )
})

export const forgotPassword = asyncHandler(async (req, res) => {

    // forgot password is the first step of verifying before sending reset link
    const { email } = req.body

    if (!email) {
        throw new ApiError(400, 'Email is required')
    }

    // check is user exist with this email
    const user = await userModel.findOne({ email: String(email).trim().toLowerCase() })

    // we r tricking user with that if email exist a pass reset link must have been sent
    if (!user) {
        return res.status(200).json(
            new ApiResponse(200, null, 'If an account exists, a password reset link has been sent')
        )
    }

    await tokenModel.deleteMany({ user: user._id, used: false })

    // generating token
    const rawToken = crypto.randomBytes(32).toString('hex')
    // hashing the token to store in db
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

    const resetToken = await tokenModel.create({
        user: user._id,
        tokenHash,
        // expires the hash or tokenhashed in 15 min
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    })

    const frontendUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000'
    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`

    try {
        await sendPasswordResetEmail({
            email: user.email,
            resetUrl,
            name: user.fullName || user.name,
        })
    } catch (error) {
        // if token done and saved in db but suppose error occured so we delete it from db
        await tokenModel.deleteOne({ _id: resetToken._id })
        logger.error(`Failed to send password reset email for user: ${user.email}`)
        throw error
    }

    logger.info(`Password reset email sent for user: ${user.email}`)

    res.status(200).json(
        new ApiResponse(200, null, 'If an account exists, a password reset link has been sent')
    )
})

// reset process is the process of verification of token send by user and detting the new password
export const resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
        throw new ApiError(400, 'Token and new password are required')
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex')

    const resetToken = await tokenModel.findOne({
        tokenHash,
        used: false,
        expiresAt: { $gt: new Date() },
    })

    if (!resetToken) {
        throw new ApiError(400, 'Reset token is invalid or expired')
    }

    const user = await userModel.findById(resetToken.user).select('+password')

    if (!user) {
        throw new ApiError(404, 'User not found for this reset token')
    }

    user.password = newPassword
    await user.save()

    const updatedUser = await userModel.findById(user._id).select('+password')
    const isPasswordUpdated = await updatedUser.comparePassword(newPassword)

    if (!isPasswordUpdated) {
        throw new ApiError(500, 'Failed to update password correctly. Please try again')
    }

    resetToken.used = true
    await resetToken.save()

    await refreshTokenModel.updateMany(
        { user: user._id, revokedAt: null },
        {
            revokedAt: new Date(),
            revokedByIp: req.ip,
        }
    )

    logger.info(`Password reset successfully for user: ${user.email}`)
    clearAuthCookies(res)

    res.status(200).json(
        new ApiResponse(200, null, 'Password has been reset successfully. Please login again')
    )
})
