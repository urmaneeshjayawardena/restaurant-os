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

Needs Node 22 or newer.

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

## Money

All prices are stored as whole cents so totals never pick up floating point
errors. Service charge is worked out on the subtotal, and tax on the subtotal
plus service charge.

## License

MIT, see [LICENSE](LICENSE).
