import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openDatabase } from '../src/db.js';
import { generateTableToken } from '../src/table.js';
import { createTableRepository } from '../src/table-repository.js';

function repository() {
  return createTableRepository(openDatabase());
}

test('a saved table reads back the same by number and by token', () => {
  const tables = repository();
  const saved = tables.save({ number: 4, label: ' Patio 4 ' });

  assert.equal(saved.label, 'Patio 4');
  assert.deepEqual(tables.get(4), saved);
  assert.deepEqual(tables.findByToken(saved.token), saved);
});

test('unknown numbers and tokens read back as undefined', () => {
  const tables = repository();
  tables.save({ number: 1 });

  assert.equal(tables.get(2), undefined);
  assert.equal(tables.findByToken(generateTableToken()), undefined);
  assert.equal(tables.findByToken(undefined), undefined);
});

test('saving an existing number updates it in place', () => {
  const tables = repository();
  const first = tables.save({ number: 1 });
  tables.save({ ...first, label: 'Window' });

  assert.equal(tables.get(1).label, 'Window');
  assert.equal(tables.list().length, 1);
});

test('rejects invalid tables before they reach the database', () => {
  const tables = repository();

  assert.throws(() => tables.save({ number: 0 }), /table number/);
  assert.deepEqual(tables.list(), []);
});

test('rejects a token already used by another table', () => {
  const tables = repository();
  const { token } = tables.save({ number: 1 });

  assert.throws(() => tables.save({ number: 2, token }), /duplicate token on table 2/);
  assert.equal(tables.get(2), undefined);
});

test('list returns tables ordered by number', () => {
  const tables = repository();
  tables.save({ number: 3 });
  tables.save({ number: 1 });
  tables.save({ number: 2 });

  assert.deepEqual(tables.list().map((table) => table.number), [1, 2, 3]);
});

test('rotating a token saves the new one and retires the old one', () => {
  const tables = repository();
  const before = tables.save({ number: 7, label: 'Bar' });
  const after = tables.rotateToken(7);

  assert.notEqual(after.token, before.token);
  assert.equal(after.label, 'Bar');
  assert.deepEqual(tables.findByToken(after.token), after);
  assert.equal(tables.findByToken(before.token), undefined);
});

test('rotateToken rejects unknown tables', () => {
  assert.throws(() => repository().rotateToken(9), /unknown table number/);
});
