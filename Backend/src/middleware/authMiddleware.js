import { asyncHandler } from '../utils/asyncHandler.js';
import { userModel } from '../models/user.model.js';
import { ApiError } from '../utils/apiError.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logs.js';
import { ACCESS_TOKEN_COOKIE, getCookieValue } from '../utils/authCookies.js';

// async Handler will take a function
const protectAccess = asyncHandler(async (req, res, next) => {

    // we need to check if user is authenticated
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {

        // means token is present in request
        // split the token in array like ['bearer', 'vvfergevasrv']  pick the first index one
        token = req.headers.authorization.split(' ')[1]

    }
    // try to get token from both authorization and cookies
    if (!token) {
        token = getCookieValue(req, ACCESS_TOKEN_COOKIE)
    }
    if (!token) {
        throw new ApiError(401, 'Token is not present. Unauthenticated user')
    }

    // we should wrap them in try catch bcz they may sent errpr while verifying and we sent custom api error to user

    try {
        // it sends an object
        const verifiedToken =  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        if (!verifiedToken) {
            logger.error(`Invalid token send by user: ${req.ip}`)
            throw new ApiError(401, 'Invalid token sent by user')
        }

        const user = await userModel.findById(verifiedToken._id).select('-password')

        if (!user) {
            throw new ApiError(401, 'User not found. Invalid login')
        }

        if (!(user.isActive)) {
            throw new ApiError(401, 'User account has been deactivated')
        }

        req.user = user;

        next()
    } catch (err) {

        // this catch will catch error while verifying jwt
        if (err.name == 'JsonWebTokenError') {
            throw new ApiError(401, 'Invalid token')
        }
        if (err.name == 'TokenExpiredError') {
            throw new ApiError(401, 'Token expired')
        }
        throw err
    }
})

// Optional auth means let user have access to some roles like home page . dont block them just warn

const optionalAuth = asyncHandler(async (req, res, next) => {

    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        token = getCookieValue(req, ACCESS_TOKEN_COOKIE)
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            const user = await userModel.findById(decoded._id).select('-password');

            if (user && user.isActive) {
                req.user = user;
            }
        } catch (error) {
            // Don't throw error, just continue without user
            logger.warn('Optional auth failed, continuing without user');
        }
    }

    next();
})





export { protectAccess, optionalAuth }


// later add late limiting
