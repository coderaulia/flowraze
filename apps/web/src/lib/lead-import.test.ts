import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDelimitedRows } from './lead-import';

test('parseDelimitedRows handles quoted CSV values', () => {
  const rows = parseDelimitedRows('Name,Email,Notes\n"Jane Doe",jane@example.com,"Said ""hello"""');

  assert.deepEqual(rows, [
    ['Name', 'Email', 'Notes'],
    ['Jane Doe', 'jane@example.com', 'Said "hello"'],
  ]);
});

test('parseDelimitedRows detects tab-delimited files', () => {
  const rows = parseDelimitedRows('Name\tEmail\nJohn\tjohn@example.com');

  assert.deepEqual(rows, [
    ['Name', 'Email'],
    ['John', 'john@example.com'],
  ]);
});
