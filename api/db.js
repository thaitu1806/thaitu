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
    // Parent-created rewards ("Quà từ bố mẹ") — ensure tables exist on Turso/local.
    db.execute({ sql: `CREATE TABLE IF NOT EXISTS parent_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      icon TEXT DEFAULT '🎁',
      price_diamonds INTEGER NOT NULL DEFAULT 50,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, args: [] }).catch(() => {});
    db.execute({ sql: `ALTER TABLE parent_rewards ADD COLUMN max_per_week INTEGER DEFAULT NULL`, args: [] }).catch(() => {});
    db.execute({ sql: `CREATE TABLE IF NOT EXISTS parent_reward_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reward_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      parent_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      icon TEXT DEFAULT '🎁',
      price_diamonds INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      fulfilled_at DATETIME DEFAULT NULL
    )`, args: [] }).catch(() => {});
  }

  return db;
}
