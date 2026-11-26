import { inTransaction } from './db.js';
import { createMenuRepository } from './menu-repository.js';
import { createTableRepository } from './table-repository.js';

// A small Sri Lankan menu, priced in rupee cents, so the app has something
// real to show before an owner enters their own.
export const SAMPLE_MENU = [
  { id: 'plain-tea', name: 'Plain tea', priceCents: 10000, category: 'drinks' },
  { id: 'milk-tea', name: 'Milk tea', priceCents: 15000, category: 'drinks' },
  { id: 'iced-coffee', name: 'Iced coffee', priceCents: 45000, category: 'drinks' },
  { id: 'lime-juice', name: 'Fresh lime juice', priceCents: 35000, category: 'drinks' },
  { id: 'chicken-rice-curry', name: 'Chicken rice and curry', priceCents: 85000, category: 'mains' },
  { id: 'veg-rice-curry', name: 'Vegetable rice and curry', priceCents: 60000, category: 'mains' },
  { id: 'chicken-kottu', name: 'Chicken kottu', priceCents: 110000, category: 'mains' },
  { id: 'egg-hoppers', name: 'Egg hoppers (2)', priceCents: 50000, category: 'mains' },
  { id: 'string-hoppers', name: 'String hoppers with dhal', priceCents: 55000, category: 'mains' },
  { id: 'fish-cutlets', name: 'Fish cutlets (4)', priceCents: 40000, category: 'snacks' },
  { id: 'vegetable-roti', name: 'Vegetable roti', priceCents: 25000, category: 'snacks' },
  { id: 'watalappan', name: 'Watalappan', priceCents: 35000, category: 'desserts' },
  { id: 'curd-treacle', name: 'Curd and treacle', priceCents: 40000, category: 'desserts' },
];

export const SAMPLE_TABLE_COUNT = 8;

// Only adds what is missing, so running it again never overwrites an owner's
// price changes or reprints QR codes by giving existing tables new tokens.
export function seedDatabase(db, { menu = SAMPLE_MENU, tableCount = SAMPLE_TABLE_COUNT } = {}) {
  if (!Number.isInteger(tableCount) || tableCount < 0) {
    throw new Error(`invalid table count: ${tableCount}`);
  }

  const menuItems = createMenuRepository(db);
  const tables = createTableRepository(db);

  return inTransaction(db, () => {
    const newItems = menu.filter((item) => !menuItems.get(item.id));
    newItems.forEach((item) => menuItems.save(item));

    const newTables = [];
    for (let number = 1; number <= tableCount; number++) {
      if (!tables.get(number)) newTables.push(tables.save({ number }));
    }

    return { itemsAdded: newItems.length, tablesAdded: newTables.length };
  });
}
