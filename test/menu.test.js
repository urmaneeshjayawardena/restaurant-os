import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMenu, createMenuItem } from '../src/menu.js';

test('trims the item name', () => {
  const item = createMenuItem({ id: 'rice', name: '  Fried rice ', priceCents: 95000 });
  assert.equal(item.name, 'Fried rice');
});

test('rejects prices that are not whole cents', () => {
  assert.throws(() => createMenuItem({ id: 'tea', name: 'Tea', priceCents: 12.5 }));
  assert.throws(() => createMenuItem({ id: 'tea', name: 'Tea', priceCents: -100 }));
});

test('rejects duplicate ids', () => {
  const tea = { id: 'tea', name: 'Tea', priceCents: 15000 };
  assert.throws(() => createMenu([tea, tea]), /duplicate/);
});
