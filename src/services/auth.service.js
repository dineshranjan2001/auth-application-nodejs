import bcrypt from "bcrypt";
import AppError from "../utils/apperror.utils.js";
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
        const hasedRefreshToken = hashRefreshToken(generateNewRefreshToken);
        const expiresAt = new Date(
            Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000
        );

        const newSession = await authRepository.createSession({
            userId: getUserDetails?.id,
            userAgent: loginRequestData?.userAgent,
            ipAddress: loginRequestData?.ipAddress,
            deviceInfo: loginRequestData?.userAgent,
            expiresAt,
        }, hasedRefreshToken);

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
}

export default new AuthService();