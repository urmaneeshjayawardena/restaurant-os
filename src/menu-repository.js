import { createMenu, createMenuItem } from './menu.js';

export function createMenuRepository(db) {
  const upsert = db.prepare(`
    INSERT INTO menu_items (id, name, price_cents, category, sold_out)
    VALUES (:id, :name, :priceCents, :category, :soldOut)
    ON CONFLICT (id) DO UPDATE SET
      name = excluded.name,
      price_cents = excluded.price_cents,
      category = excluded.category,
      sold_out = excluded.sold_out
  `);
  const selectOne = db.prepare('SELECT * FROM menu_items WHERE id = ?');
  const selectAll = db.prepare('SELECT * FROM menu_items ORDER BY category, name');
  const updateSoldOut = db.prepare('UPDATE menu_items SET sold_out = ? WHERE id = ?');

  return {
    save(raw) {
      const item = createMenuItem(raw);
      upsert.run({ ...item, soldOut: item.soldOut ? 1 : 0 });
      return item;
    },

    get(id) {
      const row = selectOne.get(id);
      return row && toMenuItem(row);
    },

    loadMenu() {
      return createMenu(selectAll.all().map(toMenuItem));
    },

    setSoldOut(id, soldOut) {
      if (typeof soldOut !== 'boolean') throw new Error(`invalid sold out flag for ${id}: ${soldOut}`);
      const { changes } = updateSoldOut.run(soldOut ? 1 : 0, id);
      if (changes === 0) throw new Error(`unknown menu id: ${id}`);
    },
  };
}

function toMenuItem(row) {
  return createMenuItem({
    id: row.id,
    name: row.name,
    priceCents: row.price_cents,
    category: row.category,
    soldOut: row.sold_out === 1,
  });
}
