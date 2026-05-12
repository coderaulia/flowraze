import prisma from './src/prisma/index.js';

async function main() {
  const [totalLeads, totalDeals, wonDeals] = await Promise.all([
    prisma.lead.count(),
    prisma.deal.count(),
    prisma.deal.findMany({
      where: { stage: 'won' },
      select: { value: true, createdAt: true },
    }),
  ]);

  const leadsBySource = await prisma.lead.groupBy({
    by: ['source'],
    _count: { id: true },
  });

  console.log({ totalLeads, totalDeals, wonDeals, leadsBySource });
}

main().finally(() => prisma.$disconnect());
