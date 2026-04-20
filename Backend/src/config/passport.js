import passport from 'passport';
import userModel from '../models/user.model.js';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import refreshTokenModel from '../models/refreshToken.js';
import logger from '../utils/logs.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure Backend/.env is loaded even if server bootstrap changes
dotenv.config({ path: path.join(__dirname, '../../.env') });

const API_VERSION = process.env.API_VERSION || 'v1';
const PORT = process.env.PORT || '7000';
const BACKEND_PUBLIC_URL = (process.env.BACKEND_URL || `http://localhost:${PORT}`).replace(/\/+$/, '');

// google callback url  is a endpoint where after user complete login process it redirect to this endpoint
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || `${BACKEND_PUBLIC_URL}/api/${API_VERSION}/auth/google/callback`;

const isGoogleAuthConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// before trying check whether we have google id
if (!isGoogleAuthConfigured) {
  logger.warn('Google OAuth env missing. Google sign-in routes will remain unavailable until configured.');
} else {
  // This connects your app with Google OAuth
  // passport.use(new GoogleStrategy({...}, async (...) => { ... }))
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email'],
      },
      // this runs after google ligic is success.data coming from google
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = String(profile.emails?.[0]?.value || '').trim().toLowerCase();
          const name = profile.displayName;
          const googleId = profile.id;
          const profilePicture = profile.photos?.[0]?.value;

          if (!email) {
            throw new Error('Google profile did not include a valid email');
          }
          // find the user in model
          let user = await userModel.findOne({ email });

          if (user) {
            if (!user.googleId) {
              user.googleId = googleId;
            }

            user.profilePicture = profilePicture || user.profilePicture;
            user.isEmailVerified = true;
            user.authProvider = 'google';
            user.isActive = true;
            await user.save();
            // if user not found create the user 
          } else {
            user = await userModel.create({
              name,
              email,
              googleId,
              profilePicture,
              isEmailVerified: true,
              authProvider: 'google',
              isActive: true,
            });
          }

          // after getting user we generate access and refresh token
          const jwtaccessToken = user.generateAccessToken();
          const jwtrefreshToken = user.generateRefreshToken();

          // we make a entry in model schema
          await refreshTokenModel.create({
            user: user._id,
            token: jwtrefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          });

          // done is a callback function which states authentication is finished
          // done(error, user, info)
          return done(null, {
            user,
            accessToken: jwtaccessToken,
            refreshToken: jwtrefreshToken,
          });
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}
// You are storing full user object in session
passport.serializeUser((user, done) => {
  done(null, user);
});

// You are just returning it back
// user attach to req.user
passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
export { isGoogleAuthConfigured };
