const prisma = require("../config/prisma")

const createService = async (req, res) => {
    try {
        const { name, description } = req.body
        const branchId = Number(req.body.branchId)

        if (!name || !branchId) {
            return res.status(400).json({
                message: "name and branchId are required"
            })
        }

        const serviceExist = await prisma.service.findFirst({

            where: {    
                name,
                branchId
            }
        })

        if (serviceExist) {
            return res.status(400).json({
                message: "service already exists in this branch"
            })
        }

        const branch = await prisma.branch.findUnique({
            where: {
                id: branchId
            }
        })

        if (!branch) {
            return res.status(404).json({
                message: "branch not found"
            })
        }

        const service = await prisma.service.create({
            data: {
                name,
                description,
                branchId
            }
        })

        return res.status(201).json({
            message: "service created successfully",
            service
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const getService = async(req,res)=>{
    try{
        const id = Number(req.params.id)

        if(!Number.isInteger(id)|| id<=0){
            return res.status(400).json({
                message:"valid id is required"
            })
        }

        const service = await prisma.service.findUnique({
            where:{
                id
            }
        })

        res.status(200).json({
            message:"service retireved successfully",
            service
        })
    }

    catch(error){
        console.log(error)

        return res.status(500).json({
            message:"internal server error"
        })
    }
}

const allService = async(req,res)=>{
    try{
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) ||10
        const branchId = req.query.branchId === undefined ? undefined : Number(req.query.branchId)

        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({ message:"page and limit must be valid positive integers" })
        }
        if (branchId !== undefined && (!Number.isInteger(branchId) || branchId <= 0)) {
            return res.status(400).json({ message:"branchId must be a valid positive integer" })
        }

        const skip = (page - 1) * limit

        const service = await prisma.service.findMany({
            where: branchId === undefined ? undefined : { branchId },
            skip,
            take:limit,
            include: { branch: true }
        })

        const totalService = await prisma.service.count({
            where: branchId === undefined ? undefined : { branchId }
        })
        const totalPage = Math.ceil(totalService/limit)

        const hasNextPage = page < totalPage
        const hasPreviousPage = page >1

        res.status(200).json({
            message:"service retrieved successfully",
            service,
            pagination:{
                totalService,
                totalPage,
                hasNextPage,
                hasPreviousPage
            }
        })
    }
    catch(error){
        console.log(error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

    
}


// model Service {
//   id         Int      @id @default(autoincrement())
//   name       String
//   description String?
//   branchId   Int
//   branch     Branch   @relation(fields: [branchId], references: [id])
//   created_at DateTime @default(now())
// }


const updateService = async(req,res)=>{

    try{
        const id = Number(req.params.id)
        const { name, description } = req.body

        const data = {}

        if(!Number.isInteger(id)|| id<=0){
            return res.status(400).json({
                message:"input a valid id"
            })
        }

        const serviceExist = await prisma.service.findUnique({
            where:{
                id
            }
        })

        if(!serviceExist){
            return res.status(404).json({
                message:"service not found"
            })
        }

        if(name !== undefined){
            data.name= name
        }

        if(description !== undefined){
            data.description = description
        }

        const update = await prisma.service.update({
            where:{
                id
            },
            data
        })

        res.status(200).json({
            message:"updatetd suceesuflly",
            update
        })
    }

    catch(error){
        console.log(error)
        return res.status(500).json({
            message:"internal server error"
        })
    }
}

const deleteService = async(req,res)=>{
    try{
        const id = Number(req.params.id)

        if(!Number.isInteger(id)|| id<=0){
            return res.status(400).json({
                message:"input a valid id"
            })
        }

        const serviceExist = await prisma.service.findUnique({
            where:{
                id
            }
        })

        if(!serviceExist){
            return res.status(404).json({
                message:"service not found"
            })
        }

        const del = await prisma.service.delete({
            where:{id}
        })

        res.status(200).json({
            message:"service deleted successfully",
            del
        })
    }
    catch(error){
        console.log(error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

module.exports = {createService,allService,getService,updateService,deleteService}
