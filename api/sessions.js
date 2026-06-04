import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'POST') {
    const { player_id, subject, difficulty, score, total_questions, correct_answers, stars_earned, combo_max } = req.body;
    try {
      const result = await db.execute({
        sql: `INSERT INTO game_sessions (player_id, subject, difficulty, score, total_questions, correct_answers, stars_earned, combo_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [player_id, subject, difficulty, score, total_questions, correct_answers, stars_earned, combo_max],
      });
      // Also update adventure_level from player_progress if available
      const prog = await db.execute({ sql: `SELECT progress_data FROM player_progress WHERE player_id = ? AND game_mode = 'v2'`, args: [player_id] });
      if (prog.rows.length > 0) {
        const data = JSON.parse(prog.rows[0].progress_data);
        if (data.level) {
          await db.execute({ sql: `UPDATE players SET adventure_level = ? WHERE id = ?`, args: [parseInt(data.level), player_id] });
        }
      }
      return res.json({ id: result.lastInsertRowid });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
