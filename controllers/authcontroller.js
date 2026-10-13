const prisma = require("../config/prisma")
const bcrypt = require("bcrypt")
const transporter = require("../config/mail")

const cloudinary = require("../config/cloudinary")



const jwt = require("jsonwebtoken")
const { publicApiUrl } = require("../config/env")


const passwordValidator = require('password-validator');

// Create a schema
const passwordSchema = new passwordValidator();

passwordSchema
.is().min(7)
.is().max(20)
.has().uppercase()                              
.has().lowercase()                
.has().digits(2)
.has().symbols()

const createUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email) {
            return res.json({
                message: "email field needed"
            });
        }

        if (!password) {
            return res.json({
                message: "password field needed"
            });
        }

        if (!passwordSchema.validate(password)) {
            return res.json({
                message: "password must have min of 7 characters, uppercase, lowercase, digit, symbols"
            });
        }

        if (!req.file) {
            return res.json({
                message: "file required"
            });
        }

        const userExist = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (userExist) {
            return res.json({
                message: "user exist"
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path);

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email: email,
                password: hashPassword,
                imageUrl: result.secure_url
            }
        });

        const verificationToken = jwt.sign(
            {
                id: user.id,
                email: user.email
            },
            process.env.JWT_SECRET_KEY,
            {
                expiresIn: "1h"
            }
        );

        const verificationLink =
            `${process.env.PUBLIC_API_URL}/auth/verify-email?token=${verificationToken}`;

        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: user.email,
            subject: "Hello, verify your email",
            text: `Click the link to verify: ${verificationLink}`
        });

        return res.json({
            message: "user created, check your email to verify",
            user: {
                id: user.id,
                email: user.email
            }
        });

    } catch (error) {
        console.log("CREATE USER ERROR:", error);

        return res.status(500).json({
            message: error.message
        });
    }
};

const verifyEmail = async(req,res)=>{
    try{
        const{token} = req.query

        if(!token){
            return res.json({
                message:"token is required"
            })
        }

        const decode = jwt.verify(token,process.env.JWT_SECRET_KEY)

        const verify = await prisma.user.update({
            where:{
                id:decode.id

            },
            data:{
                isVerified:true
            }
        })

        res.json({
            message:"verified successfully"
        })
    }
    catch(error){
        console.log(error);
        return res.json({message:error.message})
    }
}

const resendEmail = async(req,res) =>{
    try{
        const{email} = req.body

        if(!email){
            return res.json({
                message:"email required"
            })
        }

        const user = await prisma.user.findUnique({
            where:{
                email
            }
        })

        

        // console.log("Email received:", email);
        // console.log("User found:", user);
        // console.log("ALL USERS:", user);

        // console.log("Email:", JSON.stringify(email));

        if(!user){
            return res.json({
                message:"invalid credentials"
            })
        }


        if(user.isVerified){
            return res.json({
                message:"user is already verified"
            })
        }

        

        const verificationToken = jwt.sign(
            {id:user.id,email:user.email},
            process.env.JWT_SECRET_KEY,
            {expiresIn:"1h"}
        )

        const verificationLink = `${process.env.PUBLIC_API_URL}/auth/verify-email?token=${verificationToken}`

        

        await transporter.sendMail({
            from: process.env.SMTP_USER, 
            to: user.email, 
            subject: "hello verify your email",
            text:`click the link to verify ${verificationLink}`
        });

        res.json({
            messagee:"check your inbox for verifcation link"
        })
    }

        
    

    catch(error){
        console.log(error)
        return res.json({
            message:error.message
        })
    }


}

const login = async(req,res)=>{
    try{
        const{email,password} = req.body

        if(!email){
            return res.json({
                message:"email field needed"
            })
        }

        if(!password){
            return res.json({
                message:"password field needed"
            })
        }

        const user = await prisma.user.findUnique({
            where:{
                email
            }
        })

        if(!user){
            return res.json({
                message:"invalid credentials"
            })
        }

        const isMatch = await bcrypt.compare(password,user.password)

        if(!isMatch){
            return res.json({
                message:"invalid credentials"
            })
        }

        const token = jwt.sign(
            {id:user.id,email:user.email,role:user.role,branchId:user.branchId},
            process.env.JWT_SECRET_KEY,
            {expiresIn:"1h"}
        )

        res.json({
            message:"loggin successfully",
            token
        })
    }

    catch(error){
        console.log(error)

        return res.json({message:error.message})
    }
}


