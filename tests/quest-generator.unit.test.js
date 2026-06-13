/**
 * Unit tests for quest-generator.js
 */
import { describe, it, expect } from 'vitest';
import { generateDailyQuests, getVietnamDateStr, QUEST_TEMPLATES } from '../lib/quest-generator.js';

const VALID_TYPES = QUEST_TEMPLATES.map(t => t.type);

describe('generateDailyQuests', () => {
  it('produces between 3 and 5 quests', () => {
    const quests = generateDailyQuests('player1', '2024-06-15');
    expect(quests.length).toBeGreaterThanOrEqual(3);
    expect(quests.length).toBeLessThanOrEqual(5);
  });

  it('is deterministic — same input always produces same output', () => {
    const a = generateDailyQuests('player42', '2024-12-25');
    const b = generateDailyQuests('player42', '2024-12-25');
    expect(a).toEqual(b);
  });

  it('produces different quests for different players on the same day', () => {
    const a = generateDailyQuests('player1', '2024-06-15');
    const b = generateDailyQuests('player2', '2024-06-15');
    // Very unlikely to be identical
    const aTypes = a.map(q => q.type + q.target_value).join(',');
    const bTypes = b.map(q => q.type + q.target_value).join(',');
    expect(aTypes).not.toEqual(bTypes);
  });

  it('produces different quests for same player on different days', () => {
    const a = generateDailyQuests('player1', '2024-06-15');
    const b = generateDailyQuests('player1', '2024-06-16');
    const aTypes = a.map(q => q.type + q.target_value).join(',');
    const bTypes = b.map(q => q.type + q.target_value).join(',');
    expect(aTypes).not.toEqual(bTypes);
  });

  it('all quests have valid types', () => {
    const quests = generateDailyQuests('test-player', '2024-01-01');
    for (const quest of quests) {
      expect(VALID_TYPES).toContain(quest.type);
    }
  });

  it('all quests have diamond_reward between 5 and 20', () => {
    const quests = generateDailyQuests('abc', '2024-07-04');
    for (const quest of quests) {
      expect(quest.diamond_reward).toBeGreaterThanOrEqual(5);
      expect(quest.diamond_reward).toBeLessThanOrEqual(20);
    }
  });

  it('all quests have target_value > 0', () => {
    const quests = generateDailyQuests('player99', '2024-03-10');
    for (const quest of quests) {
      expect(quest.target_value).toBeGreaterThan(0);
    }
  });

  it('quest descriptions contain the target number', () => {
    const quests = generateDailyQuests('player5', '2024-08-20');
    for (const quest of quests) {
      expect(quest.description).toContain(String(quest.target_value));
    }
  });

  it('works with numeric player IDs', () => {
    const quests = generateDailyQuests(123, '2024-01-01');
    expect(quests.length).toBeGreaterThanOrEqual(3);
    expect(quests.length).toBeLessThanOrEqual(5);
  });
});

describe('getVietnamDateStr', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const dateStr = getVietnamDateStr();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns a valid date', () => {
    const dateStr = getVietnamDateStr();
    const parsed = new Date(dateStr);
    expect(parsed.toString()).not.toBe('Invalid Date');
  });
});
