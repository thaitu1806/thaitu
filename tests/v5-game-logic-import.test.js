import { describe, it, expect } from 'vitest';
import {
  BOARD_CONFIG,
  calculateTargetTile,
  getNextPlayer,
  applySpecialTileEffect,
  checkKick,
  checkWinCondition,
  botAnswer,
  accumulateProgress,
  initializeGame,
  getTileType,
} from '../public/v5/game-logic.js';

describe('game-logic.js module import', () => {
  it('exports BOARD_CONFIG with required fields', () => {
    expect(BOARD_CONFIG.totalTiles).toBe(36);
    expect(BOARD_CONFIG.finishPosition).toBe(35);
    expect(BOARD_CONFIG.starTiles).toEqual([4, 13, 22, 31]);
    expect(BOARD_CONFIG.trapTiles).toEqual([8, 17, 26]);
  });

  it('exports all pure logic functions', () => {
    expect(typeof calculateTargetTile).toBe('function');
    expect(typeof getNextPlayer).toBe('function');
    expect(typeof applySpecialTileEffect).toBe('function');
    expect(typeof checkKick).toBe('function');
    expect(typeof checkWinCondition).toBe('function');
    expect(typeof botAnswer).toBe('function');
    expect(typeof accumulateProgress).toBe('function');
    expect(typeof initializeGame).toBe('function');
    expect(typeof getTileType).toBe('function');
  });

  it('calculateTargetTile clamps to finish', () => {
    expect(calculateTargetTile(10, 5)).toBe(15);
    expect(calculateTargetTile(33, 5)).toBe(35);
  });

  it('getNextPlayer wraps around', () => {
    expect(getNextPlayer(2, 4)).toBe(3);
    expect(getNextPlayer(3, 4)).toBe(0);
  });

  it('applySpecialTileEffect handles star, trap, normal', () => {
    expect(applySpecialTileEffect(30, 'star')).toBe(32);
    expect(applySpecialTileEffect(35, 'star')).toBe(35);
    expect(applySpecialTileEffect(10, 'trap')).toBe(7);
    expect(applySpecialTileEffect(2, 'trap')).toBe(0);
    expect(applySpecialTileEffect(10, 'normal')).toBe(10);
  });

  it('checkKick finds opponent on tile', () => {
    expect(checkKick(5, [0, 5, 3], 0)).toBe(1);
    expect(checkKick(0, [0, 0, 3], 0)).toBe(-1);
    expect(checkKick(7, [0, 5, 3], 0)).toBe(-1);
  });

  it('checkWinCondition finds winner', () => {
    expect(checkWinCondition([10, 36, 5])).toBe(1);
    expect(checkWinCondition([10, 20, 5])).toBe(-1);
  });

  it('getTileType returns correct types', () => {
    expect(getTileType(4)).toBe('star');
    expect(getTileType(8)).toBe('trap');
    expect(getTileType(5)).toBe('normal');
  });

  it('initializeGame creates state with all positions at 0', () => {
    const game = initializeGame({
      playerCount: 2,
      subject: 'math',
      difficulty: 'easy',
      players: [
        { slot: 0, name: 'P1', type: 'human', color: 'red' },
        { slot: 1, name: 'Bot', type: 'bot', color: 'blue' },
      ],
    });
    expect(game.players.every(p => p.position === 0)).toBe(true);
    expect(game.players.length).toBe(2);
    expect(game.state).toBe('waiting_roll');
  });

  it('accumulateProgress accumulates values correctly', () => {
    const result = accumulateProgress(
      { games_played: 2, total_correct: 10, total_questions: 15, wins: 1 },
      { correct: 5, total: 8, isWinner: true }
    );
    expect(result).toEqual({
      games_played: 3,
      total_correct: 15,
      total_questions: 23,
      wins: 2,
    });
  });

  it('accumulateProgress handles null existing', () => {
    const result = accumulateProgress(null, { correct: 3, total: 5, isWinner: false });
    expect(result).toEqual({
      games_played: 1,
      total_correct: 3,
      total_questions: 5,
      wins: 0,
    });
  });

  it('botAnswer returns a valid answer key', () => {
    const question = { correct_answer: 'b' };
    const answer = botAnswer(question, 'easy');
    expect(['a', 'b', 'c', 'd']).toContain(answer);
  });
});
