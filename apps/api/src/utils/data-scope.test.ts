import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { requireCompanyId, hasCompanyWideAccess } from './data-scope.js';

function mockRequest(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    userId: 'user-1',
    userRole: 'employee',
    companyId: 'company-1',
    ...overrides,
  } as AuthRequest;
}

test('requireCompanyId returns companyId when present', () => {
  const req = mockRequest({ companyId: 'company-abc' });
  assert.equal(requireCompanyId(req), 'company-abc');
});

test('requireCompanyId throws AppError when companyId is null', () => {
  const req = mockRequest({ companyId: null });

  assert.throws(
    () => requireCompanyId(req),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      assert.equal(error.statusCode, 403);
      return true;
    }
  );
});

test('requireCompanyId throws AppError when companyId is undefined', () => {
  const req = mockRequest({ companyId: undefined });

  assert.throws(
    () => requireCompanyId(req),
    (error: unknown) => {
      assert.ok(error instanceof AppError);
      return true;
    }
  );
});

test('hasCompanyWideAccess returns true for admin role', () => {
  const req = mockRequest({ userRole: 'admin' });
  assert.equal(hasCompanyWideAccess(req), true);
});

test('hasCompanyWideAccess returns false for manager role', () => {
  const req = mockRequest({ userRole: 'manager' });
  assert.equal(hasCompanyWideAccess(req), false);
});

test('hasCompanyWideAccess returns false for employee role', () => {
  const req = mockRequest({ userRole: 'employee' });
  assert.equal(hasCompanyWideAccess(req), false);
});
