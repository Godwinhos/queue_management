const adminMiddleware = async (req, res, next) => {

    if (!req.user) {
        return res.status(401).json({
            message: "authentication required"
        })
    }

    if (req.user.role !== "ADMIN") {
        return res.status(403).json({
            message: "not an admin"
        })
    }

    next()
}

module.exports = adminMiddleware