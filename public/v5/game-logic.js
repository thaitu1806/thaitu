// V5 Cờ Cá Ngựa - Pure Game Logic Module
// Contains all pure game logic functions (no DOM/window dependencies)
// Importable from both browser (ES module) and Node.js (vitest)

// ===== BOARD CONFIGURATION =====
export const BOARD_CONFIG = {
  totalTiles: 36,
  finishPosition: 35,
  starTiles: [4, 13, 22, 31],      // default, overridden per game
  trapTiles: [8, 17, 26],          // default, overridden per game
  finishTile: 35,
};

/**
 * Generate random positions for star and trap tiles.
 * Rules:
 * - Not on position 0 (start) or 35 (finish)
 * - Stars and traps not adjacent to each other
 * - 4 stars, 5 traps
 * @returns {{ starTiles: number[], trapTiles: number[] }}
 */
export function generateRandomTiles() {
  const available = [];
  for (let i = 1; i <= 34; i++) {
    available.push(i);
  }

  const picked = [];

  function isValidPick(pos) {
    for (const p of picked) {
      if (Math.abs(p - pos) <= 1) return false; // not adjacent
    }
    return true;
  }

  // Shuffle available
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const starTiles = [];
  const trapTiles = [];

  // Pick 4 stars first
  for (const pos of available) {
    if (starTiles.length >= 4) break;
    if (isValidPick(pos)) {
      starTiles.push(pos);
      picked.push(pos);
    }
  }

  // Pick 5 traps
  for (const pos of available) {
    if (trapTiles.length >= 5) break;
    if (!picked.includes(pos) && isValidPick(pos)) {
      trapTiles.push(pos);
      picked.push(pos);
    }
  }

  starTiles.sort((a, b) => a - b);
  trapTiles.sort((a, b) => a - b);

  return { starTiles, trapTiles };
}

/**
 * Calculate target tile from current position and dice total.
 * Clamped to finish position (36).
 * @param {number} position - current position (0-36)
 * @param {number} diceTotal - sum of two dice (2-12)
 * @returns {number} target tile index
 */
export function calculateTargetTile(position, diceTotal) {
  return Math.min(position + diceTotal, BOARD_CONFIG.finishPosition);
}

/**
 * Get the next player index in turn rotation.
 * @param {number} currentIndex - current player index
 * @param {number} playerCount - total number of players
 * @returns {number} next player index
 */
export function getNextPlayer(currentIndex, playerCount) {
  return (currentIndex + 1) % playerCount;
}

/**
 * Apply special tile effect and return new position.
 * Star: +2 (clamped to finish)
 * Trap: -3 (clamped to 0)
 * Normal: no change
 * @param {number} position - current position after landing
 * @param {string} tileType - 'star', 'trap', or 'normal'
 * @returns {number} final position after effect
 */
export function applySpecialTileEffect(position, tileType) {
  if (tileType === 'star') {
    return Math.min(position + 2, BOARD_CONFIG.finishPosition);
  }
  if (tileType === 'trap') {
    return Math.max(position - 3, 0);
  }
  return position;
}

/**
 * Check if landing on a tile kicks another player.
 * @param {number} targetTile - tile being landed on
 * @param {Array} allPlayerPositions - array of all player positions
 * @param {number} currentPlayerIndex - index of the current player
 * @returns {number} index of kicked player, or -1 if no kick
 */
export function checkKick(targetTile, allPlayerPositions, currentPlayerIndex) {
  for (let i = 0; i < allPlayerPositions.length; i++) {
    if (i === currentPlayerIndex) continue;
    if (allPlayerPositions[i] === targetTile && targetTile !== 0) {
      return i;
    }
  }
  return -1;
}

/**
 * Check win condition: returns the index of the first player at finish position, or -1.
 * @param {Array} playerPositions - array of player positions
 * @returns {number} index of winning player, or -1 if no winner
 */
export function checkWinCondition(playerPositions) {
  for (let i = 0; i < playerPositions.length; i++) {
    if (playerPositions[i] >= BOARD_CONFIG.finishPosition) {
      return i;
    }
  }
  return -1;
}

/**
 * Bot answer logic: determines bot's answer based on difficulty accuracy rates.
 * Accuracy rates: easy 0.6, medium 0.45, hard 0.3
 * @param {Object} question - the question object with correct_answer field
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {string} the answer key ('a', 'b', 'c', or 'd')
 */
export function botAnswer(question, difficulty) {
  const accuracy = { easy: 0.6, medium: 0.45, hard: 0.3 }[difficulty] || 0.6;
  const isCorrect = Math.random() < accuracy;
  if (isCorrect) return question.correct_answer;
  const options = ['a', 'b', 'c', 'd'].filter(o => o !== question.correct_answer);
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Accumulate progress data across multiple game sessions.
 * @param {Object|null} existing - existing progress data (may be null)
 * @param {Object} newSession - new session data { correct, total, isWinner }
 * @returns {Object} accumulated progress
 */
export function accumulateProgress(existing, newSession) {
  return {
    games_played: (existing?.games_played || 0) + 1,
    total_correct: (existing?.total_correct || 0) + newSession.correct,
    total_questions: (existing?.total_questions || 0) + newSession.total,
    wins: (existing?.wins || 0) + (newSession.isWinner ? 1 : 0),
  };
}

/**
 * Create initial game state with all players at position 0.
 * @param {Object} config - game configuration { playerCount, players, subject, difficulty }
 * @returns {Object} initial game state
 */
export function initializeGame(config) {
  const game = {
    config: {
      playerCount: config.playerCount,
      subject: config.subject,
      difficulty: config.difficulty,
    },
    players: config.players.map(p => ({
      slot: p.slot,
      name: p.name,
      type: p.type,
      color: p.color,
      position: 0,
      stats: {
        correct: 0,
        incorrect: 0,
        turnsPlayed: 0,
      },
    })),
    currentPlayerIndex: 0,
    state: 'waiting_roll',
    diceResult: null,
    targetTile: null,
    turnCount: 0,
    winner: null,
  };

  return game;
}

/**
 * Get the tile type for a given tile index.
 * @param {number} index - tile index (0-35)
 * @returns {string} 'star', 'trap', or 'normal'
 */
export function getTileType(index) {
  if (index === BOARD_CONFIG.finishTile) return 'finish';
  if (BOARD_CONFIG.starTiles.includes(index)) return 'star';
  if (BOARD_CONFIG.trapTiles.includes(index)) return 'trap';
  return 'normal';
}
