export function createOrder(tableNumber) {
  if (!Number.isInteger(tableNumber) || tableNumber < 1) {
    throw new Error(`invalid table number: ${tableNumber}`);
  }

  return { tableNumber, lines: [] };
}

export function addItem(order, menuItem, quantity = 1) {
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

function assertQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error(`invalid quantity: ${quantity}`);
  }
}
