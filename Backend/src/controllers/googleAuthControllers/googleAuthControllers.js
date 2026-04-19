import asyncHandler from '../../utils/asyncHandler.js'
import { setAuthCookies } from '../../utils/authCookies.js'

const getFrontendUrl = () =>
  process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000'

export const googleAuthCallback = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = req.user || {}

  if (!accessToken || !refreshToken) {
    return res.redirect(`${getFrontendUrl()}/login?error=google_auth_failed`)
  }

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
