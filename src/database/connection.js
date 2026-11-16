// Prisma (PostgreSQL / Neon) ulanishi — butun ilova uchun bitta instansiya
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['warn', 'error'] });

module.exports = prisma;
