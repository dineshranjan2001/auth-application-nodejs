import AppError from "../utils/app-error.utils.js";
import {ErrorCode} from "../enums/errorcode.enum.js";


export const requiredPermissions=(...permissions)=>{
  return(req,_,next)=>{

    //check the auth request is present or not before check the permissions
      if(!req.auth){
        throw new AppError("Authentication required",401,ErrorCode.UNAUTHORIZED);
      }

    //set all permissions from req.auth.permissions for uniquely store.
      const userPermissions=new Set(req?.auth?.permissions);

    //check every permisssions which is passed in the method parameters match with the userPermissions whether it is present or not. 
      const hasAllPermissions=permissions.every((permission)=>userPermission.has(permission));
      if(!hasAllPermissions){
        throw new AppError("You do not have permission to perform this action",403,ErrorCode.FORBIDDEN)
      }
    next();
  };
}
