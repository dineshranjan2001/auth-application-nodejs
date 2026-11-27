export async function paginate=(model,args={},options={}){
  const {
    page=1,
    limit=10,
    search='',
    searchFields=[],
    sortBy='createdAt',
    sortOrder='desc',
    allowedSortFields=['createdAt']
  }=options;

  const pageInt=Math.max(1,Number(page)|| 1);
  const limitInt=Math.min(100,Math.max(1,Number(limit)|| 10));
  const skip=(pageInt-1)*limitInt;


  // dynamic search condition (OR across searchable fields)
  const searchCondition=search && searFields.length>0?{
    OR:searchFields.map((field)=>({
      [field]:{contains:search,mode:'insensitive'}
    }));
  }:{};
  
  //Combine base `where` filters with search condition
  const where={
    AND:[args.where || {},searchCondition]
  };

  // Validate sort field against allowlist to prevent Prisma errors/injection
  const validatedSortField=allowedSortFields.includes(sortBy)?sortBy:allowedSortFields[0];
  const validatedSortOrder=sortOrder?.toLowerCase()==='asc'? 'asc' : 'desc';

  const[data,totalRecords]=await Promise.all([
      model.findMany({
        ...args,
        where,
        skip,
        take:limitInt,
        orderBy:{[validatedSortField]:validatedSortOrder}
      }),
    model.count({ where }),
  ]);

  const totalPages=Math.ceil(totalRecords/limitInt);

  return{
    data,
    meta:{
      totalRecords,
      totalPages,
      currentPage:pageInt,
      limit:limitInt,
      hasNextPage:pageInt<totalPages,
      hasPreviousPage:pageInt>1
    }
  }
  
}
