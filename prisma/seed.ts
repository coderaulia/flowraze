import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Return a Date that is `monthsAgo` months before today, at noon UTC */
function monthsAgo(n: number, dayOfMonth = 15): Date {
  const d = new Date();
  d.setUTCDate(dayOfMonth);
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
}

async function main() {
  console.log('Seeding database...');

  const superadminPassword = await bcrypt.hash('superadmin123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);
  const staffPassword = await bcrypt.hash('staff123', 10);

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@flowraze.com' },
    update: {},
    create: {
      email: 'superadmin@flowraze.com',
      password: superadminPassword,
      name: 'Super Admin',
      role: 'superadmin',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@flowraze.com' },
    update: {},
    create: {
      email: 'admin@flowraze.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
    },
  });

  const staff1 = await prisma.user.upsert({
    where: { email: 'sarah@flowraze.com' },
    update: {},
    create: {
      email: 'sarah@flowraze.com',
      password: staffPassword,
      name: 'Sarah Chen',
      role: 'staff',
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: 'michael@flowraze.com' },
    update: {},
    create: {
      email: 'michael@flowraze.com',
      password: staffPassword,
      name: 'Michael Rodriguez',
      role: 'staff',
    },
  });

  console.log('Created users:', { superadmin, admin, staff1, staff2 });

  // Campaigns spread across the past 6 months
  const campaign1 = await prisma.campaign.create({
    data: {
      name: 'Summer Sale 2025',
      channel: 'Email',
      cost: 5000000,
      startDate: monthsAgo(5, 1),
      endDate: monthsAgo(3, 28),
      createdAt: monthsAgo(5, 1),
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      name: 'LinkedIn Outreach',
      channel: 'Social',
      cost: 3000000,
      startDate: monthsAgo(4, 1),
      endDate: monthsAgo(1, 28),
      createdAt: monthsAgo(4, 1),
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      name: 'Google Ads Q1 2026',
      channel: 'Paid',
      cost: 10000000,
      startDate: monthsAgo(3, 1),
      endDate: monthsAgo(1, 28),
      createdAt: monthsAgo(3, 1),
    },
  });

  const campaign4 = await prisma.campaign.create({
    data: {
      name: 'Content Marketing Q2',
      channel: 'Organic',
      cost: 2500000,
      startDate: monthsAgo(2, 1),
      createdAt: monthsAgo(2, 1),
    },
  });

  console.log('Created campaigns:', { campaign1, campaign2, campaign3, campaign4 });

  // Leads spread across the past 6 months (createdAt set via raw SQL after creation)
  const leadsData = [
    // Month -5
    { fullName: 'John Smith', email: 'john@techstartup.io', phone: '+6281234567890', companyName: 'TechStartup Inc', source: 'Website', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign1.id, createdAt: monthsAgo(5, 5) },
    { fullName: 'Emma Wilson', email: 'emma@designstudio.co', phone: '+6282345678901', companyName: 'Design Studio Co', source: 'Referral', status: 'contacted' as const, ownerId: staff1.id, campaignId: null, createdAt: monthsAgo(5, 12) },
    // Month -4
    { fullName: 'David Brown', email: 'david@retailbusiness.com', phone: '+6283456789012', companyName: 'Retail Business Ltd', source: 'LinkedIn', status: 'new' as const, ownerId: staff2.id, campaignId: campaign2.id, createdAt: monthsAgo(4, 3) },
    { fullName: 'Lisa Anderson', email: 'lisa@marketingagency.net', phone: '+6284567890123', companyName: 'Marketing Agency', source: 'Google Ads', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign3.id, createdAt: monthsAgo(4, 18) },
    // Month -3
    { fullName: 'Robert Taylor', email: 'robert@consultingfirm.io', phone: '+6285678901234', companyName: 'Consulting Firm', source: 'Website', status: 'contacted' as const, ownerId: staff2.id, campaignId: null, createdAt: monthsAgo(3, 7) },
    { fullName: 'Jennifer Martinez', email: 'jennifer@ecommerce.co', phone: '+6286789012345', companyName: 'E-Commerce Plus', source: 'Referral', status: 'new' as const, ownerId: staff1.id, campaignId: null, createdAt: monthsAgo(3, 20) },
    // Month -2
    { fullName: 'William Johnson', email: 'william@saascompany.com', phone: '+6287890123456', companyName: 'SaaS Company', source: 'Email', status: 'qualified' as const, ownerId: staff2.id, campaignId: campaign1.id, createdAt: monthsAgo(2, 8) },
    { fullName: 'Amanda Davis', email: 'amanda@foodbusiness.net', phone: '+6288901234567', companyName: 'Food Business Inc', source: 'LinkedIn', status: 'contacted' as const, ownerId: staff1.id, campaignId: campaign2.id, createdAt: monthsAgo(2, 22) },
    // Month -1
    { fullName: 'Kevin Park', email: 'kevin@fintech.io', phone: '+6289012345678', companyName: 'FinTech Solutions', source: 'Google Ads', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign4.id, createdAt: monthsAgo(1, 5) },
    { fullName: 'Sandra Lee', email: 'sandra@healthtech.co', phone: '+6289123456789', companyName: 'HealthTech Co', source: 'Website', status: 'new' as const, ownerId: staff2.id, campaignId: null, createdAt: monthsAgo(1, 15) },
    // Month 0 (current)
    { fullName: 'Mark Thompson', email: 'mark@logistics.com', phone: '+6289234567890', companyName: 'Logistics Plus', source: 'Referral', status: 'contacted' as const, ownerId: staff1.id, campaignId: campaign4.id, createdAt: monthsAgo(0, 3) },
    { fullName: 'Priya Sharma', email: 'priya@edtech.net', phone: '+6289345678901', companyName: 'EduTech Inc', source: 'LinkedIn', status: 'new' as const, ownerId: staff2.id, campaignId: null, createdAt: monthsAgo(0, 8) },
  ];

  const leads: { id: string; createdAt: Date }[] = [];
  for (const { createdAt, ...leadData } of leadsData) {
    const lead = await prisma.lead.create({ data: leadData });
    // Back-date createdAt via raw SQL so dashboard time ranges work
    await prisma.$executeRaw`UPDATE "Lead" SET "createdAt" = ${createdAt} WHERE id = ${lead.id}`;
    leads.push({ id: lead.id, createdAt });
  }

  console.log('Created leads:', leads.length);

  // Deals spread across months; won deals get closedAt set in same month as lead
  const dealsData = [
    // Won 5 months ago — high value
    { leadId: leads[0]?.id ?? '', title: 'Enterprise License', value: 75000000, stage: 'won' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(5, 20), createdAt: monthsAgo(5, 10), closedAt: monthsAgo(5, 20) },
    // Won 4 months ago
    { leadId: leads[2]?.id ?? '', title: 'Standard Package', value: 25000000, stage: 'won' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(4, 25), createdAt: monthsAgo(4, 5), closedAt: monthsAgo(4, 25) },
    // Won 3 months ago
    { leadId: leads[3]?.id ?? '', title: 'Premium Plan', value: 100000000, stage: 'won' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(3, 15), createdAt: monthsAgo(3, 8), closedAt: monthsAgo(3, 15) },
    // Won 2 months ago
    { leadId: leads[6]?.id ?? '', title: 'Annual Subscription', value: 50000000, stage: 'won' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(2, 18), createdAt: monthsAgo(2, 10), closedAt: monthsAgo(2, 18) },
    // Won 1 month ago
    { leadId: leads[8]?.id ?? '', title: 'Growth Package', value: 35000000, stage: 'won' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(1, 20), createdAt: monthsAgo(1, 8), closedAt: monthsAgo(1, 20) },
    // Active pipeline
    { leadId: leads[1]?.id ?? '', title: 'Design Retainer', value: 20000000, stage: 'proposal' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(-1, 15), createdAt: monthsAgo(4, 20), closedAt: null },
    { leadId: leads[4]?.id ?? '', title: 'Consulting Bundle', value: 45000000, stage: 'negotiation' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(-1, 30), createdAt: monthsAgo(3, 12), closedAt: null },
    { leadId: leads[5]?.id ?? '', title: 'Starter Package', value: 15000000, stage: 'qualified' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(-2, 10), createdAt: monthsAgo(2, 25), closedAt: null },
    { leadId: leads[9]?.id ?? '', title: 'HealthTech SaaS', value: 30000000, stage: 'new' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(-2, 20), createdAt: monthsAgo(1, 16), closedAt: null },
    { leadId: leads[10]?.id ?? '', title: 'Logistics Platform', value: 60000000, stage: 'qualified' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(-1, 15), createdAt: monthsAgo(0, 5), closedAt: null },
    { leadId: leads[7]?.id ?? '', title: 'Basic Package', value: 10000000, stage: 'lost' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(1, 28), createdAt: monthsAgo(2, 23), closedAt: null },
  ];

  for (const { createdAt, closedAt, leadId, ...dealData } of dealsData) {
    if (!leadId) continue;
    const deal = await prisma.deal.create({ data: { leadId, ...dealData } });
    await prisma.$executeRaw`UPDATE "Deal" SET "createdAt" = ${createdAt}, "closedAt" = ${closedAt} WHERE id = ${deal.id}`;
  }

  console.log('Created deals:', dealsData.length);

  const activitiesData = [
    { leadId: leads[0]?.id ?? '', type: 'note' as const, content: 'Initial discovery call completed. Client interested in enterprise features.', createdBy: staff1.id },
    { leadId: leads[0]?.id ?? '', type: 'call' as const, content: 'Follow-up call to discuss pricing and implementation timeline.', createdBy: staff1.id },
    { leadId: leads[1]?.id ?? '', type: 'follow_up' as const, content: 'Scheduled demo for next week.', createdBy: staff1.id },
    { leadId: leads[3]?.id ?? '', type: 'note' as const, content: 'Contract signed. Implementation starting soon.', createdBy: staff1.id },
    { leadId: leads[4]?.id ?? '', type: 'call' as const, content: 'Discussed requirements and prepared proposal.', createdBy: staff2.id },
    { leadId: leads[6]?.id ?? '', type: 'note' as const, content: 'Closed deal! Annual subscription with premium support.', createdBy: staff2.id },
    { leadId: leads[8]?.id ?? '', type: 'call' as const, content: 'Demo completed, customer loves the product. Moving to negotiation.', createdBy: staff1.id },
    { leadId: leads[9]?.id ?? '', type: 'follow_up' as const, content: 'Sent proposal document. Awaiting feedback.', createdBy: staff2.id },
  ];

  for (const activityData of activitiesData) {
    if (activityData.leadId) {
      await prisma.activity.create({ data: activityData });
    }
  }

  console.log('Created activities:', activitiesData.length);

  const billingAccount = await prisma.billingAccount.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: {
      id: 'default-workspace',
      workspaceName: 'FlowRaze Demo Workspace',
      plan: 'growth',
      status: 'trialing',
      seats: 8,
      renewalDate: new Date('2026-12-01'),
    },
  });

  console.log('Created billing account:', billingAccount);
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
