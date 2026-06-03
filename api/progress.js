import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();

  // Parse player id and mode from URL: /api/players/123/progress/v2
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);
  // Expected: ['api', 'players', ':id', 'progress', ':mode']
  const playerId = parseInt(parts[2]);
  const mode = parts[4] || 'v2';

  if (!playerId || isNaN(playerId)) {
    return res.status(400).json({ error: 'Invalid player id' });
  }

  // GET - load progress
  if (req.method === 'GET') {
    try {
      const result = await db.execute({
        sql: `SELECT progress_data FROM player_progress WHERE player_id = ? AND game_mode = ?`,
        args: [playerId, mode],
      });
      if (result.rows.length > 0) return res.json(JSON.parse(result.rows[0].progress_data));
      return res.json(null);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // PUT - save progress
  if (req.method === 'PUT') {
    const data = JSON.stringify(req.body);
    try {
      await db.execute({
        sql: `INSERT INTO player_progress (player_id, game_mode, progress_data) VALUES (?, ?, ?) ON CONFLICT(player_id, game_mode) DO UPDATE SET progress_data = ?, updated_at = CURRENT_TIMESTAMP`,
        args: [playerId, mode, data, data],
      });
      // Update adventure_level in players table for V2
      if (mode === 'v2' && req.body.level) {
        await db.execute({
          sql: `UPDATE players SET adventure_level = ? WHERE id = ?`,
          args: [parseInt(req.body.level), playerId],
        });
      }
      return res.json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
