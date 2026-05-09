export type UserRole = 'superadmin' | 'admin' | 'staff';
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified';
export type DealStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type DealStatus = 'active' | 'closed';
export type ActivityType = 'note' | 'call' | 'follow_up';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
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
  status: LeadStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deal {
  id: string;
  leadId: string;
  title: string;
  value: number;
  stage: DealStage;
  ownerId: string;
  expectedCloseDate?: Date;
  status: DealStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  name: string;
  channel: string;
  cost?: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

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
  createdBy?: { id: string; name: string; email: string };
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

export interface SearchResults {
  leads: Lead[];
  deals: Deal[];
  campaigns: Campaign[];
  activities: Activity[];
}

export interface DashboardStats {
  range: '30d' | '90d' | '6m' | '12m' | 'all';
  totalLeads: number;
  totalDeals: number;
  wonRevenue: number;
  conversionRate: number;
  leadsBySource: Record<string, number>;
  revenueOverTime: { month: string; revenue: number }[];
  dealsByStage: Record<DealStage, number>;
}

export interface TeamPerformance {
  userId: string;
  userName: string;
  leadsAssigned: number;
  dealsWon: number;
  revenueClosed: number;
  activitiesLogged: number;
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
