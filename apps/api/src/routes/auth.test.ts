import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/index.js';
import { createApp } from '../app.js';

const JWT_SECRET = 'test-secret';
process.env.JWT_SECRET = JWT_SECRET;

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

// ─── Login Tests ──────────────────────────────────────────────────────────────

test('POST /api/auth/login returns token for valid credentials', async () => {
  resetMocks();
  const hashedPassword = bcrypt.hashSync('password123', 10);

  mockPrisma('user', 'findUnique', (args) => {
    const where = (args as { where?: { email?: string } }).where;
    assert.equal(where?.email, 'admin@flowraze.com');
    return {
      id: 'user-1',
      email: 'admin@flowraze.com',
      name: 'Admin',
      role: 'admin',
      companyId: 'company-1',
      password: hashedPassword,
      isActive: true,
      emailVerifiedAt: new Date(),
    };
  });
  mockPrisma('billingAccount', 'findUnique', () => ({
    plan: 'custom',
    status: 'active',
    seats: 10,
  }));

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@flowraze.com', password: 'password123' }),
    });

    assert.equal(response.status, 200);
    const body = await response.json() as { success: boolean; data: { token: string; user: { id: string } } };
    assert.equal(body.success, true);
    assert.ok(body.data.token);
    assert.equal(body.data.user.id, 'user-1');
  });

  resetMocks();
});

test('POST /api/auth/login rejects invalid credentials', async () => {
  resetMocks();

  mockPrisma('user', 'findUnique', () => null);

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nobody@flowraze.com', password: 'wrong' }),
    });

    assert.equal(response.status, 401);
    const body = await response.json() as { success: boolean; error: string };
    assert.equal(body.success, false);
    assert.match(body.error, /Invalid credentials/i);
  });

  resetMocks();
});

test('POST /api/auth/login rejects missing fields', async () => {
  resetMocks();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    });

    assert.equal(response.status, 400);
  });

  resetMocks();
});

// ─── Register Tests ───────────────────────────────────────────────────────────

test('POST /api/auth/register creates a new user', async () => {
  resetMocks();

  mockPrisma('user', 'findUnique', () => null);
  mockPrisma('user', 'create', (args) => {
    const data = (args as { data?: { email?: string; name?: string } }).data;
    assert.equal(data?.email, 'new@flowraze.com');
    assert.equal(data?.name, 'New User');
    return {
      id: 'user-new',
      email: 'new@flowraze.com',
      name: 'New User',
      role: 'employee',
      companyId: null,
      emailVerifiedAt: null,
    };
  });

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'new@flowraze.com',
        password: 'securepass123',
        name: 'New User',
        consent: true,
      }),
    });

    assert.equal(response.status, 201);
    const body = await response.json() as { success: boolean; data: { token: string; user: { email: string } } };
    assert.equal(body.success, true);
    assert.ok(body.data.token);
    assert.equal(body.data.user.email, 'new@flowraze.com');
  });

  resetMocks();
});

test('POST /api/auth/register rejects duplicate email', async () => {
  resetMocks();

  mockPrisma('user', 'findUnique', () => ({
    id: 'existing-user',
    email: 'taken@flowraze.com',
  }));

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'taken@flowraze.com',
        password: 'securepass123',
        name: 'Duplicate',
        consent: true,
      }),
    });

    assert.equal(response.status, 400);
    const body = await response.json() as { error: string };
    assert.match(body.error, /already in use/i);
  });

  resetMocks();
});

test('POST /api/auth/register rejects weak password', async () => {
  resetMocks();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'new@flowraze.com',
        password: 'short',
        name: 'New User',
      }),
    });

    assert.equal(response.status, 400);
    const body = await response.json() as { error: string };
    assert.match(body.error, /8 characters/i);
  });

  resetMocks();
});

// ─── GET /me Tests ────────────────────────────────────────────────────────────

test('GET /api/auth/me returns current user with valid token', async () => {
  resetMocks();
  const user = {
    id: 'user-1',
    email: 'admin@flowraze.com',
    name: 'Admin',
    role: 'admin',
    companyId: 'company-1',
    isActive: true,
    emailVerifiedAt: new Date(),
  };

  mockPrisma('user', 'findUnique', (args) => {
    const where = (args as { where?: { id?: string } }).where;
    if (where?.id === 'user-1') return user;
    return null;
  });
  mockPrisma('billingAccount', 'findUnique', () => ({
    plan: 'custom',
    status: 'active',
    seats: 10,
  }));

  const token = jwt.sign(
    { userId: 'user-1', role: 'admin', companyId: 'company-1' },
    JWT_SECRET
  );

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 200);
    const body = await response.json() as { data: { user: { id: string; email: string } } };
    assert.equal(body.data.user.id, 'user-1');
    assert.equal(body.data.user.email, 'admin@flowraze.com');
  });

  resetMocks();
});

test('GET /api/auth/me rejects invalid token', async () => {
  resetMocks();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid-token-here' },
    });

    assert.equal(response.status, 401);
  });

  resetMocks();
});

test('GET /api/auth/me rejects request without token', async () => {
  resetMocks();

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/me`);
    assert.equal(response.status, 401);
  });

  resetMocks();
});

test('GET /api/auth/me rejects inactive user', async () => {
  resetMocks();

  mockPrisma('user', 'findUnique', () => ({
    id: 'user-inactive',
    email: 'inactive@flowraze.com',
    name: 'Inactive',
    role: 'employee',
    companyId: 'company-1',
    isActive: false,
  }));

  const token = jwt.sign(
    { userId: 'user-inactive', role: 'employee', companyId: 'company-1' },
    JWT_SECRET
  );

  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.equal(response.status, 401);
  });

  resetMocks();
});
