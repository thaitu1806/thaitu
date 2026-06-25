/**
 * Prompt Decision Logic (Pure Function)
 *
 * Extracted from public/link-gate.js checkAndShowPrompt() for testability.
 * This module contains the pure decision logic for determining whether
 * to show a parent-linking prompt to a player.
 */

/**
 * Determine whether to show a parent-linking prompt based on player state.
 *
 * @param {string} status - Player's link_status ('unlinked', 'prompted', 'linked')
 * @param {number} sessionCount - Number of completed game sessions
 * @param {number} currentStreak - Current consecutive-day streak
 * @param {string|null} lastPromptDate - ISO date string (YYYY-MM-DD) of last prompt, or null
 * @returns {string|null} Prompt message to show, or null if no prompt needed
 */
export function shouldShowPrompt(status, sessionCount, currentStreak, lastPromptDate) {
  const today = new Date().toISOString().split('T')[0];

  // Already linked — no prompt needed
  if (status === 'linked') return null;

  // Already prompted today — once-per-day constraint
  if (lastPromptDate === today) return null;

  // Soft prompt: unlinked + session_count >= 1
  if (status === 'unlinked' && sessionCount >= 1) {
    return 'Muốn ba mẹ xem thành tích không? 🌟';
  }

  // Milestone prompts: prompted + (session_count >= 5 OR streak >= 3)
  if (status === 'prompted') {
    if (sessionCount >= 5) return 'Ba mẹ sẽ tự hào lắm đó! Liên kết ngay nhé 🏆';
    if (currentStreak >= 3) return 'Con giỏi quá! Cho ba mẹ biết nhé 🔥';
  }

  return null;
}
