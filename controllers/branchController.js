const prisma = require("../config/prisma")
const cloudinary = require("../config/cloudinary")



// model Branch {
//   id Int @id @default(autoincrement())
//   name String @unique
//   categoryId Int
//   category Category @relation(fields:[categoryId],references:[id])
//   imageUrl String
//   location String
//   created_at DateTime @default(now())
// }

const createBranch = async(req,res)=>{
    try{
        const{name,location }= req.body

        const categoryId = Number(req.body.categoryId);


        if(!name){
            return res.status(403).json({
                message:"name field require"
            })
        }
        if(!Number.isInteger(categoryId) || categoryId<=0){
            return res.status(404).json({
                message:"valid field required"
            })
        }

        if(!location){
            return res.status(403).json({
                message:"location field require"
            })
        }

        if(!req.file){
            return res.status(403).json({
                message:"photo is required"
            })
        }

        const category = await prisma.category.findUnique({
            where:{
                id:categoryId
            }
        })

        if(!category){
            return res.status(404).json({
                message:"not found"
            })
        }

        const result = await cloudinary.uploader.upload(req.file.path)

        const branch = await prisma.branch.create({
            data:{
                name,
                categoryId:Number(categoryId),
                imageUrl:result.secure_url,
                location

            }
        })

        res.status(201).json({
            message:"branch created successfully",
            branch:{
                id:branch.id,
                name:branch.name,
                location:branch.location
            }
        })
    }

    catch(error){
        console.log(error)
        return res.status(401).json({
            message:"something went wrong"
        })
    }
}

const getBranches = async(req,res)=>{
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const categoryId = req.query.categoryId === undefined ? undefined : Number(req.query.categoryId)

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
        return res.status(400).json({ message: "page and limit must be valid positive integers" })
    }

    if (categoryId !== undefined && (!Number.isInteger(categoryId) || categoryId <= 0)) {
        return res.status(400).json({ message: "categoryId must be a valid positive integer" })
    }

    const skip = (page-1)*limit
     const branch = await prisma.branch.findMany({
        where: categoryId === undefined ? undefined : { categoryId },
        skip,
        take:limit,
        include: { category: true }
     })

     const totalBranch = await prisma.branch.count({
        where: categoryId === undefined ? undefined : { categoryId }
     })

     const totalPage = Math.ceil(totalBranch/limit)

     const hasNextPage = page<totalPage

     const hasPreviousPage = page>1

     res.status(200).json({
        message:"branch retrieved successfully",

        branch,
        pagination:{
            page,
            limit,
            totalBranch,
            totalPage,
            hasNextPage,
            hasPreviousPage
        }

     })
}

const getBranch = async(req,res)=>{
    const id = Number(req.params.id)

    if(!id){
        return res.status(401).json({
            message:"field needed"
        })
    }

    const branch = await prisma.branch.findUnique({
        where:{
            id
        }
    })

    if(!branch){
        return res.status(404).json({
            message:"branch not found"
        })
    }

    res.status(200).json({
        message:"branch retrieved",
        branch
    })
}

// model Branch {
//   id Int @id @default(autoincrement())
//   name String @unique
//   categoryId Int
//   category Category @relation(fields:[categoryId],references:[id])
//   imageUrl String
//   location String
//   created_at DateTime @default(now())
//}

const updateBranch = async(req,res)=>{
    try{
        const id= Number(req.params.id)
        const {name,location }= req.body
        const file = req.file
        const data = {}

        const branchExist = await prisma.branch.findUnique({
            where:{
                id
            }
        })

        if(!branchExist){
            return res.status(404).json({
                message:"not found"
            })
        }

        if(name !== undefined){
            data.name = name
        }
        if(location !== undefined){
            data.location = location
        }
        if(file !== undefined){
            const result = cloudinary.uploader.upload(file.path)
            data.imageUrl =(await result).secure_url
        }

        const branchUpdate = await prisma.branch.update({
            where:{
                id
            },
            data
        })

        res.status(200).json({
            message:"branch updated successfully",
            branchUpdate
        })
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            message:error.message
        })
    }

}

const deleteBranch = async(req,res)=>{
    try{
        const id = req.params.id
        const branchId = Number(id)

        if(!branchId){
            return res.status(400).json({
                message:"field required"
            })
        }

        const branchExist = await prisma.branch.findUnique({
            where:{
                id:branchId
            }
        })

        if(!branchExist){
            return res.status(400).json({
                message:"branch does not exist"
            })
        }

        const del = await prisma.branch.delete({
            where:{
                id:branchId
            }
            
        })

        res.status(200).json({
            message:"branch deleted successfully"
        })


    }

    catch(error){
        console.log(error)

        return res.status(500).json({
            message:error.message
        })
    }
}

module.exports = {createBranch,getBranch,getBranches,updateBranch,deleteBranch}
