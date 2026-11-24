import { createTable, rotateToken } from './table.js';

export function createTableRepository(db) {
  const upsert = db.prepare(`
    INSERT INTO tables (number, label, token)
    VALUES (:number, :label, :token)
    ON CONFLICT (number) DO UPDATE SET
      label = excluded.label,
      token = excluded.token
  `);
  const selectByNumber = db.prepare('SELECT * FROM tables WHERE number = ?');
  const selectByToken = db.prepare('SELECT * FROM tables WHERE token = ?');
  const selectAll = db.prepare('SELECT * FROM tables ORDER BY number');

  function get(number) {
    const row = selectByNumber.get(number);
    return row && toTable(row);
  }

  function findByToken(token) {
    if (typeof token !== 'string') return undefined;
    const row = selectByToken.get(token);
    return row && toTable(row);
  }

  function save(raw) {
    const table = createTable(raw);
    const holder = findByToken(table.token);
    if (holder && holder.number !== table.number) {
      throw new Error(`duplicate token on table ${table.number}`);
    }
    upsert.run(table);
    return table;
  }

  return {
    save,
    get,
    findByToken,

    list() {
      return selectAll.all().map(toTable);
    },

    rotateToken(number) {
      const table = get(number);
      if (!table) throw new Error(`unknown table number: ${number}`);
      return save(rotateToken(table));
    },
  };
}

function toTable(row) {
  return createTable({ number: row.number, label: row.label, token: row.token });
}
