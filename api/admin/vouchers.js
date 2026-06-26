import { getDb } from '../db.js';

export default async function handler(req, res) {
  const action = req.query?.action || 'list';
  const method = req.method;

  try {
    // GET /api/admin/vouchers (action='' or 'list') — list vouchers with player name and item info
    if (method === 'GET' && (!action || action === 'list')) {
      return await handleListVouchers(req, res);
    }

    // PUT /api/admin/vouchers/:id (action='resolve') — approve or reject a voucher
    if (method === 'PUT' && action === 'resolve') {
      return await handleResolveVoucher(req, res);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * GET — List vouchers with player name and item info.
 * Optionally filter by ?status=pending (default: show all).
 */
async function handleListVouchers(req, res) {
  const db = getDb();
  const status = req.query?.status;

  let sql = `
    SELECT rv.*, p.name as player_name, si.name as item_name, si.category, si.price_diamonds
    FROM reward_vouchers rv
    JOIN players p ON rv.player_id = p.id
    JOIN shop_items si ON rv.item_id = si.id
  `;
  const args = [];

  if (status) {
    sql += ` WHERE rv.status = ?`;
    args.push(status);
  }

  sql += ` ORDER BY rv.requested_at DESC`;

  const result = await db.execute({ sql, args });
  return res.json({ vouchers: result.rows || [] });
}

/**
 * PUT — Approve or reject a voucher.
 * Body: { voucher_id, status: 'approved'|'rejected', admin_note? }
 * Validates that current status is 'pending' before transition.
 */
async function handleResolveVoucher(req, res) {
  const db = getDb();
  const { voucher_id, status, admin_note } = req.body || {};

  // Validate required fields
  if (!voucher_id || !status) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  // Validate status value
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ. Phải là: approved, rejected' });
  }

  const id = parseInt(voucher_id);

  // Get current voucher
  const existing = await db.execute({
    sql: `SELECT id, status FROM reward_vouchers WHERE id = ?`,
    args: [id],
  });

  if (!existing.rows || existing.rows.length === 0) {
    return res.status(404).json({ error: 'Phiếu thưởng không tồn tại' });
  }

  // Validate current status is 'pending'
  if (existing.rows[0].status !== 'pending') {
    return res.status(400).json({ error: 'Phiếu thưởng không ở trạng thái chờ' });
  }

  // Update voucher status, set resolved_at, and optionally admin_note
  const now = new Date().toISOString();

  await db.execute({
    sql: `UPDATE reward_vouchers SET status = ?, resolved_at = ?, admin_note = ? WHERE id = ?`,
    args: [status, now, admin_note || null, id],
  });

  return res.json({ ok: true });
}
