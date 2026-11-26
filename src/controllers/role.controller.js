
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
            message:"Data created successfully",
            data:updatedRoleDetails
        });  
    }
}

export default new RoleController();
