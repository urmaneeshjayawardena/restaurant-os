import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openDatabase } from '../src/db.js';
import { createMenuRepository } from '../src/menu-repository.js';
import { createTableRepository } from '../src/table-repository.js';
import { createOrderRepository } from '../src/order-repository.js';
import { addItem, advanceStatus, calculateBill, combineOrders, createOrder } from '../src/order.js';

const tea = { id: 'tea', name: 'Tea', priceCents: 15000, category: 'drinks', soldOut: false };
const rice = { id: 'rice', name: 'Fried rice', priceCents: 95000, category: 'mains', soldOut: false };

function setup() {
  const db = openDatabase();
  const menu = createMenuRepository(db);
  menu.save(tea);
  menu.save(rice);
  const tables = createTableRepository(db);
  tables.save({ number: 1 });
  tables.save({ number: 2 });
  return { db, orders: createOrderRepository(db) };
}

function teaAndRice(tableNumber) {
  let order = createOrder(tableNumber);
  order = addItem(order, tea, 2);
  order = addItem(order, rice, 1, { note: 'no onions' });
  return order;
}

test('a new order is given an id and reads back with its lines in order', () => {
  const { orders } = setup();
  const saved = orders.save(teaAndRice(1));

  assert.equal(typeof saved.id, 'number');
  assert.match(saved.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(saved.status, 'placed');
  assert.deepEqual(saved.lines, teaAndRice(1).lines);
  assert.deepEqual(orders.get(saved.id), saved);
});

test('unknown ids read back as undefined', () => {
  assert.equal(setup().orders.get(42), undefined);
});

test('saving an existing order updates its status and lines', () => {
  const { orders } = setup();
  const saved = orders.save(createOrder(1));
  const changed = orders.save(advanceStatus(addItem(saved, tea, 3)));

  assert.equal(changed.id, saved.id);
  assert.equal(changed.status, 'preparing');
  assert.equal(changed.createdAt, saved.createdAt);
  assert.deepEqual(changed.lines.map((line) => line.quantity), [3]);
});

test('lines keep the price they were ordered at after the menu changes', () => {
  const { db, orders } = setup();
  const saved = orders.save(teaAndRice(1));
  createMenuRepository(db).save({ ...tea, priceCents: 20000 });

  assert.equal(orders.get(saved.id).lines[0].unitPriceCents, 15000);
});

test('rejects invalid orders before they reach the database', () => {
  const { orders } = setup();

  assert.throws(() => orders.save({ tableNumber: 0, status: 'placed', lines: [] }), /table number/);
  assert.throws(() => orders.save({ tableNumber: 1, status: 'eaten', lines: [] }), /invalid order status/);
  assert.deepEqual(orders.unpaidForTable(1), []);
});

test('updating an unknown id is refused', () => {
  const { orders } = setup();

  assert.throws(() => orders.save({ ...createOrder(1), id: 99 }), /unknown order id: 99/);
});

test('a failed save leaves nothing half written', () => {
  const { orders } = setup();
  const ghost = { itemId: 'ghost', name: 'Ghost', unitPriceCents: 100, quantity: 1, note: '' };
  const order = { ...teaAndRice(1), lines: [...teaAndRice(1).lines, ghost] };

  assert.throws(() => orders.save(order), /FOREIGN KEY/);
  assert.deepEqual(orders.unpaidForTable(1), []);
});

test('unpaidForTable returns that table\'s open orders, oldest first', () => {
  const { orders } = setup();
  const first = orders.save(teaAndRice(1));
  const second = orders.save(addItem(createOrder(1), tea));
  orders.save(teaAndRice(2));

  let paid = orders.save(addItem(createOrder(1), rice));
  for (let step = 0; step < 4; step++) paid = advanceStatus(paid);
  orders.save(paid);

  assert.deepEqual(orders.unpaidForTable(1).map((order) => order.id), [first.id, second.id]);
});

test('unpaid orders combine into one bill', () => {
  const { orders } = setup();
  orders.save(teaAndRice(1));
  orders.save(addItem(createOrder(1), tea));

  const bill = calculateBill(combineOrders(orders.unpaidForTable(1)));

  assert.equal(bill.totalCents, 3 * 15000 + 95000);
});
