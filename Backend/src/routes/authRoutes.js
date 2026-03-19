// auth route will have
// 1.signup
// 2.login
// 3.logout
// 4.changePassword
// 5.refreshToken
// 
import express from 'express';
const router = express.Router();
import { logout } from '../controllers/authControllers/logout.authControllers.js'
import { signup } from '../controllers/authControllers/signup.authControllers.js'
import { login } from '../controllers/authControllers/login.authControllers.js'
import {changePassword, getCurrentUser} from '../controllers/authControllers/changePassword.js'
import { protectAccess } from '../middleware/authMiddleware.js'
import { refreshToken } from '../controllers/authControllers/refreshAccessToken.Controller.js'
import {validateSignUp,validateLogin, validatePasswordChange} from '../validation/auth.validation.js'


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
router.post('/logout',protectAccess,logout)

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
router.post('/change-password',protectAccess,validatePasswordChange,changePassword)

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user
 * @access  Private
 */
router.get('/me',protectAccess,getCurrentUser)



export default router