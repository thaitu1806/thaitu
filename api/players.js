import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'POST') {
    const { name } = req.body;
    try {
      const existing = await db.execute({ sql: `SELECT * FROM players WHERE name = ?`, args: [name] });
      if (existing.rows.length > 0) return res.json(existing.rows[0]);
      const result = await db.execute({ sql: `INSERT INTO players (name) VALUES (?)`, args: [name] });
      return res.json({ id: result.lastInsertRowid, name, total_stars: 0 });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
