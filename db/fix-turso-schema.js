// Quick fix: add missing columns before full schema apply
import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const columns = [
  "ALTER TABLE players ADD COLUMN link_code TEXT DEFAULT NULL",
  "ALTER TABLE players ADD COLUMN link_status TEXT DEFAULT 'unlinked'",
  "ALTER TABLE players ADD COLUMN last_prompt_date TEXT DEFAULT NULL",
];

for (const sql of columns) {
  try {
    await db.execute(sql);
    console.log('OK:', sql);
  } catch (e) {
    console.log('Skip (already exists or table missing):', e.message);
  }
}

console.log('Done. Now run seed-turso.js');
