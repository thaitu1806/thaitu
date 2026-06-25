import { describe, it, expect } from 'vitest';
import {
  BOARD_CONFIG,
  calculateTargetTile,
  getNextPlayer,
  applySpecialTileEffect,
  checkKick,
  checkWinCondition,
  botAnswer,
  initializeGame,
  getTileType,
} from '../public/v5/game-logic.js';

// ===== Boundary Position Tests =====
describe('Boundary Position Tests', () => {
  it('calculateTargetTile at position 35 with max dice (12) → clamped to 35', () => {
    expect(calculateTargetTile(35, 12)).toBe(35);
  });

  it('calculateTargetTile at position 0 with min dice (2) → returns 2', () => {
    expect(calculateTargetTile(0, 2)).toBe(2);
  });

  it('calculateTargetTile at position 34 with dice 2 → clamped to 35', () => {
    expect(calculateTargetTile(34, 2)).toBe(35);
  });

  it('applySpecialTileEffect at position 0 with trap → returns 0 (can\'t go below 0)', () => {
    expect(applySpecialTileEffect(0, 'trap')).toBe(0);
  });

  it('applySpecialTileEffect at position 1 with trap → returns 0 (clamped)', () => {
    expect(applySpecialTileEffect(1, 'trap')).toBe(0);
  });

  it('applySpecialTileEffect at position 2 with trap → returns 0 (clamped)', () => {
    expect(applySpecialTileEffect(2, 'trap')).toBe(0);
  });

  it('applySpecialTileEffect at position 35 with star → returns 35 (already at finish)', () => {
    expect(applySpecialTileEffect(35, 'star')).toBe(35);
  });

  it('applySpecialTileEffect at position 36 with star → returns 35 (clamped)', () => {
    expect(applySpecialTileEffect(36, 'star')).toBe(35);
  });

  it('checkKick at position 0 (start tile) → returns -1 (no kick at start)', () => {
    expect(checkKick(0, [0, 0, 0], 0)).toBe(-1);
  });

  it('checkWinCondition with all players at position 0 → returns -1', () => {
    expect(checkWinCondition([0, 0, 0, 0])).toBe(-1);
  });

  it('checkWinCondition with multiple players at 35 → returns first one found', () => {
    expect(checkWinCondition([0, 35, 35, 0])).toBe(1);
  });
});

// ===== Question Cache Edge Cases (simulated) =====
describe('Question Cache Edge Cases (simulated)', () => {
  it('empty question cache → no questions served', () => {
    const cache = [];
    const usedIds = new Set();
    const available = cache.filter(q => !usedIds.has(q.id));
    expect(available.length).toBe(0);
  });

  it('all questions used: usedIds contains all cached IDs → no more unique questions', () => {
    const cache = [
      { id: 1, question_text: 'Q1', correct_answer: 'a' },
      { id: 2, question_text: 'Q2', correct_answer: 'b' },
      { id: 3, question_text: 'Q3', correct_answer: 'c' },
    ];
    const usedIds = new Set([1, 2, 3]);
    const available = cache.filter(q => !usedIds.has(q.id));
    expect(available.length).toBe(0);
  });

  it('single question in cache: can serve once, then it\'s used', () => {
    const cache = [{ id: 42, question_text: 'Q42', correct_answer: 'b' }];
    const usedIds = new Set();

    // First serve
    const firstAvailable = cache.filter(q => !usedIds.has(q.id));
    expect(firstAvailable.length).toBe(1);
    usedIds.add(firstAvailable[0].id);

    // Second attempt - no more
    const secondAvailable = cache.filter(q => !usedIds.has(q.id));
    expect(secondAvailable.length).toBe(0);
  });
});


