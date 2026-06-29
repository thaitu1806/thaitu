// One-time migration: make answer_logs.session_id NULLABLE so answers logged
// during play (before a game session row exists) don't fail the FK/NOT NULL.
// Recreates the table preserving all existing rows + indexes.
import { createClient } from '@libsql/client';

const db = createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN });

const cur = await db.execute(`SELECT sql FROM sqlite_master WHERE name='answer_logs'`);
console.log('BEFORE:\n', cur.rows[0].sql);

if (/session_id INTEGER NOT NULL/.test(cur.rows[0].sql)) {
  const before = await db.execute('SELECT COUNT(*) c FROM answer_logs');
  console.log('rows before:', before.rows[0].c);

  // SQLite table rebuild. Run statements individually (executeMultiple wraps in a txn).
  await db.execute('PRAGMA foreign_keys=OFF');
  await db.execute(`CREATE TABLE answer_logs_new (
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
  )`);
  await db.execute(`INSERT INTO answer_logs_new (id, session_id, player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms, answered_at)
    SELECT id, NULLIF(session_id, 0), player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms, answered_at FROM answer_logs`);
  await db.execute('DROP TABLE answer_logs');
  await db.execute('ALTER TABLE answer_logs_new RENAME TO answer_logs');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_answer_logs_player ON answer_logs(player_id)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_answer_logs_question ON answer_logs(question_id)');
  await db.execute('CREATE INDEX IF NOT EXISTS idx_answer_logs_session ON answer_logs(session_id)');
  await db.execute('PRAGMA foreign_keys=ON');

  const after = await db.execute('SELECT COUNT(*) c FROM answer_logs');
  console.log('rows after:', after.rows[0].c);
  const now = await db.execute(`SELECT sql FROM sqlite_master WHERE name='answer_logs'`);
  console.log('AFTER:\n', now.rows[0].sql);
} else {
  console.log('Already nullable — no migration needed.');
}
