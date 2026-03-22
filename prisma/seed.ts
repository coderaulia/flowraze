import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

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

  const campaign1 = await prisma.campaign.create({
    data: {
      name: 'Summer Sale 2024',
      channel: 'Email',
      cost: 5000000,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      name: 'LinkedIn Outreach',
      channel: 'Social',
      cost: 3000000,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-12-31'),
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      name: 'Google Ads Q3',
      channel: 'Paid',
      cost: 10000000,
      startDate: new Date('2024-07-01'),
      endDate: new Date('2024-09-30'),
    },
  });

  console.log('Created campaigns:', { campaign1, campaign2, campaign3 });

  const leadsData = [
    { fullName: 'John Smith', email: 'john@techstartup.io', phone: '+6281234567890', companyName: 'TechStartup Inc', source: 'Website', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign1.id },
    { fullName: 'Emma Wilson', email: 'emma@designstudio.co', phone: '+6282345678901', companyName: 'Design Studio Co', source: 'Referral', status: 'contacted' as const, ownerId: staff1.id, campaignId: null },
    { fullName: 'David Brown', email: 'david@retailbusiness.com', phone: '+6283456789012', companyName: 'Retail Business Ltd', source: 'LinkedIn', status: 'new' as const, ownerId: staff2.id, campaignId: campaign2.id },
    { fullName: 'Lisa Anderson', email: 'lisa@marketingagency.net', phone: '+6284567890123', companyName: 'Marketing Agency', source: 'Google Ads', status: 'qualified' as const, ownerId: staff1.id, campaignId: campaign3.id },
    { fullName: 'Robert Taylor', email: 'robert@consultingfirm.io', phone: '+6285678901234', companyName: 'Consulting Firm', source: 'Website', status: 'contacted' as const, ownerId: staff2.id, campaignId: null },
    { fullName: 'Jennifer Martinez', email: 'jennifer@ecommerce.co', phone: '+6286789012345', companyName: 'E-Commerce Plus', source: 'Referral', status: 'new' as const, ownerId: staff1.id, campaignId: null },
    { fullName: 'William Johnson', email: 'william@saascompany.com', phone: '+6287890123456', companyName: 'SaaS Company', source: 'Email', status: 'qualified' as const, ownerId: staff2.id, campaignId: campaign1.id },
    { fullName: 'Amanda Davis', email: 'amanda@foodbusiness.net', phone: '+6288901234567', companyName: 'Food Business Inc', source: 'LinkedIn', status: 'contacted' as const, ownerId: staff1.id, campaignId: campaign2.id },
  ];

  const leads = [];
  for (const leadData of leadsData) {
    const lead = await prisma.lead.create({ data: leadData });
    leads.push(lead);
  }

  console.log('Created leads:', leads.length);

  const dealsData = [
    { leadId: leads[0]?.id ?? '', title: 'Enterprise License', value: 50000000, stage: 'proposal' as const, ownerId: staff1.id, expectedCloseDate: new Date('2024-09-15') },
    { leadId: leads[1]?.id ?? '', title: 'Standard Package', value: 25000000, stage: 'negotiation' as const, ownerId: staff1.id, expectedCloseDate: new Date('2024-08-30') },
    { leadId: leads[3]?.id ?? '', title: 'Premium Plan', value: 75000000, stage: 'won' as const, ownerId: staff1.id, expectedCloseDate: new Date('2024-07-20') },
    { leadId: leads[4]?.id ?? '', title: 'Starter Package', value: 15000000, stage: 'qualified' as const, ownerId: staff2.id, expectedCloseDate: new Date('2024-10-01') },
    { leadId: leads[6]?.id ?? '', title: 'Annual Subscription', value: 100000000, stage: 'won' as const, ownerId: staff2.id, expectedCloseDate: new Date('2024-06-15') },
    { leadId: leads[2]?.id ?? '', title: 'Basic Package', value: 10000000, stage: 'new' as const, ownerId: staff2.id, expectedCloseDate: new Date('2024-11-01') },
    { leadId: leads[5]?.id ?? '', title: 'Growth Package', value: 35000000, stage: 'lost' as const, ownerId: staff1.id },
  ];

  const deals = [];
  for (const dealData of dealsData) {
    if (dealData.leadId) {
      const deal = await prisma.deal.create({ data: dealData });
      deals.push(deal);
    }
  }

  console.log('Created deals:', deals.length);

  const activitiesData = [
    { leadId: leads[0]?.id ?? '', type: 'note' as const, content: 'Initial discovery call completed. Client interested in enterprise features.', createdBy: staff1.id },
    { leadId: leads[0]?.id ?? '', type: 'call' as const, content: 'Follow-up call to discuss pricing and implementation timeline.', createdBy: staff1.id },
    { leadId: leads[1]?.id ?? '', type: 'follow_up' as const, content: 'Scheduled demo for next week.', createdBy: staff1.id },
    { leadId: leads[3]?.id ?? '', type: 'note' as const, content: 'Contract signed. Implementation starting soon.', createdBy: staff1.id },
    { leadId: leads[4]?.id ?? '', type: 'call' as const, content: 'Discussed requirements and prepared proposal.', createdBy: staff2.id },
    { leadId: leads[6]?.id ?? '', type: 'note' as const, content: 'Closed deal! Annual subscription with premium support.', createdBy: staff2.id },
  ];

  for (const activityData of activitiesData) {
    if (activityData.leadId) {
      await prisma.activity.create({ data: activityData });
    }
  }

  console.log('Created activities:', activitiesData.length);

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
