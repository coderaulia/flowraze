import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toPdf } from './export.js';

test('toPdf builds a branded multi-page report', () => {
  const rows = Array.from({ length: 80 }, (_, index) => ({
    Name: `Lead ${index + 1}`,
    Status: index % 2 === 0 ? 'qualified' : 'new',
    Value: 1_000_000 + index,
    'Created At': '2026-05-13T00:00:00.000Z',
  }));

  const pdf = toPdf('Leads Export', rows, ['Name', 'Status', 'Value', 'Created At']);
  const text = pdf.toString('latin1');

  assert.match(text, /^%PDF-1\.4/);
  assert.match(text, /FlowRaze/);
  assert.match(text, /RECORDS/);
  assert.match(text, /STATUS MIX/);
  assert.match(text, /Page 1 of/);
});
