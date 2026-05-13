import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/index.js';
import { createApp } from '../app.js';

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

const user = { id: 'employee-a', role: 'employee', companyId: 'company-a', isActive: true };
const restores: Array<() => void> = [];

function mockPrisma(model: string, method: string, implementation: (...args: unknown[]) => unknown) {
  const target = (prisma as unknown as Record<string, Record<string, unknown>>)[model];
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

function tokenFor() {
  return jwt.sign({ userId: user.id, role: user.role, companyId: user.companyId }, JWT_SECRET);
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

test('support ticket creation is scoped to requester company', async () => {
  resetMocks();
  mockPrisma('user', 'findUnique', (args) => {
    assert.equal((args as { where?: { id?: string } }).where?.id, user.id);
    return user;
  });
  mockPrisma('billingAccount', 'findUnique', (args) => {
    assert.equal((args as { where?: { companyId?: string } }).where?.companyId, user.companyId);
    return { plan: 'pro', status: 'active' };
  });
  mockPrisma('supportTicket', 'create', (args) => {
    const data = (args as { data?: { companyId?: string; requesterId?: string; type?: string; slaDueAt?: Date } }).data;
    assert.equal(data?.companyId, user.companyId);
    assert.equal(data?.requesterId, user.id);
    assert.equal(data?.type, 'bug');
    assert.ok(data?.slaDueAt instanceof Date);
    return {
      id: 'ticket-a',
      ...data,
      status: 'open',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date(),
      requester: { id: user.id, name: 'Employee', email: 'employee@example.com' },
      assignedTo: null,
    };
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/support`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenFor()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'bug',
        priority: 'high',
        subject: 'Import fails',
        description: 'CSV import fails on valid rows.',
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json() as { data: { id: string } };
    assert.equal(body.data.id, 'ticket-a');
  });

  resetMocks();
});