// ===== Setup Validation Edge Cases =====
describe('Setup Validation Edge Cases', () => {
  it('initializeGame with 2 players → exactly 2 players in state, both at position 0', () => {
    const game = initializeGame({
      playerCount: 2,
      subject: 'math',
      difficulty: 'easy',
      players: [
        { slot: 0, name: 'Player 1', type: 'human', color: 'red' },
        { slot: 1, name: 'Bot 1', type: 'bot', color: 'blue' },
      ],
    });
    expect(game.players.length).toBe(2);
    expect(game.players[0].position).toBe(0);
    expect(game.players[1].position).toBe(0);
  });

  it('initializeGame with 4 players → exactly 4 players, all distinct colors', () => {
    const game = initializeGame({
      playerCount: 4,
      subject: 'math',
      difficulty: 'medium',
      players: [
        { slot: 0, name: 'Player 1', type: 'human', color: 'red' },
        { slot: 1, name: 'Bot 1', type: 'bot', color: 'blue' },
        { slot: 2, name: 'Bot 2', type: 'bot', color: 'green' },
        { slot: 3, name: 'Bot 3', type: 'bot', color: 'yellow' },
      ],
    });
    expect(game.players.length).toBe(4);
    const colors = game.players.map(p => p.color);
    expect(new Set(colors).size).toBe(4);
  });

  it('config with all bots should still initialize (UI-level validation, not in initializeGame)', () => {
    const game = initializeGame({
      playerCount: 3,
      subject: 'vietnamese',
      difficulty: 'hard',
      players: [
        { slot: 0, name: 'Bot 1', type: 'bot', color: 'red' },
        { slot: 1, name: 'Bot 2', type: 'bot', color: 'blue' },
        { slot: 2, name: 'Bot 3', type: 'bot', color: 'green' },
      ],
    });
    expect(game.players.length).toBe(3);
    expect(game.state).toBe('waiting_roll');
    expect(game.players.every(p => p.type === 'bot')).toBe(true);
  });
});

// ===== Bot Behavior Edge Cases =====
describe('Bot Behavior Edge Cases', () => {
  it('botAnswer always returns one of [a, b, c, d]', () => {
    const question = { correct_answer: 'c' };
    for (let i = 0; i < 50; i++) {
      const answer = botAnswer(question, 'easy');
      expect(['a', 'b', 'c', 'd']).toContain(answer);
    }
  });

  it('botAnswer with difficulty not in map defaults to 60% accuracy behavior', () => {
    const question = { correct_answer: 'a' };
    // With unknown difficulty, should still return valid answers
    for (let i = 0; i < 50; i++) {
      const answer = botAnswer(question, 'unknown_difficulty');
      expect(['a', 'b', 'c', 'd']).toContain(answer);
    }
  });

  it('bot names: verify default naming pattern works ("Bot 1", "Bot 2", "Bot 3")', () => {
    const game = initializeGame({
      playerCount: 4,
      subject: 'math',
      difficulty: 'easy',
      players: [
        { slot: 0, name: 'Human', type: 'human', color: 'red' },
        { slot: 1, name: 'Bot 1', type: 'bot', color: 'blue' },
        { slot: 2, name: 'Bot 2', type: 'bot', color: 'green' },
        { slot: 3, name: 'Bot 3', type: 'bot', color: 'yellow' },
      ],
    });
    expect(game.players[1].name).toBe('Bot 1');
    expect(game.players[2].name).toBe('Bot 2');
    expect(game.players[3].name).toBe('Bot 3');
  });
});

// ===== Turn Rotation Edge Cases =====
describe('Turn Rotation Edge Cases', () => {
  it('getNextPlayer with 2 players, index 1 → returns 0', () => {
    expect(getNextPlayer(1, 2)).toBe(0);
  });

  it('getNextPlayer with 4 players, index 3 → returns 0', () => {
    expect(getNextPlayer(3, 4)).toBe(0);
  });

  it('getNextPlayer with 3 players, index 0 → returns 1', () => {
    expect(getNextPlayer(0, 3)).toBe(1);
  });
});

// ===== Board Layout Edge Cases =====
describe('Board Layout Edge Cases', () => {
  it('star tiles are at expected positions [4, 13, 22, 31]', () => {
    expect(BOARD_CONFIG.starTiles).toEqual([4, 13, 22, 31]);
  });

  it('trap tiles are at expected positions [8, 17, 26]', () => {
    expect(BOARD_CONFIG.trapTiles).toEqual([8, 17, 26]);
  });

  it('getTileType for each star position returns "star"', () => {
    for (const pos of [4, 13, 22, 31]) {
      expect(getTileType(pos)).toBe('star');
    }
  });

  it('getTileType for each trap position returns "trap"', () => {
    for (const pos of [8, 17, 26]) {
      expect(getTileType(pos)).toBe('trap');
    }
  });

  it('getTileType for position 0 (start) returns "normal"', () => {
    expect(getTileType(0)).toBe('normal');
  });

  it('getTileType for position 35 (finish) returns "finish"', () => {
    expect(getTileType(35)).toBe('finish');
  });
});
