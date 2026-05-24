import { createHash } from 'node:crypto';

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();
const SEED_ID_PREFIX = 'seed-';

type Role = 'superadmin' | 'admin' | 'manager' | 'employee';
type PlanTier = 'starter' | 'growth' | 'custom';
type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled';
type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified';
type DealStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type ActivityType = 'note' | 'call' | 'follow_up';
type WebhookEvent =
  | 'lead_created'
  | 'lead_updated'
  | 'lead_deleted'
  | 'deal_created'
  | 'deal_updated'
  | 'deal_stage_changed'
  | 'deal_won'
  | 'deal_lost'
  | 'deal_deleted'
  | 'activity_created'
  | 'activity_updated'
  | 'activity_deleted';

type SeedUser = {
  key: string;
  email: string;
  name: string;
  role: Exclude<Role, 'superadmin'>;
};

type SeedCampaign = {
  key: string;
  id: string;
  name: string;
  channel: string;
  type: string;
  cost: number;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  ownerKey: string;
  salesOwnerKey: string;
};

type SeedLead = {
  key: string;
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  source: string;
  serviceType: string;
  status: LeadStatus;
  ownerKey: string;
  campaignKey: string | null;
  createdAt: Date;
};

type SeedDeal = {
  id: string;
  leadKey: string;
  title: string;
  value: number;
  stage: DealStage;
  ownerKey: string;
  expectedCloseDate: Date;
  createdAt: Date;
  closedAt: Date | null;
};

type SeedActivity = {
  id: string;
  leadKey: string;
  type: ActivityType;
  content: string;
  createdByKey: string;
  createdAt: Date;
};

type SeedCompany = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  billing: {
    id: string;
    workspaceName: string;
    plan: PlanTier;
    status: BillingStatus;
    seats: number;
    renewalDate: Date | null;
    externalCustomer: string;
  };
  users: SeedUser[];
  apiKeys: Array<{ id: string; name: string; rawKey: string; createdByKey: string; lastUsedAt: Date | null; revokedAt: Date | null }>;
  webhooks: Array<{ id: string; name: string; url: string; event: WebhookEvent; createdByKey: string; isActive: boolean; lastTriggeredAt: Date | null }>;
  campaigns: SeedCampaign[];
  leads: SeedLead[];
  deals: SeedDeal[];
  activities: SeedActivity[];
  annualTarget: number;
  teamTarget: number;
  targetLeads: number;
  targetDeals: number;
};

type UserMap = Map<string, { id: string; name: string }>;
type CampaignMap = Map<string, { id: string }>;
type LeadMap = Map<string, { id: string }>;

function monthsAgo(n: number, dayOfMonth = 15): Date {
  const d = new Date();
  d.setUTCDate(dayOfMonth);
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCMonth(d.getUTCMonth() - n);
  return d;
}

function hashSecret(secret: string) {
  return createHash('sha256').update(secret).digest('hex');
}

function getKeyPrefix(apiKey: string) {
  return apiKey.slice(0, 12);
}

function requiredFromMap<T>(map: Map<string, T>, key: string, label: string): T {
  const value = map.get(key);
  if (!value) {
    throw new Error(`Missing ${label}: ${key}`);
  }
  return value;
}

