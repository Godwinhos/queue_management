const prisma = require("../config/prisma")

const makeAStaff = async(req,res)=>{
    try{
        const id = Number(req.params.id)

        if(!Number.isInteger(id) || id<=0){
            return res.status(400).json({
                messsage:"valid field required"
            })
        }

        const userExist = await prisma.user.findUnique({
            where:{
                id
            }
        })

        if(!userExist){
            return res.status(404).json({
                message:"user not found"
            })
        }

        const updateUser = await prisma.user.update({
            where:{
                id
            },
            data:{
                role:"STAFF"
            }
        })

        res.status(200).json({
            message:"user update successfully",
            update:{
                id:updateUser.id,
                role:updateUser.role
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
const assignStaff = async(req,res) =>{
    try{
        const id = Number(req.params.id)
        const {branchId} = req.body

        if(!Number.isInteger(id) || id<=0){
            return res.status(400).json({
                message:"enter a valid id"
            })
        }

        if(!Number.isInteger(branchId)||branchId<=0){
            return res.status(400).json({
                message:"enter a valid branch id"
            })
        }

        const staff = await prisma.user.findUnique({
            where:{id}
        })

        if(!staff || staff.role !== "STAFF"){
            return res.status(404).json({
                message:"staff not found"
            })
        }

        const branch = await prisma.branch.findUnique({
            where:{
                id:branchId
            }
        })

        if(!branch){
            return res.status(404).json({
                message:"not found"
            })
        }

        const update = await prisma.user.update({
            where:{
                id
            },
            data:{
                branchId
            }
        })

        res.status(200).json({
            message:"branch assisgn to the staff successfully"
        })
    }

    catch(error){
        console.log(error)

        return res.status(500).json({
            message:"internal server error"
        })
    }

}

module.exports = {makeAStaff,assignStaff}