import authRepository from "../repositories/auth.repository.js";
import AppError from "../utils/app-error.utils.js";
import { verifyAccessToken } from "../utils/token.utils.js";

export const authenticate = async (req, _, next) => {
    
    // get the value Bearer token from the req.headers.authorization property.
    const authorization = req.headers.authorization;

    // check the extracted string starts from Bearer or not.
    if (!authorization?.startsWith("Bearer ")) {
        throw new AppError("Access token required",401);
    }

    // extract the jwt access token from the authorization string.
    const token = authorization.substring(7);

    // extract the payload from the jwt access token.
    const payload = verifyAccessToken(token);
    if(!payload.sid || !payload.sub){
        throw new AppError("Invalid access token payload",401);
    }

    // get the active session with the sessionId and userId which is comming from the jwt access token
    // the fetchSessionByUserIdAndSessionId method fetch the session bases on the revokedAt null, existingAt is greater than to current date and user is active or not
    // this method returns sessionId,userId,roleNames,permissionCodes of the active user; 
    const getSession = await authRepository.fetchSessionByUserIdAndSessionId(payload.sid, payload.sub);
    if (!getSession) {
        throw new AppError("Session expired or revoked",401);
    }

    // get the roles from the active user's session.
    const roles=getSession?.user?.userRoles?.map((role)=>role?.roleName);


    // get the permission from the active user's session.
    // the fetched permissions is stored in a Set for storing the unique permission.
    // convert the set object to array.
    const permissions=[...new Set(
        getSession?.user?.userRoles?.flatMap(
            ({role})=>
                role.rolePermissions.map(
                    (permission)=>permission.permissionCode
            )
        )
    )];

    // set the userId,sessionId,roles and permissions into the req object.
    req.auth = {
        userId: payload.sub,
        sessionId: payload.sid,
        roles,
        permissions
    };

    //if there are no errors present then send the req to next handler.
    next();

}
