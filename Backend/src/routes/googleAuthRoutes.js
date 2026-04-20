import express from 'express';
const router = express.Router();
import {
  googleAuthCallback,
  googleAuthFailure,
} from '../controllers/googleAuthControllers/googleAuthControllers.js'
import passport, { isGoogleAuthConfigured } from '../config/passport.js';

router.get(
    '/google',
    (req, res, next) => {
        if (!isGoogleAuthConfigured) {
            return googleAuthFailure(req, res, next)
        }
        return next()
    },
    // passport midlleware is called
    // it internally reads strategypassport.use(new GoogleStrategy(...)) and sees what u means the system needs
    // also send redirect response to google means browser gets redirect to google
    passport.authenticate('google',{
        scope:['profile','email'],
        session:false,
    })
)
// async (accessToken, refreshToken, profile, done)
// this fxn is not called yet it becomes after runs ONLY after login (callback step)

// 🔁 What happens next?
// 🟣 Step 4: User interacts with Google

// Select account

// Click Allow

// 🟠 Step 5: Google calls your backend
// GET /api/auth/google/callback

// 👉 Now next route runs
// 👉 This route is called by Google after the user selects an account and approves login.

router.get(
    '/google/callback',
    (req, res, next) => {
        if (!isGoogleAuthConfigured) {
            return googleAuthFailure(req, res, next)
        }
        passport.authenticate('google', { session: false }, (err, user) => {
            if (err || !user) {
                return googleAuthFailure(req, res, next)
            }

            req.user = user
            return next()
        })(req, res, next)
    },
    googleAuthCallback
)

router.get('/google/failure',googleAuthFailure)

export default router
