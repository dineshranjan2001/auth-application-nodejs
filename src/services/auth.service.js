import bcrypt from "bcrypt";
import AppError from "../utils/app-error.utils.js";
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from "../utils/token.utils.js";
import authRepository from "../repositories/auth.repository.js";


class AuthService {
    login = async (loginRequestData) => {
        const getUserDetails = await authRepository.fetchUserByEmail(loginRequestData?.email);
        if (!getUserDetails || !getUserDetails.isActive) {
            throw new AppError("Invalid user or user is not found", 400);
        }

        if (!await bcrypt.compare(loginRequestData?.password, getUserDetails?.password)) {
            throw new AppError("Invalid email or password", 400);
        }

        const generateNewRefreshToken = generateRefreshToken();
        const hashedRefreshToken = hashRefreshToken(generateNewRefreshToken);
        const expiresAt = new Date(
            Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000
        );

        const newSession = await authRepository.createSession({
            userId: getUserDetails?.id,
            userAgent: loginRequestData?.userAgent,
            ipAddress: loginRequestData?.ipAddress,
            deviceInfo: loginRequestData?.userAgent,
            expiresAt,
        }, hashedRefreshToken);

        const generateNewAccessToken = generateAccessToken(getUserDetails.id, newSession.id);
        return {
            accessToken: generateNewAccessToken,
            refreshToken: generateNewRefreshToken,
            user: {
                id: getUserDetails?.id,
                name: getUserDetails?.name,
                email: getUserDetails?.email,
            }
        }

    }

    refreshToken=async(refreshToken)=>{
        const oldRefreshTokenHashed=hashRefreshToken(refreshToken);
        const getRefreshTokenData=await authRepository.fetchRefreshTokenByToken(oldRefreshTokenHashed);
        if(!getRefreshTokenData){
            throw new AppError("Invalid refresh token",400);
        }

        const newRefreshToken=generateRefreshToken();
        const hashedNewRefreshToken=hashRefreshToken(newRefreshToken);
        const operationResult=await authRepository.checkRefreshTokenAndOperationSession(oldRefreshTokenHashed,hashedNewRefreshToken,getRefreshTokenData.sessionId);
        if(operationResult.status==="REUSED"){
            throw new AppError("Refresh token reuse detected. Session revoked.",400);
        }
        if(operationResult.status!=="SUCCESS"){
            throw new AppError("Invalid or expired refresh token",400);
        }
        const accessToken = generateAccessToken(operationResult.userId,operationResult.sessionId);
        return{
            accessToken,
            refreshToken:newRefreshToken
        };
    }

    logout=async(refreshToken)=>{
        if(!refreshToken){
            return;
        }

        const hashedRefreshToken=hashRefreshToken(refreshToken);
        const getRefreshTokenAndSessionData=await authRepository.fetchRefreshTokenByToken(hashedRefreshToken);
        if(!getRefreshTokenAndSessionData){
            return;
        }
        await authRepository.updateSessionAndRefreshTokenBySessionId(getRefreshTokenAndSessionData.sessionId);
    }

    logoutAll=async(userId)=>{
        await authRepository.fetchAllSessionAndUpdateSessionAndRefreshTokenByUserId(userId);
    }
}

export default new AuthService();