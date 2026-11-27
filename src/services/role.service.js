import { ErrorCode } from "../enums/errorcode.enum";
import AppError from "../utils/app-error.utils.js";

class RoleService{
    create=async(roleData)=>{
        const getRoleInfo=await roleRepository.fetchRoleByName(roleData?.roleName);
        if(getRoleInfo){
            throw new AppError("Data already present",409,ErrorCode.CONFLICT);
        }

        const createdRoleInfo=await roleRepository.create(roleData);
        return createdRoleInfo;
    }

    update=async(roleId,roleData)=>{
        if(!roleId || typeof roleId!=="string"){
            throw new AppError("role id is missing",400,ErrorCode.BAD_REQUEST);
        }

        const getRoleInfo=await roleRepository.fetchRoleById(roleId);
        if(!getRoleInfo){
            throw new AppError("Data not found",404,ErrorCode.NOT_FOUND);
        }

        const updatedRoleInfo=await roleRepository.update(roleId,roleData);
        return updatedRoleInfo;
    }

    getById=async(roleId)=>{
        if(!roleId || typeof roleId!=="string"){
            throw new AppError("role id is missing",400,ErrorCode.BAD_REQUEST);
        }
        const getRoleInfo=await roleRepository.fetchRoleById(roleId);
        if(!getRoleInfo){
            throw new AppError("Data not found",404,ErrorCode.NOT_FOUND);
        }
        return  getRoleInfo;
    }

    getAllRoles=async(filter)=>{
        const getAllRolesInfo=await roleRepository.getAllRoles(filter);
        return getAllRolesInfo;
    }

    ‎assignRoleToUser=async(userId,roleId)=>{
        if(!userId || typeof userId!=="string"){
            throw new AppError("user id is missing or invalid user id",400,ErrorCode.BAD_REQUEST);
        }
        if(!roleId || typeof roleId!=="string"){
            throw new AppError("role id is missing or invalid role id",400,ErrorCode.BAD_REQUEST);
        }
        const assignedRoleToUserInfo=await roleRepository.assignRoleToUser(userId,roleId);
        return assignedRoleToUserInfo;
    }
    
‎    revokeRoleFromUser=async(userId,roleId)=>{
        if(!userId || typeof userId!=="string"){
            throw new AppError("user id is missing or invalid user id",400,ErrorCode.BAD_REQUEST);
        }
        if(!roleId || typeof roleId!=="string"){
            throw new AppError("role id is missing or invalid role id",400,ErrorCode.BAD_REQUEST);
        }
        const rovokedRoleFromUser=await roleRepository.revokeRoleFromUser(userId,roleId);
        return rovokedRoleFromUser;
    }

}
export default new RoleService();
