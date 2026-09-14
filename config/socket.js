const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")
const prisma = require("./prisma")
const { clientOrigins } = require("./env")

let io

const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: clientOrigins,
            methods: ["GET", "POST"],
            credentials: false
        }
    })

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(" ")[1]
        if (!token) return next(new Error("authentication required"))

        try {
            socket.data.user = jwt.verify(token, process.env.JWT_SECRET_KEY)
            return next()
        } catch {
            return next(new Error("invalid or expired token"))
        }
    })

    io.on("connection", (socket) => {
        socket.on("join-queue-room", async (queueId, acknowledge = () => {}) => {
            const queueIdNumber = Number(queueId)
            if (!Number.isInteger(queueIdNumber) || queueIdNumber <= 0) {
                return acknowledge({ error: "invalid queue id" })
            }

            try {
                const user = socket.data.user
                const queue = await prisma.queue.findUnique({
                    where: { id: queueIdNumber },
                    include: { service: { select: { branchId: true } } }
                })
                if (!queue) return acknowledge({ error: "queue not found" })

                const entry = await prisma.queueEntry.findFirst({
                    where: { queueId: queueIdNumber, userId: user.id }
                })
                const allowed = user.role === "ADMIN" || entry ||
                    (user.role === "STAFF" && user.branchId === queue.service.branchId)
                if (!allowed) return acknowledge({ error: "not allowed to join this queue room" })

                socket.join(`queue-${queueIdNumber}`)
                return acknowledge({ joined: true })
            } catch (error) {
                console.error("Unable to join queue room", { message: error.message })
                return acknowledge({ error: "unable to join queue room" })
            }
        })
    })

    return io
}

const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO has not been initialized")
    }

    return io
}

module.exports = {
    initializeSocket,
    getIO
}
