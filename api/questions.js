import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    const { subject, difficulty, limit = 10, grade, player_id } = req.query;
    try {
      // Determine grade: explicit param > player's stored grade > default 2
      let resolvedGrade = 2;
      if (grade) {
        resolvedGrade = parseInt(grade);
      } else if (player_id) {
        const playerResult = await db.execute({
          sql: `SELECT grade FROM players WHERE id = ?`,
          args: [parseInt(player_id)],
        });
        if (playerResult.rows.length > 0 && playerResult.rows[0].grade) {
          resolvedGrade = playerResult.rows[0].grade;
        }
      }

      const result = await db.execute({
        sql: `SELECT * FROM questions WHERE subject = ? AND difficulty = ? AND grade = ? ORDER BY RANDOM() LIMIT ?`,
        args: [subject, difficulty, resolvedGrade, parseInt(limit)],
      });
      return res.json(result.rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
