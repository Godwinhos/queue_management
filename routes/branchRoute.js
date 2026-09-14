const express = require("express")

const authenticationToken = require("../middlewares/auth")

const adminMiddleware = require("../middlewares/admin")

const upload = require("../middlewares/upload")

const{createBranch,getBranch,getBranches,updateBranch,deleteBranch} = require("../controllers/branchController")
const { auth } = require("express-oauth2-jwt-bearer")

const route = express.Router()

route.post("/create-Branch",authenticationToken,adminMiddleware,upload.single("image"),createBranch)
route.get("/get-Branch/:id",authenticationToken,getBranch)
route.get("/all-Branches",authenticationToken,getBranches)
route.put("/update-branch/:id",authenticationToken,adminMiddleware,upload.single("image"),updateBranch)
route.delete("/delete-branch/:id",authenticationToken,adminMiddleware,deleteBranch)


module.exports = route
