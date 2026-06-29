import { getDb } from './db.js';
import { generateUniqueLinkCode } from '../lib/link-code.js';

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
    const { name, grade } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nhập tên đi con!' });

    const playerGrade = (grade != null && grade !== '') ? parseInt(grade) : 2;

    try {
      const existing = await db.execute({ sql: `SELECT * FROM players WHERE name = ?`, args: [name.trim()] });
      if (existing.rows.length > 0) {
        // Name exists - return existing player (login behavior)
        return res.json(existing.rows[0]);
      }
      // Create new player with unique name, grade, and link code
      const linkCode = await generateUniqueLinkCode(db);
      const result = await db.execute({
        sql: `INSERT INTO players (name, grade, link_code) VALUES (?, ?, ?)`,
        args: [name.trim(), playerGrade, linkCode],
      });
      return res.json({ id: Number(result.lastInsertRowid), name: name.trim(), total_stars: 0, grade: playerGrade, link_code: linkCode, link_status: 'unlinked' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT - update player grade
  if (req.method === 'PUT') {
    const { id: bodyId, grade } = req.body;
    const id = req.query.id || bodyId;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    if (grade == null || grade === '') return res.status(400).json({ error: 'Missing grade' });

    const gradeValue = parseInt(grade);
    if (gradeValue < 0 || gradeValue > 5) {
      return res.status(400).json({ error: 'Grade must be between 0 and 5' });
    }

    try {
      await db.execute({
        sql: `UPDATE players SET grade = ? WHERE id = ?`,
        args: [gradeValue, parseInt(id)],
      });
      const result = await db.execute({ sql: `SELECT * FROM players WHERE id = ?`, args: [parseInt(id)] });
      if (result.rows.length === 0) return res.status(404).json({ error: 'Player not found' });
      return res.json(result.rows[0]);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
