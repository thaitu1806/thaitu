import { getDb } from './db.js';

/**
 * Friends API — supports search, request, accept, reject, list, unfriend.
 * Two-way friendship: A sends request → B accepts → mutual friends.
 * Query param ?action= determines the operation.
 */
export default async function handler(req, res) {
  const db = getDb();
  const action = req.query.action || req.body?.action;

  try {
    switch (action) {
      // ── Search players by name (for finding friends) ──
      case 'search': {
        const { q, player_id } = req.query;
        if (!q || !player_id) return res.json([]);
        const results = await db.execute({
          sql: `SELECT id, name, grade, equipped_avatar, lifetime_diamonds, total_stars
                FROM players WHERE name LIKE ? AND id != ? LIMIT 20`,
          args: [`%${q}%`, parseInt(player_id)],
        });
        // Attach friendship status for each result
        const rows = results.rows || [];
        const enriched = [];
        for (const r of rows) {
          const fs = await db.execute({
            sql: `SELECT status FROM friendships
                  WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)`,
            args: [parseInt(player_id), r.id, r.id, parseInt(player_id)],
          });
          const status = fs.rows && fs.rows.length > 0 ? fs.rows[0].status : null;
          enriched.push({ ...r, friendship_status: status });
        }
        return res.json(enriched);
      }

      // ── List all players (for discovery) ──
      case 'discover': {
        const { player_id, limit = 30 } = req.query;
        if (!player_id) return res.status(400).json({ error: 'player_id required' });
        const results = await db.execute({
          sql: `SELECT id, name, grade, equipped_avatar, lifetime_diamonds, total_stars
                FROM players WHERE id != ? ORDER BY last_active_date DESC LIMIT ?`,
          args: [parseInt(player_id), parseInt(limit)],
        });
        return res.json(results.rows || []);
      }

      // ── Send friend request ──
      case 'request': {
        const { requester_id, receiver_id } = req.body;
        if (!requester_id || !receiver_id) return res.status(400).json({ error: 'Missing ids' });
        if (requester_id === receiver_id) return res.status(400).json({ error: 'Cannot friend yourself' });
        // Check if already exists
        const existing = await db.execute({
          sql: `SELECT id, status FROM friendships
                WHERE (requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)`,
          args: [requester_id, receiver_id, receiver_id, requester_id],
        });
        if (existing.rows && existing.rows.length > 0) {
          const s = existing.rows[0].status;
          if (s === 'accepted') return res.json({ ok: true, status: 'already_friends' });
          if (s === 'pending') return res.json({ ok: true, status: 'already_pending' });
        }
        await db.execute({
          sql: `INSERT INTO friendships (requester_id, receiver_id, status) VALUES (?, ?, 'pending')`,
          args: [requester_id, receiver_id],
        });
        return res.json({ ok: true, status: 'requested' });
      }

      // ── Accept friend request ──
      case 'accept': {
        const { friendship_id, player_id } = req.body;
        if (!friendship_id || !player_id) return res.status(400).json({ error: 'Missing params' });
        await db.execute({
          sql: `UPDATE friendships SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP
                WHERE id = ? AND receiver_id = ? AND status = 'pending'`,
          args: [friendship_id, player_id],
        });
        return res.json({ ok: true });
      }

      // ── Reject / cancel friend request ──
      case 'reject': {
        const { friendship_id, player_id } = req.body;
        if (!friendship_id || !player_id) return res.status(400).json({ error: 'Missing params' });
        await db.execute({
          sql: `DELETE FROM friendships WHERE id = ? AND (requester_id = ? OR receiver_id = ?)`,
          args: [friendship_id, player_id, player_id],
        });
        return res.json({ ok: true });
      }

      // ── Unfriend ──
      case 'unfriend': {
        const { friend_id, player_id } = req.body;
        if (!friend_id || !player_id) return res.status(400).json({ error: 'Missing params' });
        await db.execute({
          sql: `DELETE FROM friendships
                WHERE ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?))
                AND status = 'accepted'`,
          args: [player_id, friend_id, friend_id, player_id],
        });
        return res.json({ ok: true });
      }

      // ── List my friends (accepted) ──
      case 'list': {
        const { player_id } = req.query;
        if (!player_id) return res.status(400).json({ error: 'player_id required' });
        const pid = parseInt(player_id);
        const results = await db.execute({
          sql: `SELECT f.id as friendship_id,
                  CASE WHEN f.requester_id = ? THEN f.receiver_id ELSE f.requester_id END as friend_id,
                  p.name, p.grade, p.equipped_avatar, p.lifetime_diamonds, p.total_stars, p.last_active_date
                FROM friendships f
                JOIN players p ON p.id = CASE WHEN f.requester_id = ? THEN f.receiver_id ELSE f.requester_id END
                WHERE (f.requester_id = ? OR f.receiver_id = ?) AND f.status = 'accepted'
                ORDER BY p.last_active_date DESC`,
          args: [pid, pid, pid, pid],
        });
        return res.json(results.rows || []);
      }

      // ── List pending requests (received) ──
      case 'pending': {
        const { player_id } = req.query;
        if (!player_id) return res.status(400).json({ error: 'player_id required' });
        const pid = parseInt(player_id);
        const results = await db.execute({
          sql: `SELECT f.id as friendship_id, f.requester_id,
                  p.name, p.grade, p.equipped_avatar, p.lifetime_diamonds, p.total_stars
                FROM friendships f
                JOIN players p ON p.id = f.requester_id
                WHERE f.receiver_id = ? AND f.status = 'pending'
                ORDER BY f.created_at DESC`,
          args: [pid],
        });
        return res.json(results.rows || []);
      }

      // ── Get friend count (for parent dashboard) ──
      case 'count': {
        const { player_id } = req.query;
        if (!player_id) return res.status(400).json({ error: 'player_id required' });
        const pid = parseInt(player_id);
        const result = await db.execute({
          sql: `SELECT COUNT(*) as count FROM friendships
                WHERE (requester_id = ? OR receiver_id = ?) AND status = 'accepted'`,
          args: [pid, pid],
        });
        return res.json({ count: (result.rows && result.rows[0]?.count) || 0 });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
