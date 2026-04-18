import passport from 'passport';
import jwt from 'jsonwebtoken';
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

// whenver google send data use or run this function
// passport is just a google auth handler

// Basic env validation to avoid cryptic crashes
if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  logger.error('Google OAuth env missing', {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '***set***' : undefined,
  });
  throw new Error('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set in env');
}

passport.use(
  new GoogleStrategy( {
      clientID: process.env.GOOGLE_CLIENT_ID,
      // callback tells where google will send user after login
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL || 'http://localhost:7000/auth/google/callback',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // scope determines what we need from google-
      // profile means we need name , googleid , picture
      scope: ['profile', 'email'],
     },
   
    // callback fxn
    // done is a fxn to pass result
    // this all is send from google
    async(accessToken , refreshToken , profile , done)=>{

        try{
            
            const email = profile.emails[0].value
            const name = profile.displayName;
            const googleId = profile.id;
            const profilePicture = profile.photos[0]?.value

            let user = await userModel.findOne({email})

            if(user){
                // user exists; ensure Google linkage and activate account
                if(!user.googleId){
                    user.googleId = googleId;
                }
                user.profilePicture = profilePicture || user.profilePicture;
                user.isEmailVerified = true;
                user.authProvider = 'google';
                user.isActive = true;
                await user.save();
            }else{
                // user not found – create and activate Google user
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

            // now in any case we either found or created user-we must create tokens also now
            const jwtaccessToken = await user.generateAccessToken()
            const jwtrefreshToken = await user.generateRefreshToken()

            await refreshTokenModel.create(
                {
                    user:user._id,
                    token:jwtrefreshToken,
                    expiresAt:new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
                }
            )

            return done(null,{
                user:user,
                accessToken:jwtaccessToken,
                refreshToken:jwtrefreshToken,
            })
        }catch(err){
            return done (err,null)
        }
    }
));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

export default passport;
