import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'Missing player id' });

  const playerId = parseInt(id);

  // GET /api/players/:id/link-status
  if (req.method === 'GET') {
    try {
      // Get player link info and current_streak
      const playerResult = await db.execute({
        sql: `SELECT link_code, link_status, last_prompt_date, current_streak FROM players WHERE id = ?`,
        args: [playerId],
      });

      if (playerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy người chơi' });
      }

      const player = playerResult.rows[0];

      // Get session count
      const sessionResult = await db.execute({
        sql: `SELECT COUNT(*) as session_count FROM game_sessions WHERE player_id = ?`,
        args: [playerId],
      });
      const sessionCount = sessionResult.rows[0].session_count;

      // Get linked parents if status is 'linked'
      let parents = [];
      if (player.link_status === 'linked') {
        const parentsResult = await db.execute({
          sql: `SELECT p.id, p.display_name FROM parents p
            JOIN parent_children pc ON pc.parent_id = p.id
            WHERE pc.player_id = ?`,
          args: [playerId],
        });
        parents = parentsResult.rows.map(row => ({ id: row.id, display_name: row.display_name }));
      }

      return res.json({
        status: player.link_status,
        code: player.link_code,
        session_count: sessionCount,
        current_streak: player.current_streak || 0,
        last_prompt_date: player.last_prompt_date || null,
        parents,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/players/:id/link-status
  if (req.method === 'POST') {
    const { action } = req.body || {};

    if (action === 'dismiss') {
      try {
        const today = new Date().toISOString().split('T')[0];
        await db.execute({
          sql: `UPDATE players SET link_status = 'prompted', last_prompt_date = ? WHERE id = ? AND link_status != 'linked'`,
          args: [today, playerId],
        });
        return res.json({ ok: true });
      } catch (err) {
        return res.status(500).json({ error: err.message });
      }
    }

    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
