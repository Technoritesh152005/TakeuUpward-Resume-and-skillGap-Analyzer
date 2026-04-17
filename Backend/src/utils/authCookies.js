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
}

const refreshTokenCookieOptions = {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
}

const setAuthCookies = (res, { accessToken, refreshToken }) => {
    if (accessToken) {
        res.cookie(ACCESS_TOKEN_COOKIE, accessToken, accessTokenCookieOptions)
    }

    if (refreshToken) {
        res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, refreshTokenCookieOptions)
    }
}

const clearAuthCookies = (res) => {
    res.clearCookie(ACCESS_TOKEN_COOKIE, accessTokenCookieOptions)
    res.clearCookie(REFRESH_TOKEN_COOKIE, refreshTokenCookieOptions)
}

const getCookieValue = (req, cookieName) => {
    const rawCookieHeader = req.headers?.cookie

    if (!rawCookieHeader) {
        return ''
    }

    const cookies = rawCookieHeader.split(';')

    for (const cookieEntry of cookies) {
        const [name, ...rest] = cookieEntry.trim().split('=')

        if (name === cookieName) {
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
