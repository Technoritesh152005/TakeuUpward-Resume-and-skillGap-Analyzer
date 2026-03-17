import googleClient from '../../config/googleClient.js'
import ApiResponse from '../../utils/apiResponse.js'
import ApiError from '../../utils/apiError.js'
import logger from '../../utils/logs.js'
import asyncHandler from '../../utils/asyncHandler.js'
import userModel from '../../models/user.model.js'
import refreshTokenModel from '../../models/refreshToken.js'

export const googleSignIn = asyncHandler(async (req, res) => {
    // when user clicks login it gives back a token
    const { token } = req.body
    if (!token) {
        throw new ApiError(401, 'Token of google not provided')
    }

    // verify the token
    try {

        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        })
        //   google sends the user data in payload if token valid
        const payload = ticket.getPayload()
        console.log(payload)
        const { email, name, picture, sub: googleId } = payload

        // search user from db first whether this user exist
        let user = await userModel.findOne({ email: email })

        // if user not found then create this user cause google verified ot

        if (!user) {
            user = await userModel.create({
                email: email,
                avatar: avatar,
                name: name,
                googleId,
                isEmailVerified: true,
                role: 'user',
                password: Math.random().toString(36).slice(-10),
            })

            logger.info(200, 'User created sucesfully via google')

        } else if (!user.googleId) {
            // we have found user but user dont have a google id
            user.googleId = googleId
            user.avatar = picture || user.avatar
            await user.save()

        }
        // now once u find user and that user also have googleID
        // create refresh and accessToken
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateAccessToken()

        await refreshTokenModel.create({
            token: refreshToken,
            user: user._id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            createdBy: req.ip
        })

        res.status(200)
            .json(new ApiResponse(201, {
                user: user,
                accessToken,
                refreshToken
            },
                'Google sign-in success'
            ))
    } catch (err) {
        logger.error(400,'Error occured in google sign in error.. error is : '+`${err.message}`)
        throw new ApiError(401, 'Invalid or expired Google token')
    }
})