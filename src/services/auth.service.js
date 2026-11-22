import bcrypt from "bcrypt";
import AppError from "../utils/app-error.utils.js";
import { generateAccessToken, generateRefreshToken, hashRefreshToken } from "../utils/token.utils.js";
import authRepository from "../repositories/auth.repository.js";
import { ErrorCode } from "../enums/errorcode.enum.js";

const REFRESH_DAYS = process.env.REFRESH_DAYS;

class AuthService {
    register=async(userData)=>{
        const {password,...otherUserData}=userData;
        const hashedPassword=await bcrypt.hash(password,12);
        const registeredUserData=await authRepository.register({...otherUserData,password:hashedPassword});
        return registeredUserData;
    }

    login = async (loginRequestData) => {
        const getUserDetails = await authRepository.fetchUserByEmail(loginRequestData?.email);
        if (!getUserDetails || !getUserDetails.isActive) {
            throw new AppError("Invalid user or user is not found", 401,ErrorCode.UNAUTHORIZED);
        }

        if (!await bcrypt.compare(loginRequestData?.password, getUserDetails?.password)) {
            throw new AppError("Invalid email or password", 401,ErrorCode.UNAUTHORIZED);
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
            lastUsedAt:new Date(),
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
        if(!refreshToken){
            throw new AppError("Refresh token required",400,ErrorCode.REFRESH_TOKEN_REQUIRED);
        }
        const oldRefreshTokenHashed=hashRefreshToken(refreshToken);
        const getRefreshTokenData=await authRepository.fetchRefreshTokenByToken(oldRefreshTokenHashed);
        if(!getRefreshTokenData){
            throw new AppError("Invalid refresh token",400,ErrorCode.REFRESH_TOKEN_INVALID);
        }

        const newRefreshToken=generateRefreshToken();
        const hashedNewRefreshToken=hashRefreshToken(newRefreshToken);
        const operationResult=await authRepository.checkRefreshTokenAndOperationSession(oldRefreshTokenHashed,hashedNewRefreshToken,getRefreshTokenData.sessionId);
        if(operationResult.status==="REUSED"){
            throw new AppError("Refresh token reuse detected. Session revoked.",400,ErrorCode.REFRESH_TOKEN_REUSED);
        }
        if(operationResult.status!=="SUCCESS"){
            throw new AppError("Invalid or expired refresh token",400,ErrorCode.REFRESH_TOKEN_EXPIRED);
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
        if(!userId){
            throw new AppError("Unauthorized",401,ErrorCode.UNAUTHORIZED);
        }
        await authRepository.fetchAllSessionAndUpdateSessionAndRefreshTokenByUserId(userId);
    }

    profile=async(userId)=>{
        if(!userId){
            throw new AppError("user id is missing",400,ErrorCode.BAD_REQUEST);
        }
        const getUserProfileInfo=await authRepository.fetchUserDetailsById(userId);
        return getUserProfileInfo;
    }
}

export default new AuthService();