/**
 * Migration script: Assign link_code and link_status to existing players.
 *
 * This script is idempotent — safe to re-run multiple times.
 *
 * What it does:
 * 1. Adds link_code, link_status, last_prompt_date columns (if not already present)
 * 2. Generates unique link_code for all players where link_code IS NULL
 * 3. Sets link_status = 'linked' for players with existing parent_children records
 * 4. Sets link_status = 'unlinked' for players without parent_children records (default)
 *
 * Run: node db/migrate-link-codes.js
 */

import { getDb } from './database.js';
import { generateUniqueLinkCode } from '../lib/link-code.js';

async function migrate() {
  console.log('🔄 Starting link-code migration...\n');

  // Get DB connection (without running full initDb which may fail if columns missing)
  const db = getDb();

  // Step 1: Add columns if not exist (try/catch for SQLite compat)
  console.log('Step 1: Ensuring columns exist...');

  const alterStatements = [
    `ALTER TABLE players ADD COLUMN link_code TEXT DEFAULT NULL`,
    `ALTER TABLE players ADD COLUMN link_status TEXT DEFAULT 'unlinked' CHECK(link_status IN ('unlinked', 'prompted', 'linked'))`,
    `ALTER TABLE players ADD COLUMN last_prompt_date TEXT DEFAULT NULL`,
  ];

  for (const sql of alterStatements) {
    try {
      await db.execute({ sql, args: [] });
      console.log('  ✅ Added:', sql.substring(0, 60) + '...');
    } catch (e) {
      if (e.message?.includes('duplicate column') || e.message?.includes('already exists')) {
        console.log('  ⏭️  Already exists:', sql.substring(0, 60) + '...');
      } else {
        console.log('  ❌ Error:', e.message);
      }
    }
  }

  // Ensure unique index exists
  try {
    await db.execute({ sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_players_link_code ON players(link_code)`, args: [] });
    console.log('  ✅ Unique index idx_players_link_code ensured.');
  } catch (e) {
    console.log('  ⏭️  Index already exists or error:', e.message);
  }

  // Step 2: Generate link_code for players where it's NULL
  console.log('\nStep 2: Generating link codes for existing players...');

  const playersWithoutCode = await db.execute({
    sql: `SELECT id, name FROM players WHERE link_code IS NULL`,
    args: []
  });

  const totalToMigrate = playersWithoutCode.rows.length;
  console.log(`  Found ${totalToMigrate} player(s) without link_code.`);

  let codesGenerated = 0;
  for (const player of playersWithoutCode.rows) {
    const code = await generateUniqueLinkCode(db);
    await db.execute({
      sql: `UPDATE players SET link_code = ? WHERE id = ?`,
      args: [code, player.id]
    });
    codesGenerated++;
    if (codesGenerated % 50 === 0) {
      console.log(`  ... ${codesGenerated}/${totalToMigrate} codes generated`);
    }
  }

  if (codesGenerated > 0) {
    console.log(`  ✅ Generated link codes for ${codesGenerated} player(s).`);
  } else {
    console.log('  ⏭️  All players already have link codes.');
  }

  // Step 3: Set link_status = 'linked' for players with parent_children records
  console.log('\nStep 3: Setting link_status for players with parent links...');

  const linkedResult = await db.execute({
    sql: `UPDATE players SET link_status = 'linked' WHERE id IN (SELECT DISTINCT player_id FROM parent_children) AND link_status != 'linked'`,
    args: []
  });

  const linkedCount = linkedResult.rowsAffected || 0;
  console.log(`  ✅ Set ${linkedCount} player(s) to 'linked' status.`);

  // Step 4: Set link_status = 'unlinked' for players without parent_children records
  // (Only update those that are still NULL or not yet set — default is 'unlinked' so this covers edge cases)
  console.log('\nStep 4: Ensuring unlinked players have correct status...');

  const unlinkedResult = await db.execute({
    sql: `UPDATE players SET link_status = 'unlinked' WHERE id NOT IN (SELECT DISTINCT player_id FROM parent_children) AND (link_status IS NULL OR link_status = '')`,
    args: []
  });

  const unlinkedCount = unlinkedResult.rowsAffected || 0;
  console.log(`  ✅ Set ${unlinkedCount} player(s) to 'unlinked' status.`);

  // Summary
  console.log('\n✅ Migration complete!');
  console.log(`   Total players processed: ${totalToMigrate}`);
  console.log(`   Link codes generated: ${codesGenerated}`);
  console.log(`   Marked as linked: ${linkedCount}`);
  console.log(`   Marked as unlinked: ${unlinkedCount}`);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
