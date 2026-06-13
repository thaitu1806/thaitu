// Combined handler for: diamonds, quests, streak, shop
// Merged to stay within Vercel Hobby 12-function limit
import { getDb } from './db.js';
import { getPlayerLevel, checkStreakMilestone, STREAK_MILESTONES, PLAYER_LEVELS } from '../lib/diamond-calc.js';
import { generateDailyQuests, getVietnamDateStr } from '../lib/quest-generator.js';

const LEVEL_ORDER = ['bronze', 'silver', 'gold', 'diamond', 'master'];

function meetsLevelRequirement(playerLevel, requiredLevel) {
  return LEVEL_ORDER.indexOf(playerLevel) >= LEVEL_ORDER.indexOf(requiredLevel);
}

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
