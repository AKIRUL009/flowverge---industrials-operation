import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { pool } from './index.ts';

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

const adapter = new PrismaPg(pool);

export const prisma =
  global.prismaGlobal ||
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}

export default prisma;
