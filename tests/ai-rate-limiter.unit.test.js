import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { checkRateLimit, recordUsage } from '../lib/ai-rate-limiter.js';
import { initDb, getDb } from '../db/database.js';

describe('ai-rate-limiter', () => {
  let db;

  beforeAll(async () => {
    db = await initDb();
  });

  beforeEach(async () => {
    // Clean up ai_usage_logs before each test
    await db.execute({ sql: `DELETE FROM ai_usage_logs`, args: [] });
    // Ensure a test player exists
    await db.execute({
      sql: `INSERT OR IGNORE INTO players (id, name) VALUES (?, ?)`,
      args: [999, 'test-rate-player'],
    });
  });

  describe('checkRateLimit', () => {
    it('allows requests when player has no usage today', async () => {
      const result = await checkRateLimit(999);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(50);
      expect(result.resetAt).toBeDefined();
    });

    it('returns correct remaining after some usage', async () => {
      // Record 3 usages
      await recordUsage(999, 'explain', 100);
      await recordUsage(999, 'hint', 50);
      await recordUsage(999, 'chat', 200);

      const result = await checkRateLimit(999);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(47);
    });

    it('denies requests when daily limit is reached', async () => {
      // Fill up to the limit (default 50)
      for (let i = 0; i < 50; i++) {
        await recordUsage(999, 'explain', 10);
      }

      const result = await checkRateLimit(999);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('resetAt is midnight tonight (start of next day)', async () => {
      const result = await checkRateLimit(999);
      const resetDate = new Date(result.resetAt);
      const now = new Date();

      // Should be tomorrow at 00:00:00
      expect(resetDate.getDate()).toBe(now.getDate() + 1 <= new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        ? now.getDate() + 1
        : 1);
      expect(resetDate.getHours()).toBe(0);
      expect(resetDate.getMinutes()).toBe(0);
      expect(resetDate.getSeconds()).toBe(0);
    });
  });

  describe('recordUsage', () => {
    it('inserts a log entry into ai_usage_logs', async () => {
      await recordUsage(999, 'explain', 150);

      const result = await db.execute({
        sql: `SELECT * FROM ai_usage_logs WHERE player_id = ?`,
        args: [999],
      });

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].player_id).toBe(999);
      expect(result.rows[0].feature).toBe('explain');
      expect(result.rows[0].tokens_used).toBe(150);
    });

    it('records multiple usages for the same player', async () => {
      await recordUsage(999, 'explain', 100);
      await recordUsage(999, 'hint', 50);
      await recordUsage(999, 'chat', 200);

      const result = await db.execute({
        sql: `SELECT * FROM ai_usage_logs WHERE player_id = ? ORDER BY id`,
        args: [999],
      });

      expect(result.rows.length).toBe(3);
      expect(result.rows[0].feature).toBe('explain');
      expect(result.rows[1].feature).toBe('hint');
      expect(result.rows[2].feature).toBe('chat');
    });
  });
});
