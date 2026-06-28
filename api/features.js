// Combined handler for: diamonds, quests, streak, shop, link, parent, progress
// Merged to stay within Vercel Hobby 12-function limit
import { getDb } from './db.js';
import { getPlayerLevel, checkStreakMilestone, STREAK_MILESTONES, PLAYER_LEVELS } from '../lib/diamond-calc.js';
import { generateDailyQuests, getVietnamDateStr } from '../lib/quest-generator.js';
import { validateLinkCodeFormat } from '../lib/link-code.js';

const LEVEL_ORDER = ['bronze', 'silver', 'gold', 'diamond', 'master'];

function meetsLevelRequirement(playerLevel, requiredLevel) {
  return LEVEL_ORDER.indexOf(playerLevel) >= LEVEL_ORDER.indexOf(requiredLevel);
}

// --- Rate Limiting for parent link-by-code (in-memory) ---
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

export function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || (now - entry.firstAttempt > RATE_LIMIT_WINDOW)) {
    rateLimitMap.set(ip, { count: 1, firstAttempt: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export { rateLimitMap, RATE_LIMIT_WINDOW, RATE_LIMIT_MAX };

export default async function handler(req, res) {
  const feature = req.query?.feature;
  try {
    switch (feature) {
      case 'diamonds': return await handleDiamonds(req, res);
      case 'quests': return await handleQuests(req, res);
      case 'streak': return await handleStreak(req, res);
      case 'shop': return await handleShop(req, res);
      case 'inventory': return await handleInventory(req, res);
      case 'equip': return await handleEquip(req, res);
      case 'buy': return await handleBuy(req, res);
      case 'link': return await handleLink(req, res);
      case 'parent': return await handleParent(req, res);
      case 'progress': return await handleProgress(req, res);
      default: return res.status(404).json({ error: 'Unknown feature' });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// === DIAMONDS ===
async function handleDiamonds(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  const db = getDb();
  const playerResult = await db.execute({ sql: `SELECT total_diamonds, lifetime_diamonds FROM players WHERE id = ?`, args: [parseInt(id)] });
  if (!playerResult.rows || playerResult.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  const player = playerResult.rows[0];
  const level = getPlayerLevel(player.lifetime_diamonds || 0);
  const txResult = await db.execute({ sql: `SELECT id, amount, type, source, description, created_at FROM diamond_transactions WHERE player_id = ? ORDER BY created_at DESC LIMIT 50`, args: [parseInt(id)] });
  return res.json({ total_diamonds: player.total_diamonds || 0, lifetime_diamonds: player.lifetime_diamonds || 0, level: { name: level.name, label: level.label }, transactions: txResult.rows || [] });
}

// === QUESTS ===
async function handleQuests(req, res) {
  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  const playerId = parseInt(id);
  const db = getDb();
  const playerResult = await db.execute({ sql: `SELECT id, total_diamonds, lifetime_diamonds FROM players WHERE id = ?`, args: [playerId] });
  if (!playerResult.rows || playerResult.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  const todayStr = getVietnamDateStr();
  const isCheck = req.method === 'POST' || req.query?.action === 'check';
  if (isCheck) return await handleQuestCheck(req, res, db, playerId, todayStr);
  return await handleGetQuests(req, res, db, playerId, todayStr);
}

async function handleGetQuests(req, res, db, playerId, todayStr) {
  let questsResult = await db.execute({ sql: `SELECT * FROM daily_quests WHERE player_id = ? AND quest_date = ?`, args: [playerId, todayStr] });
  if (!questsResult.rows || questsResult.rows.length === 0) {
    const generated = generateDailyQuests(playerId, todayStr);
    for (const quest of generated) {
      await db.execute({ sql: `INSERT INTO daily_quests (player_id, quest_type, quest_description, target_value, current_value, diamond_reward, is_completed, quest_date) VALUES (?, ?, ?, ?, 0, ?, 0, ?)`, args: [playerId, quest.type, quest.description, quest.target_value, quest.diamond_reward, todayStr] });
    }
    questsResult = await db.execute({ sql: `SELECT * FROM daily_quests WHERE player_id = ? AND quest_date = ?`, args: [playerId, todayStr] });
  }
  return res.json({ quests: questsResult.rows });
}

async function handleQuestCheck(req, res, db, playerId, todayStr) {
  const { mode, combo_max, accuracy, is_learn_session } = req.body || {};
  const questsResult = await db.execute({ sql: `SELECT * FROM daily_quests WHERE player_id = ? AND quest_date = ? AND is_completed = 0`, args: [playerId, todayStr] });
  const quests = questsResult.rows || [];
  const updatedQuests = [];
  let diamondsAwarded = 0;
  for (const quest of quests) {
    let newValue = quest.current_value;
    switch (quest.quest_type) {
      case 'play_any': newValue = quest.current_value + 1; break;
      case 'play_mode': if (mode && quest.quest_description.toLowerCase().includes(mode.toLowerCase())) newValue = quest.current_value + 1; break;
      case 'combo_streak': if (combo_max != null && combo_max >= quest.target_value) newValue = Math.max(quest.current_value, combo_max); break;
      case 'accuracy': if (accuracy != null && accuracy >= 80) newValue = quest.current_value + 1; break;
      case 'learn_lesson': if (is_learn_session) newValue = quest.current_value + 1; break;
    }
    if (newValue !== quest.current_value) {
      const completed = newValue >= quest.target_value ? 1 : 0;
      const completedAt = completed ? new Date().toISOString() : null;
      await db.execute({ sql: `UPDATE daily_quests SET current_value = ?, is_completed = ?, completed_at = ? WHERE id = ?`, args: [newValue, completed, completedAt, quest.id] });
      if (completed) {
        diamondsAwarded += quest.diamond_reward;
        await db.execute({ sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, reference_id, description) VALUES (?, ?, 'earn', 'quest', ?, ?)`, args: [playerId, quest.diamond_reward, quest.id, `Hoàn thành nhiệm vụ: ${quest.quest_description}`] });
        await db.execute({ sql: `UPDATE players SET total_diamonds = total_diamonds + ?, lifetime_diamonds = lifetime_diamonds + ? WHERE id = ?`, args: [quest.diamond_reward, quest.diamond_reward, playerId] });
      }
      updatedQuests.push({ id: quest.id, quest_type: quest.quest_type, current_value: newValue, target_value: quest.target_value, is_completed: completed });
    }
  }
  let allQuestsBonus = 0;
  const allQuestsResult = await db.execute({ sql: `SELECT COUNT(*) as total, SUM(is_completed) as completed FROM daily_quests WHERE player_id = ? AND quest_date = ?`, args: [playerId, todayStr] });
  const row = allQuestsResult.rows[0];
  if (row && row.total > 0 && row.total === row.completed) {
    const bonusCheck = await db.execute({ sql: `SELECT id FROM diamond_transactions WHERE player_id = ? AND source = 'all_quests_bonus' AND DATE(created_at) = ?`, args: [playerId, todayStr] });
    if (!bonusCheck.rows || bonusCheck.rows.length === 0) {
      allQuestsBonus = 15;
      await db.execute({ sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, description) VALUES (?, 15, 'earn', 'all_quests_bonus', ?)`, args: [playerId, 'Hoàn thành tất cả nhiệm vụ hôm nay'] });
      await db.execute({ sql: `UPDATE players SET total_diamonds = total_diamonds + 15, lifetime_diamonds = lifetime_diamonds + 15 WHERE id = ?`, args: [playerId] });
      diamondsAwarded += 15;
    }
  }
  return res.json({ updated: updatedQuests, diamonds_awarded: diamondsAwarded, all_quests_bonus: allQuestsBonus });
}

// === STREAK ===
async function handleStreak(req, res) {
  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  const playerId = parseInt(id);
  const db = getDb();
  const playerResult = await db.execute({ sql: `SELECT id, current_streak, longest_streak, last_active_date, total_diamonds, lifetime_diamonds FROM players WHERE id = ?`, args: [playerId] });
  if (!playerResult.rows || playerResult.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  const player = playerResult.rows[0];
  const isCheck = req.method === 'POST' || req.query?.action === 'check';
  if (isCheck) return await handleStreakCheck(req, res, db, playerId, player);
  const currentStreak = player.current_streak || 0;
  const nextMilestone = getNextMilestone(currentStreak);
  return res.json({ current_streak: currentStreak, longest_streak: player.longest_streak || 0, last_active_date: player.last_active_date || null, next_milestone: nextMilestone });
}

async function handleStreakCheck(req, res, db, playerId, player) {
  const todayStr = getVietnamDateStr();
  const lastActiveDate = player.last_active_date || null;
  let currentStreak = player.current_streak || 0;
  let longestStreak = player.longest_streak || 0;
  if (lastActiveDate === todayStr) {
    return res.json({ current_streak: currentStreak, longest_streak: longestStreak, last_active_date: lastActiveDate, next_milestone: getNextMilestone(currentStreak), streak_changed: false, milestone_bonus: 0 });
  }
  const yesterdayStr = getYesterdayStr(todayStr);
  if (lastActiveDate === yesterdayStr) { currentStreak += 1; } else { currentStreak = 1; }
  if (currentStreak > longestStreak) longestStreak = currentStreak;
  let milestoneBonus = 0;
  const milestone = checkStreakMilestone(currentStreak);
  if (milestone) {
    milestoneBonus = milestone.bonus;
    await db.execute({ sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, description) VALUES (?, ?, 'earn', 'streak', ?)`, args: [playerId, milestoneBonus, `Bonus chuỗi ${currentStreak} ngày liên tục`] });
    await db.execute({ sql: `UPDATE players SET total_diamonds = total_diamonds + ?, lifetime_diamonds = lifetime_diamonds + ? WHERE id = ?`, args: [milestoneBonus, milestoneBonus, playerId] });
  }
  await db.execute({ sql: `UPDATE players SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?`, args: [currentStreak, longestStreak, todayStr, playerId] });
  return res.json({ current_streak: currentStreak, longest_streak: longestStreak, last_active_date: todayStr, next_milestone: getNextMilestone(currentStreak), streak_changed: true, milestone_bonus: milestoneBonus });
}

function getNextMilestone(currentStreak) {
  for (const m of STREAK_MILESTONES) { if (currentStreak < m.days) return m; }
  return null;
}

function getYesterdayStr(todayStr) {
  const [year, month, day] = todayStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// === SHOP ===
async function handleShop(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = getDb();
  const { category, player_id } = req.query || {};
  let playerLevel = null;
  if (player_id) {
    const playerResult = await db.execute({ sql: `SELECT lifetime_diamonds FROM players WHERE id = ?`, args: [parseInt(player_id)] });
    if (playerResult.rows && playerResult.rows.length > 0) {
      const level = getPlayerLevel(playerResult.rows[0].lifetime_diamonds || 0);
      playerLevel = level.name;
    }
  }
  let sql = `SELECT * FROM shop_items WHERE is_active = 1`;
  const args = [];
  if (category) { sql += ` AND category = ?`; args.push(category); }
  sql += ` ORDER BY created_at DESC`;
  const result = await db.execute({ sql, args });
  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  let items = (result.rows || []).map(item => ({ ...item, is_new: (now - new Date(item.created_at)) <= sevenDaysMs }));
  if (playerLevel) items = items.filter(item => meetsLevelRequirement(playerLevel, item.min_level || 'bronze'));
  return res.json({ items });
}

async function handleBuy(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const db = getDb();
  const { player_id, item_id } = req.body || {};
  if (!player_id || !item_id) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  const playerId = parseInt(player_id);
  const itemId = parseInt(item_id);
  const playerResult = await db.execute({ sql: `SELECT id, total_diamonds, lifetime_diamonds FROM players WHERE id = ?`, args: [playerId] });
  if (!playerResult.rows || playerResult.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  const player = playerResult.rows[0];
  const itemResult = await db.execute({ sql: `SELECT * FROM shop_items WHERE id = ? AND is_active = 1`, args: [itemId] });
  if (!itemResult.rows || itemResult.rows.length === 0) return res.status(404).json({ error: 'Vật phẩm không tồn tại' });
  const item = itemResult.rows[0];
  const playerLevel = getPlayerLevel(player.lifetime_diamonds || 0);
  if (!meetsLevelRequirement(playerLevel.name, item.min_level || 'bronze')) {
    const requiredLabel = PLAYER_LEVELS.find(l => l.name === item.min_level)?.label || item.min_level;
    return res.status(403).json({ error: `Cần đạt cấp ${requiredLabel} để mua` });
  }
  if ((player.total_diamonds || 0) < item.price_diamonds) return res.status(400).json({ error: 'Không đủ kim cương' });
  if (item.max_per_week != null) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weeklyResult = await db.execute({ sql: `SELECT COUNT(*) as count FROM player_inventory WHERE player_id = ? AND item_id = ? AND purchased_at >= ?`, args: [playerId, itemId, sevenDaysAgo] });
    if ((weeklyResult.rows[0]?.count || 0) >= item.max_per_week) return res.status(400).json({ error: 'Đã đạt giới hạn tuần' });
  }
  const statements = [
    { sql: `UPDATE players SET total_diamonds = total_diamonds - ? WHERE id = ?`, args: [item.price_diamonds, playerId] },
    { sql: `INSERT INTO player_inventory (player_id, item_id) VALUES (?, ?)`, args: [playerId, itemId] },
    { sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, reference_id, description) VALUES (?, ?, 'spend', 'shop', ?, ?)`, args: [playerId, item.price_diamonds, itemId, `Mua: ${item.name}`] },
  ];
  if (item.category === 'voucher') statements.push({ sql: `INSERT INTO reward_vouchers (player_id, item_id, status) VALUES (?, ?, 'pending')`, args: [playerId, itemId] });
  await db.batch(statements);
  return res.json({ ok: true, message: 'Mua thành công', item_name: item.name, diamonds_spent: item.price_diamonds, new_balance: (player.total_diamonds || 0) - item.price_diamonds });
}

async function handleInventory(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = getDb();
  const id = req.query?.player_id;
  if (!id) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  const playerId = parseInt(id);
  const playerResult = await db.execute({ sql: `SELECT id FROM players WHERE id = ?`, args: [playerId] });
  if (!playerResult.rows || playerResult.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  const inventoryResult = await db.execute({ sql: `SELECT pi.id, pi.player_id, pi.item_id, pi.purchased_at, pi.is_equipped, si.name, si.description, si.category, si.image_url FROM player_inventory pi JOIN shop_items si ON pi.item_id = si.id WHERE pi.player_id = ? ORDER BY pi.purchased_at DESC`, args: [playerId] });
  return res.json({ inventory: inventoryResult.rows || [] });
}

async function handleEquip(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  const db = getDb();
  const { player_id, inventory_id } = req.body || {};
  const id = player_id || req.query?.player_id;
  if (!id || !inventory_id) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  const playerId = parseInt(id);
  const invId = parseInt(inventory_id);
  const invResult = await db.execute({ sql: `SELECT pi.id, pi.item_id, si.category FROM player_inventory pi JOIN shop_items si ON pi.item_id = si.id WHERE pi.id = ? AND pi.player_id = ?`, args: [invId, playerId] });
  if (!invResult.rows || invResult.rows.length === 0) return res.status(400).json({ error: 'Bạn chưa sở hữu vật phẩm này' });
  const invItem = invResult.rows[0];
  const category = invItem.category;
  if (category !== 'avatar' && category !== 'frame') return res.status(400).json({ error: 'Vật phẩm này không thể trang bị' });
  await db.execute({ sql: `UPDATE player_inventory SET is_equipped = 0 WHERE player_id = ? AND item_id IN (SELECT id FROM shop_items WHERE category = ?) AND is_equipped = 1`, args: [playerId, category] });
  await db.execute({ sql: `UPDATE player_inventory SET is_equipped = 1 WHERE id = ?`, args: [invId] });
  const field = category === 'avatar' ? 'equipped_avatar' : 'equipped_frame';
  await db.execute({ sql: `UPDATE players SET ${field} = ? WHERE id = ?`, args: [invItem.item_id.toString(), playerId] });
  return res.json({ ok: true, equipped: category, inventory_id: invId });
}

// === LINK STATUS ===
async function handleLink(req, res) {
  const db = getDb();
  const id = req.query?.id;
  if (!id) return res.status(400).json({ error: 'Missing player id' });
  const playerId = parseInt(id);

  if (req.method === 'GET') {
    const playerResult = await db.execute({ sql: `SELECT link_code, link_status, last_prompt_date, current_streak FROM players WHERE id = ?`, args: [playerId] });
    if (playerResult.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy người chơi' });
    const player = playerResult.rows[0];
    const sessionResult = await db.execute({ sql: `SELECT COUNT(*) as session_count FROM game_sessions WHERE player_id = ?`, args: [playerId] });
    const sessionCount = sessionResult.rows[0].session_count;
    let parents = [];
    if (player.link_status === 'linked') {
      const parentsResult = await db.execute({ sql: `SELECT p.id, p.display_name FROM parents p JOIN parent_children pc ON pc.parent_id = p.id WHERE pc.player_id = ?`, args: [playerId] });
      parents = parentsResult.rows.map(row => ({ id: row.id, display_name: row.display_name }));
    }
    return res.json({ status: player.link_status, code: player.link_code, session_count: sessionCount, current_streak: player.current_streak || 0, last_prompt_date: player.last_prompt_date || null, parents });
  }

  if (req.method === 'POST') {
    const { action } = req.body || {};
    if (action === 'dismiss') {
      const today = new Date().toISOString().split('T')[0];
      await db.execute({ sql: `UPDATE players SET link_status = 'prompted', last_prompt_date = ? WHERE id = ? AND link_status != 'linked'`, args: [today, playerId] });
      return res.json({ ok: true });
    }
    return res.status(400).json({ error: 'Invalid action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// === PARENT ===
async function handleParent(req, res) {
  const db = getDb();
  const action = req.query?.action || '';

  if (req.method === 'POST' && action === 'register') {
    const { username, pin, display_name } = req.body;
    if (!username || !pin) return res.status(400).json({ error: 'Cần nhập tên đăng nhập và mã PIN' });
    if (pin.length < 4) return res.status(400).json({ error: 'Mã PIN cần ít nhất 4 ký tự' });
    const existing = await db.execute({ sql: `SELECT id FROM parents WHERE username = ?`, args: [username.trim()] });
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Tên đăng nhập đã tồn tại' });
    const result = await db.execute({ sql: `INSERT INTO parents (username, pin, display_name) VALUES (?, ?, ?)`, args: [username.trim(), pin, display_name || username.trim()] });
    return res.json({ id: Number(result.lastInsertRowid), username: username.trim() });
  }

  if (req.method === 'POST' && action === 'login') {
    const { username, pin } = req.body;
    if (!username || !pin) return res.status(400).json({ error: 'Cần nhập tên đăng nhập và mã PIN' });
    const result = await db.execute({ sql: `SELECT id, username, display_name FROM parents WHERE username = ? AND pin = ?`, args: [username.trim(), pin] });
    if (result.rows.length === 0) return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mã PIN' });
    return res.json(result.rows[0]);
  }

  if (req.method === 'POST' && action === 'link-child') {
    const { parent_id, player_name } = req.body;
    if (!parent_id || !player_name) return res.status(400).json({ error: 'Thiếu thông tin' });
    const player = await db.execute({ sql: `SELECT id, name FROM players WHERE name = ?`, args: [player_name.trim()] });
    if (player.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy học sinh với tên này' });
    const playerId = player.rows[0].id;
    const existing = await db.execute({ sql: `SELECT id FROM parent_children WHERE parent_id = ? AND player_id = ?`, args: [parent_id, playerId] });
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Đã liên kết con này rồi' });
    await db.execute({ sql: `INSERT INTO parent_children (parent_id, player_id) VALUES (?, ?)`, args: [parent_id, playerId] });
    return res.json({ ok: true, player: player.rows[0] });
  }

  if (req.method === 'POST' && action === 'link-by-code') {
    const { parent_id, link_code } = req.body;
    if (!parent_id || !link_code) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    const parentCheck = await db.execute({ sql: `SELECT id FROM parents WHERE id = ?`, args: [parent_id] });
    if (parentCheck.rows.length === 0) return res.status(401).json({ error: 'Cần đăng nhập trước' });
    if (!validateLinkCodeFormat(link_code)) return res.status(400).json({ error: 'Mã liên kết phải gồm 6 ký tự chữ và số' });
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Thử lại sau 30 phút' });
    const playerResult = await db.execute({ sql: `SELECT id, name FROM players WHERE link_code = ?`, args: [link_code] });
    if (playerResult.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy mã liên kết này' });
    const player = playerResult.rows[0];
    const existingLink = await db.execute({ sql: `SELECT id FROM parent_children WHERE parent_id = ? AND player_id = ?`, args: [parent_id, player.id] });
    if (existingLink.rows.length > 0) return res.status(409).json({ error: 'Đã liên kết con này rồi' });
    await db.batch([
      { sql: `INSERT INTO parent_children (parent_id, player_id) VALUES (?, ?)`, args: [parent_id, player.id] },
      { sql: `UPDATE players SET link_status = 'linked' WHERE id = ?`, args: [player.id] },
    ]);
    return res.json({ ok: true, player: { id: player.id, name: player.name } });
  }

  if (req.method === 'DELETE' && action === 'unlink-child') {
    const { parent_id, player_id } = req.query;
    if (!parent_id || !player_id) return res.status(400).json({ error: 'Thiếu thông tin' });
    await db.execute({ sql: `DELETE FROM parent_children WHERE parent_id = ? AND player_id = ?`, args: [parseInt(parent_id), parseInt(player_id)] });
    return res.json({ ok: true });
  }

  if (req.method === 'GET' && action === 'children') {
    const { parent_id } = req.query;
    if (!parent_id) return res.status(400).json({ error: 'Thiếu parent_id' });
    const result = await db.execute({ sql: `SELECT p.id, p.name, p.total_stars, p.grade, p.total_diamonds, p.lifetime_diamonds, p.current_streak, p.longest_streak, p.last_active_date, p.adventure_level, p.equipped_avatar, p.equipped_frame, (SELECT COUNT(*) FROM game_sessions WHERE player_id = p.id) as total_games, (SELECT MAX(played_at) FROM game_sessions WHERE player_id = p.id) as last_played FROM players p JOIN parent_children pc ON pc.player_id = p.id WHERE pc.parent_id = ? ORDER BY p.name`, args: [parseInt(parent_id)] });
    return res.json(result.rows);
  }

  if (req.method === 'GET' && action === 'child-stats') {
    const { parent_id, player_id } = req.query;
    if (!parent_id || !player_id) return res.status(400).json({ error: 'Thiếu thông tin' });
    const link = await db.execute({ sql: `SELECT id FROM parent_children WHERE parent_id = ? AND player_id = ?`, args: [parseInt(parent_id), parseInt(player_id)] });
    if (link.rows.length === 0) return res.status(403).json({ error: 'Không có quyền xem' });
    const bySubject = await db.execute({ sql: `SELECT q.subject, q.difficulty, COUNT(*) as total, SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct, ROUND(100.0 * SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as accuracy FROM answer_logs a JOIN questions q ON a.question_id = q.id WHERE a.player_id = ? GROUP BY q.subject, q.difficulty ORDER BY q.subject, q.difficulty`, args: [parseInt(player_id)] });
    const sessions = await db.execute({ sql: `SELECT subject, difficulty, correct_answers, total_questions, stars_earned, combo_max, played_at, ROUND(100.0 * correct_answers / total_questions, 1) as accuracy FROM game_sessions WHERE player_id = ? AND total_questions > 0 ORDER BY played_at DESC LIMIT 20`, args: [parseInt(player_id)] });
    const exams = await db.execute({ sql: `SELECT er.score, er.grade, er.correct_answers, er.total_questions, er.time_spent_seconds, er.taken_at, e.title, e.subject FROM exam_results er JOIN exams e ON er.exam_id = e.id WHERE er.player_name = (SELECT name FROM players WHERE id = ?) ORDER BY er.taken_at DESC LIMIT 10`, args: [parseInt(player_id)] });
    const vouchers = await db.execute({ sql: `SELECT rv.id, rv.status, rv.requested_at, si.name as item_name, si.category, si.price_diamonds FROM reward_vouchers rv JOIN shop_items si ON rv.item_id = si.id WHERE rv.player_id = ? ORDER BY rv.requested_at DESC LIMIT 10`, args: [parseInt(player_id)] });
    return res.json({ bySubject: bySubject.rows, sessions: sessions.rows, exams: exams.rows, vouchers: vouchers.rows });
  }

  if (req.method === 'PUT' && action === 'approve-voucher') {
    const { parent_id, voucher_id, status } = req.body;
    if (!parent_id || !voucher_id || !status) return res.status(400).json({ error: 'Thiếu thông tin' });
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status không hợp lệ' });
    const voucher = await db.execute({ sql: `SELECT rv.player_id FROM reward_vouchers rv JOIN parent_children pc ON pc.player_id = rv.player_id WHERE rv.id = ? AND pc.parent_id = ?`, args: [parseInt(voucher_id), parseInt(parent_id)] });
    if (voucher.rows.length === 0) return res.status(403).json({ error: 'Không có quyền' });
    await db.execute({ sql: `UPDATE reward_vouchers SET status = ?, resolved_at = CURRENT_TIMESTAMP WHERE id = ?`, args: [status, parseInt(voucher_id)] });
    return res.json({ ok: true });
  }

  // ── Parent-created rewards ("Quà từ bố mẹ") ──
  if (req.method === 'POST' && action === 'create-reward') {
    const { parent_id, player_id, title, icon, price_diamonds } = req.body;
    if (!parent_id || !player_id || !title) return res.status(400).json({ error: 'Thiếu thông tin' });
    const price = Math.max(1, parseInt(price_diamonds) || 50);
    const link = await db.execute({ sql: `SELECT id FROM parent_children WHERE parent_id = ? AND player_id = ?`, args: [parseInt(parent_id), parseInt(player_id)] });
    if (link.rows.length === 0) return res.status(403).json({ error: 'Không có quyền' });
    const r = await db.execute({ sql: `INSERT INTO parent_rewards (parent_id, player_id, title, icon, price_diamonds) VALUES (?, ?, ?, ?, ?)`, args: [parseInt(parent_id), parseInt(player_id), String(title).slice(0, 60), icon || '🎁', price] });
    return res.json({ ok: true, id: Number(r.lastInsertRowid) });
  }
  if (req.method === 'GET' && action === 'rewards') {
    const { parent_id, player_id } = req.query;
    if (!player_id) return res.status(400).json({ error: 'Thiếu player_id' });
    let sql, args;
    if (parent_id) { sql = `SELECT id, title, icon, price_diamonds, is_active, created_at FROM parent_rewards WHERE parent_id = ? AND player_id = ? ORDER BY created_at DESC`; args = [parseInt(parent_id), parseInt(player_id)]; }
    else { sql = `SELECT id, title, icon, price_diamonds FROM parent_rewards WHERE player_id = ? AND is_active = 1 ORDER BY price_diamonds ASC`; args = [parseInt(player_id)]; }
    const r = await db.execute({ sql, args });
    return res.json(r.rows);
  }
  if (req.method === 'DELETE' && action === 'delete-reward') {
    const { parent_id, reward_id } = req.query;
    if (!parent_id || !reward_id) return res.status(400).json({ error: 'Thiếu thông tin' });
    await db.execute({ sql: `DELETE FROM parent_rewards WHERE id = ? AND parent_id = ?`, args: [parseInt(reward_id), parseInt(parent_id)] });
    return res.json({ ok: true });
  }
  if (req.method === 'POST' && action === 'redeem-reward') {
    const { player_id, reward_id } = req.body;
    if (!player_id || !reward_id) return res.status(400).json({ error: 'Thiếu thông tin' });
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
    return res.json({ ok: true, new_balance: bal - reward.price_diamonds, title: reward.title });
  }
  if (req.method === 'GET' && action === 'claims') {
    const { parent_id } = req.query;
    if (!parent_id) return res.status(400).json({ error: 'Thiếu parent_id' });
    const r = await db.execute({ sql: `SELECT c.id, c.title, c.icon, c.price_diamonds, c.status, c.claimed_at, c.player_id, p.name as player_name FROM parent_reward_claims c JOIN players p ON p.id = c.player_id WHERE c.parent_id = ? ORDER BY (c.status = 'pending') DESC, c.claimed_at DESC LIMIT 50`, args: [parseInt(parent_id)] });
    return res.json(r.rows);
  }
  if (req.method === 'PUT' && action === 'fulfill-claim') {
    const { parent_id, claim_id } = req.body;
    if (!parent_id || !claim_id) return res.status(400).json({ error: 'Thiếu thông tin' });
    const c = await db.execute({ sql: `SELECT id FROM parent_reward_claims WHERE id = ? AND parent_id = ?`, args: [parseInt(claim_id), parseInt(parent_id)] });
    if (c.rows.length === 0) return res.status(403).json({ error: 'Không có quyền' });
    await db.execute({ sql: `UPDATE parent_reward_claims SET status = 'fulfilled', fulfilled_at = CURRENT_TIMESTAMP WHERE id = ?`, args: [parseInt(claim_id)] });
    return res.json({ ok: true });
  }

  res.status(404).json({ error: 'Action không hợp lệ' });
}

// === PROGRESS ===
async function handleProgress(req, res) {
  const db = getDb();
  const playerId = parseInt(req.query.id);
  const mode = req.query.mode || 'v2';
  if (!playerId || isNaN(playerId)) return res.status(400).json({ error: 'Invalid player id' });

  if (req.method === 'GET') {
    const result = await db.execute({ sql: `SELECT progress_data FROM player_progress WHERE player_id = ? AND game_mode = ?`, args: [playerId, mode] });
    if (result.rows.length > 0) return res.json(JSON.parse(result.rows[0].progress_data));
    return res.json(null);
  }

  if (req.method === 'PUT') {
    const data = JSON.stringify(req.body);
    await db.execute({ sql: `INSERT INTO player_progress (player_id, game_mode, progress_data) VALUES (?, ?, ?) ON CONFLICT(player_id, game_mode) DO UPDATE SET progress_data = ?, updated_at = CURRENT_TIMESTAMP`, args: [playerId, mode, data, data] });
    if (mode === 'v2' && req.body.level) {
      await db.execute({ sql: `UPDATE players SET adventure_level = ? WHERE id = ?`, args: [parseInt(req.body.level), playerId] });
    }
    return res.json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
