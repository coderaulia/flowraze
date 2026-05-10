import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/index.js';
import { createApp } from '../app.js';

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

type TestUser = {
  id: string;
  role: 'admin' | 'manager' | 'employee' | 'superadmin';
  companyId: string | null;
  isActive: boolean;
};

const companyId = 'company-a';
const otherCompanyId = 'company-b';
const admin: TestUser = { id: 'admin-a', role: 'admin', companyId, isActive: true };
const manager: TestUser = { id: 'manager-a', role: 'manager', companyId, isActive: true };
const employee: TestUser = { id: 'employee-a', role: 'employee', companyId, isActive: true };
const outsider: TestUser = { id: 'employee-b', role: 'employee', companyId: otherCompanyId, isActive: true };

const restores: Array<() => void> = [];

function resetMocks() {
  while (restores.length > 0) {
    restores.pop()?.();
  }
}

function mockPrisma(model: string, method: string, implementation: (...args: unknown[]) => unknown) {
  const target = (prisma as unknown as Record<string, Record<string, unknown>>)[model];
  const original = target[method];
  target[method] = implementation;
  restores.push(() => {
    target[method] = original;
  });
}

function mockPrismaClient(method: string, implementation: (...args: unknown[]) => unknown) {
  const target = prisma as unknown as Record<string, unknown>;
  const original = target[method];
  target[method] = implementation;
  restores.push(() => {
    target[method] = original;
  });
}

function mockTransaction() {
  mockPrismaClient('$transaction', (queries) => Promise.all(queries as Array<Promise<unknown> | unknown>));
}

function mockAuthUsers() {
  mockPrisma('user', 'findUnique', (args) => {
    const id = (args as { where?: { id?: string } }).where?.id;
    return [admin, manager, employee, outsider].find((user) => user.id === id) ?? null;
  });
}

function mockManagerTeam() {
  mockPrisma('salesTeam', 'findMany', (args) => {
    const where = (args as { where?: { companyId?: string; managerId?: string } }).where;
    assert.equal(where?.companyId, companyId);
    assert.equal(where?.managerId, manager.id);
    return [{ id: 'team-a', members: [{ userId: employee.id }] }];
  });
}

function mockPlan(plan = 'growth', seats = 10) {
  mockPrisma('billingAccount', 'findUnique', (args) => {
    const where = (args as { where?: { companyId?: string } }).where;
    assert.equal(where?.companyId, companyId);
    return { plan, status: 'active', seats };
  });
}

function tokenFor(user: TestUser) {
  return jwt.sign({ userId: user.id, role: user.role, companyId: user.companyId }, JWT_SECRET);
}

function assertOwnerFilter(value: unknown, expectedIds: string[]) {
  if (typeof value === 'string') {
    assert.deepEqual([value].sort(), expectedIds.sort());
    return;
  }

  const ids = (value as { in?: string[] } | undefined)?.in;
  assert.deepEqual(ids?.sort(), expectedIds.sort());
}

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const server = createApp().listen(0);
  try {
    const address = server.address();
    assert.equal(typeof address, 'object');
    assert.ok(address);
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      (server as Server).close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  }
}

async function apiFetch(baseUrl: string, user: TestUser, path: string, init: RequestInit = {}) {
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${tokenFor(user)}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
}

async function verifyManagerLeadListScope() {
  mockAuthUsers();
  mockManagerTeam();
  mockTransaction();
  mockPrisma('lead', 'findMany', (args) => {
    const where = (args as { where?: { companyId?: string; ownerId?: { in?: string[] } } }).where;
    assert.equal(where?.companyId, companyId);
    assertOwnerFilter(where?.ownerId, [employee.id, manager.id]);
    return [
      { id: 'lead-manager', ownerId: manager.id, fullName: 'Manager Lead' },
      { id: 'lead-employee', ownerId: employee.id, fullName: 'Employee Lead' },
    ];
  });
  mockPrisma('lead', 'count', (args) => {
    const where = (args as { where?: { companyId?: string; ownerId?: { in?: string[] } } }).where;
    assert.equal(where?.companyId, companyId);
    assertOwnerFilter(where?.ownerId, [employee.id, manager.id]);
    return 2;
  });

  await withServer(async (baseUrl) => {
    const response = await apiFetch(baseUrl, manager, '/api/leads?page=1');
    assert.equal(response.status, 200);
    const body = await response.json() as { data: unknown[]; pagination: { total: number } };
    assert.equal(body.data.length, 2);
    assert.equal(body.pagination.total, 2);
  });
}

async function verifyEmployeeLeadDetailScope() {
  mockAuthUsers();
  mockPrisma('lead', 'findFirst', (args) => {
    const where = (args as { where?: { id?: string; companyId?: string; ownerId?: string } }).where;
    assert.equal(where?.id, 'lead-b');
    assert.equal(where?.companyId, companyId);
    assertOwnerFilter(where?.ownerId, [employee.id]);
    return null;
  });

  await withServer(async (baseUrl) => {
    const response = await apiFetch(baseUrl, employee, '/api/leads/lead-b');
    assert.equal(response.status, 404);
  });
}

async function verifyEmployeeLeadExportScope() {
  mockAuthUsers();
  mockPlan('growth');
  mockPrisma('lead', 'findMany', (args) => {
    const where = (args as { where?: { companyId?: string; ownerId?: string } }).where;
    assert.equal(where?.companyId, companyId);
    assertOwnerFilter(where?.ownerId, [employee.id]);
    return [{
      fullName: 'Own Lead',
      email: 'own@example.com',
      phone: null,
      companyName: 'Own Company',
      source: 'referral',
      status: 'new',
      owner: { name: 'Employee' },
      campaign: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    }];
  });

  await withServer(async (baseUrl) => {
    const response = await apiFetch(baseUrl, employee, '/api/exports/leads.csv');
    assert.equal(response.status, 200);
    const csv = await response.text();
    assert.match(csv, /Own Lead/);
  });
}

