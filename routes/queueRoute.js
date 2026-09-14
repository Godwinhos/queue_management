const express = require("express")

const route = express.Router()

const {createQueue,allQueue,getQueue,updateQueue,deleteQueue} = require("../controllers/queueController")

const adminMiddleware = require("../middlewares/admin")

const authenticationToken = require("../middlewares/auth")

route.post("/create-queue",authenticationToken,adminMiddleware,createQueue)

route.get("/get-queue/:id",authenticationToken,getQueue)

route.get("/all-queue",authenticationToken,allQueue)

route.put("/update-queue/:id",authenticationToken,adminMiddleware,updateQueue)

route.delete("/delete-queue/:id",authenticationToken,adminMiddleware,deleteQueue)


module.exports = route
