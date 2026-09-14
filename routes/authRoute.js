const express = require("express")

const upload = require("../middlewares/upload")

const authMiddleware = require("../middlewares/auth")

const adminMiddleware = require("../middlewares/admin")

const jwtCheck = require("../middlewares/auth0")

const{createUser,verifyEmail,resendEmail,login,getUser,allUser,updateUser,deleteUser,forgotPassword,resetPassword,profile,authorize} = require("../controllers/authcontroller")

const route = express.Router()

route.post("/register", upload.single("image"), createUser)
route.get("/verify-email",verifyEmail)
route.post("/resend-email",resendEmail)
route.post("/login",login)
route.get("/users",authMiddleware,adminMiddleware,allUser)
route.get("/user/:id",authMiddleware,getUser)
route.post("/update",authMiddleware,upload.single("image"),updateUser)
route.post("/delete",authMiddleware,adminMiddleware,deleteUser)
route.post("/forgot-password",forgotPassword)
route.get("/reset-password",resetPassword)
route.get("/profile",authMiddleware,profile)
route.get("/all-user",authMiddleware,adminMiddleware,allUser)
route.get("/user",authMiddleware,getUser)
route.post("/reset-password",resetPassword)
// route.get("/authorize",jwtCheck,authorize)

// route.get("/authorize", jwtCheck, (req, res) => {
//     console.log("AUTH:", req.auth);

//     res.json({
//         message: "Auth0 works",
//         auth: req.auth
//     });
// });


// route.get("/authorize", (req, res, next) => {
//     console.log("AUTH HEADER:", req.headers.authorization);
//     next();
// }, jwtCheck, authorize);

module.exports = route
