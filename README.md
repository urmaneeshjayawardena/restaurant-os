# restaurant-os

Menu, table and order management for small restaurants. The goal is something
a family-run place could actually use: take orders at the table, send them to
the kitchen, and print a correct bill.

Early days. Right now it's the core order and billing logic, with an API and
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
