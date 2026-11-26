# restaurant-os

QR code table ordering for small restaurants.

## The problem

At a busy restaurant, guests wait for a menu, wait to order, and wait again for
the bill. Orders get written down wrong, and most QR ordering services charge
more per month than a small family-run place wants to pay.

## The idea

Each table gets a QR code. A guest scans it, browses the menu on their phone
and places the order, with no app to install. The order shows up on a kitchen
screen straight away, and the bill is ready when the table asks for it.

## Status

Early days. Right now it's the core table, order and billing logic, with the API and
screens coming next. See [BACKLOG.md](BACKLOG.md) for what's planned.

## Running the tests

Needs Node 22.13 or newer, the first release with `node:sqlite` available
without a flag.

```
npm test
```

## Table tokens

Each table has a random 128-bit token that goes in its QR code link, so guests
can't order for another table by changing a number in the URL. Rotating a
table's token makes its old QR code stop working.

## Item notes

Guests can add a short note to an item, such as "no onions". The same dish
with a different note goes on its own order line so the kitchen sees each
request separately. Notes are trimmed, capped at 140 characters and don't
change the price.

## Sold out items

Staff can mark a menu item sold out and back again with `markSoldOut` and
`markAvailable`. Sold out items drop off the guest menu (`availableItems`) and
can't be added to an order, but lines already ordered stay as they are.

## One bill per table

A table that orders more than once still gets a single bill.
`combineOrders(orders)` merges the unpaid orders for one table into one set of
lines, which `calculateBill` then totals as usual, so service charge and tax
are rounded once on the whole bill. The same dish ordered at two different
prices stays on separate lines.

## Storage

`openDatabase(path)` opens a SQLite file with the built-in `node:sqlite`
module, or an in-memory database when no path is given. It turns on foreign
keys and brings the schema up to date, tracking the version in
`PRAGMA user_version` so each upgrade only runs once. Order lines keep their
own copy of the item name and price, matching the in-memory order logic.
Node still prints an experimental warning the first time `node:sqlite` loads.

`createMenuRepository(db)` saves and reads menu items. `save` validates an item
the same way as `createMenuItem` and updates it in place if the id already
exists, `get` reads one item, `setSoldOut` flips the sold out flag, and
`loadMenu` returns the whole menu as the same map the in-memory menu functions
use, ordered by category then name.

`createTableRepository(db)` does the same for tables. `save` validates a table
like `createTable` and refuses a token another table already uses,
`findByToken` looks up the table behind a scanned QR code, `list` returns all
tables by number, and `rotateToken` stores a fresh token so the old QR code
stops working.

`createOrderRepository(db)` stores orders with their lines. `save` inserts an
order without an id and returns it with its new `id` and `createdAt`, or
updates the status and lines of one that has an id, all in one transaction so
a failed save leaves nothing half written. `get` reads one order back, and
`unpaidForTable` returns a table's orders that aren't paid yet, oldest first,
ready to pass to `combineOrders`.

To try it with some data, `npm run seed` creates `restaurant.db` (or the file
you name, as in `npm run seed -- cafe.db`) with a small Sri Lankan sample menu
and eight tables, each with its own QR token. It only adds what is missing, so
running it again never changes prices you've edited or reissues table tokens.

## Money

All prices are stored as whole cents so totals never pick up floating point
errors. Service charge is worked out on the subtotal, and tax on the subtotal
plus service charge.

## License

MIT, see [LICENSE](LICENSE).
