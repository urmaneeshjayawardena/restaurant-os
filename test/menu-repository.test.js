import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openDatabase } from '../src/db.js';
import { availableItems } from '../src/menu.js';
import { createMenuRepository } from '../src/menu-repository.js';

const tea = { id: 'tea', name: 'Tea', priceCents: 15000, category: 'drinks' };
const rice = { id: 'rice', name: 'Fried rice', priceCents: 95000, category: 'mains' };

function repository() {
  return createMenuRepository(openDatabase());
}

test('a saved item reads back the same', () => {
  const menu = repository();
  const saved = menu.save({ ...tea, name: '  Tea ' });

  assert.deepEqual(menu.get('tea'), saved);
  assert.deepEqual(saved, { ...tea, soldOut: false });
});

test('unknown ids read back as undefined', () => {
  assert.equal(repository().get('cake'), undefined);
});

test('saving an existing id updates it in place', () => {
  const menu = repository();
  menu.save(tea);
  menu.save({ ...tea, priceCents: 18000 });

  assert.equal(menu.get('tea').priceCents, 18000);
  assert.equal(menu.loadMenu().size, 1);
});

test('rejects invalid items before they reach the database', () => {
  const menu = repository();

  assert.throws(() => menu.save({ ...tea, priceCents: 12.5 }), /invalid price/);
  assert.equal(menu.get('tea'), undefined);
});

test('loadMenu returns a menu map ordered by category then name', () => {
  const menu = repository();
  menu.save(tea);
  menu.save(rice);
  menu.save({ id: 'coffee', name: 'Coffee', priceCents: 30000, category: 'drinks' });

  assert.deepEqual([...menu.loadMenu().keys()], ['coffee', 'tea', 'rice']);
});

test('sold out items persist and drop off the guest menu', () => {
  const menu = repository();
  menu.save(tea);
  menu.save(rice);

  menu.setSoldOut('rice', true);
  assert.equal(menu.get('rice').soldOut, true);
  assert.deepEqual(availableItems(menu.loadMenu()).map((item) => item.id), ['tea']);

  menu.setSoldOut('rice', false);
  assert.equal(menu.get('rice').soldOut, false);
});

test('setSoldOut rejects unknown ids and non-boolean flags', () => {
  const menu = repository();
  menu.save(tea);

  assert.throws(() => menu.setSoldOut('cake', true), /unknown menu id/);
  assert.throws(() => menu.setSoldOut('tea', 'yes'), /sold out flag/);
});
