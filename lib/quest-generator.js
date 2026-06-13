/**
 * Quest Generator Module
 * Deterministic daily quest generation using seeded pseudo-random selection.
 * Pure functions — no database dependencies.
 */

/** Quest templates with types, descriptions, target values, and rewards */
export const QUEST_TEMPLATES = [
  { type: 'play_any', desc: 'Chơi {n} lượt bất kỳ', targets: [2, 3, 4], rewards: [5, 8, 10] },
  { type: 'play_mode', desc: 'Chơi {n} lượt {mode}', targets: [1, 2], rewards: [8, 12] },
  { type: 'combo_streak', desc: 'Đạt combo {n} trong 1 ván', targets: [3, 5, 7], rewards: [10, 15, 20] },
  { type: 'accuracy', desc: 'Chơi {n} lượt đạt 80% đúng', targets: [1, 2], rewards: [10, 15] },
  { type: 'learn_lesson', desc: 'Học {n} bài mới', targets: [1], rewards: [10] },
];

/**
 * Simple seeded PRNG using a hash-based approach (mulberry32).
 * Returns a function that produces pseudo-random floats in [0, 1).
 * @param {number} seed - 32-bit integer seed
 * @returns {() => number} PRNG function
 */
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a numeric seed from a string using a simple hash (djb2 variant).
 * @param {string} str - input string to hash
 * @returns {number} 32-bit integer hash
 */
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return hash;
}

/**
 * Generate daily quests for a player on a specific date.
 * Deterministic: same playerId + dateStr always produces same quests.
 *
 * @param {string|number} playerId - unique player identifier
 * @param {string} dateStr - date string in 'YYYY-MM-DD' format
 * @returns {Array<{ type: string, description: string, target_value: number, diamond_reward: number }>}
 */
export function generateDailyQuests(playerId, dateStr) {
  const seedStr = `${playerId}:${dateStr}`;
  const seed = hashString(seedStr);
  const rand = mulberry32(seed);

  // Determine number of quests: 3-5
  const questCount = 3 + Math.floor(rand() * 3); // 3, 4, or 5

  const quests = [];
  const usedTypes = new Set();

  for (let i = 0; i < questCount; i++) {
    // Pick a template, avoiding duplicates when possible
    let templateIdx;
    let attempts = 0;
    do {
      templateIdx = Math.floor(rand() * QUEST_TEMPLATES.length);
      attempts++;
    } while (usedTypes.has(templateIdx) && attempts < 10);

    usedTypes.add(templateIdx);
    const template = QUEST_TEMPLATES[templateIdx];

    // Pick a target/reward pair
    const variantIdx = Math.floor(rand() * template.targets.length);
    const targetValue = template.targets[variantIdx];
    const diamondReward = template.rewards[variantIdx];

    // Build description
    const description = template.desc.replace('{n}', targetValue);

    quests.push({
      type: template.type,
      description,
      target_value: targetValue,
      diamond_reward: diamondReward,
    });
  }

  return quests;
}

/**
 * Get the current date string in Vietnam timezone (UTC+7) as 'YYYY-MM-DD'.
 * @returns {string} date string in 'YYYY-MM-DD' format
 */
export function getVietnamDateStr() {
  const now = new Date();
  // Shift to UTC+7
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const vietnam = new Date(utc + 7 * 3600000);

  const year = vietnam.getFullYear();
  const month = String(vietnam.getMonth() + 1).padStart(2, '0');
  const day = String(vietnam.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
