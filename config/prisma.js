// const {PrismaClient} = require("@prisma/client")
// const { PrismaMariaDb } = require("@prisma/adapter-mariadb")

// const adapter = new PrismaMariaDb({
//   host: "localhost",
//   user: "root",
//   database: "fastpass",
//   password:"!godwin6193"
// });

// const prisma = new PrismaClient({ adapter });

// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "../generated/prisma/client.js";

// const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// export const prisma = new PrismaClient({ adapter });

const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../generated/prisma/client.js");

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({
    adapter
});

module.exports = prisma;

