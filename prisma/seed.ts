import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const SEED_ID_PREFIX = 'seed-';

type SeedSalesTarget = Prisma.SalesTargetUncheckedCreateInput & { id: string };

/** Return a Date that is `monthsAgo` months before today, at noon UTC */
function monthsAgo(n: number, dayOfMonth = 15): Date {
  const d = new Date();
  d.setUTCDate(dayOfMonth);
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
}

async function pruneLegacySeedRows({
  leadEmails,
  leadIds,
  campaignNames,
  campaignIds,
  dealIds,
  targetNames,
  targetIds,
}: {
  leadEmails: string[];
  leadIds: string[];
  campaignNames: string[];
  campaignIds: string[];
  dealIds: string[];
  targetNames: string[];
  targetIds: string[];
}) {
  await prisma.activity.deleteMany({
    where: {
      lead: { email: { in: leadEmails } },
      id: { not: { startsWith: SEED_ID_PREFIX } },
    },
  });
  await prisma.deal.deleteMany({
    where: {
      lead: { email: { in: leadEmails } },
      id: { notIn: dealIds },
    },
  });
  await prisma.lead.deleteMany({
    where: {
      email: { in: leadEmails },
      id: { notIn: leadIds },
    },
  });
  await prisma.campaign.deleteMany({
    where: {
      name: { in: campaignNames },
      id: { notIn: campaignIds },
    },
  });
  await prisma.salesTarget.deleteMany({
    where: {
      name: { in: targetNames },
      id: { notIn: targetIds },
    },
  });
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

  const campaignsData = [
    {
      id: 'seed-campaign-summer-sale-2025',
      name: 'Summer Sale 2025',
      channel: 'Email',
      cost: 5000000,
      startDate: monthsAgo(5, 1),
      endDate: monthsAgo(3, 28),
      createdAt: monthsAgo(5, 1),
      type: 'Project',
    },
    {
      id: 'seed-campaign-linkedin-outreach',
      name: 'LinkedIn Outreach',
      channel: 'Social',
      cost: 3000000,
      startDate: monthsAgo(4, 1),
      endDate: monthsAgo(1, 28),
      createdAt: monthsAgo(4, 1),
      type: 'Retainer',
    },
    {
      id: 'seed-campaign-google-ads-q1-2026',
      name: 'Google Ads Q1 2026',
      channel: 'Paid',
      cost: 10000000,
      startDate: monthsAgo(3, 1),
      endDate: monthsAgo(1, 28),
      createdAt: monthsAgo(3, 1),
      type: 'GMV',
    },
    {
      id: 'seed-campaign-content-marketing-q2',
      name: 'Content Marketing Q2',
      channel: 'Organic',
      cost: 2500000,
      startDate: monthsAgo(2, 1),
      createdAt: monthsAgo(2, 1),
      endDate: null,
      type: 'Project',
    },
  ];

  const campaign1 = campaignsData[0]!;
  const campaign2 = campaignsData[1]!;
  const campaign3 = campaignsData[2]!;
  const campaign4 = campaignsData[3]!;

  // Leads spread across the past 6 months (createdAt set via raw SQL after creation)
  const leadsData = [
    // Month -5
    { id: 'seed-lead-john-smith', fullName: 'John Smith', email: 'john@techstartup.io', phone: '+6281234567890', companyName: 'TechStartup Inc', source: 'Website', serviceType: 'Development', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign1.id, createdAt: monthsAgo(5, 5) },
    { id: 'seed-lead-emma-wilson', fullName: 'Emma Wilson', email: 'emma@designstudio.co', phone: '+6282345678901', companyName: 'Design Studio Co', source: 'Referral', serviceType: 'Design', status: 'contacted' as const, ownerId: staff1.id, campaignId: null, createdAt: monthsAgo(5, 12) },
    // Month -4
    { id: 'seed-lead-david-brown', fullName: 'David Brown', email: 'david@retailbusiness.com', phone: '+6283456789012', companyName: 'Retail Business Ltd', source: 'LinkedIn', serviceType: 'Consulting', status: 'new' as const, ownerId: staff2.id, campaignId: campaign2.id, createdAt: monthsAgo(4, 3) },
    { id: 'seed-lead-lisa-anderson', fullName: 'Lisa Anderson', email: 'lisa@marketingagency.net', phone: '+6284567890123', companyName: 'Marketing Agency', source: 'Google Ads', serviceType: 'Marketing', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign3.id, createdAt: monthsAgo(4, 18) },
    // Month -3
    { id: 'seed-lead-robert-taylor', fullName: 'Robert Taylor', email: 'robert@consultingfirm.io', phone: '+6285678901234', companyName: 'Consulting Firm', source: 'Website', serviceType: 'Consulting', status: 'contacted' as const, ownerId: staff2.id, campaignId: null, createdAt: monthsAgo(3, 7) },
    { id: 'seed-lead-jennifer-martinez', fullName: 'Jennifer Martinez', email: 'jennifer@ecommerce.co', phone: '+6286789012345', companyName: 'E-Commerce Plus', source: 'Referral', serviceType: 'Development', status: 'new' as const, ownerId: staff1.id, campaignId: null, createdAt: monthsAgo(3, 20) },
    // Month -2
    { id: 'seed-lead-william-johnson', fullName: 'William Johnson', email: 'william@saascompany.com', phone: '+6287890123456', companyName: 'SaaS Company', source: 'Email', serviceType: 'Support', status: 'qualified' as const, ownerId: staff2.id, campaignId: campaign1.id, createdAt: monthsAgo(2, 8) },
    { id: 'seed-lead-amanda-davis', fullName: 'Amanda Davis', email: 'amanda@foodbusiness.net', phone: '+6288901234567', companyName: 'Food Business Inc', source: 'LinkedIn', serviceType: 'Design', status: 'contacted' as const, ownerId: staff1.id, campaignId: campaign2.id, createdAt: monthsAgo(2, 22) },
    // Month -1
    { id: 'seed-lead-kevin-park', fullName: 'Kevin Park', email: 'kevin@fintech.io', phone: '+6289012345678', companyName: 'FinTech Solutions', source: 'Google Ads', serviceType: 'Development', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign4.id, createdAt: monthsAgo(1, 5) },
    { id: 'seed-lead-sandra-lee', fullName: 'Sandra Lee', email: 'sandra@healthtech.co', phone: '+6289123456789', companyName: 'HealthTech Co', source: 'Website', serviceType: 'Consulting', status: 'new' as const, ownerId: staff2.id, campaignId: null, createdAt: monthsAgo(1, 15) },
    // Month 0 (current)
    { id: 'seed-lead-mark-thompson', fullName: 'Mark Thompson', email: 'mark@logistics.com', phone: '+6289234567890', companyName: 'Logistics Plus', source: 'Referral', serviceType: 'Logistics', status: 'contacted' as const, ownerId: staff1.id, campaignId: campaign4.id, createdAt: monthsAgo(0, 3) },
    { id: 'seed-lead-priya-sharma', fullName: 'Priya Sharma', email: 'priya@edtech.net', phone: '+6289345678901', companyName: 'EduTech Inc', source: 'LinkedIn', serviceType: 'Marketing', status: 'new' as const, ownerId: staff2.id, campaignId: null, createdAt: monthsAgo(0, 8) },
  ];

  await pruneLegacySeedRows({
    leadEmails: leadsData.map((lead) => lead.email),
    leadIds: leadsData.map((lead) => lead.id),
    campaignNames: campaignsData.map((campaign) => campaign.name),
    campaignIds: campaignsData.map((campaign) => campaign.id),
    dealIds: [],
    targetNames: [],
    targetIds: [],
  });

  const campaigns = [];
  for (const { id, ...campaignData } of campaignsData) {
    const campaign = await prisma.campaign.upsert({
      where: { id },
      update: campaignData,
      create: { id, ...campaignData },
    });
    campaigns.push(campaign);
  }

  console.log('Seeded campaigns:', campaigns.length);

  const leads: { id: string; createdAt: Date }[] = [];
  for (const { id, createdAt, ...leadData } of leadsData) {
    const lead = await prisma.lead.upsert({
      where: { id },
      update: { ...leadData, createdAt },
      create: { id, ...leadData, createdAt },
    });
    leads.push({ id: lead.id, createdAt });
  }

  console.log('Seeded leads:', leads.length);

  // Deals spread across months; won deals get closedAt set in same month as lead
  const dealsData = [
    // Won 5 months ago — high value
    { id: 'seed-deal-enterprise-license', leadId: leads[0]?.id ?? '', title: 'Enterprise License', value: 75000000, stage: 'won' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(5, 20), createdAt: monthsAgo(5, 10), closedAt: monthsAgo(5, 20) },
    // Won 4 months ago
    { id: 'seed-deal-standard-package', leadId: leads[2]?.id ?? '', title: 'Standard Package', value: 25000000, stage: 'won' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(4, 25), createdAt: monthsAgo(4, 5), closedAt: monthsAgo(4, 25) },
    // Won 3 months ago
    { id: 'seed-deal-premium-plan', leadId: leads[3]?.id ?? '', title: 'Premium Plan', value: 100000000, stage: 'won' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(3, 15), createdAt: monthsAgo(3, 8), closedAt: monthsAgo(3, 15) },
    // Won 2 months ago
    { id: 'seed-deal-annual-subscription', leadId: leads[6]?.id ?? '', title: 'Annual Subscription', value: 50000000, stage: 'won' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(2, 18), createdAt: monthsAgo(2, 10), closedAt: monthsAgo(2, 18) },
    // Won 1 month ago
    { id: 'seed-deal-growth-package', leadId: leads[8]?.id ?? '', title: 'Growth Package', value: 35000000, stage: 'won' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(1, 20), createdAt: monthsAgo(1, 8), closedAt: monthsAgo(1, 20) },
    // Active pipeline
    { id: 'seed-deal-design-retainer', leadId: leads[1]?.id ?? '', title: 'Design Retainer', value: 20000000, stage: 'proposal' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(-1, 15), createdAt: monthsAgo(4, 20), closedAt: null },
    { id: 'seed-deal-consulting-bundle', leadId: leads[4]?.id ?? '', title: 'Consulting Bundle', value: 45000000, stage: 'negotiation' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(-1, 30), createdAt: monthsAgo(3, 12), closedAt: null },
    { id: 'seed-deal-starter-package', leadId: leads[5]?.id ?? '', title: 'Starter Package', value: 15000000, stage: 'qualified' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(-2, 10), createdAt: monthsAgo(2, 25), closedAt: null },
    { id: 'seed-deal-healthtech-saas', leadId: leads[9]?.id ?? '', title: 'HealthTech SaaS', value: 30000000, stage: 'new' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(-2, 20), createdAt: monthsAgo(1, 16), closedAt: null },
    { id: 'seed-deal-logistics-platform', leadId: leads[10]?.id ?? '', title: 'Logistics Platform', value: 60000000, stage: 'qualified' as const, ownerId: staff1.id, expectedCloseDate: monthsAgo(-1, 15), createdAt: monthsAgo(0, 5), closedAt: null },
    { id: 'seed-deal-basic-package', leadId: leads[7]?.id ?? '', title: 'Basic Package', value: 10000000, stage: 'lost' as const, ownerId: staff2.id, expectedCloseDate: monthsAgo(1, 28), createdAt: monthsAgo(2, 23), closedAt: null },
  ];

  for (const { id, leadId, ...dealData } of dealsData) {
    if (!leadId) continue;
    await prisma.deal.upsert({
      where: { id },
      update: { leadId, ...dealData },
      create: { id, leadId, ...dealData },
    });
  }

  console.log('Seeded deals:', dealsData.length);

  const activitiesData = [
    { id: 'seed-activity-john-discovery-note', leadId: leads[0]?.id ?? '', type: 'note' as const, content: 'Initial discovery call completed. Client interested in enterprise features.', createdBy: staff1.id },
    { id: 'seed-activity-john-followup-call', leadId: leads[0]?.id ?? '', type: 'call' as const, content: 'Follow-up call to discuss pricing and implementation timeline.', createdBy: staff1.id },
    { id: 'seed-activity-emma-demo-follow-up', leadId: leads[1]?.id ?? '', type: 'follow_up' as const, content: 'Scheduled demo for next week.', createdBy: staff1.id },
    { id: 'seed-activity-lisa-contract-note', leadId: leads[3]?.id ?? '', type: 'note' as const, content: 'Contract signed. Implementation starting soon.', createdBy: staff1.id },
    { id: 'seed-activity-robert-requirements-call', leadId: leads[4]?.id ?? '', type: 'call' as const, content: 'Discussed requirements and prepared proposal.', createdBy: staff2.id },
    { id: 'seed-activity-william-closed-note', leadId: leads[6]?.id ?? '', type: 'note' as const, content: 'Closed deal! Annual subscription with premium support.', createdBy: staff2.id },
    { id: 'seed-activity-kevin-demo-call', leadId: leads[8]?.id ?? '', type: 'call' as const, content: 'Demo completed, customer loves the product. Moving to negotiation.', createdBy: staff1.id },
    { id: 'seed-activity-sandra-proposal-follow-up', leadId: leads[9]?.id ?? '', type: 'follow_up' as const, content: 'Sent proposal document. Awaiting feedback.', createdBy: staff2.id },
  ];

  for (const { id, ...activityData } of activitiesData) {
    if (activityData.leadId) {
      await prisma.activity.upsert({
        where: { id },
        update: activityData,
        create: { id, ...activityData },
      });
    }
  }

  console.log('Seeded activities:', activitiesData.length);

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

  const salesTargetsData: SeedSalesTarget[] = [
    { id: 'seed-target-company-revenue-2026', name: 'Company Revenue 2026', scope: 'company', period: 'yearly', year: 2026, targetValue: ANNUAL, targetLeads: 200, targetDeals: 80 },
  ];

  for (let q = 1; q <= 4; q++) {
    const qTarget = ANNUAL * (qShares[q - 1]! / 100);

    // Quarterly company target
    salesTargetsData.push({
      id: `seed-target-company-q${q}-2026`,
      name: `Company Q${q} 2026`,
      scope: 'company',
      period: 'quarterly',
      year: 2026,
      quarter: q,
      targetValue: qTarget,
      shareOfParent: qShares[q - 1],
    });

    // Quarterly category targets
    for (const [cat, split] of Object.entries(catSplits)) {
      salesTargetsData.push({
        id: `seed-target-company-q${q}-2026-${cat.toLowerCase()}`,
        name: `Company Q${q} 2026 - ${cat}`,
        scope: 'company',
        period: 'quarterly',
        year: 2026,
        quarter: q,
        targetValue: qTarget * split,
        category: cat,
        shareOfParent: qShares[q - 1],
      });
    }

    // Monthly targets within quarter
    for (let m = 0; m < 3; m++) {
      const monthIndex = (q - 1) * 3 + m + 1;
      const mTarget = qTarget * (mSharesInQ[m]! / 100);
      salesTargetsData.push({
        id: `seed-target-company-m${monthIndex}-2026`,
        name: `Company M${monthIndex} 2026`,
        scope: 'company',
        period: 'monthly',
        year: 2026,
        quarter: q,
        month: monthIndex,
        targetValue: mTarget,
        shareOfParent: mSharesInQ[m],
      });
      // Monthly category targets
      for (const [cat, split] of Object.entries(catSplits)) {
        salesTargetsData.push({
          id: `seed-target-company-m${monthIndex}-2026-${cat.toLowerCase()}`,
          name: `Company M${monthIndex} 2026 - ${cat}`,
          scope: 'company',
          period: 'monthly',
          year: 2026,
          quarter: q,
          month: monthIndex,
          targetValue: mTarget * split,
          category: cat,
          shareOfParent: mSharesInQ[m],
        });
      }
    }
  }

  // Individual targets for staff (yearly)
  salesTargetsData.push(
    { id: 'seed-target-sarah-2026', name: 'Sarah 2026', scope: 'individual', period: 'yearly', year: 2026, userId: staff1.id, targetValue: 8_000_000_000, targetLeads: 70, targetDeals: 28 },
    { id: 'seed-target-michael-2026', name: 'Michael 2026', scope: 'individual', period: 'yearly', year: 2026, userId: staff2.id, targetValue: 6_000_000_000, targetLeads: 50, targetDeals: 20 },
    { id: 'seed-target-admin-2026', name: 'Admin 2026', scope: 'individual', period: 'yearly', year: 2026, userId: admin.id, targetValue: 10_000_000_000, targetLeads: 80, targetDeals: 32 },
  );

  // Team Alpha yearly target
  salesTargetsData.push({ id: 'seed-target-team-alpha-2026', name: 'Team Alpha 2026', scope: 'team', period: 'yearly', year: 2026, teamId: teamAlpha.id, targetValue: 18_000_000_000 });

  await prisma.salesTarget.deleteMany({
    where: {
      name: { in: salesTargetsData.map((target) => target.name) },
      id: { notIn: salesTargetsData.map((target) => target.id) },
    },
  });

  for (const { id, ...targetData } of salesTargetsData) {
    await prisma.salesTarget.upsert({
      where: { id },
      update: targetData,
      create: { id, ...targetData },
    });
  }

  console.log('Seeded sales teams and targets');
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
