import { getDb } from '../db.js';

const VALID_CATEGORIES = ['avatar', 'frame', 'sticker', 'powerup', 'voucher'];
const VALID_LEVELS = ['bronze', 'silver', 'gold', 'diamond', 'master'];

export default async function handler(req, res) {
  const action = req.query?.action || 'items';
  const method = req.method;

  try {
    // GET /api/admin/shop/items (action='' or action='items') — list all items including inactive
    if (method === 'GET' && (!action || action === 'items')) {
      return await handleListAllItems(req, res);
    }

    // GET /api/admin/diamond-stats (action='stats') — diamond economy stats
    if (method === 'GET' && action === 'stats') {
      return await handleDiamondStats(req, res);
    }

    // POST /api/admin/shop/items (action='create') — create new shop item
    if (method === 'POST' && action === 'create') {
      return await handleCreateItem(req, res);
    }

    // PUT /api/admin/shop/items/:id (action='update') — update item fields
    if (method === 'PUT' && action === 'update') {
      return await handleUpdateItem(req, res);
    }

    // DELETE /api/admin/shop/items/:id (action='delete') — delete item
    if (method === 'DELETE' && action === 'delete') {
      return await handleDeleteItem(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET — List all shop items including inactive ones.
 */
async function handleListAllItems(req, res) {
  const db = getDb();
  const result = await db.execute({
    sql: `SELECT * FROM shop_items ORDER BY created_at DESC`,
    args: [],
  });
  return res.json({ items: result.rows || [] });
}

/**
 * POST — Create a new shop item.
 * Required: name, category, price_diamonds
 * Optional: description, min_level, image_url, is_active, max_per_week
 */
async function handleCreateItem(req, res) {
  const db = getDb();
  const { name, description, category, price_diamonds, min_level, image_url, is_active, max_per_week } = req.body || {};

  // Validate required fields
  if (!name || !category || price_diamonds == null) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  // Validate category
  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: `Danh mục không hợp lệ. Phải là: ${VALID_CATEGORIES.join(', ')}` });
  }

  // Validate min_level if provided
  if (min_level && !VALID_LEVELS.includes(min_level)) {
    return res.status(400).json({ error: `Cấp độ không hợp lệ. Phải là: ${VALID_LEVELS.join(', ')}` });
  }

  const result = await db.execute({
    sql: `INSERT INTO shop_items (name, description, category, price_diamonds, min_level, image_url, is_active, max_per_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      name,
      description || '',
      category,
      parseInt(price_diamonds),
      min_level || 'bronze',
      image_url || null,
      is_active != null ? (is_active ? 1 : 0) : 1,
      max_per_week != null ? parseInt(max_per_week) : null,
    ],
  });

  return res.json({ ok: true, id: Number(result.lastInsertRowid) });
}

/**
 * PUT — Update an existing shop item (partial updates).
 * item_id from query param or body.
 */
async function handleUpdateItem(req, res) {
  const db = getDb();
  const itemId = req.query?.item_id || req.body?.item_id;

  if (!itemId) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const id = parseInt(itemId);

  // Check item exists
  const existing = await db.execute({
    sql: `SELECT id FROM shop_items WHERE id = ?`,
    args: [id],
  });
  if (!existing.rows || existing.rows.length === 0) {
    return res.status(404).json({ error: 'Vật phẩm không tồn tại' });
  }

  // Build dynamic update based on provided fields
  const allowedFields = ['name', 'description', 'category', 'price_diamonds', 'min_level', 'image_url', 'is_active', 'max_per_week'];
  const updates = [];
  const args = [];

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      let value = req.body[field];

      // Validate category if being updated
      if (field === 'category' && !VALID_CATEGORIES.includes(value)) {
        return res.status(400).json({ error: `Danh mục không hợp lệ. Phải là: ${VALID_CATEGORIES.join(', ')}` });
      }

      // Validate min_level if being updated
      if (field === 'min_level' && !VALID_LEVELS.includes(value)) {
        return res.status(400).json({ error: `Cấp độ không hợp lệ. Phải là: ${VALID_LEVELS.join(', ')}` });
      }

      // Convert boolean-like is_active to integer
      if (field === 'is_active') {
        value = value ? 1 : 0;
      }

      // Convert numeric fields
      if (field === 'price_diamonds' || field === 'max_per_week') {
        value = value != null ? parseInt(value) : null;
      }

      updates.push(`${field} = ?`);
      args.push(value);
    }
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'Không có trường nào để cập nhật' });
  }

  args.push(id);
  await db.execute({
    sql: `UPDATE shop_items SET ${updates.join(', ')} WHERE id = ?`,
    args,
  });

  return res.json({ ok: true });
}

/**
 * DELETE — Hard delete a shop item.
 * item_id from query param or body.
 */
async function handleDeleteItem(req, res) {
  const db = getDb();
  const itemId = req.query?.item_id || req.body?.item_id;

  if (!itemId) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const id = parseInt(itemId);

  await db.execute({
    sql: `DELETE FROM shop_items WHERE id = ?`,
    args: [id],
  });

  return res.json({ ok: true });
}

/**
 * GET — Diamond economy stats.
 * Returns total_earned, total_spent, and top purchased items.
 */
async function handleDiamondStats(req, res) {
  const db = getDb();

  // Total earned
  const earnedResult = await db.execute({
    sql: `SELECT SUM(amount) as total_earned FROM diamond_transactions WHERE type = 'earn'`,
    args: [],
  });

  // Total spent
  const spentResult = await db.execute({
    sql: `SELECT SUM(amount) as total_spent FROM diamond_transactions WHERE type = 'spend'`,
    args: [],
  });

  // Top purchased items
  const topItemsResult = await db.execute({
    sql: `SELECT si.name, si.category, COUNT(*) as purchase_count FROM player_inventory pi JOIN shop_items si ON pi.item_id = si.id GROUP BY pi.item_id ORDER BY purchase_count DESC LIMIT 10`,
    args: [],
  });

  return res.json({
    total_earned: earnedResult.rows[0]?.total_earned || 0,
    total_spent: spentResult.rows[0]?.total_spent || 0,
    top_items: topItemsResult.rows || [],
  });
}
