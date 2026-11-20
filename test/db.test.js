import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openDatabase, SCHEMA_VERSION, schemaVersion } from '../src/db.js';
import { MAX_NOTE_LENGTH } from '../src/order.js';
import { generateTableToken } from '../src/table.js';

function seed(db) {
  db.prepare('INSERT INTO menu_items (id, name, price_cents) VALUES (?, ?, ?)').run('tea', 'Tea', 15000);
  db.prepare('INSERT INTO tables (number, label, token) VALUES (?, ?, ?)').run(4, 'Table 4', generateTableToken());
  return db.prepare('INSERT INTO orders (table_number) VALUES (?)').run(4).lastInsertRowid;
}

function addLine(db, orderId, { itemId = 'tea', quantity = 1, note = '' } = {}) {
  db.prepare(
    `INSERT INTO order_lines (order_id, item_id, name, unit_price_cents, quantity, note)
     VALUES (?, ?, 'Tea', 15000, ?, ?)`,
  ).run(orderId, itemId, quantity, note);
}

function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'restaurant-os-'));
  try {
    fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test('a new database gets every table at the latest schema version', () => {
  const db = openDatabase();
  const names = db
    .prepare("SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name")
    .all()
    .map((row) => row.name);

  assert.deepEqual(names, ['menu_items', 'order_lines', 'orders', 'tables']);
  assert.equal(schemaVersion(db), SCHEMA_VERSION);
});

test('new orders start as placed with a timestamp', () => {
  const db = openDatabase();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(seed(db));

  assert.equal(order.status, 'placed');
  assert.match(order.created_at, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

test('foreign keys are enforced', () => {
  const db = openDatabase();
  const orderId = seed(db);

  assert.throws(() => db.prepare('INSERT INTO orders (table_number) VALUES (99)').run(), /FOREIGN KEY/);
  assert.throws(() => addLine(db, orderId, { itemId: 'cake' }), /FOREIGN KEY/);
});

test('deleting an order removes its lines', () => {
  const db = openDatabase();
  const orderId = seed(db);
  addLine(db, orderId);

  db.prepare('DELETE FROM orders WHERE id = ?').run(orderId);

  assert.equal(db.prepare('SELECT count(*) AS n FROM order_lines').get().n, 0);
});

test('rejects values the order logic would never produce', () => {
  const db = openDatabase();
  const orderId = seed(db);

  assert.throws(() => db.prepare("UPDATE orders SET status = 'lost'").run(), /CHECK/);
  assert.throws(() => db.prepare("UPDATE menu_items SET price_cents = -1").run(), /CHECK/);
  assert.throws(() => db.prepare("UPDATE menu_items SET price_cents = 1.5").run(), /cannot store REAL/);
  assert.throws(() => addLine(db, orderId, { quantity: 0 }), /CHECK/);
  assert.throws(() => addLine(db, orderId, { note: 'x'.repeat(MAX_NOTE_LENGTH + 1) }), /CHECK/);
});

test('an item with a different note gets its own line, the same note does not', () => {
  const db = openDatabase();
  const orderId = seed(db);
  addLine(db, orderId);
  addLine(db, orderId, { note: 'no sugar' });

  assert.throws(() => addLine(db, orderId, { note: 'no sugar' }), /UNIQUE/);
});

test('table tokens must be unique', () => {
  const db = openDatabase();
  const token = generateTableToken();
  const insert = db.prepare('INSERT INTO tables (number, label, token) VALUES (?, ?, ?)');
  insert.run(1, 'Table 1', token);

  assert.throws(() => insert.run(2, 'Table 2', token), /UNIQUE/);
});

test('reopening a database file keeps its data and does not migrate twice', () => {
  withTempDir((dir) => {
    const path = join(dir, 'restaurant.db');
    const first = openDatabase(path);
    seed(first);
    first.close();

    const second = openDatabase(path);
    assert.equal(schemaVersion(second), SCHEMA_VERSION);
    assert.equal(second.prepare('SELECT count(*) AS n FROM orders').get().n, 1);
    second.close();
  });
});

test('refuses a database from a newer version of the app', () => {
  withTempDir((dir) => {
    const path = join(dir, 'restaurant.db');
    const db = openDatabase(path);
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION + 1}`);
    db.close();

    assert.throws(() => openDatabase(path), /newer than this app/);
  });
});
