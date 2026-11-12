import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addItem,
  advanceStatus,
  calculateBill,
  createOrder,
  removeItem,
} from '../src/order.js';

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

test('a new order starts as placed', () => {
  assert.equal(createOrder(3).status, 'placed');
});

test('status moves forward one step at a time until paid', () => {
  let order = addItem(createOrder(3), tea);
  const seen = [order.status];

  while (order.status !== 'paid') {
    order = advanceStatus(order);
    seen.push(order.status);
  }

  assert.deepEqual(seen, ['placed', 'preparing', 'ready', 'served', 'paid']);
  assert.throws(() => advanceStatus(order), /already paid/);
});

test('an empty order cannot go to the kitchen', () => {
  assert.throws(() => advanceStatus(createOrder(3)), /empty order/);
});

test('items are locked once the kitchen starts', () => {
  const order = advanceStatus(addItem(createOrder(3), tea));

  assert.throws(() => addItem(order, rice), /preparing/);
  assert.throws(() => removeItem(order, 'tea'), /preparing/);
});
