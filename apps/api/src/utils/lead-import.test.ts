import assert from 'node:assert/strict';
import test from 'node:test';
import { AppError } from '../middleware/errorHandler.js';
import { buildLeadImportCandidates } from './lead-import.js';

test('buildLeadImportCandidates validates and normalizes lead rows', () => {
  const result = buildLeadImportCandidates([
    {
      fullName: ' Jane Doe ',
      email: ' JANE@EXAMPLE.COM ',
      source: ' Website ',
      status: 'qualified',
    },
  ], 'user-1');

  assert.equal(result.totalRows, 1);
  assert.equal(result.errors.length, 0);
  assert.equal(result.candidates[0].email, 'jane@example.com');
  assert.equal(result.candidates[0].data.fullName, 'Jane Doe');
  assert.equal(result.candidates[0].data.status, 'qualified');
});

test('buildLeadImportCandidates reports bad rows and file duplicates', () => {
  const result = buildLeadImportCandidates([
    { fullName: '', email: 'not-email', source: 'Website' },
    { fullName: 'Jane', email: 'jane@example.com', source: 'Website' },
    { fullName: 'Jane Copy', email: 'jane@example.com', source: 'Website' },
  ], 'user-1');

  assert.equal(result.candidates.length, 1);
  assert.equal(result.errors.length, 2);
  assert.deepEqual(result.errors.map((error) => error.reason), [
    'Email is invalid',
    'Email is duplicated in this file',
  ]);
});

test('buildLeadImportCandidates rejects missing row arrays', () => {
  assert.throws(() => buildLeadImportCandidates({}, 'user-1'), AppError);
  assert.throws(() => buildLeadImportCandidates([], 'user-1'), AppError);
});
