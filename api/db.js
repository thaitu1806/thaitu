import { createClient } from '@libsql/client';

let db;

export function getDb() {
  if (db) return db;

  db = createClient({
    url: process.env.TURSO_URL || 'file:local.db',
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });

  return db;
}
