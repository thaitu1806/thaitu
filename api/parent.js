import { getDb } from './db.js';
import { validateLinkCodeFormat } from '../lib/link-code.js';

// --- Rate Limiting (in-memory) ---
const rateLimitMap = new Map(); // key: IP, value: { count, firstAttempt }
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;

/**
 * Check if an IP is rate-limited for link-by-code attempts.
 * Returns true if allowed, false if blocked.
 */
export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || (now - entry.firstAttempt > RATE_LIMIT_WINDOW)) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return true; // allowed
  }

  if (entry.count >= RATE_LIMIT_MAX) return false; // blocked
  entry.count++;
  return true;
}

// Exported for testing purposes
export { rateLimitMap, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX };

export default async function handler(req, res) {
  const db = getDb();
  const action = req.query.action || '';

  // POST /api/parent?action=register
  if (req.method === 'POST' && action === 'register') {
    const { username, pin, display_name } = req.body;
    if (!username || !pin) return res.status(400).json({ error: 'Cần nhập tên đăng nhập và mã PIN' });
    if (pin.length < 4) return res.status(400).json({ error: 'Mã PIN cần ít nhất 4 ký tự' });
    try {
      const existing = await db.execute({ sql: `SELECT id FROM parents WHERE username = ?`, args: [username.trim()] });
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
      const result = await db.execute({
        sql: `INSERT INTO parents (username, pin, display_name) VALUES (?, ?, ?)`,
        args: [username.trim(), pin, display_name || username.trim()],
      });
      return res.json({ id: Number(result.lastInsertRowid), username: username.trim() });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // POST /api/parent?action=login
  if (req.method === 'POST' && action === 'login') {
    const { username, pin } = req.body;
    if (!username || !pin) return res.status(400).json({ error: 'Cần nhập tên đăng nhập và mã PIN' });
    try {
      const result = await db.execute({
        sql: `SELECT id, username, display_name FROM parents WHERE username = ? AND pin = ?`,
        args: [username.trim(), pin],
      });
      if (result.rows.length === 0) return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mã PIN' });
      return res.json(result.rows[0]);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // POST /api/parent?action=link-child
  if (req.method === 'POST' && action === 'link-child') {
    const { parent_id, player_name } = req.body;
    if (!parent_id || !player_name) return res.status(400).json({ error: 'Thiếu thông tin' });
    try {
      const player = await db.execute({ sql: `SELECT id, name FROM players WHERE name = ?`, args: [player_name.trim()] });
      if (player.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy học sinh với tên này' });
      const playerId = player.rows[0].id;
      // Check if already linked
      const existing = await db.execute({
        sql: `SELECT id FROM parent_children WHERE parent_id = ? AND player_id = ?`,
        args: [parent_id, playerId],
      });
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Đã liên kết con này rồi' });
      await db.execute({
        sql: `INSERT INTO parent_children (parent_id, player_id) VALUES (?, ?)`,
        args: [parent_id, playerId],
      });
      return res.json({ ok: true, player: player.rows[0] });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // POST /api/parent?action=link-by-code
  if (req.method === 'POST' && action === 'link-by-code') {
    const { parent_id, link_code } = req.body;

    // Validate required fields
    if (!parent_id || !link_code) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    // Validate parent_id exists (authentication check)
    try {
      const parentCheck = await db.execute({ sql: `SELECT id FROM parents WHERE id = ?`, args: [parent_id] });
      if (parentCheck.rows.length === 0) {
        return res.status(401).json({ error: 'Cần đăng nhập trước' });
      }
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }

    // Validate link_code format
    if (!validateLinkCodeFormat(link_code)) {
      return res.status(400).json({ error: 'Mã liên kết phải gồm 6 ký tự chữ và số' });
    }

    // Check rate limit before DB lookup
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Thử lại sau 30 phút' });
    }

    try {
      // Lookup player by link_code
      const playerResult = await db.execute({ sql: `SELECT id, name FROM players WHERE link_code = ?`, args: [link_code] });
      if (playerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy mã liên kết này' });
      }

      const player = playerResult.rows[0];

      // Check for existing parent_children link (duplicate check)
      const existingLink = await db.execute({
        sql: `SELECT id FROM parent_children WHERE parent_id = ? AND player_id = ?`,
        args: [parent_id, player.id],
      });
      if (existingLink.rows.length > 0) {
        return res.status(409).json({ error: 'Đã liên kết con này rồi' });
      }

      // Atomically: INSERT parent_children + UPDATE player link_status='linked'
      await db.batch([
        { sql: `INSERT INTO parent_children (parent_id, player_id) VALUES (?, ?)`, args: [parent_id, player.id] },
        { sql: `UPDATE players SET link_status = 'linked' WHERE id = ?`, args: [player.id] },
      ]);

      return res.json({ ok: true, player: { id: player.id, name: player.name } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE /api/parent?action=unlink-child
  if (req.method === 'DELETE' && action === 'unlink-child') {
    const { parent_id, player_id } = req.query;
    if (!parent_id || !player_id) return res.status(400).json({ error: 'Thiếu thông tin' });
    try {
      await db.execute({
        sql: `DELETE FROM parent_children WHERE parent_id = ? AND player_id = ?`,
        args: [parseInt(parent_id), parseInt(player_id)],
      });
      return res.json({ ok: true });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // GET /api/parent?action=children&parent_id=X
  if (req.method === 'GET' && action === 'children') {
    const { parent_id } = req.query;
    if (!parent_id) return res.status(400).json({ error: 'Thiếu parent_id' });
    try {
      const result = await db.execute({
        sql: `SELECT p.id, p.name, p.total_stars, p.grade, p.total_diamonds, p.lifetime_diamonds,
          p.current_streak, p.longest_streak, p.last_active_date, p.adventure_level,
          p.equipped_avatar, p.equipped_frame,
          (SELECT COUNT(*) FROM game_sessions WHERE player_id = p.id) as total_games,
          (SELECT MAX(played_at) FROM game_sessions WHERE player_id = p.id) as last_played
        FROM players p
        JOIN parent_children pc ON pc.player_id = p.id
        WHERE pc.parent_id = ?
        ORDER BY p.name`,
        args: [parseInt(parent_id)],
      });
      return res.json(result.rows);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // GET /api/parent?action=child-stats&player_id=X&parent_id=Y
  if (req.method === 'GET' && action === 'child-stats') {
    const { parent_id, player_id } = req.query;
    if (!parent_id || !player_id) return res.status(400).json({ error: 'Thiếu thông tin' });
    // Verify parent owns this child
    try {
      const link = await db.execute({
        sql: `SELECT id FROM parent_children WHERE parent_id = ? AND player_id = ?`,
        args: [parseInt(parent_id), parseInt(player_id)],
      });
      if (link.rows.length === 0) return res.status(403).json({ error: 'Không có quyền xem' });

      // Performance by subject
      const bySubject = await db.execute({
        sql: `SELECT q.subject, q.difficulty,
          COUNT(*) as total, SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct,
          ROUND(100.0 * SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as accuracy
        FROM answer_logs a JOIN questions q ON a.question_id = q.id
        WHERE a.player_id = ? GROUP BY q.subject, q.difficulty ORDER BY q.subject, q.difficulty`,
        args: [parseInt(player_id)],
      });

      // Recent sessions (last 20)
      const sessions = await db.execute({
        sql: `SELECT subject, difficulty, correct_answers, total_questions, stars_earned, combo_max, played_at,
          ROUND(100.0 * correct_answers / total_questions, 1) as accuracy
        FROM game_sessions WHERE player_id = ? AND total_questions > 0 ORDER BY played_at DESC LIMIT 20`,
        args: [parseInt(player_id)],
      });

      // Exam results
      const exams = await db.execute({
        sql: `SELECT er.score, er.grade, er.correct_answers, er.total_questions, er.time_spent_seconds, er.taken_at,
          e.title, e.subject FROM exam_results er JOIN exams e ON er.exam_id = e.id
        WHERE er.player_name = (SELECT name FROM players WHERE id = ?) ORDER BY er.taken_at DESC LIMIT 10`,
        args: [parseInt(player_id)],
      });

      // Pending vouchers
      const vouchers = await db.execute({
        sql: `SELECT rv.id, rv.status, rv.requested_at, si.name as item_name, si.category, si.price_diamonds
        FROM reward_vouchers rv JOIN shop_items si ON rv.item_id = si.id
        WHERE rv.player_id = ? ORDER BY rv.requested_at DESC LIMIT 10`,
        args: [parseInt(player_id)],
      });

      return res.json({
        bySubject: bySubject.rows,
        sessions: sessions.rows,
        exams: exams.rows,
        vouchers: vouchers.rows,
      });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // PUT /api/parent?action=approve-voucher
  if (req.method === 'PUT' && action === 'approve-voucher') {
    const { parent_id, voucher_id, status } = req.body;
    if (!parent_id || !voucher_id || !status) return res.status(400).json({ error: 'Thiếu thông tin' });
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status không hợp lệ' });
    try {
      // Verify parent owns the child who requested this voucher
      const voucher = await db.execute({
        sql: `SELECT rv.player_id FROM reward_vouchers rv
          JOIN parent_children pc ON pc.player_id = rv.player_id
          WHERE rv.id = ? AND pc.parent_id = ?`,
        args: [parseInt(voucher_id), parseInt(parent_id)],
      });
      if (voucher.rows.length === 0) return res.status(403).json({ error: 'Không có quyền' });
      await db.execute({
        sql: `UPDATE reward_vouchers SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [status, parseInt(voucher_id)],
      });
      return res.json({ ok: true });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // ── Parent-created rewards ("Quà từ bố mẹ") ──

  // POST /api/parent?action=create-reward  { parent_id, player_id, title, icon, price_diamonds }
  if (req.method === 'POST' && action === 'create-reward') {
    const { parent_id, player_id, title, icon, price_diamonds } = req.body;
    if (!parent_id || !player_id || !title) return res.status(400).json({ error: 'Thiếu thông tin' });
    const price = Math.max(1, parseInt(price_diamonds) || 50);
    try {
      // Verify parent owns this child
      const link = await db.execute({ sql: `SELECT id FROM parent_children WHERE parent_id = ? AND player_id = ?`, args: [parseInt(parent_id), parseInt(player_id)] });
      if (link.rows.length === 0) return res.status(403).json({ error: 'Không có quyền' });
      const r = await db.execute({
        sql: `INSERT INTO parent_rewards (parent_id, player_id, title, icon, price_diamonds) VALUES (?, ?, ?, ?, ?)`,
        args: [parseInt(parent_id), parseInt(player_id), String(title).slice(0, 60), icon || '🎁', price],
      });
      return res.json({ ok: true, id: Number(r.lastInsertRowid) });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // GET /api/parent?action=rewards&parent_id=X&player_id=Y  (parent view: all)
  // GET /api/parent?action=rewards&player_id=Y              (child view: active only)
  if (req.method === 'GET' && action === 'rewards') {
    const { parent_id, player_id } = req.query;
    if (!player_id) return res.status(400).json({ error: 'Thiếu player_id' });
    try {
      let sql, args;
      if (parent_id) {
        sql = `SELECT id, title, icon, price_diamonds, is_active, created_at FROM parent_rewards WHERE parent_id = ? AND player_id = ? ORDER BY created_at DESC`;
        args = [parseInt(parent_id), parseInt(player_id)];
      } else {
        sql = `SELECT id, title, icon, price_diamonds FROM parent_rewards WHERE player_id = ? AND is_active = 1 ORDER BY price_diamonds ASC`;
        args = [parseInt(player_id)];
      }
      const r = await db.execute({ sql, args });
      return res.json(r.rows);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // DELETE /api/parent?action=delete-reward&parent_id=X&reward_id=Y
  if (req.method === 'DELETE' && action === 'delete-reward') {
    const { parent_id, reward_id } = req.query;
    if (!parent_id || !reward_id) return res.status(400).json({ error: 'Thiếu thông tin' });
    try {
      await db.execute({ sql: `DELETE FROM parent_rewards WHERE id = ? AND parent_id = ?`, args: [parseInt(reward_id), parseInt(parent_id)] });
      return res.json({ ok: true });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // POST /api/parent?action=redeem-reward  { player_id, reward_id }  (child redeems)
  if (req.method === 'POST' && action === 'redeem-reward') {
    const { player_id, reward_id } = req.body;
    if (!player_id || !reward_id) return res.status(400).json({ error: 'Thiếu thông tin' });
    try {
      const rw = await db.execute({ sql: `SELECT * FROM parent_rewards WHERE id = ? AND player_id = ? AND is_active = 1`, args: [parseInt(reward_id), parseInt(player_id)] });
      if (rw.rows.length === 0) return res.status(404).json({ error: 'Quà không tồn tại' });
      const reward = rw.rows[0];
      const pl = await db.execute({ sql: `SELECT total_diamonds FROM players WHERE id = ?`, args: [parseInt(player_id)] });
      const bal = pl.rows[0]?.total_diamonds || 0;
      if (bal < reward.price_diamonds) return res.status(400).json({ error: 'Chưa đủ kim cương' });
      await db.batch([
        { sql: `UPDATE players SET total_diamonds = total_diamonds - ? WHERE id = ?`, args: [reward.price_diamonds, parseInt(player_id)] },
        { sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, reference_id, description) VALUES (?, ?, 'spend', 'shop', ?, ?)`, args: [parseInt(player_id), reward.price_diamonds, reward.id, `Đổi quà bố mẹ: ${reward.title}`] },
        { sql: `INSERT INTO parent_reward_claims (reward_id, player_id, parent_id, title, icon, price_diamonds) VALUES (?, ?, ?, ?, ?, ?)`, args: [reward.id, parseInt(player_id), reward.parent_id, reward.title, reward.icon, reward.price_diamonds] },
      ]);
      const newBal = bal - reward.price_diamonds;
      return res.json({ ok: true, new_balance: newBal, title: reward.title });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // GET /api/parent?action=claims&parent_id=X  (parent: pending redemptions)
  if (req.method === 'GET' && action === 'claims') {
    const { parent_id } = req.query;
    if (!parent_id) return res.status(400).json({ error: 'Thiếu parent_id' });
    try {
      const r = await db.execute({
        sql: `SELECT c.id, c.title, c.icon, c.price_diamonds, c.status, c.claimed_at, c.player_id, p.name as player_name
          FROM parent_reward_claims c JOIN players p ON p.id = c.player_id
          WHERE c.parent_id = ? ORDER BY (c.status = 'pending') DESC, c.claimed_at DESC LIMIT 50`,
        args: [parseInt(parent_id)],
      });
      return res.json(r.rows);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // PUT /api/parent?action=fulfill-claim  { parent_id, claim_id }
  if (req.method === 'PUT' && action === 'fulfill-claim') {
    const { parent_id, claim_id } = req.body;
    if (!parent_id || !claim_id) return res.status(400).json({ error: 'Thiếu thông tin' });
    try {
      const c = await db.execute({ sql: `SELECT id FROM parent_reward_claims WHERE id = ? AND parent_id = ?`, args: [parseInt(claim_id), parseInt(parent_id)] });
      if (c.rows.length === 0) return res.status(403).json({ error: 'Không có quyền' });
      await db.execute({ sql: `UPDATE parent_reward_claims SET status = 'fulfilled', fulfilled_at = CURRENT_TIMESTAMP WHERE id = ?`, args: [parseInt(claim_id)] });
      return res.json({ ok: true });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  res.status(404).json({ error: 'Action không hợp lệ' });
}
