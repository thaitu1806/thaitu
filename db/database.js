import Database from 'better-sqlite3';
import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let db;

export function getDb() {
  if (db) return db;

  if (process.env.TURSO_URL) {
    // Production: Turso
    db = createClient({
      url: process.env.TURSO_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  } else {
    // Local dev: SQLite
    const sqliteDb = new Database(join(__dirname, 'local.db'));
    sqliteDb.pragma('journal_mode = WAL');

    // Wrap better-sqlite3 to match libsql client interface
    db = {
      execute: async (query) => {
        if (typeof query === 'string') {
          sqliteDb.exec(query);
          return { rows: [] };
        }
        const { sql, args } = query;
        const trimmed = sql.trim().toUpperCase();
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
          const rows = sqliteDb.prepare(sql).all(...(args || []));
          return { rows };
        }
        const result = sqliteDb.prepare(sql).run(...(args || []));
        return { rows: [], rowsAffected: result.changes, lastInsertRowid: result.lastInsertRowid };
      },
      batch: async (statements) => {
        const results = [];
        for (const stmt of statements) {
          if (typeof stmt === 'string') {
            sqliteDb.exec(stmt);
            results.push({ rows: [] });
          } else {
            const { sql, args } = stmt;
            sqliteDb.prepare(sql).run(...(args || []));
            results.push({ rows: [] });
          }
        }
        return results;
      },
      executeMultiple: async (sql) => {
        sqliteDb.exec(sql);
      },
      _sqlite: sqliteDb,
    };
  }

  return db;
}

export async function initDb() {
  const db = getDb();
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  if (db.executeMultiple) {
    await db.executeMultiple(schema);
  } else if (db._sqlite) {
    db._sqlite.exec(schema);
  }

  // Migrations: add columns if missing
  try {
    await db.execute({ sql: `ALTER TABLE players ADD COLUMN adventure_level INTEGER DEFAULT 1`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }

  // Daily Quest & Reward Shop: add new columns to players table
  try {
    await db.execute({ sql: `ALTER TABLE players ADD COLUMN total_diamonds INTEGER DEFAULT 0`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }
  try {
    await db.execute({ sql: `ALTER TABLE players ADD COLUMN lifetime_diamonds INTEGER DEFAULT 0`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }
  try {
    await db.execute({ sql: `ALTER TABLE players ADD COLUMN current_streak INTEGER DEFAULT 0`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }
  try {
    await db.execute({ sql: `ALTER TABLE players ADD COLUMN longest_streak INTEGER DEFAULT 0`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }
  try {
    await db.execute({ sql: `ALTER TABLE players ADD COLUMN last_active_date TEXT DEFAULT NULL`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }
  try {
    await db.execute({ sql: `ALTER TABLE players ADD COLUMN equipped_avatar TEXT DEFAULT NULL`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }
  try {
    await db.execute({ sql: `ALTER TABLE players ADD COLUMN equipped_frame TEXT DEFAULT NULL`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }

  // Multi-Grade & AI Integration: add grade column to players
  try {
    await db.execute({ sql: `ALTER TABLE players ADD COLUMN grade INTEGER DEFAULT 2`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }

  // Multi-Grade & AI Integration: add grade column to questions
  try {
    await db.execute({ sql: `ALTER TABLE questions ADD COLUMN grade INTEGER DEFAULT 2`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }

  // Multi-Grade & AI Integration: add source column to questions
  try {
    await db.execute({ sql: `ALTER TABLE questions ADD COLUMN source TEXT DEFAULT 'manual'`, args: [] });
  } catch (e) {
    // Column already exists - ignore
  }

  // Multi-Grade & AI Integration: add composite index for grade-filtered queries
  try {
    await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_questions_grade ON questions(subject, difficulty, grade)`, args: [] });
  } catch (e) {
    // Index already exists - ignore
  }

  return db;
}
