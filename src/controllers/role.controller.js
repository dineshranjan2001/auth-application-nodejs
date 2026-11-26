import roleService from "../services/role.service.js";

class RoleController{
    create=async(req,res)=>{
      const createdRoleDetails=await roleService.create(req?.body);
      res.status(201).json({
            success:true,
            message:"Data created successfully",
            data:createdRoleDetails
        });
    }

    update=async(req,res)=>{
     const roleId=req?.params?.roleId;
     const updatedRoleDetails=await roleService.update(roleId,req?.body);
      res.status(201).json({
            success:true,
            message:"Data updated successfully",
            data:updatedRoleDetails
        });  
    }

    getById=async(req,res)=>{
        const roleId=req?.params?.roleId;
        const getRoleInfo=await roleService.getById(roleId);
        res.status(201).json({
            success:true,
            message:"Data fetched successfully",
            data:getRoleInfo
        });  
    }

    getAllRoles=async(req,res)=>{
        const page=req?.query?.page || 0;
        const limit=req?.query?.limit || 10;
        const getAllRolesInfo=await roleService.getAllRolesInfo(page,limit);
         res.status(201).json({
            success:true,
            message:"Data fetched successfully",
            data:getAllRolesInfo
        });  
    }

    assignRoleToUser=async(req,res)=>{
        const userId=req?.body?.userId;
        const roleId=req?.body?.roleId;
        const assignedRoleInfo=await roleService.assignRoleToUser(userId,roleId);
        res.status(201).json({
            success:true,
            message:"Role assigned successfully",
            data:assignedRoleInfo
        }); 
    }

    revokeRoleFromUser=async(req,res)=>{
        const userId=req?.body?.userId;
        const roleId=req?.body?.roleId;
        const rovokedRoleInfo=await roleService.revokeRoleFromUser(userId,roleId);
        res.status(201).json({
            success:true,
            message:"Role revoked from user successfully",
            data:rovokedRoleInfo
        });
    }
}

export default new RoleController();
