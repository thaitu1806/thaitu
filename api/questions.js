import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    const { subject, difficulty, limit = 10 } = req.query;
    try {
      const result = await db.execute({
        sql: `SELECT * FROM questions WHERE subject = ? AND difficulty = ? ORDER BY RANDOM() LIMIT ?`,
        args: [subject, difficulty, parseInt(limit)],
      });
      return res.json(result.rows);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
