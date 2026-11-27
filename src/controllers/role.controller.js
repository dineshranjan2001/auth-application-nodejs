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
        const filter={
            page:req?.query?.page,
            limit:req?.query?.limit,
            search:req?.query?.search || "",
            sortBy:req?.query?.sortBy || "createdAt",
            sortOrder:req?.query?.sortOrder || "asc"
        };
        const getAllRolesInfo=await roleService.getAllRoles(filter);
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
