const prisma = require("../config/prisma")

const createCategory = async(req,res)=>{
    try{
        const{name}= req.body

        if(!name){
            return res.status(400).json({
                message:"name field require"
            })
        }
        const categoryExist = await prisma.category.findUnique({
            where:{
                name
            }
        })

        if(categoryExist){
            return res.status(409).json({
                message:"category exist already"
            })
        }

        const category = await prisma.category.create({
            data:{
                name
            }
        })

        res.status(201).json({
            message:"category created successfully",
            category:{
                id:category.id,
                name:category.name
            }
        })
    }
    catch(error){
        console.log(error)
        return res.json({
            message:error.message
        })
    }
}

const allCategory = async(req,res)=>{
    try{
    const allCategory = await prisma.category.findMany()

    res.status(200).json({
        message:"all category!!!",
        categories:allCategory
    })
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            message:error.message
        })
    }
}

const getCategory = async(req,res)=>{
    try{
        const id= Number(req.params.id)

        if(!id){
            return res.status(400).json({
                message:"id field require"
            })
        }

        const category = await prisma.category.findUnique({
            where:{
                id
            }
        })

        if(!category){
            return res.status(404).json({
                message:"invalid credentials"
            })
        }

        res.status(200).json({
            message:"category found",
            foundcategory:category.name
        })
    }

    catch(error){
        console.log(error)
        return res.json({
            message:error.message
        })
    }
}

const updateCategory = async(req,res)=>{
    try{
        const id = Number(req.params.id)
        const{name} = req.body

        const data = {}

        const category = await prisma.category.findUnique({
            where:{
                id
            }
        })

        if(!category){
            return res.status(404).json({
                message:"no such category"
            })
        }
        
        if(name !== undefined){
            data.name = name
        }

        const update = await prisma.category.update({
            where:{
                id
            },
            data

        })

        res.status(200).json({
            message:"updated successfully",
            update
        })
    }
    catch(error){
        console.log(error)
        return res.status(500).json({
            message:error.message
        })
    }
}

const deleteCategory = async(req,res)=>{
    try{
        const id= Number(req.params.id)

        if(!id){
            return res.status(400).json({
                message:"field needed"
            })
        }

        const checkCategory = await prisma.category.findUnique({
            where:{
                id
            }
        })

        if(!checkCategory){
            return res.status(400).json({
                message:"category doesnt exist"
            })
        }

        const del = await prisma.category.delete({
            where:{
                id
            }
        })

        res.status(200).json({
            message:"cstegory deleted",
            deleted:del.name
        })
    }

    catch(error){
        console.log(error)
        return res.status(500).json({
            message:error.message
        })
    }
}


module.exports = {createCategory,getCategory,allCategory,updateCategory,deleteCategory}
