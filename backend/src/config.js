// dotenv
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const RESET_URL_BASE = process.env.RESET_URL_BASE;
const QR_SECRET = process.env.QR_SECRET;
// prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Exports
module.exports = {
    JWT_SECRET,
    QR_SECRET,
    RESET_URL_BASE,
    prisma,
};
