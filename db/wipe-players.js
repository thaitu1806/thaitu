// One-off script: delete ALL players and related data on Turso (or local).
// Keeps questions and exams intact.
// Run: TURSO_URL=... TURSO_AUTH_TOKEN=... node db/wipe-players.js
import { createClient } from '@libsql/client';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = process.env.TURSO_URL
  ? createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  : createClient({ url: 'file:' + join(__dirname, 'local.db') });

// Order matters: clear child tables (those referencing players) before players itself.
const tables = [
  'answer_logs',
  'game_sessions',
  'player_progress',
  'daily_quests',
  'player_inventory',
  'diamond_transactions',
  'reward_vouchers',
  'parent_children',
  'ai_usage_logs',
  'parents',
  'players',
];

async function wipe() {
  const before = await db.execute('SELECT COUNT(*) AS c FROM players');
  console.log(`Players before: ${before.rows[0].c}`);

  for (const t of tables) {
    try {
      const r = await db.execute(`DELETE FROM ${t}`);
      console.log(`✅ Cleared ${t} (${r.rowsAffected} rows)`);
    } catch (e) {
      if (/no such table/i.test(e.message || '')) {
        console.log(`⏭️  Skipped ${t} (table does not exist)`);
      } else {
        throw e;
      }
    }
  }

  const after = await db.execute('SELECT COUNT(*) AS c FROM players');
  console.log(`Players after: ${after.rows[0].c}`);
  console.log('Done.');
}

wipe().catch((e) => { console.error(e); process.exit(1); });
