const ACCESS_TOKEN_COOKIE = 'accessToken'
const REFRESH_TOKEN_COOKIE = 'refreshToken'

const isProduction = process.env.NODE_ENV === 'production'

const baseCookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
}

const accessTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 15 * 60 * 1000,
    // 15 min
}

const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    // 7 days
}

// res response object from express is send to browser
// It represents the HTTP response going back to the client (browser)
const setAuthCookies = (res, { accessToken, refreshToken }) => {

//     Internally this creates a header like:
// Set-Cookie: accessToken=abc123; Path=/; HttpOnly
    if (accessToken) {
        res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions)
    }

    if (refreshToken) {
        res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions)
    }
}

// it just send empty token and expired date
const clearAuthCookies = (res) => {
    res.clearCookie(ACCESS_TOKEN_COOKIE, accessTokenCookieOptions)
    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions)
}

// when broser sends cookies for every req it sends in req.headers
const getCookieValue = (req, cookieName) => {
    const rawCookieHeader = req.headers?.cookie

    // if u dont have cookie then return null or empty
    if (!rawCookieHeader) {
        return ''
    }
    // "accessToken=abc123; refreshToken=xyz456" in cookies it looks like this. we need to take access token
    const cookies = rawCookieHeader.split(';')

    for (const cookieEntry of cookies) {
        const [name, ...rest] = cookieEntry.trim().split('=')

            if (name === cookieName) {
                // cookies are encoded
                return decodeURIComponent(rest.join('='))
            }
    }

    return ''
}

export {
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE,
    clearAuthCookies,
    getCookieValue,
    setAuthCookies,
}
