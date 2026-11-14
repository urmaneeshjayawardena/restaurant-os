export const ORDER_STATUSES = ['placed', 'preparing', 'ready', 'served', 'paid'];
export const MAX_NOTE_LENGTH = 140;

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

// Lines are matched on item and note together, so "no onions" stays on its
// own line instead of merging into the plain version of the same dish.
export function addItem(order, menuItem, quantity = 1, { note = '' } = {}) {
  assertEditable(order);
  assertQuantity(quantity);
  const cleanNote = normalizeNote(note);

  const existing = order.lines.find(
    (line) => line.itemId === menuItem.id && line.note === cleanNote,
  );
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
    note: cleanNote,
  };

  return { ...order, lines: [...order.lines, line] };
}

// Without a note this drops every line for the item; with one, only that line.
export function removeItem(order, itemId, { note } = {}) {
  assertEditable(order);
  const cleanNote = note === undefined ? undefined : normalizeNote(note);
  const matches = (line) =>
    line.itemId === itemId && (cleanNote === undefined || line.note === cleanNote);

  return { ...order, lines: order.lines.filter((line) => !matches(line)) };
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

// Guests type notes on a phone, so stray spaces shouldn't split identical requests.
function normalizeNote(note) {
  if (typeof note !== 'string') throw new Error(`invalid note: ${note}`);

  const clean = note.trim().replace(/\s+/g, ' ');
  if (clean.length > MAX_NOTE_LENGTH) {
    throw new Error(`note is longer than ${MAX_NOTE_LENGTH} characters`);
  }
  return clean;
}
