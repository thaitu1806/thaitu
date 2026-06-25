import { getDb } from './db.js';
import { checkStreakMilestone, STREAK_MILESTONES } from '../lib/diamond-calc.js';
import { getVietnamDateStr } from '../lib/quest-generator.js';

export default async function handler(req, res) {
  const id = req.params?.id || req.query?.id;
  if (!id) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const playerId = parseInt(id);
  const db = getDb();

  // Check player exists
  const playerResult = await db.execute({
    sql: `SELECT id, current_streak, longest_streak, last_active_date, total_diamonds, lifetime_diamonds FROM players WHERE id = ?`,
    args: [playerId],
  });
  if (!playerResult.rows || playerResult.rows.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  }

  // Determine action: POST method or action=check query param
  const isCheck = req.method === 'POST' || req.query?.action === 'check';

  if (isCheck) {
    return handleStreakCheck(req, res, db, playerId, playerResult.rows[0]);
  }

  // Default: GET streak info
  return handleGetStreak(req, res, playerResult.rows[0]);
}

/**
 * GET /api/players/:id/streak
 * Return current streak info and next milestone.
 */
function handleGetStreak(req, res, player) {
  const currentStreak = player.current_streak || 0;
  const nextMilestone = getNextMilestone(currentStreak);

  return res.json({
    current_streak: currentStreak,
    longest_streak: player.longest_streak || 0,
    last_active_date: player.last_active_date || null,
    next_milestone: nextMilestone,
  });
}

/**
 * POST /api/players/:id/streak/check
 * Called after quest completion. Update streak, check milestones.
 */
async function handleStreakCheck(req, res, db, playerId, player) {
  try {
    const todayStr = getVietnamDateStr();
    const lastActiveDate = player.last_active_date || null;
    let currentStreak = player.current_streak || 0;
    let longestStreak = player.longest_streak || 0;

    // If already counted today, return without change
    if (lastActiveDate === todayStr) {
      const nextMilestone = getNextMilestone(currentStreak);
      return res.json({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: lastActiveDate,
        next_milestone: nextMilestone,
        streak_changed: false,
        milestone_bonus: 0,
      });
    }

    // Compute yesterday in Vietnam timezone
    const yesterdayStr = getYesterdayStr(todayStr);

    // Determine new streak value
    if (lastActiveDate === yesterdayStr) {
      // Consecutive day — increment streak
      currentStreak += 1;
    } else {
      // Missed a day (or first activity ever) — reset to 1
      currentStreak = 1;
    }

    // Update longest_streak if needed
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Check milestone bonus
    let milestoneBonus = 0;
    const milestone = checkStreakMilestone(currentStreak);
    if (milestone) {
      milestoneBonus = milestone.bonus;

      // Award milestone bonus diamonds
      await db.execute({
        sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, description) VALUES (?, ?, 'earn', 'streak', ?)`,
        args: [playerId, milestoneBonus, `Bonus chuỗi ${currentStreak} ngày liên tục`],
      });

      // Update player diamond balance
      await db.execute({
        sql: `UPDATE players SET total_diamonds = total_diamonds + ?, lifetime_diamonds = lifetime_diamonds + ? WHERE id = ?`,
        args: [milestoneBonus, milestoneBonus, playerId],
      });
    }

    // Save new streak + last_active_date to players table
    await db.execute({
      sql: `UPDATE players SET current_streak = ?, longest_streak = ?, last_active_date = ? WHERE id = ?`,
      args: [currentStreak, longestStreak, todayStr, playerId],
    });

    const nextMilestone = getNextMilestone(currentStreak);

    return res.json({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: todayStr,
      next_milestone: nextMilestone,
      streak_changed: true,
      milestone_bonus: milestoneBonus,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get the next milestone the player hasn't reached yet based on current streak.
 * @param {number} currentStreak - the player's current streak
 * @returns {{ days: number, bonus: number } | null} next milestone or null if all reached
 */
function getNextMilestone(currentStreak) {
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak < milestone.days) {
      return milestone;
    }
  }
  return null;
}

/**
 * Compute yesterday's date string given today's date string (YYYY-MM-DD).
 * @param {string} todayStr - today's date in 'YYYY-MM-DD' format
 * @returns {string} yesterday's date in 'YYYY-MM-DD' format
 */
function getYesterdayStr(todayStr) {
  const [year, month, day] = todayStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - 1);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}
