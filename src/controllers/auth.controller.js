import authService from "../services/auth.service.js";


const isProduction=process.env.NODE_ENV==="production"

const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 30 * 24 * 60 * 60 * 1000,
};


class AuthController {
    register=async(req,res)=>{
        const registeredUserData=await authService.register(req?.body);
        res.status(201).json({
            success:true,
            message:"Data created successfully",
            data:registeredUserData
        });
    }

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

    logout = async (req, res) => {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) {
            await authService.logout(refreshToken);
        }
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/v1/auth'
        });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }

    logoutAll = async (req, res) => {
        const userId = req?.auth?.userId;
        if (userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }
        await authService.logoutAll(userId);
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/api/v1/auth'
        });
        return res.status(200).json({
            success: true,
            message: "Logged out from all devices"
        });
    }
}
export default new AuthController();