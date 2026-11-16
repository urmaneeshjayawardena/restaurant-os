import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  availableItems,
  createMenu,
  createMenuItem,
  markAvailable,
  markSoldOut,
} from '../src/menu.js';

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

test('items start available', () => {
  assert.equal(createMenuItem({ id: 'tea', name: 'Tea', priceCents: 15000 }).soldOut, false);
});

test('marking an item sold out returns a new menu', () => {
  const menu = createMenu([{ id: 'tea', name: 'Tea', priceCents: 15000 }]);
  const soldOut = markSoldOut(menu, 'tea');

  assert.equal(soldOut.get('tea').soldOut, true);
  assert.equal(menu.get('tea').soldOut, false);
  assert.equal(markAvailable(soldOut, 'tea').get('tea').soldOut, false);
});

test('sold out items are left off the guest menu', () => {
  const menu = markSoldOut(
    createMenu([
      { id: 'rice', name: 'Fried rice', priceCents: 95000 },
      { id: 'tea', name: 'Tea', priceCents: 15000 },
    ]),
    'rice',
  );

  assert.deepEqual(availableItems(menu).map((item) => item.id), ['tea']);
});

test('rejects unknown ids and non-boolean sold out flags', () => {
  assert.throws(() => markSoldOut(createMenu([]), 'tea'), /unknown menu id/);
  assert.throws(
    () => createMenuItem({ id: 'tea', name: 'Tea', priceCents: 15000, soldOut: 'yes' }),
    /sold out flag/,
  );
});
