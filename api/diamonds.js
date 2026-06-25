import { getDb } from './db.js';
import { getPlayerLevel } from '../lib/diamond-calc.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const id = req.params?.id || req.query?.id;
  if (!id) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const playerId = parseInt(id);
  const db = getDb();

  try {
    // Get player diamond info
    const playerResult = await db.execute({
      sql: `SELECT total_diamonds, lifetime_diamonds FROM players WHERE id = ?`,
      args: [playerId],
    });

    if (!playerResult.rows || playerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy người chơi' });
    }

    const player = playerResult.rows[0];
    const totalDiamonds = player.total_diamonds || 0;
    const lifetimeDiamonds = player.lifetime_diamonds || 0;
    const level = getPlayerLevel(lifetimeDiamonds);

    // Get last 50 transactions
    const txResult = await db.execute({
      sql: `SELECT id, amount, type, source, description, created_at FROM diamond_transactions WHERE player_id = ? ORDER BY created_at DESC LIMIT 50`,
      args: [playerId],
    });

    return res.json({
      total_diamonds: totalDiamonds,
      lifetime_diamonds: lifetimeDiamonds,
      level: { name: level.name, label: level.label },
      transactions: txResult.rows || [],
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
