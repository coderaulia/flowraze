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
  role: 'admin' | 'manager' | 'employee';
  companyId: string;
  isActive: boolean;
};

const companyId = 'company-a';
const admin: TestUser = { id: 'admin-a', role: 'admin', companyId, isActive: true };
const employee: TestUser = { id: 'employee-a', role: 'employee', companyId, isActive: true };

const restores: Array<() => void> = [];

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

function resetMocks() {
  while (restores.length > 0) {
    restores.pop()?.();
  }
}

function tokenFor(user: TestUser) {
  return jwt.sign({ userId: user.id, role: user.role, companyId: user.companyId }, JWT_SECRET);
}

function mockAuthUser(user: TestUser) {
  mockPrisma('user', 'findUnique', (args) => {
    const id = (args as { where?: { id?: string } }).where?.id;
    if (id === user.id) return user;
    return null;
  });
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

// ─── Lead Creation ────────────────────────────────────────────────────────────

test('POST /api/leads creates a lead with valid data', async () => {
  resetMocks();
  mockAuthUser(admin);
  mockPrisma('billingAccount', 'findUnique', () => ({ plan: 'pro', status: 'active', seats: 10 }));
  mockPrisma('lead', 'findFirst', () => null); // no duplicate
  mockPrisma('lead', 'create', (args) => {
    const data = (args as { data?: Record<string, unknown> }).data;
    assert.equal(data?.companyId, companyId);
    assert.equal(data?.email, 'lead@example.com');
    assert.equal(data?.fullName, 'Jane Doe');
    assert.equal(data?.ownerId, admin.id);
    return {
      id: 'lead-new',
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: { id: admin.id, name: 'Admin' },
    };
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenFor(admin)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Jane Doe',
        email: 'lead@example.com',
        source: 'Website',
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json() as { success: boolean; data: { id: string; email: string } };
    assert.equal(body.success, true);
    assert.equal(body.data.id, 'lead-new');
    assert.equal(body.data.email, 'lead@example.com');
  });

  resetMocks();
});

test('POST /api/leads rejects duplicate email within company', async () => {
  resetMocks();
  mockAuthUser(admin);
  mockPrisma('billingAccount', 'findUnique', () => ({ plan: 'pro', status: 'active', seats: 10 }));
  mockPrisma('lead', 'findFirst', () => ({ id: 'existing-lead' })); // duplicate found

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenFor(admin)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: 'Jane Doe',
        email: 'existing@example.com',
        source: 'Website',
      }),
    });

    assert.equal(response.status, 409);
    const body = await response.json() as { code?: string };
    assert.equal(body.code, 'DUPLICATE_LEAD');
  });

  resetMocks();
});

test('POST /api/leads rejects missing required fields', async () => {
  resetMocks();
  mockAuthUser(admin);
  mockPrisma('billingAccount', 'findUnique', () => ({ plan: 'pro', status: 'active', seats: 10 }));

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenFor(admin)}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullName: 'Jane Doe' }),
    });

    assert.equal(response.status, 400);
  });

  resetMocks();
});

// ─── Lead Listing ─────────────────────────────────────────────────────────────

test('GET /api/leads returns paginated leads scoped to company', async () => {
  resetMocks();
  mockAuthUser(admin);
  mockPrismaClient('$transaction', (queries) => Promise.all(queries as Array<Promise<unknown>>));
  mockPrisma('lead', 'findMany', (args) => {
    const where = (args as { where?: { companyId?: string } }).where;
    assert.equal(where?.companyId, companyId);
    return [
      { id: 'lead-1', fullName: 'Lead One', email: 'one@example.com', owner: { id: admin.id, name: 'Admin' }, campaign: null },
      { id: 'lead-2', fullName: 'Lead Two', email: 'two@example.com', owner: { id: admin.id, name: 'Admin' }, campaign: null },
    ];
  });
  mockPrisma('lead', 'count', (args) => {
    const where = (args as { where?: { companyId?: string } }).where;
    assert.equal(where?.companyId, companyId);
    return 2;
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads?page=1&limit=10`, {
      headers: { Authorization: `Bearer ${tokenFor(admin)}` },
    });

    assert.equal(response.status, 200);
    const body = await response.json() as { data: unknown[]; pagination: { total: number; page: number } };
    assert.equal(body.data.length, 2);
    assert.equal(body.pagination.total, 2);
    assert.equal(body.pagination.page, 1);
  });

  resetMocks();
});

// ─── Lead Detail ──────────────────────────────────────────────────────────────

test('GET /api/leads/:id returns 404 for non-existent lead', async () => {
  resetMocks();
  mockAuthUser(employee);
  mockPrisma('lead', 'findFirst', () => null);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads/nonexistent`, {
      headers: { Authorization: `Bearer ${tokenFor(employee)}` },
    });

    assert.equal(response.status, 404);
  });

  resetMocks();
});

// ─── Lead Deletion ────────────────────────────────────────────────────────────

test('DELETE /api/leads/:id deletes a lead within scope', async () => {
  resetMocks();
  mockAuthUser(admin);
  mockPrisma('lead', 'findFirst', () => ({ id: 'lead-to-delete' }));
  mockPrisma('lead', 'delete', (args) => {
    const where = (args as { where?: { id?: string } }).where;
    assert.equal(where?.id, 'lead-to-delete');
    return { id: 'lead-to-delete' };
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads/lead-to-delete`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenFor(admin)}` },
    });

    assert.equal(response.status, 200);
    const body = await response.json() as { success: boolean };
    assert.equal(body.success, true);
  });

  resetMocks();
});

// ─── Unauthenticated Access ───────────────────────────────────────────────────

test('GET /api/leads rejects unauthenticated requests', async () => {
  resetMocks();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/leads`);
    assert.equal(response.status, 401);
  });

  resetMocks();
});
