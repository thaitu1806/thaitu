import { getDb } from './db.js';
import { getPlayerLevel, PLAYER_LEVELS } from '../lib/diamond-calc.js';

/**
 * Level ordering for comparison.
 */
const LEVEL_ORDER = ['bronze', 'silver', 'gold', 'diamond', 'master'];

/**
 * Check if player's level meets the required minimum level.
 * @param {string} playerLevel - player's current level name
 * @param {string} requiredLevel - item's min_level requirement
 * @returns {boolean}
 */
function meetsLevelRequirement(playerLevel, requiredLevel) {
  return LEVEL_ORDER.indexOf(playerLevel) >= LEVEL_ORDER.indexOf(requiredLevel);
}

export default async function handler(req, res) {
  const action = req.query?.action || '';
  const method = req.method;

  try {
    // Route: GET /api/shop/items (action='' or action='items')
    if (method === 'GET' && (!action || action === 'items')) {
      return await handleListItems(req, res);
    }

    // Route: POST /api/shop/buy (action='buy')
    if (method === 'POST' && action === 'buy') {
      return await handleBuyItem(req, res);
    }

    // Route: GET /api/players/:id/inventory (action='inventory')
    if (method === 'GET' && action === 'inventory') {
      return await handleGetInventory(req, res);
    }

    // Route: PUT /api/players/:id/equip (action='equip')
    if (method === 'PUT' && action === 'equip') {
      return await handleEquipItem(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/shop/items
 * List active shop items, filter by category and player level.
 * Mark items as "new" if created within 7 days.
 * Query params: category, player_id
 */
async function handleListItems(req, res) {
  const db = getDb();
  const { category, player_id } = req.query || {};

  let playerLevel = null;
  if (player_id) {
    const playerResult = await db.execute({
      sql: `SELECT lifetime_diamonds FROM players WHERE id = ?`,
      args: [parseInt(player_id)],
    });
    if (playerResult.rows && playerResult.rows.length > 0) {
      const level = getPlayerLevel(playerResult.rows[0].lifetime_diamonds || 0);
      playerLevel = level.name;
    }
  }

  let sql = `SELECT * FROM shop_items WHERE is_active = 1`;
  const args = [];

  if (category) {
    sql += ` AND category = ?`;
    args.push(category);
  }

  sql += ` ORDER BY created_at DESC`;

  const result = await db.execute({ sql, args });
  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  let items = (result.rows || []).map(item => {
    const createdAt = new Date(item.created_at);
    const isNew = (now - createdAt) <= sevenDaysMs;
    return { ...item, is_new: isNew };
  });

  // Filter by player level if player_id provided
  if (playerLevel) {
    items = items.filter(item => meetsLevelRequirement(playerLevel, item.min_level || 'bronze'));
  }

  return res.json({ items });
}

/**
 * POST /api/shop/buy
 * Purchase an item. Body: { player_id, item_id }
 * Validates: player exists, item active, sufficient diamonds, level requirement, weekly limit.
 * Atomically: deduct diamonds, insert inventory, insert spend transaction, create voucher if needed.
 */
async function handleBuyItem(req, res) {
  const db = getDb();
  const { player_id, item_id } = req.body || {};

  if (!player_id || !item_id) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const playerId = parseInt(player_id);
  const itemId = parseInt(item_id);

  // 1. Validate player exists
  const playerResult = await db.execute({
    sql: `SELECT id, total_diamonds, lifetime_diamonds FROM players WHERE id = ?`,
    args: [playerId],
  });
  if (!playerResult.rows || playerResult.rows.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  }
  const player = playerResult.rows[0];

  // 2. Validate item exists and is active
  const itemResult = await db.execute({
    sql: `SELECT * FROM shop_items WHERE id = ? AND is_active = 1`,
    args: [itemId],
  });
  if (!itemResult.rows || itemResult.rows.length === 0) {
    return res.status(404).json({ error: 'Vật phẩm không tồn tại' });
  }
  const item = itemResult.rows[0];

  // 3. Validate level requirement
  const playerLevel = getPlayerLevel(player.lifetime_diamonds || 0);
  if (!meetsLevelRequirement(playerLevel.name, item.min_level || 'bronze')) {
    const requiredLabel = PLAYER_LEVELS.find(l => l.name === item.min_level)?.label || item.min_level;
    return res.status(403).json({ error: `Cần đạt cấp ${requiredLabel} để mua` });
  }

  // 4. Validate sufficient diamonds
  if ((player.total_diamonds || 0) < item.price_diamonds) {
    return res.status(400).json({ error: 'Không đủ kim cương' });
  }

  // 5. Validate weekly limit (if max_per_week is set)
  if (item.max_per_week != null) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weeklyResult = await db.execute({
      sql: `SELECT COUNT(*) as count FROM player_inventory WHERE player_id = ? AND item_id = ? AND purchased_at >= ?`,
      args: [playerId, itemId, sevenDaysAgo],
    });
    const weeklyCount = weeklyResult.rows[0]?.count || 0;
    if (weeklyCount >= item.max_per_week) {
      return res.status(400).json({ error: 'Đã đạt giới hạn tuần' });
    }
  }

  // 6. Perform purchase atomically using batch
  const statements = [
    // Deduct diamonds
    {
      sql: `UPDATE players SET total_diamonds = total_diamonds - ? WHERE id = ?`,
      args: [item.price_diamonds, playerId],
    },
    // Insert inventory record
    {
      sql: `INSERT INTO player_inventory (player_id, item_id) VALUES (?, ?)`,
      args: [playerId, itemId],
    },
    // Insert spend transaction
    {
      sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, reference_id, description) VALUES (?, ?, 'spend', 'shop', ?, ?)`,
      args: [playerId, item.price_diamonds, itemId, `Mua: ${item.name}`],
    },
  ];

  // If category is 'voucher', also insert reward_vouchers record
  if (item.category === 'voucher') {
    statements.push({
      sql: `INSERT INTO reward_vouchers (player_id, item_id, status) VALUES (?, ?, 'pending')`,
      args: [playerId, itemId],
    });
  }

  await db.batch(statements);

  return res.json({
    ok: true,
    message: 'Mua thành công',
    item_name: item.name,
    diamonds_spent: item.price_diamonds,
    new_balance: (player.total_diamonds || 0) - item.price_diamonds,
  });
}

/**
 * GET /api/players/:id/inventory (action='inventory')
 * Return player's purchased items with equipped status.
 * Query params: player_id (or id from route params)
 */
async function handleGetInventory(req, res) {
  const db = getDb();
  const id = req.params?.id || req.query?.player_id;

  if (!id) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const playerId = parseInt(id);

  // Validate player exists
  const playerResult = await db.execute({
    sql: `SELECT id FROM players WHERE id = ?`,
    args: [playerId],
  });
  if (!playerResult.rows || playerResult.rows.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  }

  // Get inventory with item details
  const inventoryResult = await db.execute({
    sql: `SELECT pi.id, pi.player_id, pi.item_id, pi.purchased_at, pi.is_equipped,
          si.name, si.description, si.category, si.image_url
          FROM player_inventory pi
          JOIN shop_items si ON pi.item_id = si.id
          WHERE pi.player_id = ?
          ORDER BY pi.purchased_at DESC`,
    args: [playerId],
  });

  return res.json({ inventory: inventoryResult.rows || [] });
}

/**
 * PUT /api/players/:id/equip (action='equip')
 * Equip an avatar or frame. Body: { player_id, inventory_id }
 * Validates ownership and item category; unequips previous of same type.
 */
async function handleEquipItem(req, res) {
  const db = getDb();
  const { player_id, inventory_id } = req.body || {};
  const id = player_id || req.params?.id || req.query?.player_id;

  if (!id || !inventory_id) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const playerId = parseInt(id);
  const invId = parseInt(inventory_id);

  // Validate player exists
  const playerResult = await db.execute({
    sql: `SELECT id FROM players WHERE id = ?`,
    args: [playerId],
  });
  if (!playerResult.rows || playerResult.rows.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  }

  // Validate ownership - player owns this inventory item
  const invResult = await db.execute({
    sql: `SELECT pi.id, pi.item_id, si.category FROM player_inventory pi
          JOIN shop_items si ON pi.item_id = si.id
          WHERE pi.id = ? AND pi.player_id = ?`,
    args: [invId, playerId],
  });
  if (!invResult.rows || invResult.rows.length === 0) {
    return res.status(400).json({ error: 'Bạn chưa sở hữu vật phẩm này' });
  }

  const invItem = invResult.rows[0];
  const category = invItem.category;

  // Only avatar and frame can be equipped
  if (category !== 'avatar' && category !== 'frame') {
    return res.status(400).json({ error: 'Vật phẩm này không thể trang bị' });
  }

  // Unequip previous item of the same category
  await db.execute({
    sql: `UPDATE player_inventory SET is_equipped = 0 WHERE player_id = ? AND item_id IN (SELECT id FROM shop_items WHERE category = ?) AND is_equipped = 1`,
    args: [playerId, category],
  });

  // Equip the new item
  await db.execute({
    sql: `UPDATE player_inventory SET is_equipped = 1 WHERE id = ?`,
    args: [invId],
  });

  // Update player equipped_avatar or equipped_frame
  const field = category === 'avatar' ? 'equipped_avatar' : 'equipped_frame';
  await db.execute({
    sql: `UPDATE players SET ${field} = ? WHERE id = ?`,
    args: [invItem.item_id.toString(), playerId],
  });

  return res.json({
    ok: true,
    equipped: category,
    inventory_id: invId,
  });
}
