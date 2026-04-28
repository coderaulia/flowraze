export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff';
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
  channel: string;
  cost?: number;
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
}

export type ActivityType = 'note' | 'call' | 'follow_up';

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  content: string;
  createdBy: string;
  createdAt: Date;
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
