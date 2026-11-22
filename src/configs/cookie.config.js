const isProduction=process.env.NODE_ENV==="production"
const REFRESH_COOKIE_NAME = "refreshToken";

const getCookieOptions = (path, maxAge) => ({
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path,
    maxAge,
});

export const setRefreshTokenCookie = (
    res,
    refreshToken,
    { path = "/api/v1/auth", maxAge = 30 * 24 * 60 * 60 * 1000 } = {}
) => {
    res.cookie(
        REFRESH_COOKIE_NAME,
        refreshToken,
        getCookieOptions(path, maxAge)
    );
};

export const clearRefreshTokenCookie = (
    res,
    { path = "/api/v1/auth" } = {}
) => {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
        path,
    });
};