async function verifyManagerTeamPerformanceScope() {
  mockAuthUsers();
  mockManagerTeam();
  mockPlan('growth');
  mockTransaction();
  mockPrisma('user', 'findMany', (args) => {
    const where = (args as { where?: { companyId?: string; id?: { in?: string[] } } }).where;
    assert.equal(where?.companyId, companyId);
    assert.deepEqual(where?.id?.in?.sort(), [employee.id, manager.id].sort());
    return [
      { id: manager.id, name: 'Manager', leads: [], deals: [], activities: [] },
      { id: employee.id, name: 'Employee', leads: [{ id: 'lead-a' }], deals: [], activities: [] },
    ];
  });
  mockPrisma('user', 'count', (args) => {
    const where = (args as { where?: { companyId?: string; id?: { in?: string[] } } }).where;
    assert.equal(where?.companyId, companyId);
    assert.deepEqual(where?.id?.in?.sort(), [employee.id, manager.id].sort());
    return 2;
  });

  await withServer(async (baseUrl) => {
    const response = await apiFetch(baseUrl, manager, '/api/team/performance');
    assert.equal(response.status, 200);
    const body = await response.json() as { data: Array<{ userId: string }> };
    assert.deepEqual(body.data.map((row) => row.userId).sort(), [employee.id, manager.id].sort());
  });
}

async function verifyEmployeeCampaignWriteDenied() {
  mockAuthUsers();

  await withServer(async (baseUrl) => {
    const response = await apiFetch(baseUrl, employee, '/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Employee Campaign',
        channel: 'email',
        startDate: '2026-01-01T00:00:00Z',
      }),
    });

    assert.equal(response.status, 403);
  });
}

function mockFullSeats() {
  mockPrisma('billingAccount', 'findUnique', (args) => {
    const where = (args as { where?: { companyId?: string } }).where;
    assert.equal(where?.companyId, companyId);
    return { plan: 'free', status: 'active', seats: 3 };
  });
  mockPrisma('user', 'count', (args) => {
    const where = (args as { where?: { companyId?: string; isActive?: boolean } }).where;
    assert.equal(where?.companyId, companyId);
    assert.equal(where?.isActive, true);
    return 3;
  });
}

async function verifySeatLimitBlocksUserCreate() {
  mockAuthUsers();
  mockFullSeats();

  await withServer(async (baseUrl) => {
    const response = await apiFetch(baseUrl, admin, '/api/users', {
      method: 'POST',
      body: JSON.stringify({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        role: 'employee',
      }),
    });
    const body = await response.json() as { code?: string };

    assert.equal(response.status, 403);
    assert.equal(body.code, 'SEAT_LIMIT_REACHED');
  });
}

async function verifySeatLimitBlocksInvite() {
  mockAuthUsers();
  mockFullSeats();

  await withServer(async (baseUrl) => {
    const response = await apiFetch(baseUrl, admin, '/api/users/invite', {
      method: 'POST',
      body: JSON.stringify({
        email: 'invite@example.com',
        name: 'Invited User',
        role: 'employee',
      }),
    });
    const body = await response.json() as { code?: string };

    assert.equal(response.status, 403);
    assert.equal(body.code, 'SEAT_LIMIT_REACHED');
  });
}

async function verifyFreePlanBlocksApiKeys() {
  mockAuthUsers();
  mockPlan('free');

  await withServer(async (baseUrl) => {
    const response = await apiFetch(baseUrl, admin, '/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Blocked key' }),
    });
    const body = await response.json() as { code?: string };

    assert.equal(response.status, 403);
    assert.equal(body.code, 'FEATURE_NOT_AVAILABLE');
  });
}

async function verifyGrowthWebhookLimit() {
  mockAuthUsers();
  mockPlan('growth');
  mockPrisma('webhookEndpoint', 'count', (args) => {
    const where = (args as { where?: { companyId?: string; isActive?: boolean } }).where;
    assert.equal(where?.companyId, companyId);
    assert.equal(where?.isActive, true);
    return 3;
  });

  await withServer(async (baseUrl) => {
    const response = await apiFetch(baseUrl, admin, '/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Limited webhook',
        url: 'https://example.com/hook',
        event: 'lead_created',
      }),
    });
    const body = await response.json() as { code?: string };

    assert.equal(response.status, 403);
    assert.equal(body.code, 'ENTITLEMENT_LIMIT_REACHED');
  });
}

test('production readiness route regressions', async () => {
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    await verifyManagerLeadListScope();
    resetMocks();
    await verifyEmployeeLeadDetailScope();
    resetMocks();
    await verifyEmployeeLeadExportScope();
    resetMocks();
    await verifyManagerTeamPerformanceScope();
    resetMocks();
    await verifyEmployeeCampaignWriteDenied();
    resetMocks();
    await verifySeatLimitBlocksUserCreate();
    resetMocks();
    await verifySeatLimitBlocksInvite();
    resetMocks();
    await verifyFreePlanBlocksApiKeys();
    resetMocks();
    await verifyGrowthWebhookLimit();
  } finally {
    resetMocks();
    console.error = originalConsoleError;
  }
});
