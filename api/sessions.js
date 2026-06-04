import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'POST') {
    const { player_id, subject, difficulty, score, total_questions, correct_answers, stars_earned, combo_max } = req.body;
    // Skip if missing required data
    if (!player_id) {
      return res.json({ id: 0, skipped: true });
    }
    try {
      const result = await db.execute({
        sql: `INSERT INTO game_sessions (player_id, subject, difficulty, score, total_questions, correct_answers, stars_earned, combo_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [player_id, subject || 'math', difficulty || 'easy', score || 0, total_questions || 0, correct_answers || 0, stars_earned || 0, combo_max || 0],
      });
      return res.json({ id: result.lastInsertRowid });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
