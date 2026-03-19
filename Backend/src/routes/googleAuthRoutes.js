import express from 'express';
const router = express.Router();
import {
    googleAuth,
  googleAuthCallback,
  googleAuthFailure,
} from '../controllers/googleAuthControllers/googleAuthControllers.js'
import passport from '../config/passport.js';

router.get(
    '/google',
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
    // middleware runs takes data from google and runs our strategy fxn
    // we call fone() passports sets req.user and in googleauthcallback we get the data 
    passport.authenticate('google',{
        failureRedirect: '/api/auth/google/failure',
    session: false,
    }),
    googleAuthCallback
)

router.get('/google/failure',googleAuthFailure)

export default router