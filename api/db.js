import { createClient } from '@libsql/client';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
let db;
let migrated = false;

export function getDb() {
  if (db) return db;

  if (process.env.TURSO_URL) {
    db = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    });
  } else {
    db = createClient({
      url: 'file:' + join(__dirname, '..', 'db', 'local.db'),
    });
  }

  // Run migrations once
  if (!migrated) {
    migrated = true;
    db.execute({ sql: `ALTER TABLE players ADD COLUMN adventure_level INTEGER DEFAULT 1`, args: [] }).catch(() => {});
  }

  return db;
}
