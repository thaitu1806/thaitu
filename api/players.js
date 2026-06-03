import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();

  // GET - verify player exists by id
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    try {
      const result = await db.execute({ sql: `SELECT * FROM players WHERE id = ?`, args: [parseInt(id)] });
      if (result.rows.length === 0) return res.json({ error: 'not_found' });
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST - create or login player (unique name)
  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nhập tên đi con!' });

    try {
      const existing = await db.execute({ sql: `SELECT * FROM players WHERE name = ?`, args: [name.trim()] });
      if (existing.rows.length > 0) {
        // Name exists - return existing player (login behavior)
        return res.json(existing.rows[0]);
      }
      // Create new player with unique name
      const result = await db.execute({ sql: `INSERT INTO players (name) VALUES (?)`, args: [name.trim()] });
      return res.json({ id: Number(result.lastInsertRowid), name: name.trim(), total_stars: 0 });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
