export function createMenuItem({ id, name, priceCents, category = 'other', soldOut = false }) {
  if (!id) throw new Error('menu item needs an id');
  if (!name?.trim()) throw new Error('menu item needs a name');
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    throw new Error(`invalid price for "${name}": ${priceCents}`);
  }
  if (typeof soldOut !== 'boolean') {
    throw new Error(`invalid sold out flag for "${name}": ${soldOut}`);
  }

  return { id, name: name.trim(), priceCents, category, soldOut };
}

export function createMenu(items) {
  const byId = new Map();

  for (const raw of items) {
    const item = createMenuItem(raw);
    if (byId.has(item.id)) throw new Error(`duplicate menu id: ${item.id}`);
    byId.set(item.id, item);
  }

  return byId;
}

export function markSoldOut(menu, itemId) {
  return setSoldOut(menu, itemId, true);
}

export function markAvailable(menu, itemId) {
  return setSoldOut(menu, itemId, false);
}

export function availableItems(menu) {
  return [...menu.values()].filter((item) => !item.soldOut);
}

function setSoldOut(menu, itemId, soldOut) {
  const item = menu.get(itemId);
  if (!item) throw new Error(`unknown menu id: ${itemId}`);

  return new Map(menu).set(itemId, { ...item, soldOut });
}
