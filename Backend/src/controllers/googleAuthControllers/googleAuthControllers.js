import asyncHandler from '../../utils/asyncHandler.js'
import { setAuthCookies } from '../../utils/authCookies.js'

const getFrontendUrl = () =>
  process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'

// the passport call the callback and this is the callback fxn
// after login the google redirect user here
export const googleAuthCallback = asyncHandler(async (req, res) => {
  // if u dont get access token or refresh token show weeor
  const { accessToken, refreshToken } = req.user || {}

  if (!accessToken || !refreshToken) {
    return res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`)
  }

  // here the cookies is set which was generared
  // this redirects user to frontend callback where it does load the user 
  setAuthCookies(res, { accessToken, refreshToken })
  return res.redirect(`${getFrontendUrl()}/auth/callback`)
})

export const googleAuthFailure = asyncHandler(async (req, res) => {
  return res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`)
})

export default {
  googleAuthCallback,
  googleAuthFailure,
}
