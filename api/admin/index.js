import { getDb } from '../db.js';

// Basic auth check
function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) return false;
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  return user === 'admin' && pass === 'admin';
}

export default async function handler(req, res) {
  // Auth check - skip if already handled by middleware (local server.js)
  const skipAuth = req._adminAuthed;
  if (!skipAuth) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    if (user !== 'admin' || pass !== 'admin') {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    return await handleRequest(req, res);
  } catch (err) {
    console.error('Admin handler error:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

async function handleRequest(req, res) {
  const db = getDb();
  
  // Parse resource from query param OR from URL path (e.g. /api/admin/shop/items → shop-items)
  let { resource, id, action } = req.query;
  const urlPath = req.url?.split('?')[0] || '';
  if (!resource) {
    if (urlPath.includes('/admin/shop/items')) {
      resource = 'shop-items';
      // Extract item ID from path like /admin/shop/items/123
      const itemMatch = urlPath.match(/\/admin\/shop\/items\/(\d+)/);
      if (itemMatch) id = itemMatch[1];
      // POST without id = create, PUT with id = update, DELETE with id = delete
      if (req.method === 'POST' && !id) action = 'create';
      else if (req.method === 'PUT' && id) action = 'update';
      else if (req.method === 'DELETE' && id) action = 'delete';
    } else if (urlPath.includes('/admin/diamond-stats')) {
      resource = 'diamond-stats';
    } else if (urlPath.includes('/admin/vouchers')) {
      resource = 'vouchers';
      const voucherMatch = urlPath.match(/\/admin\/vouchers\/(\d+)/);
      if (voucherMatch) id = voucherMatch[1];
    }
  }

  // === AI STATS ===
  if (resource === 'ai-stats') {
    if (req.method === 'GET') {
      // Today's usage
      const todayResult = await db.execute({
        sql: `SELECT COUNT(*) as total_requests, COALESCE(SUM(tokens_used), 0) as total_tokens FROM ai_usage_logs WHERE date(created_at) = date('now')`,
        args: [],
      });
      const today = todayResult.rows[0] || { total_requests: 0, total_tokens: 0 };
      // Estimated cost (gpt-4o-mini: ~$0.15/1M input tokens, rough estimate)
      const estimatedCost = (Number(today.total_tokens) / 1000000 * 0.15).toFixed(4);
      return res.json({
        total_requests: today.total_requests || 0,
        total_tokens: Number(today.total_tokens) || 0,
        estimated_cost: estimatedCost,
      });
    }
  }

  // === QUESTIONS ===
  if (resource === 'questions') {
    if (req.method === 'GET') {
      const { subject, difficulty, grade, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let sql = `SELECT * FROM questions WHERE 1=1`;
      const args = [];
      if (subject) { sql += ` AND subject = ?`; args.push(subject); }
      if (difficulty) { sql += ` AND difficulty = ?`; args.push(difficulty); }
      if (grade) { sql += ` AND grade = ?`; args.push(parseInt(grade)); }
      sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
      args.push(parseInt(limit), offset);
      const result = await db.execute({ sql, args });
      let countSql = `SELECT COUNT(*) as total FROM questions WHERE 1=1`;
      const countArgs = [];
      if (subject) { countSql += ` AND subject = ?`; countArgs.push(subject); }
      if (difficulty) { countSql += ` AND difficulty = ?`; countArgs.push(difficulty); }
      if (grade) { countSql += ` AND grade = ?`; countArgs.push(parseInt(grade)); }
      const countResult = await db.execute({ sql: countSql, args: countArgs });
      return res.json({ questions: result.rows, total: countResult.rows[0]?.total || 0 });
    }
    if (req.method === 'POST' && action === 'batch') {
      const { questions } = req.body;
      for (const q of questions) {
        await db.execute({
          sql: `INSERT INTO questions (subject, difficulty, grade, source, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [q.subject, q.difficulty, q.grade || 2, q.source || 'manual', q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || null],
        });
      }
      return res.json({ inserted: questions.length });
    }
    if (req.method === 'POST') {
      const q = req.body;
      const result = await db.execute({
        sql: `INSERT INTO questions (subject, difficulty, grade, source, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [q.subject, q.difficulty, q.grade || 2, q.source || 'manual', q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || null],
      });
      return res.json({ id: Number(result.lastInsertRowid) });
    }
    if (req.method === 'DELETE' && id) {
      await db.execute({ sql: `DELETE FROM questions WHERE id = ?`, args: [parseInt(id)] });
      return res.json({ ok: true });
    }
  }

  // === PLAYERS ===
  if (resource === 'players') {
    if (req.method === 'GET' && !id) {
      const result = await db.execute({
        sql: `SELECT p.*, p.adventure_level, (SELECT COUNT(*) FROM game_sessions WHERE player_id = p.id) as total_games, (SELECT SUM(stars_earned) FROM game_sessions WHERE player_id = p.id) as total_stars_earned, (SELECT SUM(correct_answers) FROM game_sessions WHERE player_id = p.id) as total_correct, (SELECT SUM(total_questions) FROM game_sessions WHERE player_id = p.id) as total_answered, (SELECT MAX(played_at) FROM game_sessions WHERE player_id = p.id) as last_played FROM players p ORDER BY p.created_at DESC`,
        args: [],
      });
      return res.json(result.rows);
    }
    if (req.method === 'GET' && id && action === 'weaknesses') {
      const playerId = parseInt(id);
      const missed = await db.execute({ sql: `SELECT q.id, q.subject, q.difficulty, q.question_text, COUNT(*) as times_attempted, SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) as times_wrong, ROUND(100.0 * SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(*), 1) as error_rate FROM answer_logs a JOIN questions q ON a.question_id = q.id WHERE a.player_id = ? GROUP BY q.id HAVING times_wrong > 0 ORDER BY error_rate DESC LIMIT 20`, args: [playerId] });
      const byCategory = await db.execute({ sql: `SELECT q.subject, q.difficulty, COUNT(*) as total, SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct, ROUND(100.0 * SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as accuracy FROM answer_logs a JOIN questions q ON a.question_id = q.id WHERE a.player_id = ? GROUP BY q.subject, q.difficulty`, args: [playerId] });
      const progress = await db.execute({ sql: `SELECT played_at, subject, difficulty, correct_answers, total_questions, score, stars_earned, ROUND(100.0 * correct_answers / total_questions, 1) as accuracy FROM game_sessions WHERE player_id = ? AND total_questions > 0 ORDER BY played_at DESC LIMIT 30`, args: [playerId] });
      return res.json({ missed: missed.rows, byCategory: byCategory.rows, patterns: [], progress: progress.rows });
    }
    if (req.method === 'GET' && id && action === 'history') {
      const playerId = parseInt(id);
      const sessions = await db.execute({ sql: `SELECT * FROM game_sessions WHERE player_id = ? ORDER BY played_at DESC LIMIT 50`, args: [playerId] });
      const player = await db.execute({ sql: `SELECT * FROM players WHERE id = ?`, args: [playerId] });
      return res.json({ player: player.rows[0], sessions: sessions.rows });
    }
    if (req.method === 'DELETE' && id && action === 'delete') {
      const playerId = parseInt(id);
      // Delete ALL related data first to satisfy foreign key constraints.
      // Every table that references players(id) must be cleared before the player row.
      const relatedTables = [
        'answer_logs',
        'game_sessions',
        'player_progress',
        'daily_quests',
        'player_inventory',
        'diamond_transactions',
        'reward_vouchers',
        'parent_children',
        'ai_usage_logs',
      ];
      for (const table of relatedTables) {
        try {
          await db.execute({ sql: `DELETE FROM ${table} WHERE player_id = ?`, args: [playerId] });
        } catch (e) {
          // Table may not exist in older databases — ignore "no such table" and continue.
          if (!/no such table/i.test(e.message || '')) throw e;
        }
      }
      await db.execute({ sql: `DELETE FROM players WHERE id = ?`, args: [playerId] });
      return res.json({ ok: true });
    }
  }

  // === STATS ===
  if (resource === 'stats') {
    const totalQ = await db.execute({ sql: `SELECT COUNT(*) as count FROM questions`, args: [] });
    const totalP = await db.execute({ sql: `SELECT COUNT(*) as count FROM players`, args: [] });
    const totalS = await db.execute({ sql: `SELECT COUNT(*) as count FROM game_sessions`, args: [] });
    const bySubject = await db.execute({ sql: `SELECT subject, difficulty, COUNT(*) as count FROM questions GROUP BY subject, difficulty`, args: [] });
    const hardest = await db.execute({ sql: `SELECT q.id, q.subject, q.difficulty, q.question_text, COUNT(*) as attempts, SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) as wrong, ROUND(100.0 * SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(*), 1) as error_rate FROM answer_logs a JOIN questions q ON a.question_id = q.id GROUP BY q.id HAVING attempts >= 3 ORDER BY error_rate DESC LIMIT 15`, args: [] });
    return res.json({ totalQuestions: totalQ.rows[0]?.count || 0, totalPlayers: totalP.rows[0]?.count || 0, totalSessions: totalS.rows[0]?.count || 0, bySubject: bySubject.rows, hardestQuestions: hardest.rows });
  }

  // === EXAMS ===
  if (resource === 'exams') {
    if (req.method === 'GET' && !id) {
      const result = await db.execute({ sql: `SELECT e.*, (SELECT COUNT(*) FROM exam_results WHERE exam_id = e.id) as times_taken FROM exams e ORDER BY e.created_at DESC`, args: [] });
      return res.json(result.rows);
    }
    if (req.method === 'GET' && id && action === 'results') {
      const result = await db.execute({ sql: `SELECT * FROM exam_results WHERE exam_id = ? ORDER BY taken_at DESC`, args: [parseInt(id)] });
      return res.json(result.rows);
    }
    if (req.method === 'POST') {
      const { title, subject, difficulty, total_questions, time_limit_minutes, question_ids } = req.body;
      let qIds = question_ids || [];
      if (qIds.length === 0) {
        if (subject === 'mix') {
          const half = Math.ceil(total_questions / 2);
          const diff = difficulty === 'mix' ? 'easy' : difficulty;
          const math = await db.execute({ sql: `SELECT id FROM questions WHERE subject = 'math' AND difficulty = ? ORDER BY RANDOM() LIMIT ?`, args: [diff, half] });
          const viet = await db.execute({ sql: `SELECT id FROM questions WHERE subject = 'vietnamese' AND difficulty = ? ORDER BY RANDOM() LIMIT ?`, args: [diff, total_questions - half] });
          qIds = [...math.rows.map(r => r.id), ...viet.rows.map(r => r.id)];
        } else {
          const diff = difficulty === 'mix' ? 'easy' : difficulty;
          const result = await db.execute({ sql: `SELECT id FROM questions WHERE subject = ? AND difficulty = ? ORDER BY RANDOM() LIMIT ?`, args: [subject, diff, total_questions] });
          qIds = result.rows.map(r => r.id);
        }
      }
      const result = await db.execute({
        sql: `INSERT INTO exams (title, subject, difficulty, total_questions, time_limit_minutes, question_ids) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [title, subject, difficulty, total_questions, time_limit_minutes, JSON.stringify(qIds)],
      });
      return res.json({ id: Number(result.lastInsertRowid), question_ids: qIds });
    }
    if (req.method === 'PUT' && id) {
      const { title, subject, difficulty, total_questions, time_limit_minutes, question_ids, is_active } = req.body;
      await db.execute({
        sql: `UPDATE exams SET title=?, subject=?, difficulty=?, total_questions=?, time_limit_minutes=?, question_ids=?, is_active=? WHERE id=?`,
        args: [title, subject, difficulty, total_questions, time_limit_minutes, JSON.stringify(question_ids), is_active ? 1 : 0, parseInt(id)],
      });
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE' && id) {
      await db.execute({ sql: `DELETE FROM exams WHERE id = ?`, args: [parseInt(id)] });
      return res.json({ ok: true });
    }
  }

  // === SHOP ITEMS (admin) ===
  if (resource === 'shop-items') {
    if (req.method === 'GET') {
      const result = await db.execute({ sql: `SELECT * FROM shop_items ORDER BY created_at DESC`, args: [] });
      return res.json({ items: result.rows || [] });
    }
    if (req.method === 'POST') {
      const { name, description, category, price_diamonds, min_level, image_url, is_active, max_per_week } = req.body || {};
      if (!name || !category || price_diamonds == null) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      const VALID_CATEGORIES = ['avatar', 'frame', 'sticker', 'powerup', 'voucher'];
      const VALID_LEVELS = ['bronze', 'silver', 'gold', 'diamond', 'master'];
      if (!VALID_CATEGORIES.includes(category)) return res.status(400).json({ error: `Danh mục không hợp lệ` });
      if (min_level && !VALID_LEVELS.includes(min_level)) return res.status(400).json({ error: `Cấp độ không hợp lệ` });
      const result = await db.execute({ sql: `INSERT INTO shop_items (name, description, category, price_diamonds, min_level, image_url, is_active, max_per_week) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, args: [name, description || '', category, parseInt(price_diamonds), min_level || 'bronze', image_url || null, is_active != null ? (is_active ? 1 : 0) : 1, max_per_week != null ? parseInt(max_per_week) : null] });
      return res.json({ ok: true, id: Number(result.lastInsertRowid) });
    }
    if (req.method === 'PUT' && id) {
      const allowedFields = ['name', 'description', 'category', 'price_diamonds', 'min_level', 'image_url', 'is_active', 'max_per_week'];
      const updates = []; const args = [];
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          let value = req.body[field];
          if (field === 'is_active') value = value ? 1 : 0;
          if (field === 'price_diamonds' || field === 'max_per_week') value = value != null ? parseInt(value) : null;
          updates.push(`${field} = ?`); args.push(value);
        }
      }
      if (updates.length === 0) return res.status(400).json({ error: 'Không có trường nào để cập nhật' });
      args.push(parseInt(id));
      await db.execute({ sql: `UPDATE shop_items SET ${updates.join(', ')} WHERE id = ?`, args });
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE' && id) {
      await db.execute({ sql: `DELETE FROM shop_items WHERE id = ?`, args: [parseInt(id)] });
      return res.json({ ok: true });
    }
  }

  // === DIAMOND STATS ===
  if (resource === 'diamond-stats') {
    const earnedResult = await db.execute({ sql: `SELECT SUM(amount) as total_earned FROM diamond_transactions WHERE type = 'earn'`, args: [] });
    const spentResult = await db.execute({ sql: `SELECT SUM(amount) as total_spent FROM diamond_transactions WHERE type = 'spend'`, args: [] });
    const topItemsResult = await db.execute({ sql: `SELECT si.name, si.category, COUNT(*) as purchase_count FROM player_inventory pi JOIN shop_items si ON pi.item_id = si.id GROUP BY pi.item_id ORDER BY purchase_count DESC LIMIT 10`, args: [] });
    return res.json({ total_earned: earnedResult.rows[0]?.total_earned || 0, total_spent: spentResult.rows[0]?.total_spent || 0, top_items: topItemsResult.rows || [] });
  }

  // === VOUCHERS ===
  if (resource === 'vouchers') {
    if (req.method === 'GET') {
      const status = req.query?.status;
      let sql = `SELECT rv.*, p.name as player_name, si.name as item_name, si.category, si.price_diamonds FROM reward_vouchers rv JOIN players p ON rv.player_id = p.id JOIN shop_items si ON rv.item_id = si.id`;
      const args = [];
      if (status) { sql += ` WHERE rv.status = ?`; args.push(status); }
      sql += ` ORDER BY rv.requested_at DESC`;
      const result = await db.execute({ sql, args });
      return res.json({ vouchers: result.rows || [] });
    }
    if (req.method === 'PUT') {
      const { voucher_id, status, admin_note } = req.body || {};
      if (!voucher_id || !status) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
      const existing = await db.execute({ sql: `SELECT id, status FROM reward_vouchers WHERE id = ?`, args: [parseInt(voucher_id)] });
      if (!existing.rows || existing.rows.length === 0) return res.status(404).json({ error: 'Phiếu thưởng không tồn tại' });
      if (existing.rows[0].status !== 'pending') return res.status(400).json({ error: 'Phiếu thưởng không ở trạng thái chờ' });
      await db.execute({ sql: `UPDATE reward_vouchers SET status = ?, resolved_at = ?, admin_note = ? WHERE id = ?`, args: [status, new Date().toISOString(), admin_note || null, parseInt(voucher_id)] });
      return res.json({ ok: true });
    }
  }

  // === PARENTS (admin management) ===
  if (resource === 'parents') {
    if (req.method === 'GET' && !id) {
      // List all parents with their linked-children count.
      const result = await db.execute({
        sql: `SELECT pr.id, pr.username, pr.display_name, pr.created_at,
          (SELECT COUNT(*) FROM parent_children WHERE parent_id = pr.id) as children_count
          FROM parents pr ORDER BY pr.created_at DESC`,
        args: [],
      });
      return res.json(result.rows);
    }
    if (req.method === 'GET' && id && action === 'children') {
      // List the children (players) linked to a given parent.
      const result = await db.execute({
        sql: `SELECT p.id, p.name, p.grade, p.total_stars, p.total_diamonds, pc.linked_at
          FROM players p JOIN parent_children pc ON pc.player_id = p.id
          WHERE pc.parent_id = ? ORDER BY p.name`,
        args: [parseInt(id)],
      });
      return res.json(result.rows);
    }
    if (req.method === 'DELETE' && id && action === 'unlink') {
      // Remove a single parent-child link. player_id passed as query param.
      const playerId = parseInt(req.query.player_id);
      await db.execute({ sql: `DELETE FROM parent_children WHERE parent_id = ? AND player_id = ?`, args: [parseInt(id), playerId] });
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE' && id) {
      // Delete a parent account and all of its child links.
      const parentId = parseInt(id);
      await db.execute({ sql: `DELETE FROM parent_children WHERE parent_id = ?`, args: [parentId] });
      await db.execute({ sql: `DELETE FROM parents WHERE id = ?`, args: [parentId] });
      return res.json({ ok: true });
    }
  }

  res.status(404).json({ error: 'Not found' });
}
