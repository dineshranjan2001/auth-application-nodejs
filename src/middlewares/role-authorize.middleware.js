import AppError from "../utils/app-error.utils.js";
import {ErrorCode} from "../enums/errorcode.enum.js"; 


export const requiredRoles=(...roles)=>{
  return (req,res,next)=>{
    
    // check the req.auth is present or not 
      if(!req.auth){
        throw new AppError("Authentication Required.",401,ErrorCode.UNAUTHORIZED);
      }

    // set all roles from req.auth.permissions for uniquely store in the Set Object.
      const userRoles=new Set(req?.auth?.roles);

    //check the role is the allowed role or not 
      const hasAllowedRole=roles.some((role)=>userRoles.has(role));
      if(!hasAllowedRole){
        throw new AppError("You do not have permission to access this resource",403,ErrorCode.FORBIDDEN);
      }

    // if there are not errors present the forward the request to next handler.
    next();
  };
};
