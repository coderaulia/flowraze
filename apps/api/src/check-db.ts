import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const targets = await prisma.salesTarget.count();
  const teams = await prisma.salesTeam.count();
  const wonDeals = await prisma.deal.count({ where: { stage: 'won' } });
  
  console.log({ targets, teams, wonDeals });
  
  const sampleTarget = await prisma.salesTarget.findFirst();
  console.log('Sample target:', sampleTarget);
}

main().catch(console.error).finally(() => prisma.$disconnect());
