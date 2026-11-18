import authService from "../services/auth.service.js";


const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
};


class AuthController {
    login = async (req, res) => {
        const loginResult = await authService.login({
            ...req.body,
            userAgent: req.get('user-agent'),
            ipAddress: req.ip
        })
        res.cookie(
            "refreshToken",
            loginResult.refreshToken,
            refreshCookieOptions
        );
        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                accessToken: loginResult.accessToken,
                user: loginResult.user,
            },
        });



    }

    refreshToken = async (req, res) => {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: "Refresh token required",
            });
        }
        const result = await authService.refreshToken(refreshToken);
        res.cookie(
            "refreshToken",
            result.refreshToken,
            refreshCookieOptions
        );

        return res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            data: {
                accessToken: result.accessToken,
            },
        });
    }
}
export default new AuthController();