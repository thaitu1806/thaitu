/**
 * AI Rate Limiter
 * Enforces daily usage limits per player and logs AI usage.
 * Uses DB query (COUNT on ai_usage_logs WHERE date = today) for production-compatible limiting.
 */

import { getDb } from '../db/database.js';

const DAILY_LIMIT = parseInt(process.env.AI_DAILY_LIMIT || '50');

/**
 * Check if a player is allowed to make an AI request.
 * @param {number} playerId - The player's ID
 * @returns {Promise<{ allowed: boolean, remaining: number, resetAt: string }>}
 */
export async function checkRateLimit(playerId) {
  const db = getDb();

  const result = await db.execute({
    sql: `SELECT COUNT(*) as count FROM ai_usage_logs WHERE player_id = ? AND date(created_at) = date('now')`,
    args: [playerId],
  });

  const usedToday = result.rows[0]?.count ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - usedToday);
  const allowed = usedToday < DAILY_LIMIT;

  // resetAt = midnight tonight (start of next day)
  const now = new Date();
  const resetAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

  return { allowed, remaining, resetAt };
}

/**
 * Record an AI usage event in ai_usage_logs.
 * @param {number} playerId - The player's ID
 * @param {string} feature - Feature used ('explain' | 'hint' | 'chat' | 'generate')
 * @param {number} tokensUsed - Number of tokens consumed
 */
export async function recordUsage(playerId, feature, tokensUsed) {
  const db = getDb();

  await db.execute({
    sql: `INSERT INTO ai_usage_logs (player_id, feature, tokens_used) VALUES (?, ?, ?)`,
    args: [playerId, feature, tokensUsed],
  });
}
