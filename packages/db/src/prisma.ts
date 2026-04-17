import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __bavPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__bavPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__bavPrisma = prisma;
}
