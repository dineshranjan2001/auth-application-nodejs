import authRepository from "../repositories/auth.repository.js";
import AppError from "../utils/app-error.utils.js";
import { verifyAccessToken } from "../utils/token.utils.js";

export const authenticate = async (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
        // return res.status(401).json({
        //     success: false,
        //     message: "Access token required"
        // });
        throw new AppError("Access token required",401);
    }

    const token = authorization.substring(7);
    
    const payload = verifyAccessToken(token);
    if(!payload.sid || !payload.sub){
        throw new AppError("Invalid access token payload",401);
    }

    const getSession = await authRepository.fetchSessionByUserIdAndSessionId(payload.sid, payload.sub);
    if (!getSession) {
        // return res.status(401).json({
        //     success: false,
        //     message: "Session expired or revoked",
        // });
        throw new AppError("Session expired or revoked",401);
    }

    req.auth = {
        userId: payload.sub,
        sessionId: payload.sid
    };

    next();

}