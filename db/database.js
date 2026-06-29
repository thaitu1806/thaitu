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
        if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
          const stmt = sqliteDb.prepare(sql);
          // PRAGMA statements that set a value (e.g. `PRAGMA foreign_keys=OFF`) don't
          // return rows and can't be .all()'d; fall back to run() for those.
          if (stmt.reader) {
            const rows = stmt.all(...(args || []));
            return { rows };
          }
          stmt.run(...(args || []));
          return { rows: [] };
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

  // Self-heal: older DBs created answer_logs with `session_id INTEGER NOT NULL`.
  // Answers are logged *during* play (before the game-session row exists), so
  // session_id must be nullable — otherwise every answer insert 500s. SQLite can't
  // drop a column constraint via ALTER, so rebuild the table once if needed.
  try {
    const info = await db.execute({ sql: `PRAGMA table_info(answer_logs)`, args: [] });
    const sessionCol = (info.rows || []).find(r => r.name === 'session_id');
    if (sessionCol && Number(sessionCol.notnull) === 1) {
      await db.execute({ sql: `PRAGMA foreign_keys=OFF`, args: [] });
      await db.execute({ sql: `CREATE TABLE answer_logs_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        player_id INTEGER NOT NULL,
        question_id INTEGER NOT NULL,
        selected_answer TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        is_correct INTEGER NOT NULL DEFAULT 0,
        time_spent_ms INTEGER DEFAULT 0,
        answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES game_sessions(id),
        FOREIGN KEY (player_id) REFERENCES players(id),
        FOREIGN KEY (question_id) REFERENCES questions(id)
      )`, args: [] });
      await db.execute({ sql: `INSERT INTO answer_logs_new (id, session_id, player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms, answered_at)
        SELECT id, session_id, player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms, answered_at FROM answer_logs`, args: [] });
      await db.execute({ sql: `DROP TABLE answer_logs`, args: [] });
      await db.execute({ sql: `ALTER TABLE answer_logs_new RENAME TO answer_logs`, args: [] });
      await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_answer_logs_player ON answer_logs(player_id)`, args: [] });
      await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_answer_logs_question ON answer_logs(question_id)`, args: [] });
      await db.execute({ sql: `CREATE INDEX IF NOT EXISTS idx_answer_logs_session ON answer_logs(session_id)`, args: [] });
      await db.execute({ sql: `PRAGMA foreign_keys=ON`, args: [] });
    }
  } catch (e) {
    // Migration failed — leave existing table intact
  }

  return db;
}
