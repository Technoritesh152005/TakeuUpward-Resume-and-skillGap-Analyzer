import asyncHandler from '../../utils/asyncHandler.js'
import ApiResponse from '../../utils/apiResponse.js'
import ApiError from '../../utils/apiError.js';
import { setAuthCookies } from '../../utils/authCookies.js';

// @desc    Initiate Google OAuth
// @route   GET /api/auth/google
// @access  Public
export const googleAuth = asyncHandler(async (req, res) => {
  // This is handled by passport middleware
  // Just a placeholder for documentation
});

// @desc    Google OAuth Callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleAuthCallback = asyncHandler(async (req, res) => {
  try {
    // User and tokens are attached by passport middleware
    // when we gt a req on passport paspport runs that strategy fxn and from that we get all these details
//     3. Passport takes this data

// Now Passport internally does something like:

// req.user = data;
// done() → Passport → req.user

const { user, accessToken, refreshToken } = req.user || {};

    // Get frontend URL from env (use CLIENT_URL for local Vite dev)
    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
    setAuthCookies(res, { accessToken, refreshToken })
    // Redirect to frontend with tokens
    res.redirect(`${frontendUrl}/auth/callback`);
  } catch (error) {
    const frontendUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
  }
});

// @desc    Google OAuth Failed
// @route   GET /api/auth/google/failure
// @access  Public
export const googleAuthFailure = asyncHandler(async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
});

export default {
  googleAuth,
  googleAuthCallback,
  googleAuthFailure,
};
