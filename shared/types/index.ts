export type UserRole = 'superadmin' | 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string | null;
  emailVerifiedAt?: Date | string | null;
  invitePending?: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  company?: { id: string; name: string };
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

export type WebhookEvent =
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
export type WebhookStatus = 'pending' | 'success' | 'failed';

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  event: WebhookEvent;
  status: WebhookStatus;
  responseStatus?: number | null;
  error?: string | null;
  retryCount: number;
  nextRetryAt?: Date | string | null;
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

export type AutomationTriggerEvent = 'manual' | WebhookEvent;
export type AutomationActionType =
  | 'create_activity'
  | 'update_lead_status'
  | 'assign_owner'
  | 'send_notification'
  | 'fire_webhook';
export type AutomationRunStatus = 'pending' | 'running' | 'success' | 'failed';

export interface AutomationRun {
  id: string;
  ruleId: string;
  triggerEvent: AutomationTriggerEvent;
  actionType: AutomationActionType;
  payload: Record<string, unknown>;
  status: AutomationRunStatus;
  result?: Record<string, unknown> | null;
  error?: string | null;
  retryCount: number;
  nextRetryAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerEvent: AutomationTriggerEvent;
  actionType: AutomationActionType;
  actionConfig: {
    activityType?: ActivityType;
    content?: string;
    status?: Lead['status'];
    userId?: string;
    title?: string;
    body?: string;
    recipientRole?: 'all' | 'admin' | 'manager';
    url?: string;
    method?: string;
    secret?: string;
  };
  isActive: boolean;
  lastTriggeredAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  runs?: AutomationRun[];
}

export type SupportTicketType = 'bug' | 'question' | 'onboarding' | 'billing' | 'feature_request';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type SupportTicketStatus = 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  companyId: string;
  requesterId: string;
  assignedToId?: string | null;
  type: SupportTicketType;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  subject: string;
  description: string;
  pageUrl?: string | null;
  browserInfo?: string | null;
  slaDueAt?: Date | string | null;
  resolvedAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  requester?: { id: string; name: string; email: string };
  assignedTo?: { id: string; name: string; email: string } | null;
}

export type PlanTier = 'starter' | 'growth' | 'custom';
export type BillingStatus = 'trialing' | 'active' | 'past_due' | 'canceled';
export type InvoiceStatus = 'open' | 'paid' | 'void' | 'overdue';
export type PaymentStatus = 'pending' | 'paid' | 'rejected' | 'expired';

export interface BillingAccount {
  id: string;
  companyId: string;
  workspaceName: string;
  plan: PlanTier;
  status: BillingStatus;
  seats: number;
  renewalDate?: Date | string | null;
  trialStartedAt?: Date | string | null;
  trialEndsAt?: Date | string | null;
  subscriptionStartedAt?: Date | string | null;
  subscriptionEndsAt?: Date | string | null;
  canceledAt?: Date | string | null;
  externalCustomer?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BillingInvoice {
  id: string;
  companyId: string;
  billingAccountId: string;
  invoiceNumber: string;
  amount: number;
  status: InvoiceStatus;
  dueDate: Date | string;
  paidAt?: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface BillingPayment {
  id: string;
  companyId: string;
  billingAccountId: string;
  invoiceId?: string | null;
  amount: number;
  status: PaymentStatus;
  method: string;
  reference?: string | null;
  checkedAt?: Date | string | null;
  paidAt?: Date | string | null;
  notes?: string | null;
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
