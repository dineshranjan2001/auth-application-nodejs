class RoleRepository{

  create=async(roleData)=>{
    return await prisma.role.create({data:roleData});
  }
  
  fetchRoleByName=async(roleName)=>{
      return await prisma.role.findUnique({
        where:{
         roleName 
        }
      });
  }

  fetchRoleById=async(roleId)=>{
    return await prisma.role.findFirst({
      where:{
        id:roleId
      }
    });
  }

  ‎getAllRoles=async(filter)=>{
    return await paginate(prisma.role,{
      where:{},
      select:{
        id:true,
        roleName:true,
        roleDescription:true,
        createdAt:true
      }
    },{
      page:filter.page,
      limit:filter.page,
      search:filter.search,
      searchFields:["roleName"],
      sortBy:filter.sortBy,
      sortOrder:filter.sortOrder,
      allowedSortFields:["roleName","roleDescription","createdAt"]
    });
  }
  
}

export default new RoleRepository();