function buildCompanyTargets(company: SeedCompany, users: UserMap, teamId: string): Array<Prisma.SalesTargetUncheckedCreateInput & { id: string }> {
  const qShares = [30, 30, 20, 20] as const;
  const mSharesInQ = [33.3, 33.3, 33.4] as const;
  const catSplits: Record<string, number> = { Project: 0.7, GMV: 0.2, Retainer: 0.1 };
  const targets: Array<Prisma.SalesTargetUncheckedCreateInput & { id: string }> = [
    {
      id: `${SEED_ID_PREFIX}target-${company.slug}-company-2026`,
      companyId: company.id,
      name: `${company.name} Revenue 2026`,
      scope: 'company',
      period: 'yearly',
      year: 2026,
      targetValue: company.annualTarget,
      targetLeads: company.targetLeads,
      targetDeals: company.targetDeals,
    },
    {
      id: `${SEED_ID_PREFIX}target-${company.slug}-core-team-2026`,
      companyId: company.id,
      name: `${company.name} Core Team 2026`,
      scope: 'team',
      period: 'yearly',
      year: 2026,
      teamId,
      targetValue: company.teamTarget,
      targetLeads: Math.round(company.targetLeads * 0.7),
      targetDeals: Math.round(company.targetDeals * 0.7),
    },
  ];

  for (let q = 1; q <= 4; q++) {
    const qShare = qShares[q - 1];
    if (qShare === undefined) throw new Error(`Missing quarter share for Q${q}`);
    const qTarget = company.annualTarget * (qShare / 100);

    targets.push({
      id: `${SEED_ID_PREFIX}target-${company.slug}-q${q}-2026`,
      companyId: company.id,
      name: `${company.name} Q${q} 2026`,
      scope: 'company',
      period: 'quarterly',
      year: 2026,
      quarter: q,
      targetValue: qTarget,
      shareOfParent: qShare,
    });

    for (const [category, split] of Object.entries(catSplits)) {
      targets.push({
        id: `${SEED_ID_PREFIX}target-${company.slug}-q${q}-2026-${category.toLowerCase()}`,
        companyId: company.id,
        name: `${company.name} Q${q} 2026 - ${category}`,
        scope: 'company',
        period: 'quarterly',
        year: 2026,
        quarter: q,
        category,
        targetValue: qTarget * split,
        shareOfParent: qShare,
      });
    }

    for (let m = 0; m < 3; m++) {
      const mShare = mSharesInQ[m];
      if (mShare === undefined) throw new Error(`Missing month share for quarter ${q}`);
      const month = (q - 1) * 3 + m + 1;
      targets.push({
        id: `${SEED_ID_PREFIX}target-${company.slug}-m${month}-2026`,
        companyId: company.id,
        name: `${company.name} M${month} 2026`,
        scope: 'company',
        period: 'monthly',
        year: 2026,
        quarter: q,
        month,
        targetValue: qTarget * (mShare / 100),
        shareOfParent: mShare,
      });
    }
  }

  for (const user of company.users) {
    const createdUser = requiredFromMap(users, user.key, 'target user');
    const multiplier = user.role === 'admin' ? 0.4 : user.role === 'manager' ? 0.35 : 0.25;
    targets.push({
      id: `${SEED_ID_PREFIX}target-${company.slug}-${user.key}-2026`,
      companyId: company.id,
      name: `${createdUser.name} 2026`,
      scope: 'individual',
      period: 'yearly',
      year: 2026,
      userId: createdUser.id,
      targetValue: company.annualTarget * multiplier,
      targetLeads: Math.max(12, Math.round(company.targetLeads * multiplier)),
      targetDeals: Math.max(4, Math.round(company.targetDeals * multiplier)),
    });
  }

  return targets;
}

