import {asyncHandler} from "../../utils/asyncHandler.js"
import {ApiError} from "../../utils/apiError.js"
import {userModel} from "../../models/user.model.js"
import logger from "../../utils/logs.js"
import {refreshTokenModel} from "../../models/refreshToken.js"
import {ApiResponse} from '../../utils/apiResponse.js'

export const login = asyncHandler(async(req,res,next)=>{

    // first check whether user exist
    // if not exist then hash and compare the password
    // if same generate refresh and access token , store the refresh token in db and return

    const {email,password} = req.body;
    // findone req an object
    const user = await userModel.findOne({email}).select('+password')
    console.log(user)

    if(!user){
        throw new ApiError(40,'No Account found . Please Login')
    }
    if(!user.isActive){
        throw new ApiError(401,'Your account has been deactivated.Please contact "khilariritesh61@gmail.com" ')
    }
    const correctPassword = await user.comparePassword(password)

    if(!correctPassword){
        throw new ApiError(400,'Password is not same.Retry or forgot password')
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken()

    if(!(accessToken && refreshToken)){
        throw new ApiError(500,'Access Token or refresh Token not generated')
    }

    const rtsaved = await refreshTokenModel.create({
        token:refreshToken,
        createdBy:req.ip,
        user:user._id,
        expiresAt:new Date(Date.now()+7 * 24 * 60 * 60 * 1000)

    })
    if(!rtsaved){
        throw new ApiError(401,'Faced difficulty to store Tokens in database')
    }

    // after sometime see diff bwn new Date and Date.now()
    userModel.lastLogin = new Date()
    await user.save({validateBeforeSave:false})

    const userresponse = user.toObject()
    delete userresponse.password
    console.log(userresponse)
    logger.info(`User has been succesfully login of email ${user.email}`)

    res.status(200)
    .json(new ApiResponse(201, 
        'User has been successfully Login',
        {userresponse,refreshToken,accessToken}
    ))

    // never use next in controller and they r end of chainflow
})