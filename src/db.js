import { DatabaseSync } from 'node:sqlite';
import { ORDER_STATUSES, MAX_NOTE_LENGTH } from './order.js';

const statusList = ORDER_STATUSES.map((status) => `'${status}'`).join(', ');

// Each entry upgrades the database by one version. Append new steps instead of
// editing old ones, since databases already in use have run them.
const MIGRATIONS = [
  `
  CREATE TABLE menu_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(trim(name)) > 0),
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    category TEXT NOT NULL DEFAULT 'other',
    sold_out INTEGER NOT NULL DEFAULT 0 CHECK (sold_out IN (0, 1))
  ) STRICT;

  CREATE TABLE tables (
    number INTEGER PRIMARY KEY CHECK (number >= 1),
    label TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE
  ) STRICT;

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    table_number INTEGER NOT NULL REFERENCES tables (number),
    status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN (${statusList})),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  ) STRICT;

  CREATE INDEX orders_by_table_status ON orders (table_number, status);

  -- name and unit price are copied from the menu when ordered, so editing the
  -- menu later never changes an open bill.
  CREATE TABLE order_lines (
    order_id INTEGER NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    item_id TEXT NOT NULL REFERENCES menu_items (id),
    name TEXT NOT NULL,
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    quantity INTEGER NOT NULL CHECK (quantity >= 1),
    note TEXT NOT NULL DEFAULT '' CHECK (length(note) <= ${MAX_NOTE_LENGTH}),
    PRIMARY KEY (order_id, item_id, note)
  ) STRICT;
  `,
];

export const SCHEMA_VERSION = MIGRATIONS.length;

export function openDatabase(path = ':memory:') {
  const db = new DatabaseSync(path);
  try {
    // SQLite leaves foreign keys off unless asked, per connection.
    db.exec('PRAGMA foreign_keys = ON');
    migrate(db);
  } catch (error) {
    db.close();
    throw error;
  }
  return db;
}

export function schemaVersion(db) {
  return db.prepare('PRAGMA user_version').get().user_version;
}

function migrate(db) {
  const current = schemaVersion(db);
  if (current > SCHEMA_VERSION) {
    throw new Error(`database is at schema version ${current}, newer than this app (${SCHEMA_VERSION})`);
  }

  for (let version = current; version < SCHEMA_VERSION; version++) {
    db.exec('BEGIN');
    try {
      db.exec(MIGRATIONS[version]);
      db.exec(`PRAGMA user_version = ${version + 1}`);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}
