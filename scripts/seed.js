import { openDatabase } from '../src/db.js';
import { seedDatabase } from '../src/seed.js';

const path = process.argv[2] ?? 'restaurant.db';
const db = openDatabase(path);

try {
  const { itemsAdded, tablesAdded } = seedDatabase(db);
  console.log(`Seeded ${path}: ${itemsAdded} menu items and ${tablesAdded} tables added.`);
} finally {
  db.close();
}
