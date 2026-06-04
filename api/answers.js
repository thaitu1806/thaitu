import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'POST') {
    const { session_id, player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms } = req.body;
    // Skip if missing required data
    if (!question_id || !player_id) {
      return res.json({ ok: true, skipped: true });
    }
    try {
      await db.execute({
        sql: `INSERT INTO answer_logs (session_id, player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [session_id || 0, player_id, question_id, selected_answer || '', correct_answer || '', is_correct ? 1 : 0, time_spent_ms || 0],
      });
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
