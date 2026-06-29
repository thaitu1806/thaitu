import { getDb } from './db.js';
import { calculateDiamonds, getPlayerLevel } from '../lib/diamond-calc.js';

const LEVEL_UP_BONUS = 20;

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'POST') {
    const { session_id, player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms, difficulty, combo_streak, hint_used } = req.body;
    // Skip if missing required data
    if (!question_id || !player_id) {
      return res.json({ ok: true, skipped: true });
    }
    try {
      // Log the answer. session_id may be absent during play (the session row is
      // only created when the game finishes) — store NULL rather than 0 to avoid
      // a foreign-key violation.
      const sid = (session_id && Number(session_id) > 0) ? session_id : null;
      await db.execute({
        sql: `INSERT INTO answer_logs (session_id, player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [sid, player_id, question_id, String(selected_answer ?? ''), String(correct_answer ?? ''), is_correct ? 1 : 0, time_spent_ms || 0],
      });

      // Diamond reward logic for correct answers
      if (is_correct && difficulty) {
        let diamonds = calculateDiamonds(difficulty, combo_streak || 0);

        // Apply 50% diamond penalty if hint was used on this question
        if (hint_used) {
          diamonds = Math.floor(diamonds / 2);
        }

        // Get current player data for level-up check
        const playerResult = await db.execute({
          sql: `SELECT lifetime_diamonds FROM players WHERE id = ?`,
          args: [player_id],
        });

        const currentLifetime = playerResult.rows && playerResult.rows.length > 0
          ? (playerResult.rows[0].lifetime_diamonds || 0)
          : 0;

        const levelBefore = getPlayerLevel(currentLifetime);
        const newLifetime = currentLifetime + diamonds;
        const levelAfter = getPlayerLevel(newLifetime);

        // Insert diamond transaction for the answer
        await db.execute({
          sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, description) VALUES (?, ?, 'earn', 'answer', ?)`,
          args: [player_id, diamonds, `Trả lời đúng câu ${difficulty}`],
        });

        // Update player totals
        await db.execute({
          sql: `UPDATE players SET total_diamonds = total_diamonds + ?, lifetime_diamonds = lifetime_diamonds + ? WHERE id = ?`,
          args: [diamonds, diamonds, player_id],
        });

        let totalEarned = diamonds;

        // Check for level-up bonus
        if (levelAfter.name !== levelBefore.name) {
          await db.execute({
            sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, description) VALUES (?, ?, 'earn', 'level_up', ?)`,
            args: [player_id, LEVEL_UP_BONUS, `Lên cấp ${levelAfter.label}`],
          });

          await db.execute({
            sql: `UPDATE players SET total_diamonds = total_diamonds + ?, lifetime_diamonds = lifetime_diamonds + ? WHERE id = ?`,
            args: [LEVEL_UP_BONUS, LEVEL_UP_BONUS, player_id],
          });

          totalEarned += LEVEL_UP_BONUS;
        }

        // Get the new total
        const updatedPlayer = await db.execute({
          sql: `SELECT total_diamonds FROM players WHERE id = ?`,
          args: [player_id],
        });

        const newTotal = updatedPlayer.rows && updatedPlayer.rows.length > 0
          ? updatedPlayer.rows[0].total_diamonds
          : 0;

        return res.json({ ok: true, diamonds_earned: totalEarned, new_total: newTotal });
      }

      // Wrong answer or no difficulty provided — no diamonds
      return res.json({ ok: true, diamonds_earned: 0, new_total: null });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
