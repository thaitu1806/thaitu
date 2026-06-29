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

    // Self-heal: older DBs created answer_logs with `session_id INTEGER NOT NULL`.
    // Answers are logged *during* play (before the game-session row exists), so
    // session_id must be nullable or every answer 500s. SQLite can't drop a column
    // constraint via ALTER, so rebuild the table once if the old constraint exists.
    migrateAnswerLogsSessionNullable(db).catch(() => {});
  }

  return db;
}

async function migrateAnswerLogsSessionNullable(db) {
  const info = await db.execute({ sql: `PRAGMA table_info(answer_logs)`, args: [] });
  const sessionCol = info.rows.find(r => r.name === 'session_id');
  if (!sessionCol || Number(sessionCol.notnull) === 0) return; // already nullable (or no table)

  await db.execute({ sql: `PRAGMA foreign_keys=OFF`, args: [] });
  await db.execute({ sql: `BEGIN`, args: [] });
  try {
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
    await db.execute({ sql: `COMMIT`, args: [] });
  } catch (e) {
    await db.execute({ sql: `ROLLBACK`, args: [] }).catch(() => {});
    throw e;
  } finally {
    await db.execute({ sql: `PRAGMA foreign_keys=ON`, args: [] }).catch(() => {});
  }
}
