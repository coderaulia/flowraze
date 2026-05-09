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
    { fullName: 'John Smith', email: 'john@techstartup.io', phone: '+6281234567890', companyName: 'TechStartup Inc', source: 'Website', serviceType: 'Development', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign1.id, createdAt: monthsAgo(5, 5) },
    { fullName: 'Emma Wilson', email: 'emma@designstudio.co', phone: '+6282345678901', companyName: 'Design Studio Co', source: 'Referral', serviceType: 'Design', status: 'contacted' as const, ownerId: staff1.id, campaignId: null, createdAt: monthsAgo(5, 12) },
    // Month -4
    { fullName: 'David Brown', email: 'david@retailbusiness.com', phone: '+6283456789012', companyName: 'Retail Business Ltd', source: 'LinkedIn', serviceType: 'Consulting', status: 'new' as const, ownerId: staff2.id, campaignId: campaign2.id, createdAt: monthsAgo(4, 3) },
    { fullName: 'Lisa Anderson', email: 'lisa@marketingagency.net', phone: '+6284567890123', companyName: 'Marketing Agency', source: 'Google Ads', serviceType: 'Marketing', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign3.id, createdAt: monthsAgo(4, 18) },
    // Month -3
    { fullName: 'Robert Taylor', email: 'robert@consultingfirm.io', phone: '+6285678901234', companyName: 'Consulting Firm', source: 'Website', serviceType: 'Consulting', status: 'contacted' as const, ownerId: staff2.id, campaignId: null, createdAt: monthsAgo(3, 7) },
    { fullName: 'Jennifer Martinez', email: 'jennifer@ecommerce.co', phone: '+6286789012345', companyName: 'E-Commerce Plus', source: 'Referral', serviceType: 'Development', status: 'new' as const, ownerId: staff1.id, campaignId: null, createdAt: monthsAgo(3, 20) },
    // Month -2
    { fullName: 'William Johnson', email: 'william@saascompany.com', phone: '+6287890123456', companyName: 'SaaS Company', source: 'Email', serviceType: 'Support', status: 'qualified' as const, ownerId: staff2.id, campaignId: campaign1.id, createdAt: monthsAgo(2, 8) },
    { fullName: 'Amanda Davis', email: 'amanda@foodbusiness.net', phone: '+6288901234567', companyName: 'Food Business Inc', source: 'LinkedIn', serviceType: 'Design', status: 'contacted' as const, ownerId: staff1.id, campaignId: campaign2.id, createdAt: monthsAgo(2, 22) },
    // Month -1
    { fullName: 'Kevin Park', email: 'kevin@fintech.io', phone: '+6289012345678', companyName: 'FinTech Solutions', source: 'Google Ads', serviceType: 'Development', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign4.id, createdAt: monthsAgo(1, 5) },
    { fullName: 'Sandra Lee', email: 'sandra@healthtech.co', phone: '+6289123456789', companyName: 'HealthTech Co', source: 'Website', serviceType: 'Consulting', status: 'new' as const, ownerId: staff2.id, campaignId: null, createdAt: monthsAgo(1, 15) },
    // Month 0 (current)
    { fullName: 'Mark Thompson', email: 'mark@logistics.com', phone: '+6289234567890', companyName: 'Logistics Plus', source: 'Referral', serviceType: 'Logistics', status: 'contacted' as const, ownerId: staff1.id, campaignId: campaign4.id, createdAt: monthsAgo(0, 3) },
    { fullName: 'Priya Sharma', email: 'priya@edtech.net', phone: '+6289345678901', companyName: 'EduTech Inc', source: 'LinkedIn', serviceType: 'Marketing', status: 'new' as const, ownerId: staff2.id, campaignId: null, createdAt: monthsAgo(0, 8) },
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

  // Update campaigns to have types (matching Campaign.type used by target categories)
  await prisma.campaign.update({ where: { id: campaign1.id }, data: { type: 'Project' } });
  await prisma.campaign.update({ where: { id: campaign2.id }, data: { type: 'Retainer' } });
  await prisma.campaign.update({ where: { id: campaign3.id }, data: { type: 'GMV' } });
  await prisma.campaign.update({ where: { id: campaign4.id }, data: { type: 'Project' } });

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
  console.log('Created billing account:', billingAccount.id);

  // ── Sales Teams ────────────────────────────────────────────────────────────
  const teamAlpha = await prisma.salesTeam.upsert({
    where: { id: 'team-alpha' },
    update: {},
    create: { id: 'team-alpha', name: 'Team Alpha', managerId: admin.id },
  });
  const teamBeta = await prisma.salesTeam.upsert({
    where: { id: 'team-beta' },
    update: {},
    create: { id: 'team-beta', name: 'Team Beta', managerId: superadmin.id },
  });

  // Members
  for (const [teamId, userId] of [
    [teamAlpha.id, staff1.id],
    [teamAlpha.id, admin.id],
    [teamBeta.id, staff2.id],
  ]) {
    await prisma.salesTeamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      update: {},
      create: { teamId, userId },
    });
  }
  console.log('Created sales teams');

  // ── Sales Targets 2026 ────────────────────────────────────────────────────
  // Annual company target: Rp 24.6B
  const ANNUAL = 24_643_948_000;

  // Quarterly shares (manual, seasonal): Q1=30%, Q2=30%, Q3=20%, Q4=20%
  const qShares = [30, 30, 20, 20];
  // Monthly shares within each quarter (manual): equal thirds for now
  const mSharesInQ = [33.3, 33.3, 33.4];

  // Category split per quarter (approx): Project 91.6%, GMV 7.7%, Retainer 0.7%
  const catSplits: Record<string, number> = { Project: 0.916, GMV: 0.077, Retainer: 0.007 };

  // Yearly company target
  await prisma.salesTarget.create({
    data: { name: 'Company Revenue 2026', scope: 'company', period: 'yearly', year: 2026, targetValue: ANNUAL, targetLeads: 200, targetDeals: 80 },
  });

  for (let q = 1; q <= 4; q++) {
    const qTarget = ANNUAL * (qShares[q - 1]! / 100);

    // Quarterly company target
    await prisma.salesTarget.create({
      data: { name: `Company Q${q} 2026`, scope: 'company', period: 'quarterly', year: 2026, quarter: q, targetValue: qTarget, shareOfParent: qShares[q - 1] },
    });

    // Quarterly category targets
    for (const [cat, split] of Object.entries(catSplits)) {
      await prisma.salesTarget.create({
        data: { name: `Company Q${q} 2026 - ${cat}`, scope: 'company', period: 'quarterly', year: 2026, quarter: q, targetValue: qTarget * split, category: cat, shareOfParent: qShares[q - 1] },
      });
    }

    // Monthly targets within quarter
    for (let m = 0; m < 3; m++) {
      const monthIndex = (q - 1) * 3 + m + 1;
      const mTarget = qTarget * (mSharesInQ[m]! / 100);
      await prisma.salesTarget.create({
        data: { name: `Company M${monthIndex} 2026`, scope: 'company', period: 'monthly', year: 2026, quarter: q, month: monthIndex, targetValue: mTarget, shareOfParent: mSharesInQ[m] },
      });
      // Monthly category targets
      for (const [cat, split] of Object.entries(catSplits)) {
        await prisma.salesTarget.create({
          data: { name: `Company M${monthIndex} 2026 - ${cat}`, scope: 'company', period: 'monthly', year: 2026, quarter: q, month: monthIndex, targetValue: mTarget * split, category: cat, shareOfParent: mSharesInQ[m] },
        });
      }
    }
  }

  // Individual targets for staff (yearly)
  await prisma.salesTarget.create({
    data: { name: 'Sarah 2026', scope: 'individual', period: 'yearly', year: 2026, userId: staff1.id, targetValue: 8_000_000_000, targetLeads: 70, targetDeals: 28 },
  });
  await prisma.salesTarget.create({
    data: { name: 'Michael 2026', scope: 'individual', period: 'yearly', year: 2026, userId: staff2.id, targetValue: 6_000_000_000, targetLeads: 50, targetDeals: 20 },
  });
  await prisma.salesTarget.create({
    data: { name: 'Admin 2026', scope: 'individual', period: 'yearly', year: 2026, userId: admin.id, targetValue: 10_000_000_000, targetLeads: 80, targetDeals: 32 },
  });

  // Team Alpha yearly target
  await prisma.salesTarget.create({
    data: { name: 'Team Alpha 2026', scope: 'team', period: 'yearly', year: 2026, teamId: teamAlpha.id, targetValue: 18_000_000_000 },
  });

  console.log('Created sales teams and targets');
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
