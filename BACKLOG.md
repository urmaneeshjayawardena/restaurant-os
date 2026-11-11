# Backlog

Worked through roughly top to bottom, one item at a time.

## Core
- [x] Menu items and validation
- [x] Orders with line items and bill totals
- [ ] Order status flow (placed, preparing, ready, served, paid)
- [ ] Table model with an unguessable QR token per table
- [ ] Item notes ("no onions") that stay on separate order lines
- [ ] Mark items as sold out and block ordering them
- [ ] Combine several orders from one table into one bill
- [ ] Split a bill evenly between guests

## Storage
- [ ] SQLite schema using node:sqlite
- [ ] Menu repository
- [ ] Table repository
- [ ] Order repository
- [ ] Seed script with a sample menu

## API
- [ ] HTTP server and JSON error handling
- [ ] Public menu endpoint for a table token
- [ ] Place an order from a table token
- [ ] Order status endpoint for guests
- [ ] Kitchen queue endpoint
- [ ] Input validation and rate limiting on guest endpoints

## Guest screens (phone first)
- [ ] Menu page opened from the QR code
- [ ] Cart and place order
- [ ] Order status page
- [ ] Call waiter and request bill buttons

## Staff screens
- [ ] Generate printable QR codes for each table
- [ ] Kitchen display of open orders
- [ ] Live kitchen updates
- [ ] Printable bill
- [ ] Menu admin page

## Reports
- [ ] Daily sales summary
- [ ] Best-selling items
- [ ] CSV export of a day's orders

## Later
- [ ] Sinhala and Tamil menu translations
- [ ] Staff logins and roles
- [ ] Dockerfile and deployment notes