async function seedCompany(company: SeedCompany, passwordHash: string) {
  await prisma.company.upsert({
    where: { id: company.id },
    update: { name: company.name, slug: company.slug, isActive: company.isActive },
    create: { id: company.id, name: company.name, slug: company.slug, isActive: company.isActive },
  });

  const users: UserMap = new Map();
  for (const user of company.users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        password: passwordHash,
        role: user.role,
        companyId: company.id,
        emailVerifiedAt: new Date(),
      },
      create: {
        email: user.email,
        password: passwordHash,
        name: user.name,
        role: user.role,
        companyId: company.id,
        emailVerifiedAt: new Date(),
      },
    });
    users.set(user.key, { id: created.id, name: created.name });
  }

  await prisma.billingAccount.upsert({
    where: { id: company.billing.id },
    update: {
      companyId: company.id,
      workspaceName: company.billing.workspaceName,
      plan: company.billing.plan,
      status: company.billing.status,
      seats: company.billing.seats,
      renewalDate: company.billing.renewalDate,
      externalCustomer: company.billing.externalCustomer,
    },
    create: {
      id: company.billing.id,
      companyId: company.id,
      workspaceName: company.billing.workspaceName,
      plan: company.billing.plan,
      status: company.billing.status,
      seats: company.billing.seats,
      renewalDate: company.billing.renewalDate,
      externalCustomer: company.billing.externalCustomer,
    },
  });

  for (const key of company.apiKeys) {
    const createdBy = requiredFromMap(users, key.createdByKey, 'API key user');
    await prisma.apiKey.upsert({
      where: { id: key.id },
      update: {
        companyId: company.id,
        name: key.name,
        keyHash: hashSecret(key.rawKey),
        keyPrefix: getKeyPrefix(key.rawKey),
        createdById: createdBy.id,
        lastUsedAt: key.lastUsedAt,
        revokedAt: key.revokedAt,
      },
      create: {
        id: key.id,
        companyId: company.id,
        name: key.name,
        keyHash: hashSecret(key.rawKey),
        keyPrefix: getKeyPrefix(key.rawKey),
        createdById: createdBy.id,
        lastUsedAt: key.lastUsedAt,
        revokedAt: key.revokedAt,
      },
    });
  }

  for (const webhook of company.webhooks) {
    const createdBy = requiredFromMap(users, webhook.createdByKey, 'webhook user');
    await prisma.webhookEndpoint.upsert({
      where: { id: webhook.id },
      update: {
        companyId: company.id,
        name: webhook.name,
        url: webhook.url,
        event: webhook.event,
        secret: `whsec_${company.slug.replace(/-/g, '_')}_${webhook.event}`,
        isActive: webhook.isActive,
        createdById: createdBy.id,
        lastTriggeredAt: webhook.lastTriggeredAt,
      },
      create: {
        id: webhook.id,
        companyId: company.id,
        name: webhook.name,
        url: webhook.url,
        event: webhook.event,
        secret: `whsec_${company.slug.replace(/-/g, '_')}_${webhook.event}`,
        isActive: webhook.isActive,
        createdById: createdBy.id,
        lastTriggeredAt: webhook.lastTriggeredAt,
      },
    });
  }

  const campaigns: CampaignMap = new Map();
  for (const campaign of company.campaigns) {
    const owner = requiredFromMap(users, campaign.ownerKey, 'campaign owner');
    const salesOwner = requiredFromMap(users, campaign.salesOwnerKey, 'campaign sales owner');
    const created = await prisma.campaign.upsert({
      where: { id: campaign.id },
      update: {
        companyId: company.id,
        name: campaign.name,
        channel: campaign.channel,
        type: campaign.type,
        cost: campaign.cost,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        ownerId: owner.id,
        salesOwnerId: salesOwner.id,
      },
      create: {
        id: campaign.id,
        companyId: company.id,
        name: campaign.name,
        channel: campaign.channel,
        type: campaign.type,
        cost: campaign.cost,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        createdAt: campaign.createdAt,
        ownerId: owner.id,
        salesOwnerId: salesOwner.id,
      },
    });
    campaigns.set(campaign.key, { id: created.id });
  }

  const leads: LeadMap = new Map();
  for (const lead of company.leads) {
    const owner = requiredFromMap(users, lead.ownerKey, 'lead owner');
    const campaign = lead.campaignKey ? requiredFromMap(campaigns, lead.campaignKey, 'lead campaign') : null;
    const created = await prisma.lead.upsert({
      where: { id: lead.id },
      update: {
        companyId: company.id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.companyName,
        source: lead.source,
        serviceType: lead.serviceType,
        status: lead.status,
        ownerId: owner.id,
        campaignId: campaign?.id ?? null,
        createdAt: lead.createdAt,
      },
      create: {
        id: lead.id,
        companyId: company.id,
        fullName: lead.fullName,
        email: lead.email,
        phone: lead.phone,
        companyName: lead.companyName,
        source: lead.source,
        serviceType: lead.serviceType,
        status: lead.status,
        ownerId: owner.id,
        campaignId: campaign?.id ?? null,
        createdAt: lead.createdAt,
      },
    });
    leads.set(lead.key, { id: created.id });
  }

  for (const deal of company.deals) {
    const lead = requiredFromMap(leads, deal.leadKey, 'deal lead');
    const owner = requiredFromMap(users, deal.ownerKey, 'deal owner');
    await prisma.deal.upsert({
      where: { id: deal.id },
      update: {
        companyId: company.id,
        leadId: lead.id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        ownerId: owner.id,
        expectedCloseDate: deal.expectedCloseDate,
        createdAt: deal.createdAt,
        closedAt: deal.closedAt,
        status: deal.stage === 'won' || deal.stage === 'lost' ? 'closed' : 'active',
      },
      create: {
        id: deal.id,
        companyId: company.id,
        leadId: lead.id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        ownerId: owner.id,
        expectedCloseDate: deal.expectedCloseDate,
        createdAt: deal.createdAt,
        closedAt: deal.closedAt,
        status: deal.stage === 'won' || deal.stage === 'lost' ? 'closed' : 'active',
      },
    });
  }

  for (const activity of company.activities) {
    const lead = requiredFromMap(leads, activity.leadKey, 'activity lead');
    const creator = requiredFromMap(users, activity.createdByKey, 'activity creator');
    await prisma.activity.upsert({
      where: { id: activity.id },
      update: {
        companyId: company.id,
        leadId: lead.id,
        type: activity.type,
        content: activity.content,
        createdBy: creator.id,
        createdAt: activity.createdAt,
      },
      create: {
        id: activity.id,
        companyId: company.id,
        leadId: lead.id,
        type: activity.type,
        content: activity.content,
        createdBy: creator.id,
        createdAt: activity.createdAt,
      },
    });
  }

  const manager = requiredFromMap(users, 'manager', 'team manager');
  const admin = requiredFromMap(users, 'admin', 'team admin');
  const employee = requiredFromMap(users, 'employee', 'team employee');
  const team = await prisma.salesTeam.upsert({
    where: { id: `${SEED_ID_PREFIX}team-${company.slug}-core` },
    update: { companyId: company.id, name: 'Core Sales Team', managerId: manager.id },
    create: {
      id: `${SEED_ID_PREFIX}team-${company.slug}-core`,
      companyId: company.id,
      name: 'Core Sales Team',
      managerId: manager.id,
    },
  });

  for (const userId of [admin.id, manager.id, employee.id]) {
    await prisma.salesTeamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId } },
      update: {},
      create: { teamId: team.id, userId },
    });
  }

  const targets = buildCompanyTargets(company, users, team.id);
  for (const { id, ...targetData } of targets) {
    await prisma.salesTarget.upsert({
      where: { id },
      update: targetData,
      create: { id, ...targetData },
    });
  }

  console.log(`Seeded ${company.name}: ${company.users.length} users, ${company.leads.length} leads, ${company.deals.length} deals`);
}

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash('admin123', 10);

  const superadmin = await prisma.user.upsert({
    where: { email: 'superadmin@flowraze.com' },
    update: {
      password: passwordHash,
      name: 'Super Admin',
      role: 'superadmin',
      companyId: null,
      emailVerifiedAt: new Date(),
    },
    create: {
      email: 'superadmin@flowraze.com',
      password: passwordHash,
      name: 'Super Admin',
      role: 'superadmin',
      companyId: null,
      emailVerifiedAt: new Date(),
    },
  });

  const companies: SeedCompany[] = [
    {
      id: 'default-company-id',
      name: 'FlowRaze Demo Agency',
      slug: 'flowraze-demo',
      isActive: true,
      billing: {
        id: 'default-workspace',
        workspaceName: 'FlowRaze Growth Workspace',
        plan: 'growth',
        status: 'trialing',
        seats: 8,
        renewalDate: new Date('2026-12-01T00:00:00.000Z'),
        externalCustomer: 'cus_demo_growth',
      },
      users: [
        { key: 'admin', email: 'admin@flowraze.com', name: 'Admin User', role: 'admin' },
        { key: 'manager', email: 'sarah@flowraze.com', name: 'Sarah Chen', role: 'manager' },
        { key: 'employee', email: 'michael@flowraze.com', name: 'Michael Rodriguez', role: 'employee' },
      ],
      apiKeys: [
        { id: 'seed-api-key-flowraze-demo', name: 'Demo Website Integration', rawKey: 'frk_flowraze_demo_seed_key_0001', createdByKey: 'admin', lastUsedAt: monthsAgo(0, 5), revokedAt: null },
      ],
      webhooks: [
        { id: 'seed-webhook-flowraze-demo-deal-won', name: 'Deal Won Slack Alert', url: 'https://hooks.example.com/flowraze/deal-won', event: 'deal_won', createdByKey: 'admin', isActive: true, lastTriggeredAt: monthsAgo(0, 4) },
      ],
      campaigns: [
        { key: 'summer', id: 'seed-campaign-summer-sale-2025', name: 'Summer Sale 2025', channel: 'Email', type: 'Project', cost: 5_000_000, startDate: monthsAgo(5, 1), endDate: monthsAgo(3, 28), createdAt: monthsAgo(5, 1), ownerKey: 'admin', salesOwnerKey: 'manager' },
        { key: 'linkedin', id: 'seed-campaign-linkedin-outreach', name: 'LinkedIn Outreach', channel: 'Social', type: 'Retainer', cost: 3_000_000, startDate: monthsAgo(4, 1), endDate: monthsAgo(1, 28), createdAt: monthsAgo(4, 1), ownerKey: 'admin', salesOwnerKey: 'employee' },
        { key: 'google', id: 'seed-campaign-google-ads-q1-2026', name: 'Google Ads Q1 2026', channel: 'Paid', type: 'GMV', cost: 10_000_000, startDate: monthsAgo(3, 1), endDate: monthsAgo(1, 28), createdAt: monthsAgo(3, 1), ownerKey: 'manager', salesOwnerKey: 'manager' },
        { key: 'content', id: 'seed-campaign-content-marketing-q2', name: 'Content Marketing Q2', channel: 'Organic', type: 'Project', cost: 2_500_000, startDate: monthsAgo(2, 1), endDate: null, createdAt: monthsAgo(2, 1), ownerKey: 'admin', salesOwnerKey: 'manager' },
      ],
      leads: [
        { key: 'john', id: 'seed-lead-john-smith', fullName: 'John Smith', email: 'john@techstartup.io', phone: '+6281234567890', companyName: 'TechStartup Inc', source: 'Website', serviceType: 'Development', status: 'qualified', ownerKey: 'manager', campaignKey: 'summer', createdAt: monthsAgo(5, 5) },
        { key: 'emma', id: 'seed-lead-emma-wilson', fullName: 'Emma Wilson', email: 'emma@designstudio.co', phone: '+6282345678901', companyName: 'Design Studio Co', source: 'Referral', serviceType: 'Design', status: 'contacted', ownerKey: 'manager', campaignKey: null, createdAt: monthsAgo(5, 12) },
        { key: 'david', id: 'seed-lead-david-brown', fullName: 'David Brown', email: 'david@retailbusiness.com', phone: '+6283456789012', companyName: 'Retail Business Ltd', source: 'LinkedIn', serviceType: 'Consulting', status: 'new', ownerKey: 'employee', campaignKey: 'linkedin', createdAt: monthsAgo(4, 3) },
        { key: 'lisa', id: 'seed-lead-lisa-anderson', fullName: 'Lisa Anderson', email: 'lisa@marketingagency.net', phone: '+6284567890123', companyName: 'Marketing Agency', source: 'Google Ads', serviceType: 'Marketing', status: 'qualified', ownerKey: 'manager', campaignKey: 'google', createdAt: monthsAgo(4, 18) },
        { key: 'robert', id: 'seed-lead-robert-taylor', fullName: 'Robert Taylor', email: 'robert@consultingfirm.io', phone: '+6285678901234', companyName: 'Consulting Firm', source: 'Website', serviceType: 'Consulting', status: 'contacted', ownerKey: 'employee', campaignKey: null, createdAt: monthsAgo(3, 7) },
        { key: 'jennifer', id: 'seed-lead-jennifer-martinez', fullName: 'Jennifer Martinez', email: 'jennifer@ecommerce.co', phone: '+6286789012345', companyName: 'E-Commerce Plus', source: 'Referral', serviceType: 'Development', status: 'new', ownerKey: 'manager', campaignKey: null, createdAt: monthsAgo(3, 20) },
        { key: 'william', id: 'seed-lead-william-johnson', fullName: 'William Johnson', email: 'william@saascompany.com', phone: '+6287890123456', companyName: 'SaaS Company', source: 'Email', serviceType: 'Support', status: 'qualified', ownerKey: 'employee', campaignKey: 'summer', createdAt: monthsAgo(2, 8) },
        { key: 'amanda', id: 'seed-lead-amanda-davis', fullName: 'Amanda Davis', email: 'amanda@foodbusiness.net', phone: '+6288901234567', companyName: 'Food Business Inc', source: 'LinkedIn', serviceType: 'Design', status: 'contacted', ownerKey: 'manager', campaignKey: 'linkedin', createdAt: monthsAgo(2, 22) },
        { key: 'kevin', id: 'seed-lead-kevin-park', fullName: 'Kevin Park', email: 'kevin@fintech.io', phone: '+6289012345678', companyName: 'FinTech Solutions', source: 'Google Ads', serviceType: 'Development', status: 'qualified', ownerKey: 'manager', campaignKey: 'content', createdAt: monthsAgo(1, 5) },
        { key: 'sandra', id: 'seed-lead-sandra-lee', fullName: 'Sandra Lee', email: 'sandra@healthtech.co', phone: '+6289123456789', companyName: 'HealthTech Co', source: 'Website', serviceType: 'Consulting', status: 'new', ownerKey: 'employee', campaignKey: null, createdAt: monthsAgo(1, 15) },
        { key: 'mark', id: 'seed-lead-mark-thompson', fullName: 'Mark Thompson', email: 'mark@logistics.com', phone: '+6289234567890', companyName: 'Logistics Plus', source: 'Referral', serviceType: 'Logistics', status: 'contacted', ownerKey: 'manager', campaignKey: 'content', createdAt: monthsAgo(0, 3) },
        { key: 'priya', id: 'seed-lead-priya-sharma', fullName: 'Priya Sharma', email: 'priya@edtech.net', phone: '+6289345678901', companyName: 'EduTech Inc', source: 'LinkedIn', serviceType: 'Marketing', status: 'new', ownerKey: 'employee', campaignKey: null, createdAt: monthsAgo(0, 8) },
      ],
      deals: [
        { id: 'seed-deal-enterprise-license', leadKey: 'john', title: 'Enterprise License', value: 75_000_000, stage: 'won', ownerKey: 'manager', expectedCloseDate: monthsAgo(5, 20), createdAt: monthsAgo(5, 10), closedAt: monthsAgo(5, 20) },
        { id: 'seed-deal-standard-package', leadKey: 'david', title: 'Standard Package', value: 25_000_000, stage: 'won', ownerKey: 'employee', expectedCloseDate: monthsAgo(4, 25), createdAt: monthsAgo(4, 5), closedAt: monthsAgo(4, 25) },
        { id: 'seed-deal-premium-plan', leadKey: 'lisa', title: 'Premium Plan', value: 100_000_000, stage: 'won', ownerKey: 'manager', expectedCloseDate: monthsAgo(3, 15), createdAt: monthsAgo(3, 8), closedAt: monthsAgo(3, 15) },
        { id: 'seed-deal-annual-subscription', leadKey: 'william', title: 'Annual Subscription', value: 50_000_000, stage: 'won', ownerKey: 'employee', expectedCloseDate: monthsAgo(2, 18), createdAt: monthsAgo(2, 10), closedAt: monthsAgo(2, 18) },
        { id: 'seed-deal-growth-package', leadKey: 'kevin', title: 'Growth Package', value: 35_000_000, stage: 'won', ownerKey: 'manager', expectedCloseDate: monthsAgo(1, 20), createdAt: monthsAgo(1, 8), closedAt: monthsAgo(1, 20) },
        { id: 'seed-deal-design-retainer', leadKey: 'emma', title: 'Design Retainer', value: 20_000_000, stage: 'proposal', ownerKey: 'manager', expectedCloseDate: monthsAgo(-1, 15), createdAt: monthsAgo(4, 20), closedAt: null },
        { id: 'seed-deal-consulting-bundle', leadKey: 'robert', title: 'Consulting Bundle', value: 45_000_000, stage: 'negotiation', ownerKey: 'employee', expectedCloseDate: monthsAgo(-1, 30), createdAt: monthsAgo(3, 12), closedAt: null },
        { id: 'seed-deal-starter-package', leadKey: 'jennifer', title: 'Starter Package', value: 15_000_000, stage: 'qualified', ownerKey: 'manager', expectedCloseDate: monthsAgo(-2, 10), createdAt: monthsAgo(2, 25), closedAt: null },
        { id: 'seed-deal-healthtech-saas', leadKey: 'sandra', title: 'HealthTech SaaS', value: 30_000_000, stage: 'new', ownerKey: 'employee', expectedCloseDate: monthsAgo(-2, 20), createdAt: monthsAgo(1, 16), closedAt: null },
        { id: 'seed-deal-logistics-platform', leadKey: 'mark', title: 'Logistics Platform', value: 60_000_000, stage: 'qualified', ownerKey: 'manager', expectedCloseDate: monthsAgo(-1, 15), createdAt: monthsAgo(0, 5), closedAt: null },
        { id: 'seed-deal-basic-package', leadKey: 'amanda', title: 'Basic Package', value: 10_000_000, stage: 'lost', ownerKey: 'employee', expectedCloseDate: monthsAgo(1, 28), createdAt: monthsAgo(2, 23), closedAt: null },
      ],
      activities: [
        { id: 'seed-activity-john-discovery-note', leadKey: 'john', type: 'note', content: 'Initial discovery call completed. Client interested in enterprise features.', createdByKey: 'manager', createdAt: monthsAgo(5, 6) },
        { id: 'seed-activity-emma-demo-follow-up', leadKey: 'emma', type: 'follow_up', content: 'Scheduled demo for next week.', createdByKey: 'manager', createdAt: monthsAgo(5, 14) },
        { id: 'seed-activity-lisa-contract-note', leadKey: 'lisa', type: 'note', content: 'Contract signed. Implementation starting soon.', createdByKey: 'manager', createdAt: monthsAgo(3, 16) },
        { id: 'seed-activity-robert-requirements-call', leadKey: 'robert', type: 'call', content: 'Discussed requirements and prepared proposal.', createdByKey: 'employee', createdAt: monthsAgo(3, 10) },
        { id: 'seed-activity-william-closed-note', leadKey: 'william', type: 'note', content: 'Closed deal. Annual subscription includes premium support.', createdByKey: 'employee', createdAt: monthsAgo(2, 19) },
        { id: 'seed-activity-kevin-demo-call', leadKey: 'kevin', type: 'call', content: 'Demo completed, customer loves the product. Moving to negotiation.', createdByKey: 'manager', createdAt: monthsAgo(1, 12) },
        { id: 'seed-activity-sandra-proposal-follow-up', leadKey: 'sandra', type: 'follow_up', content: 'Sent proposal document. Awaiting feedback.', createdByKey: 'employee', createdAt: monthsAgo(1, 18) },
      ],
      annualTarget: 24_643_948_000,
      teamTarget: 18_000_000_000,
      targetLeads: 200,
      targetDeals: 80,
    },
    {
      id: 'seed-company-nusantara-retail',
      name: 'Nusantara Retail Group',
      slug: 'nusantara-retail',
      isActive: true,
      billing: {
        id: 'seed-billing-nusantara-retail',
        workspaceName: 'Nusantara Retail Starter Workspace',
        plan: 'starter',
        status: 'active',
        seats: 3,
        renewalDate: null,
        externalCustomer: 'cus_demo_starter_retail',
      },
      users: [
        { key: 'admin', email: 'admin@nusantara-retail.demo', name: 'Dewi Lestari', role: 'admin' },
        { key: 'manager', email: 'maya@nusantara-retail.demo', name: 'Maya Putri', role: 'manager' },
        { key: 'employee', email: 'rio@nusantara-retail.demo', name: 'Rio Pratama', role: 'employee' },
      ],
      apiKeys: [
        { id: 'seed-api-key-nusantara-retail', name: 'POS Import Sandbox', rawKey: 'frk_nusantara_retail_seed_0001', createdByKey: 'admin', lastUsedAt: null, revokedAt: null },
      ],
      webhooks: [
        { id: 'seed-webhook-nusantara-retail-lead-created', name: 'Lead Created CRM Sync', url: 'https://hooks.example.com/nusantara/leads', event: 'lead_created', createdByKey: 'admin', isActive: false, lastTriggeredAt: null },
      ],
      campaigns: [
        { key: 'bazaar', id: 'seed-campaign-nusantara-weekend-bazaar', name: 'Weekend Bazaar Lead Drive', channel: 'Offline', type: 'Project', cost: 1_200_000, startDate: monthsAgo(3, 1), endDate: monthsAgo(2, 15), createdAt: monthsAgo(3, 1), ownerKey: 'admin', salesOwnerKey: 'manager' },
        { key: 'wa', id: 'seed-campaign-nusantara-whatsapp-reactivation', name: 'WhatsApp Reactivation', channel: 'Messaging', type: 'Retainer', cost: 750_000, startDate: monthsAgo(1, 1), endDate: null, createdAt: monthsAgo(1, 1), ownerKey: 'manager', salesOwnerKey: 'employee' },
      ],
      leads: [
        { key: 'andika', id: 'seed-lead-nusantara-andika', fullName: 'Andika Suryanto', email: 'andika@freshmart.demo', phone: '+6281110002201', companyName: 'FreshMart Bandung', source: 'Offline Event', serviceType: 'Retail CRM', status: 'qualified', ownerKey: 'manager', campaignKey: 'bazaar', createdAt: monthsAgo(3, 6) },
        { key: 'sinta', id: 'seed-lead-nusantara-sinta', fullName: 'Sinta Wijaya', email: 'sinta@homestore.demo', phone: '+6281110002202', companyName: 'HomeStore Surabaya', source: 'WhatsApp', serviceType: 'Inventory Sync', status: 'contacted', ownerKey: 'employee', campaignKey: 'wa', createdAt: monthsAgo(1, 9) },
        { key: 'bima', id: 'seed-lead-nusantara-bima', fullName: 'Bima Hartono', email: 'bima@kopimaju.demo', phone: '+6281110002203', companyName: 'Kopi Maju', source: 'Referral', serviceType: 'Loyalty Program', status: 'new', ownerKey: 'employee', campaignKey: null, createdAt: monthsAgo(0, 3) },
      ],
      deals: [
        { id: 'seed-deal-nusantara-freshmart-rollout', leadKey: 'andika', title: 'FreshMart CRM Rollout', value: 12_000_000, stage: 'won', ownerKey: 'manager', expectedCloseDate: monthsAgo(2, 14), createdAt: monthsAgo(3, 8), closedAt: monthsAgo(2, 14) },
        { id: 'seed-deal-nusantara-homestore-sync', leadKey: 'sinta', title: 'HomeStore Inventory Sync', value: 7_500_000, stage: 'proposal', ownerKey: 'employee', expectedCloseDate: monthsAgo(-1, 12), createdAt: monthsAgo(1, 12), closedAt: null },
        { id: 'seed-deal-nusantara-kopimaju-loyalty', leadKey: 'bima', title: 'Kopi Maju Loyalty Pilot', value: 4_500_000, stage: 'new', ownerKey: 'employee', expectedCloseDate: monthsAgo(-2, 4), createdAt: monthsAgo(0, 4), closedAt: null },
      ],
      activities: [
        { id: 'seed-activity-nusantara-andika-note', leadKey: 'andika', type: 'note', content: 'Needs simple retail pipeline and branch-level reporting.', createdByKey: 'manager', createdAt: monthsAgo(3, 7) },
        { id: 'seed-activity-nusantara-sinta-call', leadKey: 'sinta', type: 'call', content: 'Confirmed POS export format and monthly sync cadence.', createdByKey: 'employee', createdAt: monthsAgo(1, 10) },
      ],
      annualTarget: 1_200_000_000,
      teamTarget: 850_000_000,
      targetLeads: 72,
      targetDeals: 24,
    },
    {
      id: 'seed-company-byteworks-cloud',
      name: 'ByteWorks Cloud',
      slug: 'byteworks-cloud',
      isActive: true,
      billing: {
        id: 'seed-billing-byteworks-cloud',
        workspaceName: 'ByteWorks Custom Workspace',
        plan: 'custom',
        status: 'past_due',
        seats: 18,
        renewalDate: new Date('2026-06-15T00:00:00.000Z'),
        externalCustomer: 'cus_demo_custom_byteworks',
      },
      users: [
        { key: 'admin', email: 'admin@byteworks-cloud.demo', name: 'Alicia Tan', role: 'admin' },
        { key: 'manager', email: 'kenji@byteworks-cloud.demo', name: 'Kenji Mori', role: 'manager' },
        { key: 'employee', email: 'nora@byteworks-cloud.demo', name: 'Nora Williams', role: 'employee' },
      ],
      apiKeys: [
        { id: 'seed-api-key-byteworks-cloud', name: 'Product Telemetry API', rawKey: 'frk_byteworks_cloud_seed_0001', createdByKey: 'admin', lastUsedAt: monthsAgo(0, 2), revokedAt: null },
      ],
      webhooks: [
        { id: 'seed-webhook-byteworks-cloud-activity-created', name: 'Activity Created Data Warehouse', url: 'https://hooks.example.com/byteworks/activity', event: 'activity_created', createdByKey: 'admin', isActive: true, lastTriggeredAt: monthsAgo(0, 2) },
      ],
      campaigns: [
        { key: 'launch', id: 'seed-campaign-byteworks-ai-launch', name: 'AI Ops Launch', channel: 'Paid', type: 'GMV', cost: 18_000_000, startDate: monthsAgo(4, 1), endDate: monthsAgo(1, 30), createdAt: monthsAgo(4, 1), ownerKey: 'admin', salesOwnerKey: 'manager' },
        { key: 'partner', id: 'seed-campaign-byteworks-partner-webinar', name: 'Partner Webinar Series', channel: 'Webinar', type: 'Retainer', cost: 6_500_000, startDate: monthsAgo(2, 1), endDate: null, createdAt: monthsAgo(2, 1), ownerKey: 'manager', salesOwnerKey: 'employee' },
      ],
      leads: [
        { key: 'oliver', id: 'seed-lead-byteworks-oliver', fullName: 'Oliver Grant', email: 'oliver@northstar.dev', phone: '+6281120003301', companyName: 'Northstar DevOps', source: 'Paid Search', serviceType: 'Cloud Automation', status: 'qualified', ownerKey: 'manager', campaignKey: 'launch', createdAt: monthsAgo(4, 9) },
        { key: 'nadia', id: 'seed-lead-byteworks-nadia', fullName: 'Nadia Rahman', email: 'nadia@finops.demo', phone: '+6281120003302', companyName: 'FinOps Collective', source: 'Webinar', serviceType: 'Managed Cloud', status: 'contacted', ownerKey: 'employee', campaignKey: 'partner', createdAt: monthsAgo(2, 11) },
        { key: 'ethan', id: 'seed-lead-byteworks-ethan', fullName: 'Ethan Brooks', email: 'ethan@logilytics.demo', phone: '+6281120003303', companyName: 'Logilytics', source: 'Partner', serviceType: 'Data Platform', status: 'qualified', ownerKey: 'manager', campaignKey: 'partner', createdAt: monthsAgo(1, 18) },
      ],
      deals: [
        { id: 'seed-deal-byteworks-northstar-aiops', leadKey: 'oliver', title: 'Northstar AI Ops Platform', value: 220_000_000, stage: 'won', ownerKey: 'manager', expectedCloseDate: monthsAgo(3, 22), createdAt: monthsAgo(4, 12), closedAt: monthsAgo(3, 22) },
        { id: 'seed-deal-byteworks-finops-managed-cloud', leadKey: 'nadia', title: 'FinOps Managed Cloud Retainer', value: 96_000_000, stage: 'negotiation', ownerKey: 'employee', expectedCloseDate: monthsAgo(-1, 18), createdAt: monthsAgo(2, 13), closedAt: null },
        { id: 'seed-deal-byteworks-logilytics-platform', leadKey: 'ethan', title: 'Logilytics Data Platform', value: 145_000_000, stage: 'proposal', ownerKey: 'manager', expectedCloseDate: monthsAgo(-2, 20), createdAt: monthsAgo(1, 20), closedAt: null },
      ],
      activities: [
        { id: 'seed-activity-byteworks-oliver-note', leadKey: 'oliver', type: 'note', content: 'Enterprise security review completed with infrastructure team.', createdByKey: 'manager', createdAt: monthsAgo(4, 14) },
        { id: 'seed-activity-byteworks-nadia-followup', leadKey: 'nadia', type: 'follow_up', content: 'Send revised managed cloud scope after procurement review.', createdByKey: 'employee', createdAt: monthsAgo(2, 18) },
      ],
      annualTarget: 9_600_000_000,
      teamTarget: 7_200_000_000,
      targetLeads: 120,
      targetDeals: 42,
    },
  ];

  console.log('Created superadmin:', superadmin.email);

  for (const company of companies) {
    await seedCompany(company, passwordHash);
  }

  console.log('Database seeded successfully!');
  console.log('Demo password for all seeded users: admin123');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
