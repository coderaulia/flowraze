import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production'
    ? ['error']
    : ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Graceful shutdown helper
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

export default prisma;
