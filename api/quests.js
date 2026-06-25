import { getDb } from './db.js';
import { generateDailyQuests, getVietnamDateStr } from '../lib/quest-generator.js';

export default async function handler(req, res) {
  const id = req.params?.id || req.query?.id;
  if (!id) {
    return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  }

  const playerId = parseInt(id);
  const db = getDb();

  // Check player exists
  const playerResult = await db.execute({
    sql: `SELECT id, total_diamonds, lifetime_diamonds FROM players WHERE id = ?`,
    args: [playerId],
  });
  if (!playerResult.rows || playerResult.rows.length === 0) {
    return res.status(404).json({ error: 'Không tìm thấy người chơi' });
  }

  const todayStr = getVietnamDateStr();

  // Determine action: POST method or action=check query param
  const isCheck = req.method === 'POST' || req.query?.action === 'check';

  if (isCheck) {
    return handleQuestCheck(req, res, db, playerId, todayStr);
  }

  // Default: GET quests
  if (req.method === 'GET' || req.method === 'POST') {
    return handleGetQuests(req, res, db, playerId, todayStr);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

/**
 * GET /api/players/:id/quests
 * Fetch today's quests, auto-generating if none exist for today.
 */
async function handleGetQuests(req, res, db, playerId, todayStr) {
  try {
    // Check if quests exist for today
    let questsResult = await db.execute({
      sql: `SELECT * FROM daily_quests WHERE player_id = ? AND quest_date = ?`,
      args: [playerId, todayStr],
    });

    // If no quests for today, generate and insert them
    if (!questsResult.rows || questsResult.rows.length === 0) {
      const generated = generateDailyQuests(playerId, todayStr);

      for (const quest of generated) {
        await db.execute({
          sql: `INSERT INTO daily_quests (player_id, quest_type, quest_description, target_value, current_value, diamond_reward, is_completed, quest_date) VALUES (?, ?, ?, ?, 0, ?, 0, ?)`,
          args: [playerId, quest.type, quest.description, quest.target_value, quest.diamond_reward, todayStr],
        });
      }

      // Re-fetch the inserted quests
      questsResult = await db.execute({
        sql: `SELECT * FROM daily_quests WHERE player_id = ? AND quest_date = ?`,
        args: [playerId, todayStr],
      });
    }

    return res.json({ quests: questsResult.rows });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/players/:id/quests/check
 * Accept session data, update quest progress, award diamonds on completion.
 */
async function handleQuestCheck(req, res, db, playerId, todayStr) {
  try {
    const { mode, combo_max, accuracy, is_learn_session, games_played } = req.body || {};

    // Fetch today's incomplete quests
    const questsResult = await db.execute({
      sql: `SELECT * FROM daily_quests WHERE player_id = ? AND quest_date = ? AND is_completed = 0`,
      args: [playerId, todayStr],
    });

    const quests = questsResult.rows || [];
    const updatedQuests = [];
    let diamondsAwarded = 0;

    for (const quest of quests) {
      let newValue = quest.current_value;

      switch (quest.quest_type) {
        case 'play_any':
          // Any completed session counts as 1
          newValue = quest.current_value + 1;
          break;

        case 'play_mode':
          // Increment if session mode matches quest description
          if (mode && quest.quest_description.toLowerCase().includes(mode.toLowerCase())) {
            newValue = quest.current_value + 1;
          }
          break;

        case 'combo_streak':
          // Set to max(current_value, combo_max) if combo_max >= target
          if (combo_max != null && combo_max >= quest.target_value) {
            newValue = Math.max(quest.current_value, combo_max);
          }
          break;

        case 'accuracy':
          // Increment if accuracy >= 80
          if (accuracy != null && accuracy >= 80) {
            newValue = quest.current_value + 1;
          }
          break;

        case 'learn_lesson':
          // Increment if is_learn_session is true
          if (is_learn_session) {
            newValue = quest.current_value + 1;
          }
          break;
      }

      // Only update if value changed
      if (newValue !== quest.current_value) {
        const completed = newValue >= quest.target_value ? 1 : 0;
        const completedAt = completed ? new Date().toISOString() : null;

        await db.execute({
          sql: `UPDATE daily_quests SET current_value = ?, is_completed = ?, completed_at = ? WHERE id = ?`,
          args: [newValue, completed, completedAt, quest.id],
        });

        // Award diamonds if quest just completed
        if (completed) {
          diamondsAwarded += quest.diamond_reward;

          // Insert diamond transaction for quest completion
          await db.execute({
            sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, reference_id, description) VALUES (?, ?, 'earn', 'quest', ?, ?)`,
            args: [playerId, quest.diamond_reward, quest.id, `Hoàn thành nhiệm vụ: ${quest.quest_description}`],
          });

          // Update player diamond balance
          await db.execute({
            sql: `UPDATE players SET total_diamonds = total_diamonds + ?, lifetime_diamonds = lifetime_diamonds + ? WHERE id = ?`,
            args: [quest.diamond_reward, quest.diamond_reward, playerId],
          });
        }

        updatedQuests.push({
          id: quest.id,
          quest_type: quest.quest_type,
          current_value: newValue,
          target_value: quest.target_value,
          is_completed: completed,
        });
      }
    }

    // Check if ALL quests for today are now completed (all-quests bonus)
    let allQuestsBonus = 0;
    const allQuestsResult = await db.execute({
      sql: `SELECT COUNT(*) as total, SUM(is_completed) as completed FROM daily_quests WHERE player_id = ? AND quest_date = ?`,
      args: [playerId, todayStr],
    });

    const row = allQuestsResult.rows[0];
    if (row && row.total > 0 && row.total === row.completed) {
      // Check if bonus was already awarded today
      const bonusCheck = await db.execute({
        sql: `SELECT id FROM diamond_transactions WHERE player_id = ? AND source = 'all_quests_bonus' AND DATE(created_at) = ?`,
        args: [playerId, todayStr],
      });

      if (!bonusCheck.rows || bonusCheck.rows.length === 0) {
        allQuestsBonus = 15;

        // Award the all-quests bonus
        await db.execute({
          sql: `INSERT INTO diamond_transactions (player_id, amount, type, source, description) VALUES (?, 15, 'earn', 'all_quests_bonus', ?)`,
          args: [playerId, 'Hoàn thành tất cả nhiệm vụ hôm nay'],
        });

        await db.execute({
          sql: `UPDATE players SET total_diamonds = total_diamonds + 15, lifetime_diamonds = lifetime_diamonds + 15 WHERE id = ?`,
          args: [playerId],
        });

        diamondsAwarded += 15;
      }
    }

    return res.json({
      updated: updatedQuests,
      diamonds_awarded: diamondsAwarded,
      all_quests_bonus: allQuestsBonus,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
