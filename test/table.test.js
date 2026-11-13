import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createTable,
  generateTableToken,
  indexTablesByToken,
  rotateToken,
} from '../src/table.js';

test('tokens are url safe and different every time', () => {
  const tokens = new Set(Array.from({ length: 100 }, generateTableToken));

  assert.equal(tokens.size, 100);
  for (const token of tokens) assert.match(token, /^[A-Za-z0-9_-]{22}$/);
});

test('a new table gets a token and a default label', () => {
  const table = createTable({ number: 5 });

  assert.equal(table.label, 'Table 5');
  assert.match(table.token, /^[A-Za-z0-9_-]{22}$/);
});

test('keeps a custom label and an existing token', () => {
  const token = generateTableToken();
  const table = createTable({ number: 2, label: ' Patio 2 ', token });

  assert.equal(table.label, 'Patio 2');
  assert.equal(table.token, token);
});

test('rejects bad table numbers and malformed tokens', () => {
  assert.throws(() => createTable({ number: 0 }), /table number/);
  assert.throws(() => createTable({ number: 1.5 }), /table number/);
  assert.throws(() => createTable({ number: 1, token: '1' }), /invalid token/);
  assert.throws(() => createTable({ number: 1, token: '../../etc/passwd/xxxxx' }), /invalid token/);
});

test('rotating a token replaces it and leaves the original table alone', () => {
  const table = createTable({ number: 3 });
  const original = table.token;
  const rotated = rotateToken(table);

  assert.notEqual(rotated.token, original);
  assert.equal(rotated.number, 3);
  assert.equal(table.token, original);
});

test('looks tables up by token', () => {
  const tables = indexTablesByToken([{ number: 1 }, { number: 2 }]);
  const [first] = tables.values();

  assert.equal(tables.size, 2);
  assert.equal(tables.get(first.token).number, 1);
  assert.equal(tables.get(generateTableToken()), undefined);
});

test('rejects duplicate table numbers and tokens', () => {
  const token = generateTableToken();

  assert.throws(() => indexTablesByToken([{ number: 1 }, { number: 1 }]), /duplicate table number/);
  assert.throws(
    () => indexTablesByToken([{ number: 1, token }, { number: 2, token }]),
    /duplicate token/,
  );
});
