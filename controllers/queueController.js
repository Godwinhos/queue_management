const prisma = require("../config/prisma")

const createQueue = async (req, res) => {
    try {
        const { name } = req.body
        const serviceId = Number(req.body.serviceId)

        if (!name || !Number.isInteger(serviceId) || serviceId <= 0) {
            return res.status(400).json({
                message: "name and valid serviceId are required"
            })
        }

        const service = await prisma.service.findUnique({
            where: {
                id: serviceId
            }
        })

        if (!service) {
            return res.status(404).json({
                message: "service not found"
            })
        }

        const queueExist = await prisma.queue.findFirst({
            where: {
                name,
                serviceId
            }
        })
        if(queueExist){
            return res.status(400).json({
                message:"queue already exist"
            })
        }

        const queue = await prisma.queue.create({
            data: {
                name,
                serviceId
            }
        })

        return res.status(201).json({
            message: "queue created successfully",
            queue
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const getQueue = async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "valid id is required"
            })
        }

        const queue = await prisma.queue.findUnique({
            where: {
                id
            }
        })

        if (!queue) {
            return res.status(404).json({
                message: "queue not found"
            })
        }

        return res.status(200).json({
            message: "queue retrieved successfully",
            queue
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const allQueue = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.limit) || 10
        const serviceId = req.query.serviceId === undefined ? undefined : Number(req.query.serviceId)
        const branchId = req.query.branchId === undefined ? undefined : Number(req.query.branchId)

        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
            return res.status(400).json({ message: "page and limit must be valid positive integers" })
        }
        if (serviceId !== undefined && (!Number.isInteger(serviceId) || serviceId <= 0)) {
            return res.status(400).json({ message: "serviceId must be a valid positive integer" })
        }
        if (branchId !== undefined && (!Number.isInteger(branchId) || branchId <= 0)) {
            return res.status(400).json({ message: "branchId must be a valid positive integer" })
        }

        const where = {
            ...(serviceId === undefined ? {} : { serviceId }),
            ...(branchId === undefined ? {} : { service: { branchId } })
        }

        const skip = (page - 1) * limit

        const queue = await prisma.queue.findMany({
            where,
            skip,
            take: limit,
            include: { service: true }
        })

        const totalQueue = await prisma.queue.count({ where })
        const totalPage = Math.ceil(totalQueue / limit)

        const hasNextPage = page < totalPage
        const hasPreviousPage = page > 1

        return res.status(200).json({
            message: "queues retrieved successfully",
            queue,
            pagination: {
                totalQueue,
                totalPage,
                hasNextPage,
                hasPreviousPage
            }
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const updateQueue = async (req, res) => {
    try {
        const id = Number(req.params.id)
        const { name } = req.body

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "input a valid id"
            })
        }

        const queueExist = await prisma.queue.findUnique({
            where: {
                id
            }
        })

        if (!queueExist) {
            return res.status(404).json({
                message: "queue not found"
            })
        }

        const data = {}

        if (name !== undefined) {
            data.name = name
        }

        const update = await prisma.queue.update({
            where: {
                id
            },
            data
        })

        return res.status(200).json({
            message: "queue updated successfully",
            update
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const deleteQueue = async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "input a valid id"
            })
        }

        const queueExist = await prisma.queue.findUnique({
            where: {
                id
            }
        })

        if (!queueExist) {
            return res.status(404).json({
                message: "queue not found"
            })
        }

        const del = await prisma.queue.delete({
            where: {
                id
            }
        })

        return res.status(200).json({
            message: "queue deleted successfully",
            del
        })
    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}


module.exports = {createQueue,allQueue,getQueue,updateQueue,deleteQueue}
