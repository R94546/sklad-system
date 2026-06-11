import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
// БД удалённая (Railway, задержка 3-8с) — поднимаем таймауты транзакций,
// иначе confirmCart/приход иногда падают с "Unable to start a transaction in the given time".
const prisma = new PrismaClient({
  adapter,
  transactionOptions: { maxWait: 15000, timeout: 30000 },
});

export default prisma;

