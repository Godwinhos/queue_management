const express = require("express")

const route =express.Router()

const authenticationToken = require("../middlewares/auth")

const adminMiddleware = require("../middlewares/admin")

const {createCategory,getCategory,allCategory,updateCategory,deleteCategory} = require("../controllers/categoryController")


route.post("/create-category",authenticationToken,adminMiddleware,createCategory)

route.get("/get-category/:id", authenticationToken,getCategory)

route.get("/all-category",authenticationToken,allCategory)

route.patch("/update-category/:id",authenticationToken, adminMiddleware,updateCategory)

route.delete("/delete-category/:id",authenticationToken,adminMiddleware,deleteCategory)


module.exports = route