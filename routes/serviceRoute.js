const express = require("express")

const route = express.Router()

const adminMiddleware = require("../middlewares/admin")

const authenticationToken = require("../middlewares/auth")


const {createService,allService,getService,updateService,deleteService} = require("../controllers/serviceController")

route.post("/create-service",authenticationToken,adminMiddleware,createService)


route.get("/get-service/:id",authenticationToken,getService)


route.get("/all-service",authenticationToken,allService)

route.put("/update-service/:id",authenticationToken,adminMiddleware,updateService)

route.delete("/delete-service/:id",authenticationToken,adminMiddleware,deleteService)


module.exports = route