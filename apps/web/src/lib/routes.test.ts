import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COMPANY_ROUTES, ADMIN_HOME_ROUTE, getAuthenticatedHomePath } from './routes';

test('COMPANY_ROUTES has correct path structure', () => {
  assert.equal(COMPANY_ROUTES.root, '/company');
  assert.equal(COMPANY_ROUTES.dashboard, '/company/dashboard');
  assert.equal(COMPANY_ROUTES.leads, '/company/leads');
  assert.equal(COMPANY_ROUTES.deals, '/company/deals');
  assert.equal(COMPANY_ROUTES.campaigns, '/company/campaigns');
  assert.equal(COMPANY_ROUTES.analytics, '/company/analytics');
  assert.equal(COMPANY_ROUTES.settings, '/company/settings');
  assert.equal(COMPANY_ROUTES.support, '/company/support');
});

test('all company routes start with /company', () => {
  const routes = Object.values(COMPANY_ROUTES);
  for (const route of routes) {
    assert.ok(route.startsWith('/company'), `Route ${route} should start with /company`);
  }
});

test('ADMIN_HOME_ROUTE points to /admin', () => {
  assert.equal(ADMIN_HOME_ROUTE, '/admin');
});

test('getAuthenticatedHomePath returns admin route for superadmin', () => {
  assert.equal(getAuthenticatedHomePath('superadmin'), '/admin');
});

test('getAuthenticatedHomePath returns dashboard for admin role', () => {
  assert.equal(getAuthenticatedHomePath('admin'), '/company/dashboard');
});

test('getAuthenticatedHomePath returns dashboard for manager role', () => {
  assert.equal(getAuthenticatedHomePath('manager'), '/company/dashboard');
});

test('getAuthenticatedHomePath returns dashboard for employee role', () => {
  assert.equal(getAuthenticatedHomePath('employee'), '/company/dashboard');
});

test('getAuthenticatedHomePath returns dashboard for null/undefined role', () => {
  assert.equal(getAuthenticatedHomePath(null), '/company/dashboard');
  assert.equal(getAuthenticatedHomePath(undefined), '/company/dashboard');
});
