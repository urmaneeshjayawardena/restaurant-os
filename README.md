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

Early days. Right now it's the core order and billing logic, with the API and
screens coming next. See [BACKLOG.md](BACKLOG.md) for what's planned.

## Running the tests

Needs Node 22 or newer.

```
npm test
```

## Money

All prices are stored as whole cents so totals never pick up floating point
errors. Service charge is worked out on the subtotal, and tax on the subtotal
plus service charge.

## License

MIT, see [LICENSE](LICENSE).
