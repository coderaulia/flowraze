import assert from 'node:assert/strict';
import test from 'node:test';
import { createWhatsAppChatUrl, normalizeWhatsAppPhone } from './whatsapp';

test('normalizeWhatsAppPhone formats common Indonesian mobile numbers', () => {
  assert.equal(normalizeWhatsAppPhone('0812-3456-7890'), '6281234567890');
  assert.equal(normalizeWhatsAppPhone('+62 812 3456 7890'), '6281234567890');
  assert.equal(normalizeWhatsAppPhone('81234567890'), '6281234567890');
});

test('normalizeWhatsAppPhone preserves international prefixes and rejects unusable input', () => {
  assert.equal(normalizeWhatsAppPhone('+1 (415) 555-0199'), '14155550199');
  assert.equal(normalizeWhatsAppPhone('0044 7700 900123'), '447700900123');
  assert.equal(normalizeWhatsAppPhone('123'), null);
  assert.equal(normalizeWhatsAppPhone(''), null);
});

test('createWhatsAppChatUrl creates a wa.me link only for usable phone numbers', () => {
  assert.equal(createWhatsAppChatUrl('0812 3456 7890'), 'https://wa.me/6281234567890');
  assert.equal(createWhatsAppChatUrl('-'), null);
});
