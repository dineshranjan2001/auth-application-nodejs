import { clearRefreshTokenCookie, setRefreshTokenCookie } from "../configs/cookie.config.js";
import authService from "../services/auth.service.js";

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

        setRefreshTokenCookie(res,loginResult.refreshToken,{
            path:'/api/v1/auth',
        });

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
        const result = await authService.refreshToken(refreshToken);
        setRefreshTokenCookie(res,result.refreshToken,{
            path:'/api/v1/auth'
        });

    
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
         clearRefreshTokenCookie(res,{
            path:"/api/v1/auth"
        });
        return res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    }

    logoutAll = async (req, res) => {
        const userId = req?.auth?.userId;
        await authService.logoutAll(userId);

        clearRefreshTokenCookie(res,{
            path:"/api/v1/auth"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out from all devices"
        });
    }

    profile=async(req,res)=>{
        const userId=req?.auth.userId;
        const getUserProfileInfo=await authService.profile(userId);
        return res.status(200).json({
            success:true,
            message:"Profile fetched successfully",
            data:getUserProfileInfo
        });
    }
}
export default new AuthController();