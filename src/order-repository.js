import { ORDER_STATUSES, createOrder } from './order.js';

export function createOrderRepository(db) {
  const insertOrder = db.prepare(
    'INSERT INTO orders (table_number, status) VALUES (:tableNumber, :status)',
  );
  const updateStatus = db.prepare('UPDATE orders SET status = :status WHERE id = :id');
  const deleteLines = db.prepare('DELETE FROM order_lines WHERE order_id = ?');
  const insertLine = db.prepare(`
    INSERT INTO order_lines (order_id, item_id, name, unit_price_cents, quantity, note)
    VALUES (:orderId, :itemId, :name, :unitPriceCents, :quantity, :note)
  `);
  const selectOne = db.prepare('SELECT * FROM orders WHERE id = ?');
  const selectUnpaidForTable = db.prepare(
    "SELECT * FROM orders WHERE table_number = ? AND status != 'paid' ORDER BY id",
  );
  const selectLines = db.prepare('SELECT * FROM order_lines WHERE order_id = ? ORDER BY rowid');

  function get(id) {
    const row = selectOne.get(id);
    return row && toOrder(row);
  }

  function toOrder(row) {
    return {
      id: row.id,
      tableNumber: row.table_number,
      status: row.status,
      createdAt: row.created_at,
      lines: selectLines.all(row.id).map(toLine),
    };
  }

  // Lines are rewritten as a whole rather than diffed, since an order only
  // has a handful of them and the status flow stops edits once cooking starts.
  function writeLines(orderId, lines) {
    deleteLines.run(orderId);
    for (const { itemId, name, unitPriceCents, quantity, note } of lines) {
      insertLine.run({ orderId, itemId, name, unitPriceCents, quantity, note });
    }
  }

  return {
    get,

    save(order) {
      assertSavable(order);
      return inTransaction(db, () => {
        let id = order.id;
        if (id === undefined) {
          const { tableNumber, status } = order;
          id = Number(insertOrder.run({ tableNumber, status }).lastInsertRowid);
        } else if (updateStatus.run({ id, status: order.status }).changes === 0) {
          throw new Error(`unknown order id: ${id}`);
        }
        writeLines(id, order.lines);
        return get(id);
      });
    },

    // The orders still to be billed for a table, oldest first, ready for combineOrders.
    unpaidForTable(tableNumber) {
      return selectUnpaidForTable.all(tableNumber).map(toOrder);
    },
  };
}

function assertSavable(order) {
  createOrder(order.tableNumber);
  if (!ORDER_STATUSES.includes(order.status)) {
    throw new Error(`invalid order status: ${order.status}`);
  }
}

function toLine(row) {
  return {
    itemId: row.item_id,
    name: row.name,
    unitPriceCents: row.unit_price_cents,
    quantity: row.quantity,
    note: row.note,
  };
}

function inTransaction(db, work) {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
