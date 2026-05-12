import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../middleware/errorHandler.js';
import {
  optionalDate,
  optionalEnum,
  requireObjectBody,
  requireString,
} from './request.js';

test('requireObjectBody rejects arrays and empty values', () => {
  assert.throws(() => requireObjectBody(null), AppError);
  assert.throws(() => requireObjectBody([]), AppError);
  assert.deepEqual(requireObjectBody({ name: 'FlowRaze' }), { name: 'FlowRaze' });
});

test('requireString trims and rejects blank values', () => {
  assert.equal(requireString({ email: ' admin@flowraze.com ' }, 'email'), 'admin@flowraze.com');
  assert.throws(() => requireString({ email: '' }, 'email'), AppError);
});

test('optionalEnum validates known values', () => {
  const parseRole = optionalEnum(['admin', 'staff'] as const, 'Role');

  assert.equal(parseRole('admin'), 'admin');
  assert.equal(parseRole(undefined), undefined);
  assert.throws(() => parseRole('owner'), AppError);
});

test('optionalDate accepts ISO strings and clears empty values', () => {
  assert.equal(optionalDate(''), null);
  assert.equal(optionalDate(undefined), undefined);
  assert.equal(optionalDate('2026-05-09') instanceof Date, true);
  assert.throws(() => optionalDate('not-a-date'), AppError);
});
