/**
 * Diamond Calculation Module
 * Pure functions for diamond rewards, player levels, and streak milestones.
 */

/** Player level thresholds based on lifetime diamonds */
export const PLAYER_LEVELS = [
  { name: 'bronze', label: 'Đồng', min: 0, max: 99 },
  { name: 'silver', label: 'Bạc', min: 100, max: 499 },
  { name: 'gold', label: 'Vàng', min: 500, max: 1499 },
  { name: 'diamond', label: 'Kim Cương', min: 1500, max: 4999 },
  { name: 'master', label: 'Bậc Thầy', min: 5000, max: Infinity },
];

/** Streak milestone bonuses */
export const STREAK_MILESTONES = [
  { days: 3, bonus: 10 },
  { days: 7, bonus: 30 },
  { days: 14, bonus: 60 },
  { days: 30, bonus: 150 },
];

/**
 * Calculate diamond reward for a correct answer.
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @param {number} comboStreak - current combo streak count
 * @returns {number} diamonds earned
 */
export function calculateDiamonds(difficulty, comboStreak) {
  const base = { easy: 1, medium: 3, hard: 5 };
  let diamonds = base[difficulty] || 0;
  if (comboStreak >= 7) diamonds *= 3;
  else if (comboStreak >= 3) diamonds *= 2;
  return diamonds;
}

/**
 * Get player level based on lifetime diamonds earned.
 * @param {number} lifetimeDiamonds - total diamonds ever earned
 * @returns {{ name: string, label: string, min: number, max: number }} player level
 */
export function getPlayerLevel(lifetimeDiamonds) {
  for (const level of PLAYER_LEVELS) {
    if (lifetimeDiamonds >= level.min && lifetimeDiamonds <= level.max) {
      return level;
    }
  }
  // Fallback to master for any value >= 5000
  return PLAYER_LEVELS[PLAYER_LEVELS.length - 1];
}

/**
 * Check if a new streak value hits a milestone.
 * @param {number} newStreak - the updated streak count
 * @returns {{ days: number, bonus: number } | null} milestone bonus or null
 */
export function checkStreakMilestone(newStreak) {
  const milestone = STREAK_MILESTONES.find(m => m.days === newStreak);
  return milestone || null;
}
