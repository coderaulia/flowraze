import type { UserRole } from '@/types';

export const ADMIN_HOME_ROUTE = '/admin';

export const COMPANY_ROUTES = {
  root: '/company',
  dashboard: '/company/dashboard',
  analytics: '/company/analytics',
  automations: '/company/automations',
  targets: '/company/targets',
  leads: '/company/leads',
  deals: '/company/deals',
  campaigns: '/company/campaigns',
  activities: '/company/activities',
  team: '/company/team',
  users: '/company/users',
  settings: '/company/settings',
  subscription: '/company/subscription',
  search: '/company/search',
} as const;

export function getAuthenticatedHomePath(role?: UserRole | null) {
  return role === 'superadmin' ? ADMIN_HOME_ROUTE : COMPANY_ROUTES.dashboard;
}
