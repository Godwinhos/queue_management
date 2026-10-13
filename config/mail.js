const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    // Prefer IPv4 for the SMTP connection
    family: 4,

    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

module.exports = transporter;