const allUser = async(req,res)=>{
    try{
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 2
    const role = req.query.role

    const skip = (page-1) * limit
    
        const user = await prisma.user.findMany({
            where:role?{role:role}:undefined,
            skip,
            take:limit,
            select:{
                id:true,
                email:true,
                role:true,
                isVerified:true,
                imageUrl:true
            }
        })

        const totalUsers = await prisma.user.count({
            where:role ? {role} : undefined
        })
        const totalPages = Math.ceil(totalUsers/limit)
        const hasNextPage = page < totalPages
        const hasPreviousPage = page> 1

        res.json({
            users:user,
                pagination:{
                page,
                limit,
                totalUsers,
                totalPages,
                hasNextPage,
                hasPreviousPage
                }
            
        })
    }
    catch(error){
        console.log(error)
        return res.status(500).json({ message: "internal server error" })
    }
}

const getUser = async(req,res)=>{
    const id = req.params.id || req.query.id

    const userId = Number(id)

    if(!userId){
        return res.json({
            message:"id filed is required"
        })
    }

    const userExist = await prisma.user.findUnique({
        where:{
            id:userId
        }
    })

    if(!userExist){
        return res.json({
            message:"user does not exist"
        })
    }

    res.json({
        message:"fetch user",
        user:{
            id:userExist.id,
            email:userExist.email,
            imageUrl:userExist.imageUrl,
            isVerified:userExist.isVerified
        }
    })
}

const updateUser = async(req,res)=>{
    const userId = req.user.id

    const file = req.file
    const{email,password} = req.body

    const data = {}

    if(email !== undefined){
        data.email = email
    }

    if(password !== undefined){
        const hashPassword = await bcrypt.hash(password,10)
        data.password = hashPassword
    }

    if(file !== undefined){
        const result = await cloudinary.uploader.upload(file.path)

        data.imageUrl =  result.secure_url
    }

    const update = await prisma.user.update({
        where:{
            id:userId
        },
        data
    })

    res.json({
        message:"user updated successfully",
        update

    })
}

const deleteUser = async(req,res)=>{
    try{
    const userId = req.user.id

    const del = await prisma.user.delete({
        where:{
            id:userId
        }
    })

    res.json({
        message:"user delete successfully",
        del
    })
    }

    catch(error){
        console.log(error)
        return res.json({
            message:error.message
        })
    }
}

const forgotPassword = async(req,res)=>{
    const {email} = req.body
    if(!email){
        return res.json({
            message:"email field require"
        })
    }

    const user = await prisma.user.findUnique({
        where:{
            email
        }
    })

    if(!user){
        return res.json({
            message :"invalid credentials"
        })
    }


    const verificationToken = jwt.sign(
        {id:user.id,email:user.email},
        process.env.JWT_SECRET_KEY,
        {expiresIn:"1h"}
    )

    const verificationLink = `${process.env.PUBLIC_API_URL}/auth/reset-password?token=${verificationToken}`

     await transporter.sendMail({
        from: process.env.SMTP_USER, 
        to: user.email, 
        subject: "hello verify your email",
        text:`click the link to verify ${verificationLink}`
    });

    res.json({
        messagee:"check your inbox for verifcation link"
    })
}

const resetPassword = async(req,res)=>{
    const{token} = req.query
    const{password} = req.body || {}

    console.log("TOKEN:", token)

    if(!token){
        return res.json({
            message:"token require"
        })
    }

    if(!password){
        return res.json({
            message:"password field needed"
        })
    }

    if(!passwordSchema.validate(password)){
        return res.json({
            message:"password must have min of 7 characters,uppercase,lowercase,digit,symbols"
        })
    }

    const decode = jwt.verify(token,process.env.JWT_SECRET_KEY)

    const user = await prisma.user.findUnique({
        where:{
            id:decode.id
        }
    })

    if(!user){
        return res.json({
            message:"invalid credentials"
        })
    }

    const hashPassword = await bcrypt.hash(password,10)

    const newPassword = await prisma.user.update({
        where:{
            id:decode.id
        },
        data:{
            password:hashPassword
            
            
        }
    })

    res.json({
        message:"password resetted "
    })

}

const profile = async(req,res)=>{
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                role: true,
                isVerified: true,
                imageUrl: true,
                branch: {
                    select: {
                        id: true,
                        name: true,
                        location: true,
                        categoryId: true
                    }
                }
            }
        })

        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }

        return res.json({
            message:"user retrieved successfully",
            user
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: "internal server error" })
    }
}


const authorize = async(req,res)=>{
    res.json({
        message:"secured resources"
    })
}


module.exports = {createUser,verifyEmail,resendEmail,login,getUser,allUser,updateUser,deleteUser,forgotPassword,resetPassword,profile,authorize}
