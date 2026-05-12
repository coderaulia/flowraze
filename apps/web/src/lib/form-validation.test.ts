import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasFormErrors,
  isNonNegativeNumber,
  isPositiveNumber,
  isValidDateValue,
  isValidEmail,
} from './form-validation';

test('email validation accepts normal addresses and rejects invalid values', () => {
  assert.equal(isValidEmail('admin@flowraze.com'), true);
  assert.equal(isValidEmail(' admin@flowraze.com '), true);
  assert.equal(isValidEmail('not-an-email'), false);
});

test('date and number helpers guard form values', () => {
  assert.equal(isValidDateValue('2026-05-09'), true);
  assert.equal(isValidDateValue(''), false);
  assert.equal(isNonNegativeNumber(0), true);
  assert.equal(isNonNegativeNumber(-1), false);
  assert.equal(isPositiveNumber(1), true);
  assert.equal(isPositiveNumber(0), false);
});

test('hasFormErrors detects populated error maps', () => {
  assert.equal(hasFormErrors({}), false);
  assert.equal(hasFormErrors({ email: 'Email is required' }), true);
});
