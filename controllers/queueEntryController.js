const prisma = require("../config/prisma")
const { getIO } = require("../config/socket");

const queueEntryWithMetrics = async (queueEntry) => {
    if (queueEntry.status !== "WAITING") {
        return { ...queueEntry, queueNumber: `${queueEntry.queueId}-${String(queueEntry.id).padStart(3, "0")}`, position: null, peopleAhead: 0 }
    }

    const peopleAhead = await prisma.queueEntry.count({
        where: {
            queueId: queueEntry.queueId,
            status: { in: ["WAITING", "SERVING"] },
            OR: [
                { created_at: { lt: queueEntry.created_at } },
                { created_at: queueEntry.created_at, id: { lt: queueEntry.id } }
            ]
        }
    })

    return {
        ...queueEntry,
        queueNumber: `${queueEntry.queueId}-${String(queueEntry.id).padStart(3, "0")}`,
        position: peopleAhead + 1,
        peopleAhead
    }
}

const joinQueue = async (req, res) => {
    try {
        const queueId = Number(req.body.queueId)
        const userId = req.user.id

        if (!Number.isInteger(queueId) || queueId <= 0) {
            return res.status(400).json({
                message: "enter a valid queue id"
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        })

        if (!user) {
            return res.status(404).json({
                message: "user not found"
            })
        }

        const queue = await prisma.queue.findUnique({
            where: {
                id: queueId
            }
        })

        if (!queue) {
            return res.status(404).json({
                message: "queue not found"
            })
        }

        const activeEntry = await prisma.queueEntry.findFirst({
            where: {
                queueId,
                userId,
                status: { in: ["WAITING", "SERVING"] }
            }
        })

        if (activeEntry) {
            return res.status(409).json({
                message: "you already have an active entry in this queue",
                queueEntry: await queueEntryWithMetrics(activeEntry)
            })
        }

        const queueEntry = await prisma.queueEntry.create({
            data: {
                queueId,
                userId
            }
        })

        return res.status(201).json({
            message: "joined queue successfully",
            queueEntry: await queueEntryWithMetrics(queueEntry)
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const getQueueEntry = async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "enter a valid queue entry id"
            })
        }

        const queueEntry = await prisma.queueEntry.findUnique({
            where: {
                id
            },
            include: {
                queue: true,
                user: { select: { id: true, email: true, imageUrl: true } },
                staff: { select: { id: true, email: true, imageUrl: true } }
            }
        })

        if (!queueEntry) {
            return res.status(404).json({
                message: "queue entry not found"
            })
        }

        if (req.user.role !== "ADMIN" && req.user.role !== "STAFF" && queueEntry.userId !== req.user.id) {
            return res.status(403).json({ message: "you cannot view this queue entry" })
        }

        return res.status(200).json({
            queueEntry: await queueEntryWithMetrics(queueEntry)
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const myQueueEntries = async (req, res) => {
    try {
        const userId = req.user.id

        const queueEntries = await prisma.queueEntry.findMany({
            where: {
                userId
            },
            include: {
                queue: true
            },
            orderBy: {
                created_at: "desc"
            }
        })

        return res.status(200).json({
            queueEntries: await Promise.all(queueEntries.map(queueEntryWithMetrics))
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const getQueueEntries = async (req, res) => {
    try {
        const queueId = Number(req.params.queueId)

        if (!Number.isInteger(queueId) || queueId <= 0) {
            return res.status(400).json({
                message: "enter a valid queue id"
            })
        }

        const queue = await prisma.queue.findUnique({
            where: {
                id: queueId
            }
        })

        if (!queue) {
            return res.status(404).json({
                message: "queue not found"
            })
        }

        const queueEntries = await prisma.queueEntry.findMany({
            where: {
                queueId
            },
            include: {
                user: { select: { id: true, email: true, imageUrl: true } },
                staff: { select: { id: true, email: true, imageUrl: true } }
            },
            orderBy: {
                created_at: "asc"
            }
        })

        return res.status(200).json({ queueEntries })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const callNext = async (req, res) => {
    try {
        const queueId = Number(req.params.queueId)
        const staffId = req.user.id

        if (!Number.isInteger(queueId) || queueId <= 0) {
            return res.status(400).json({
                message: "enter a valid queue id"
            })
        }

        const queue = await prisma.queue.findUnique({
            where: {
                id: queueId
            }
        })

        if (!queue) {
            return res.status(404).json({
                message: "queue not found"
            })
        }

        console.log("QUEUE ID:", queueId);

        const allEntries = await prisma.queueEntry.findMany({
            where: {
                queueId: queueId
            }
        });

        console.log("ALL ENTRIES:", allEntries);
        const nextEntry = await prisma.queueEntry.findFirst({
            where: {
                queueId,
                status: "WAITING"
            },
            orderBy: {
                created_at: "asc"
            }
        })

        if (!nextEntry) {
            return res.status(404).json({
                message: "no customers waiting"
            })
        }

        const updatedEntry = await prisma.queueEntry.update({
            where: {
                id: nextEntry.id
            },
            data: {
                status: "SERVING",
                staffId
            }
        })

        // Get Socket.IO
        const io = getIO()

        // Notify everyone in this queue
        io.to(`queue-${queueId}`).emit("queue-updated", {
            queueId,
            calledEntryId: updatedEntry.id,
            status: "SERVING",
            message: "The next customer has been called"
        })

        return res.status(200).json({
            message: "customer called successfully",
            queueEntry: updatedEntry
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}


const completeEntry = async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "enter a valid queue entry id"
            })
        }

        const queueEntry = await prisma.queueEntry.findUnique({
            where: {
                id
            }
        })

        if (!queueEntry) {
            return res.status(404).json({
                message: "queue entry not found"
            })
        }

        if (queueEntry.status !== "SERVING") {
            return res.status(400).json({
                message: "customer is not currently being served"
            })
        }

        const updatedEntry = await prisma.queueEntry.update({
            where: {
                id
            },
            data: {
                status: "COMPLETED"
            }
        })

        const io = getIO()

        io.to(`queue-${queueEntry.queueId}`).emit("queue-updated", {
            queueId: queueEntry.queueId,
            completedEntryId: updatedEntry.id,
            status: "COMPLETED",
            message: "A customer has completed service"
        })

        return res.status(200).json({
            message: "customer service completed",
            queueEntry: updatedEntry
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

const skipEntry = async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "enter a valid queue entry id"
            })
        }

        const queueEntry = await prisma.queueEntry.findUnique({
            where: {
                id
            }
        })

        if (!queueEntry) {
            return res.status(404).json({
                message: "queue entry not found"
            })
        }

        if (queueEntry.status !== "SERVING") {
            return res.status(400).json({
                message: "customer is not currently being served"
            })
        }

        const updatedEntry = await prisma.queueEntry.update({
            where: {
                id
            },
            data: {
                status: "SKIPPED"
            }
        })

        const io = getIO()

        io.to(`queue-${queueEntry.queueId}`).emit("queue-updated", {
            queueId: queueEntry.queueId,
            skippedEntryId: updatedEntry.id,
            status: "SKIPPED",
            message: "A customer has been skipped"
        })

        return res.status(200).json({
            message: "customer skipped successfully",
            queueEntry: updatedEntry
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }

}

const deleteQueueEntry = async (req, res) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "enter a valid queue entry id"
            })
        }

        const queueEntry = await prisma.queueEntry.findUnique({
            where: {
                id
            }
        })

        if (!queueEntry) {
            return res.status(404).json({
                message: "queue entry not found"
            })
        }

        if (req.user.role !== "ADMIN" && queueEntry.userId !== req.user.id) {
            return res.status(403).json({ message: "you can only leave your own queue entry" })
        }

        if (queueEntry.status !== "WAITING") {
            return res.status(409).json({ message: "only waiting queue entries can be left" })
        }

        await prisma.queueEntry.delete({
            where: {
                id
            }
        })

        getIO().to(`queue-${queueEntry.queueId}`).emit("queue-updated", {
            queueId: queueEntry.queueId,
            deletedEntryId: queueEntry.id,
            status: "LEFT",
            message: "A customer left the queue"
        })

        return res.status(200).json({
            message: "queue entry deleted successfully"
        })

    } catch (error) {
        console.log(error)

        return res.status(500).json({
            message: "internal server error"
        })
    }
}

module.exports ={joinQueue,myQueueEntries,getQueueEntry,callNext,completeEntry,skipEntry,getQueueEntries,deleteQueueEntry}
