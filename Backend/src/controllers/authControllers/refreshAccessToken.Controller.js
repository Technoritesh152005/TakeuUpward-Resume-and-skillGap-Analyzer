import {asyncHandler} from "../../utils/asyncHandler.js"
import {ApiError} from "../../utils/apiError.js"
import logger from "../../utils/logs.js"
import {refreshTokenModel} from "../../models/refreshToken.js"
import { ApiResponse } from "../../utils/apiResponse.js"

export const refreshToken = asyncHandler(async(req,res,next)=>{

    const {refreshToken} = req.body;

    if(!refreshToken){
        throw new ApiError(401,'No Refresh Token Found')
    }
    // to generate access token first we need to check whether that refresh token is of user
    const token = await refreshTokenModel.findOne({token:refreshToken}).populate('user')
    
    if(!token){
        throw new ApiError(401,"This is not refresh Token Of this user")
    }
    if(!token.isActive){
        throw new ApiError(401,'Refresh Token is not active')
    }
    if(token.isExpired){
        throw new ApiError(401,'Token got expired')
    }

    const user = token.user;
    // now generate token both access and refresh token for security
    const newaccessToken = user.generateAccessToken()
    const newrefreshToken = user.generateRefreshToken()

    if(!(newaccessToken && newrefreshToken)){
        throw new ApiError(500,'Failed difficulty to generate refresh or access token for user')
    }
    // in that same doc update
    // first for security reason we will let keep history which from whom was cancelled and when
   const updateOldToken =  await refreshTokenModel.findByIdAndUpdate(token._id,{
        replacedByToken:newrefreshToken,
        revokedAt:new Date(),
        revokedBy:req.ip
    })

    if(!updateOldToken){
        throw new ApiError(401, `Old token could not be revoked before refresh for IP: ${req.ip}`)
    }

    const finalrefreshToken = await refreshTokenModel.create({
        token:newrefreshToken,
        user:user._id,
        createdByIp:req.ip,
        expiresAt:new Date(Date.now() + 7 * 60 * 60 * 24 * 1000),
    })

    if(!finalrefreshToken){
        
        throw new ApiError(401,'New refresh Token has not been created')
    }
    logger.info(`New refresh Token has been created for this email: ${user.email}`)

    res.status(200)
    .json(new ApiResponse(200, {
        refreshToken: newrefreshToken,
        accessToken: newaccessToken
    }, 'New refresh token has been generated successfully'))
})
