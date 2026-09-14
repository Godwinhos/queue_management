const express = require("express")

const adminMiddleware = require("../middlewares/admin")

const authenticationToken = require("../middlewares/auth")

const route = express.Router()

const {makeAStaff,assignStaff} = require("../controllers/adminController")


route.put("/create-staff/:id",authenticationToken,adminMiddleware,makeAStaff)
route.put("/assign-staff/:id",authenticationToken,adminMiddleware,assignStaff)

module.exports = route