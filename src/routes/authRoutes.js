// auth route will have
// 1.signup
// 2.login
// 3.logout
// 4.changePassword
// 5.refreshToken
// 
import express from 'express';
const router = express.Router();
import logout from '../controllers/authControllers/logout.authControllers'
import signup from '../controllers/authControllers/signup.authControllers'
import login from '../controllers/authControllers/login.authControllers'
import {changePassword, getCurrentUser} from '../controllers/authControllers/changePassword'
import protectAcess from '../middleware/authMiddleware'
import refreshToken from '../controllers/authControllers/refreshAccessToken.Controller'
import {validateSignUp,validateLogin, validatePasswordChange} from '../validation/auth.validation'

/**
 * @route   POST /api/v1/auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post('/signup',validateSignUp,signup)

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login',validateLogin, login)

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (revoke refresh token)
 * @access  Private means protectmust be there
 */
router.post('/logout',protectAcess,logout)

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
// why not protect question comes here in refresh Token
router.post('/refresh-token',refreshToken)

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post('/change-password',protect,validatePasswordChange,changePassword)

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get('/me',protect,getCurrentUser)

module.exports = router