import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addItem, calculateBill, createOrder, removeItem } from '../src/order.js';

const rice = { id: 'rice', name: 'Fried rice', priceCents: 95000 };
const tea = { id: 'tea', name: 'Tea', priceCents: 15000 };

test('adding the same item twice bumps the quantity', () => {
  let order = createOrder(4);
  order = addItem(order, tea);
  order = addItem(order, tea, 2);

  assert.equal(order.lines.length, 1);
  assert.equal(order.lines[0].quantity, 3);
});

test('addItem leaves the original order untouched', () => {
  const order = createOrder(4);
  addItem(order, tea);
  assert.equal(order.lines.length, 0);
});

test('a line keeps the price it was ordered at', () => {
  const order = addItem(createOrder(1), tea);
  const pricier = { ...tea, priceCents: 20000 };

  assert.equal(addItem(order, pricier).lines[0].unitPriceCents, 15000);
});

test('removeItem drops the whole line', () => {
  const order = removeItem(addItem(addItem(createOrder(2), rice), tea), 'rice');
  assert.deepEqual(order.lines.map((line) => line.itemId), ['tea']);
});

test('rejects bad table numbers and quantities', () => {
  assert.throws(() => createOrder(0));
  assert.throws(() => addItem(createOrder(1), tea, 0));
});

test('bill applies service charge, then tax on top of it', () => {
  const order = addItem(addItem(createOrder(7), rice, 2), tea);
  const bill = calculateBill(order, { serviceRate: 0.1, taxRate: 0.18 });

  assert.deepEqual(bill, {
    subtotalCents: 205000,
    serviceCents: 20500,
    taxCents: 40590,
    totalCents: 266090,
  });
});

test('an empty order costs nothing', () => {
  assert.equal(calculateBill(createOrder(1)).totalCents, 0);
});
