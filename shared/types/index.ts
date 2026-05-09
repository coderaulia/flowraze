export interface User {
  id: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin' | 'staff';
  emailVerifiedAt?: Date | string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  source: string;
  campaignId?: string;
  ownerId: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type DealStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  leadId: string;
  title: string;
  value: number;
  stage: DealStage;
  ownerId: string;
  expectedCloseDate?: Date;
  status: 'active' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  type?: string;
  channel: string;
  cost?: number;
  startDate: Date | string;
  endDate?: Date | string;
  ownerId?: string;
  salesOwnerId?: string;
  createdAt: Date | string;
  owner?: { id: string; name: string; email: string };
  salesOwner?: { id: string; name: string; email: string };
  leads?: (Lead & { deals?: Deal[] })[];
}

export type ActivityType = 'note' | 'call' | 'follow_up';

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  content: string;
  createdBy: string;
  createdAt: Date;
  lead?: { id: string; fullName: string };
  creator?: { id: string; name: string };
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: Date | string;
  lastUsedAt?: Date | string | null;
  revokedAt?: Date | string | null;
}

export type WebhookEvent = 'lead_created' | 'deal_created' | 'deal_won' | 'activity_created';
export type WebhookStatus = 'success' | 'failed';

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  status: WebhookStatus;
  responseStatus?: number | null;
  error?: string | null;
  createdAt: Date | string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  event: WebhookEvent;
  secret: string;
  isActive: boolean;
  lastTriggeredAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  deliveries?: WebhookDelivery[];
}

export type PlanTier = 'free' | 'growth' | 'pro' | 'custom';
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface BillingAccount {
  id: string;
  workspaceName: string;
  plan: PlanTier;
  status: BillingStatus;
  seats: number;
  renewalDate?: Date | string | null;
  externalCustomer?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface DashboardStats {
  range: '7d' | '30d' | '90d' | '12m' | 'all';
  totalLeads: number;
  totalDeals: number;
  wonRevenue: number;
  conversionRate: number;
  leadsBySource: Record<string, number>;
  revenueOverTime: { month: string; revenue: number }[];
  leadsOverTime: { month: string; leads: number }[];
  dealsByStage: Record<DealStage, number>;
  campaignOverview: {
    total: number;
    active: number;
    totalCost: number;
    leadsGenerated: number;
    topChannel: string | null;
  };
}

export interface TeamPerformance {
  userId: string;
  userName: string;
  leadsAssigned: number;
  dealsWon: number;
  revenueClosed: number;
  activitiesLogged: number;
}

export type TargetScope = 'company' | 'team' | 'individual';
export type TargetPeriod = 'monthly' | 'quarterly' | 'yearly';

export interface SalesTeam {
  id: string;
  name: string;
  managerId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  manager?: { id: string; name: string; email: string };
  members?: { teamId: string; userId: string; user: User }[];
}

export interface SalesTarget {
  id: string;
  name: string;
  scope: TargetScope;
  userId?: string | null;
  teamId?: string | null;
  period: TargetPeriod;
  year: number;
  quarter?: number | null;
  month?: number | null;
  targetValue: number;
  targetLeads?: number | null;
  targetDeals?: number | null;
  category?: string | null;
  shareOfParent?: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  user?: { id: string; name: string };
  team?: { id: string; name: string };
}

export interface TargetAchievement {
  year: number;
  quarter: number | null;
  month: number | null;
  period: TargetPeriod;
  scope: TargetScope;
  revenueTarget: number;
  revenueActual: number;
  achievementPct: number;
  remainingTarget: number;
  leadsTarget: number | null;
  leadsActual: number;
  dealsTarget: number | null;
  dealsActual: number;
  activeCampaigns: number;
  categories: {
    name: string;
    target: number;
    actual: number;
    pct: number;
  }[];
  monthlyBreakdown: {
    month: string;
    monthIndex: number;
    quarter: number;
    target: number;
    actual: number;
    pct: number;
    shareOfParent: number | null;
    remaining: number;
    qTarget: number;
  }[];
  quarterlyBreakdown: {
    quarter: string;
    quarterIndex: number;
    target: number;
    actual: number;
    pct: number;
    shareOfParent: number | null;
    remaining: number;
  }[];
  leaderboard: {
    userId: string;
    userName: string;
    actual: number;
    target: number;
    pct: number;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}
