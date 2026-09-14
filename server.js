const fs = require("fs")
const express = require("express")
const http = require("http")
const cors = require("cors")
const helmet = require("helmet")
const { rateLimit } = require("express-rate-limit")
const { isProduction, clientOrigins, port } = require("./config/env")

const authRoute = require("./routes/authRoute")
const categoryRoute = require("./routes/categoryRoute")
const branchRoute = require("./routes/branchRoute")
const adminRoute = require("./routes/adminRoute")
const serviceRoute = require("./routes/serviceRoute")
const queueRoute = require("./routes/queueRoute")
const queueEntryRoute = require("./routes/queueEntryRoute")
const { initializeSocket } = require("./config/socket")

const app = express()
if (isProduction) app.set("trust proxy", 1)

app.use(helmet({ crossOriginResourcePolicy: false }))
app.use(cors({
  origin(origin, callback) {
    if (!origin || clientOrigins.includes(origin)) return callback(null, true)
    return callback(new Error("Origin not allowed by CORS"))
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}))
app.use(express.json({ limit: "100kb" }))
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: "draft-8",
  legacyHeaders: false
}))

app.get("/health", (req, res) => res.status(200).json({ status: "ok" }))

// Multer writes temporary files before Cloudinary receives them. Remove them after each response.
app.use((req, res, next) => {
  res.on("finish", () => {
    const files = [req.file, ...(req.files || [])].filter(Boolean)
    for (const file of files) fs.unlink(file.path, () => {})
  })
  next()
})

app.use("/auth", authRoute)
app.use("/category", categoryRoute)
app.use("/branch", branchRoute)
app.use("/admin", adminRoute)
app.use("/service", serviceRoute)
app.use("/queue", queueRoute)
app.use("/entry", queueEntryRoute)

app.use((req, res) => res.status(404).json({ message: "route not found" }))
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "invalid JSON body" })
  }
  if (error.name === "MulterError") {
    return res.status(400).json({ message: "invalid upload; use a JPEG, PNG, or WebP image up to 5 MB" })
  }
  console.error("Unhandled request error", { message: error.message, path: req.path })
  return res.status(500).json({ message: "internal server error" })
})

const server = http.createServer(app)
initializeSocket(server)

const httpServer = server.listen(port, () => {
  console.log(`running successfully on port ${port}`)
})

const shutdown = (signal) => {
  console.log(`${signal} received; closing server`)
  httpServer.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.once("SIGTERM", () => shutdown("SIGTERM"))
process.once("SIGINT", () => shutdown("SIGINT"))
