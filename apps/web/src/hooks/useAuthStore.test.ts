import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useAuthStore } from './useAuthStore';

// Reset store state before each test
beforeEach(() => {
  useAuthStore.setState({
    user: null,
    token: null,
    isAuthenticated: false,
  });
});

test('initial state is unauthenticated', () => {
  const state = useAuthStore.getState();

  assert.equal(state.user, null);
  assert.equal(state.token, null);
  assert.equal(state.isAuthenticated, false);
});

test('setAuth sets user and token', () => {
  const user = {
    id: 'user-1',
    email: 'admin@flowraze.com',
    name: 'Admin',
    role: 'admin' as const,
    companyId: 'company-1',
  };

  useAuthStore.getState().setAuth(user, 'jwt-token-123');
  const state = useAuthStore.getState();

  assert.equal(state.isAuthenticated, true);
  assert.equal(state.token, 'jwt-token-123');
  assert.equal(state.user?.id, 'user-1');
  assert.equal(state.user?.email, 'admin@flowraze.com');
});

test('clearAuth resets state', () => {
  const user = {
    id: 'user-1',
    email: 'admin@flowraze.com',
    name: 'Admin',
    role: 'admin' as const,
    companyId: 'company-1',
  };

  useAuthStore.getState().setAuth(user, 'jwt-token-123');
  useAuthStore.getState().clearAuth();
  const state = useAuthStore.getState();

  assert.equal(state.user, null);
  assert.equal(state.token, null);
  assert.equal(state.isAuthenticated, false);
});

test('updateUser merges partial user data', () => {
  const user = {
    id: 'user-1',
    email: 'old@flowraze.com',
    name: 'Old Name',
    role: 'employee' as const,
    companyId: 'company-1',
  };

  useAuthStore.getState().setAuth(user, 'token');
  useAuthStore.getState().updateUser({ name: 'New Name', email: 'new@flowraze.com' });
  const state = useAuthStore.getState();

  assert.equal(state.user?.name, 'New Name');
  assert.equal(state.user?.email, 'new@flowraze.com');
  assert.equal(state.user?.id, 'user-1'); // unchanged
});

test('updateUser does nothing when no user is set', () => {
  useAuthStore.getState().updateUser({ name: 'Ghost' });
  const state = useAuthStore.getState();

  assert.equal(state.user, null);
});

test('isSuperadmin returns true for superadmin role', () => {
  useAuthStore.getState().setAuth(
    { id: '1', email: 'sa@flowraze.com', name: 'SA', role: 'superadmin', companyId: null },
    'token'
  );

  assert.equal(useAuthStore.getState().isSuperadmin(), true);
  assert.equal(useAuthStore.getState().isAdmin(), false);
});

test('isAdmin returns true for admin role', () => {
  useAuthStore.getState().setAuth(
    { id: '1', email: 'a@flowraze.com', name: 'Admin', role: 'admin', companyId: 'c-1' },
    'token'
  );

  assert.equal(useAuthStore.getState().isAdmin(), true);
  assert.equal(useAuthStore.getState().isSuperadmin(), false);
});

test('isManager returns true for manager role', () => {
  useAuthStore.getState().setAuth(
    { id: '1', email: 'm@flowraze.com', name: 'Manager', role: 'manager', companyId: 'c-1' },
    'token'
  );

  assert.equal(useAuthStore.getState().isManager(), true);
});

test('isAdminOrManager returns true for both admin and manager', () => {
  useAuthStore.getState().setAuth(
    { id: '1', email: 'a@flowraze.com', name: 'Admin', role: 'admin', companyId: 'c-1' },
    'token'
  );
  assert.equal(useAuthStore.getState().isAdminOrManager(), true);

  useAuthStore.getState().setAuth(
    { id: '2', email: 'm@flowraze.com', name: 'Manager', role: 'manager', companyId: 'c-1' },
    'token'
  );
  assert.equal(useAuthStore.getState().isAdminOrManager(), true);
});

test('isAdminOrManager returns false for employee', () => {
  useAuthStore.getState().setAuth(
    { id: '1', email: 'e@flowraze.com', name: 'Employee', role: 'employee', companyId: 'c-1' },
    'token'
  );

  assert.equal(useAuthStore.getState().isAdminOrManager(), false);
});

test('isCompanyMember returns true for admin, manager, employee', () => {
  const roles = ['admin', 'manager', 'employee'] as const;

  for (const role of roles) {
    useAuthStore.getState().setAuth(
      { id: '1', email: 'x@flowraze.com', name: 'User', role, companyId: 'c-1' },
      'token'
    );
    assert.equal(useAuthStore.getState().isCompanyMember(), true, `${role} should be company member`);
  }
});

test('isCompanyMember returns false for superadmin', () => {
  useAuthStore.getState().setAuth(
    { id: '1', email: 'sa@flowraze.com', name: 'SA', role: 'superadmin', companyId: null },
    'token'
  );

  assert.equal(useAuthStore.getState().isCompanyMember(), false);
});

test('hasFeature returns true for superadmin regardless of entitlements', () => {
  useAuthStore.getState().setAuth(
    { id: '1', email: 'sa@flowraze.com', name: 'SA', role: 'superadmin', companyId: null },
    'token'
  );

  assert.equal(useAuthStore.getState().hasFeature('analytics'), true);
  assert.equal(useAuthStore.getState().hasFeature('exports'), true);
  assert.equal(useAuthStore.getState().hasFeature('automation'), true);
});

test('hasFeature checks entitlements for non-superadmin users', () => {
  useAuthStore.getState().setAuth(
    {
      id: '1',
      email: 'a@flowraze.com',
      name: 'Admin',
      role: 'admin',
      companyId: 'c-1',
      entitlements: {
        plan: 'growth',
        status: 'active',
        isActive: true,
        seats: 10,
        features: {
          analytics: true,
          apiKeys: false,
          automation: true,
          campaigns: true,
          exports: false,
          targets: false,
          teamPerformance: true,
          webhooks: true,
        },
        limits: { apiKeys: 0, webhooks: 3 },
      },
    },
    'token'
  );

  assert.equal(useAuthStore.getState().hasFeature('analytics'), true);
  assert.equal(useAuthStore.getState().hasFeature('campaigns'), true);
  assert.equal(useAuthStore.getState().hasFeature('exports'), false);
  assert.equal(useAuthStore.getState().hasFeature('apiKeys'), false);
  assert.equal(useAuthStore.getState().hasFeature('targets'), false);
});

test('hasFeature returns false when no entitlements are set', () => {
  useAuthStore.getState().setAuth(
    { id: '1', email: 'e@flowraze.com', name: 'Employee', role: 'employee', companyId: 'c-1' },
    'token'
  );

  assert.equal(useAuthStore.getState().hasFeature('analytics'), false);
  assert.equal(useAuthStore.getState().hasFeature('exports'), false);
});
