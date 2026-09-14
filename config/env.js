require("dotenv").config({ quiet: true });

const isProduction = process.env.NODE_ENV === "production";
const requiredInProduction = [
  "DATABASE_URL", "JWT_SECRET_KEY", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET", "SMTP_HOST", "SMTP_USER", "SMTP_PASS", "CLIENT_ORIGINS", "PUBLIC_API_URL"
];

if (isProduction) {
  const missing = requiredInProduction.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(", ")}`);
  }
}

const clientOrigins = (process.env.CLIENT_ORIGINS || (isProduction ? "" : "http://localhost:3000,http://localhost:3001"))
  .split(",").map((origin) => origin.trim()).filter(Boolean);

const publicApiUrl = (process.env.PUBLIC_API_URL || `http://localhost:${Number(process.env.PORT) || 4002}`).replace(/\/$/, "");

module.exports = { isProduction, clientOrigins, publicApiUrl, port: Number(process.env.PORT) || 4002 };
