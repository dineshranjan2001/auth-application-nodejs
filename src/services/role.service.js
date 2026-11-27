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
        if(!roleId){
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
        if(!roleId){
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
    

}
export default new RoleService();
