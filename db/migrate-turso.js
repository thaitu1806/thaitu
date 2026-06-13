// Migration script to add missing columns to existing Turso tables
// Run: TURSO_URL=... TURSO_AUTH_TOKEN=... node db/migrate-turso.js

import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const migrations = [
  // Add grade and source to questions
  `ALTER TABLE questions ADD COLUMN grade INTEGER DEFAULT 2`,
  `ALTER TABLE questions ADD COLUMN source TEXT DEFAULT 'manual'`,
  // Add new columns to players
  `ALTER TABLE players ADD COLUMN grade INTEGER DEFAULT 2`,
  `ALTER TABLE players ADD COLUMN total_diamonds INTEGER DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN lifetime_diamonds INTEGER DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN current_streak INTEGER DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN longest_streak INTEGER DEFAULT 0`,
  `ALTER TABLE players ADD COLUMN last_active_date TEXT`,
  `ALTER TABLE players ADD COLUMN equipped_avatar TEXT`,
  `ALTER TABLE players ADD COLUMN equipped_frame TEXT`,
];

async function migrate() {
  console.log('Running migrations...');
  for (const sql of migrations) {
    try {
      await db.execute(sql);
      console.log('✅', sql.substring(0, 60) + '...');
    } catch (err) {
      if (err.message?.includes('duplicate column') || err.message?.includes('already exists')) {
        console.log('⏭️  Already exists:', sql.substring(0, 60) + '...');
      } else {
        console.log('❌', sql.substring(0, 60), '-', err.message);
      }
    }
  }
  console.log('Done!');
}

migrate().catch(console.error);
