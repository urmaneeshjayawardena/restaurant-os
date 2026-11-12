export const ORDER_STATUSES = ['placed', 'preparing', 'ready', 'served', 'paid'];

export function createOrder(tableNumber) {
  if (!Number.isInteger(tableNumber) || tableNumber < 1) {
    throw new Error(`invalid table number: ${tableNumber}`);
  }

  return { tableNumber, status: 'placed', lines: [] };
}

// Orders only ever move forward one step, so the kitchen can't skip
// straight from "placed" to "served" and a paid order stays paid.
export function advanceStatus(order) {
  const next = ORDER_STATUSES[ORDER_STATUSES.indexOf(order.status) + 1];
  if (!next) throw new Error(`order is already ${order.status}`);

  if (next === 'preparing' && order.lines.length === 0) {
    throw new Error('cannot send an empty order to the kitchen');
  }

  return { ...order, status: next };
}

export function addItem(order, menuItem, quantity = 1) {
  assertEditable(order);
  assertQuantity(quantity);

  const existing = order.lines.find((line) => line.itemId === menuItem.id);
  if (existing) {
    return {
      ...order,
      lines: order.lines.map((line) =>
        line === existing ? { ...line, quantity: line.quantity + quantity } : line,
      ),
    };
  }

  // Copy the price onto the line so later menu changes don't rewrite open bills.
  const line = {
    itemId: menuItem.id,
    name: menuItem.name,
    unitPriceCents: menuItem.priceCents,
    quantity,
  };

  return { ...order, lines: [...order.lines, line] };
}

export function removeItem(order, itemId) {
  assertEditable(order);
  return { ...order, lines: order.lines.filter((line) => line.itemId !== itemId) };
}

export function calculateBill(order, { serviceRate = 0, taxRate = 0 } = {}) {
  const subtotalCents = order.lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
  const serviceCents = Math.round(subtotalCents * serviceRate);
  const taxCents = Math.round((subtotalCents + serviceCents) * taxRate);

  return {
    subtotalCents,
    serviceCents,
    taxCents,
    totalCents: subtotalCents + serviceCents + taxCents,
  };
}

// Once the kitchen has started cooking, changes need a new order instead.
function assertEditable(order) {
  if (order.status !== 'placed') {
    throw new Error(`cannot change an order that is ${order.status}`);
  }
}

function assertQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error(`invalid quantity: ${quantity}`);
  }
}
