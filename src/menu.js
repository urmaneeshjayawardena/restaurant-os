export function createMenuItem({ id, name, priceCents, category = 'other' }) {
  if (!id) throw new Error('menu item needs an id');
  if (!name?.trim()) throw new Error('menu item needs a name');
  if (!Number.isInteger(priceCents) || priceCents < 0) {
    throw new Error(`invalid price for "${name}": ${priceCents}`);
  }

  return { id, name: name.trim(), priceCents, category };
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
