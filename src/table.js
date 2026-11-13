import { randomBytes } from 'node:crypto';

// 16 random bytes is 128 bits, far too many to guess by walking through URLs.
const TOKEN_BYTES = 16;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{22}$/;

export function generateTableToken() {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function createTable({ number, label, token = generateTableToken() }) {
  if (!Number.isInteger(number) || number < 1) {
    throw new Error(`invalid table number: ${number}`);
  }
  if (!TOKEN_PATTERN.test(token)) {
    throw new Error(`invalid token for table ${number}`);
  }

  return { number, label: label?.trim() || `Table ${number}`, token };
}

// Swapping the token makes old printed QR codes stop working, e.g. after a
// guest photographs one and keeps ordering from home.
export function rotateToken(table) {
  return { ...table, token: generateTableToken() };
}

export function indexTablesByToken(tables) {
  const byToken = new Map();
  const numbers = new Set();

  for (const raw of tables) {
    const table = createTable(raw);
    if (numbers.has(table.number)) throw new Error(`duplicate table number: ${table.number}`);
    if (byToken.has(table.token)) throw new Error(`duplicate token on table ${table.number}`);

    numbers.add(table.number);
    byToken.set(table.token, table);
  }

  return byToken;
}
