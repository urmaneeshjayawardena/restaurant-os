import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openDatabase } from '../src/db.js';
import { createMenu } from '../src/menu.js';
import { createMenuRepository } from '../src/menu-repository.js';
import { SAMPLE_MENU, SAMPLE_TABLE_COUNT, seedDatabase } from '../src/seed.js';
import { createTableRepository } from '../src/table-repository.js';

test('the sample menu is valid', () => {
  assert.equal(createMenu(SAMPLE_MENU).size, SAMPLE_MENU.length);
});

test('seeds an empty database with the sample menu and tables', () => {
  const db = openDatabase();

  assert.deepEqual(seedDatabase(db), {
    itemsAdded: SAMPLE_MENU.length,
    tablesAdded: SAMPLE_TABLE_COUNT,
  });
  assert.equal(createMenuRepository(db).loadMenu().size, SAMPLE_MENU.length);

  const tables = createTableRepository(db).list();
  assert.deepEqual(
    tables.map((table) => table.number),
    Array.from({ length: SAMPLE_TABLE_COUNT }, (_, i) => i + 1),
  );
  assert.equal(new Set(tables.map((table) => table.token)).size, tables.length);
});

test('running it again adds nothing and keeps existing tokens', () => {
  const db = openDatabase();
  seedDatabase(db);
  const tokensBefore = createTableRepository(db).list().map((table) => table.token);

  assert.deepEqual(seedDatabase(db), { itemsAdded: 0, tablesAdded: 0 });
  assert.deepEqual(createTableRepository(db).list().map((table) => table.token), tokensBefore);
});

test('leaves items and tables the owner already has alone', () => {
  const db = openDatabase();
  const menu = createMenuRepository(db);
  menu.save({ ...SAMPLE_MENU[0], priceCents: 12000 });
  const table = createTableRepository(db).save({ number: 2, label: 'Window' });

  const result = seedDatabase(db, { tableCount: 3 });

  assert.deepEqual(result, { itemsAdded: SAMPLE_MENU.length - 1, tablesAdded: 2 });
  assert.equal(menu.get(SAMPLE_MENU[0].id).priceCents, 12000);
  assert.deepEqual(createTableRepository(db).get(2), table);
});

test('an invalid item rolls back the whole seed', () => {
  const db = openDatabase();
  const menu = [SAMPLE_MENU[0], { id: 'broken', name: 'Broken', priceCents: -1 }];

  assert.throws(() => seedDatabase(db, { menu }), /invalid price/);
  assert.equal(createMenuRepository(db).loadMenu().size, 0);
  assert.deepEqual(createTableRepository(db).list(), []);
});

test('rejects an invalid table count', () => {
  assert.throws(() => seedDatabase(openDatabase(), { tableCount: 2.5 }), /invalid table count/);
});
