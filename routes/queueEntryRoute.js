const express = require("express")
const route = express.Router()

const staffMiddleware = require("../middlewares/staff")
const adminMiddleware =require("../middlewares/admin")
const authentication = require("../middlewares/auth")

const {joinQueue,myQueueEntries,getQueueEntry,callNext,completeEntry,skipEntry,getQueueEntries,deleteQueueEntry} = require("../controllers/queueEntryController")

route.post("/join-queue",authentication,joinQueue)
route.post("/call-next/:queueId",authentication,staffMiddleware,callNext)
route.get("/my-entries",authentication,myQueueEntries)
route.get("/queue/:queueId",authentication,staffMiddleware,getQueueEntries)
route.get("/:id",authentication,getQueueEntry)
route.put("/complete-entry/:id",authentication,staffMiddleware,completeEntry)
route.put("/skip-entry/:id",authentication,staffMiddleware,skipEntry)
route.delete("/:id",authentication,deleteQueueEntry)

module.exports = route
