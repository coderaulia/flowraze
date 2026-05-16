import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getPagination, getPaginationArgs, getPaginationMeta, paginatedResponse } from './pagination.js';

test('getPagination returns defaults when no query params', () => {
  const result = getPagination({});

  assert.equal(result.isPaginated, false);
  assert.equal(result.page, 1);
  assert.equal(result.limit, 25);
  assert.equal(result.skip, 0);
});

test('getPagination parses page and limit from query', () => {
  const result = getPagination({ page: '3', limit: '10' });

  assert.equal(result.isPaginated, true);
  assert.equal(result.page, 3);
  assert.equal(result.limit, 10);
  assert.equal(result.skip, 20);
});

test('getPagination caps limit at 100', () => {
  const result = getPagination({ page: '1', limit: '500' });

  assert.equal(result.limit, 100);
});

test('getPagination handles invalid values gracefully', () => {
  const result = getPagination({ page: 'abc', limit: '-5' });

  assert.equal(result.page, 1);
  assert.equal(result.limit, 25);
});

test('getPagination treats page=0 as default', () => {
  const result = getPagination({ page: '0' });

  assert.equal(result.page, 1);
});

test('getPaginationArgs returns empty object when not paginated', () => {
  const pagination = getPagination({});
  const args = getPaginationArgs(pagination);

  assert.deepEqual(args, {});
});

test('getPaginationArgs returns skip and take when paginated', () => {
  const pagination = getPagination({ page: '2', limit: '15' });
  const args = getPaginationArgs(pagination);

  assert.deepEqual(args, { skip: 15, take: 15 });
});

test('getPaginationMeta returns correct metadata', () => {
  const pagination = getPagination({ page: '2', limit: '10' });
  const meta = getPaginationMeta(pagination, 45);

  assert.deepEqual(meta, { page: 2, limit: 10, total: 45 });
});

test('paginatedResponse includes pagination when paginated', () => {
  const pagination = getPagination({ page: '1', limit: '10' });
  const data = [{ id: '1' }, { id: '2' }];
  const result = paginatedResponse(data, pagination, 50);

  assert.equal(result.success, true);
  assert.deepEqual(result.data, data);
  assert.deepEqual(result.pagination, { page: 1, limit: 10, total: 50 });
});

test('paginatedResponse omits pagination when not paginated', () => {
  const pagination = getPagination({});
  const data = [{ id: '1' }];
  const result = paginatedResponse(data, pagination, 1);

  assert.equal(result.success, true);
  assert.deepEqual(result.data, data);
  assert.equal('pagination' in result, false);
});
