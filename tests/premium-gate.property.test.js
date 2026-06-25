/**
 * Feature: progressive-parent-linking, Property 6: Premium gate enforcement
 *
 * For any player with link_status ≠ `linked`, API calls to premium features
 * (shop purchase, AI chat) should return HTTP 403 with `require_link: true`
 * in the response body. No shop purchase should be processed and no AI
 * response should be generated.
 *
 * Validates: Requirements 5.1, 5.2, 5.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mock dependencies before importing handlers
vi.mock('../api/db.js', () => ({
  getDb: vi.fn()
}));

vi.mock('../lib/ai-service.js', () => ({
  isAIEnabled: vi.fn(() => true),
  getProviderConfig: vi.fn(() => ({ apiKey: 'test', model: 'gpt-4' })),
  generateExplanation: vi.fn(),
  generateHint: vi.fn(),
  generateQuestions: vi.fn(),
  chatWithTutor: vi.fn(),
}));

vi.mock('../lib/ai-rate-limiter.js', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 10 })),
  recordUsage: vi.fn(),
}));

vi.mock('../lib/ai-cache.js', () => ({
  hashPrompt: vi.fn(() => 'hash'),
  getCached: vi.fn(() => null),
  setCache: vi.fn(),
}));

import shopHandler from '../api/shop.js';
import aiHandler from '../api/ai.js';
import { getDb } from '../api/db.js';

/**
 * Helper: create a mock request object
 */
function createMockReq({ method = 'POST', query = {}, body = {}, url = '', headers = {} } = {}) {
  return { method, query, body, url, headers, params: {} };
}

/**
 * Helper: create a mock response object that captures the response
 */
function createMockRes() {
  const res = {
    _statusCode: 200,
    _json: null,
    status(code) {
      res._statusCode = code;
      return res;
    },
    json(data) {
      res._json = data;
      return res;
    }
  };
  return res;
}

// Arbitraries
const playerIdArb = fc.integer({ min: 1, max: 10000 });
const itemIdArb = fc.integer({ min: 1, max: 100 });

// link_status values that are NOT 'linked' — these should be blocked
const nonLinkedStatusArb = fc.constantFrom('unlinked', 'prompted');

describe('Property 6: Premium gate enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 5.1, 5.5**
   *
   * Property: For any player with link_status ≠ 'linked', a shop buy request
   * should return 403 with require_link: true. No purchase should be processed.
   */
  it('shop purchase is blocked with 403 + require_link:true for non-linked players', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        itemIdArb,
        nonLinkedStatusArb,
        async (playerId, itemId, linkStatus) => {
          // Track whether any purchase-related DB write was attempted
          let purchaseProcessed = false;

          const mockDb = {
            execute: async ({ sql, args }) => {
              // link_status check query
              if (sql.includes('link_status') && sql.includes('players') && sql.includes('id')) {
                return { rows: [{ link_status: linkStatus }] };
              }
              // If any other query fires after the gate check, it means purchase was processed
              if (sql.includes('total_diamonds') || sql.includes('shop_items') || sql.includes('player_inventory')) {
                purchaseProcessed = true;
                return { rows: [] };
              }
              return { rows: [] };
            },
            batch: async () => {
              purchaseProcessed = true;
              return [];
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            query: { action: 'buy' },
            body: { player_id: playerId, item_id: itemId }
          });
          const res = createMockRes();

          await shopHandler(req, res);

          // Should return 403
          expect(res._statusCode).toBe(403);
          // Should include require_link: true
          expect(res._json).not.toBeNull();
          expect(res._json.require_link).toBe(true);
          // No purchase should have been processed
          expect(purchaseProcessed).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.2, 5.5**
   *
   * Property: For any player with link_status ≠ 'linked', AI explain requests
   * should return 403 with require_link: true. No AI response should be generated.
   */
  it('AI explain is blocked with 403 + require_link:true for non-linked players', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        nonLinkedStatusArb,
        fc.string({ minLength: 5, maxLength: 50 }),
        async (playerId, linkStatus, questionText) => {
          let aiCalled = false;

          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('link_status') && sql.includes('players')) {
                return { rows: [{ link_status: linkStatus }] };
              }
              if (sql.includes('ai_usage_logs') || sql.includes('explanation')) {
                aiCalled = true;
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            query: { action: 'explain' },
            body: {
              player_id: playerId,
              question_text: questionText,
              correct_answer: 'a',
              selected_answer: 'b',
              grade: 2
            },
            url: '/api/ai/explain'
          });
          const res = createMockRes();

          await aiHandler(req, res);

          // Should return 403
          expect(res._statusCode).toBe(403);
          expect(res._json).not.toBeNull();
          expect(res._json.require_link).toBe(true);
          // No AI processing should have occurred
          expect(aiCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.2, 5.5**
   *
   * Property: For any player with link_status ≠ 'linked', AI hint requests
   * should return 403 with require_link: true. No AI response should be generated.
   */
  it('AI hint is blocked with 403 + require_link:true for non-linked players', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        nonLinkedStatusArb,
        fc.string({ minLength: 5, maxLength: 50 }),
        fc.constantFrom(1, 2),
        async (playerId, linkStatus, questionText, hintLevel) => {
          let aiCalled = false;

          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('link_status') && sql.includes('players')) {
                return { rows: [{ link_status: linkStatus }] };
              }
              if (sql.includes('ai_usage_logs')) {
                aiCalled = true;
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            query: { action: 'hint' },
            body: {
              player_id: playerId,
              question_text: questionText,
              hint_level: hintLevel,
              grade: 2
            },
            url: '/api/ai/hint'
          });
          const res = createMockRes();

          await aiHandler(req, res);

          // Should return 403
          expect(res._statusCode).toBe(403);
          expect(res._json).not.toBeNull();
          expect(res._json.require_link).toBe(true);
          // No AI processing should have occurred
          expect(aiCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.2, 5.5**
   *
   * Property: For any player with link_status ≠ 'linked', AI chat requests
   * should return 403 with require_link: true. No AI response should be generated.
   */
  it('AI chat is blocked with 403 + require_link:true for non-linked players', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        nonLinkedStatusArb,
        fc.string({ minLength: 2, maxLength: 50 }),
        async (playerId, linkStatus, messageContent) => {
          let aiCalled = false;

          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('link_status') && sql.includes('players')) {
                return { rows: [{ link_status: linkStatus }] };
              }
              if (sql.includes('ai_usage_logs') || sql.includes('chat')) {
                aiCalled = true;
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            query: { action: 'chat' },
            body: {
              player_id: playerId,
              messages: [{ role: 'user', content: messageContent }],
              grade: 2
            },
            url: '/api/ai/chat'
          });
          const res = createMockRes();

          await aiHandler(req, res);

          // Should return 403
          expect(res._statusCode).toBe(403);
          expect(res._json).not.toBeNull();
          expect(res._json.require_link).toBe(true);
          // No AI processing should have occurred
          expect(aiCalled).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: progressive-parent-linking, Property 7: Linking unlocks premium access
 *
 * For any player whose link_status transitions from non-linked to `linked`,
 * subsequent API calls to premium features (shop, AI) should succeed
 * (assuming other validations pass like sufficient diamonds).
 *
 * Validates: Requirements 5.4
 */

import { generateExplanation, generateHint, chatWithTutor } from '../lib/ai-service.js';
import { checkRateLimit, recordUsage } from '../lib/ai-rate-limiter.js';

describe('Property 7: Linking unlocks premium access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Configure AI mocks to return valid responses
    generateExplanation.mockResolvedValue('This is an explanation');
    generateHint.mockResolvedValue('This is a hint');
    chatWithTutor.mockResolvedValue('This is a chat reply');
    checkRateLimit.mockReturnValue({ allowed: true, remaining: 10 });
    recordUsage.mockResolvedValue(undefined);
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * Property: For any linked player with sufficient diamonds and a valid item,
   * the shop buy request should NOT return 403 (the premium gate is not blocking).
   */
  it('shop purchase is NOT blocked by premium gate for linked players', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        itemIdArb,
        fc.integer({ min: 100, max: 10000 }), // diamonds the player has
        fc.integer({ min: 1, max: 50 }), // item price
        async (playerId, itemId, diamonds, itemPrice) => {
          const mockDb = {
            execute: async ({ sql, args }) => {
              // link_status check — player is linked
              if (sql.includes('link_status') && sql.includes('players') && sql.includes('id')) {
                return { rows: [{ link_status: 'linked', id: playerId, total_diamonds: diamonds, lifetime_diamonds: diamonds }] };
              }
              // Player lookup (for diamond balance)
              if (sql.includes('total_diamonds') && sql.includes('lifetime_diamonds')) {
                return { rows: [{ id: playerId, total_diamonds: diamonds, lifetime_diamonds: diamonds }] };
              }
              // Item lookup
              if (sql.includes('shop_items') && sql.includes('is_active')) {
                return { rows: [{ id: itemId, name: 'Test Item', price_diamonds: itemPrice, category: 'avatar', min_level: 'bronze', is_active: 1, max_per_week: null, created_at: new Date().toISOString() }] };
              }
              // Weekly limit check
              if (sql.includes('player_inventory') && sql.includes('COUNT')) {
                return { rows: [{ count: 0 }] };
              }
              return { rows: [] };
            },
            batch: async () => {
              return [];
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            query: { action: 'buy' },
            body: { player_id: playerId, item_id: itemId }
          });
          const res = createMockRes();

          await shopHandler(req, res);

          // The key assertion: status should NOT be 403 (gate is not blocking)
          expect(res._statusCode).not.toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * Property: For any linked player, AI explain requests should NOT return 403.
   */
  it('AI explain is NOT blocked by premium gate for linked players', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        fc.string({ minLength: 5, maxLength: 50 }),
        async (playerId, questionText) => {
          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('link_status') && sql.includes('players')) {
                return { rows: [{ link_status: 'linked' }] };
              }
              // For static explanation fallback query
              if (sql.includes('explanation') && sql.includes('questions')) {
                return { rows: [] };
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            query: { action: 'explain' },
            body: {
              player_id: playerId,
              question_text: questionText,
              correct_answer: 'a',
              selected_answer: 'b',
              grade: 2
            },
            url: '/api/ai/explain'
          });
          const res = createMockRes();

          await aiHandler(req, res);

          // The key assertion: status should NOT be 403 (gate is not blocking)
          expect(res._statusCode).not.toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * Property: For any linked player, AI hint requests should NOT return 403.
   */
  it('AI hint is NOT blocked by premium gate for linked players', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        fc.string({ minLength: 5, maxLength: 50 }),
        fc.constantFrom(1, 2),
        async (playerId, questionText, hintLevel) => {
          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('link_status') && sql.includes('players')) {
                return { rows: [{ link_status: 'linked' }] };
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            query: { action: 'hint' },
            body: {
              player_id: playerId,
              question_text: questionText,
              hint_level: hintLevel,
              grade: 2
            },
            url: '/api/ai/hint'
          });
          const res = createMockRes();

          await aiHandler(req, res);

          // The key assertion: status should NOT be 403 (gate is not blocking)
          expect(res._statusCode).not.toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 5.4**
   *
   * Property: For any linked player, AI chat requests should NOT return 403.
   */
  it('AI chat is NOT blocked by premium gate for linked players', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        fc.string({ minLength: 2, maxLength: 50 }),
        async (playerId, messageContent) => {
          const mockDb = {
            execute: async ({ sql }) => {
              if (sql.includes('link_status') && sql.includes('players')) {
                return { rows: [{ link_status: 'linked' }] };
              }
              // Chat daily limit check
              if (sql.includes('ai_usage_logs') && sql.includes('COUNT')) {
                return { rows: [{ count: 0 }] };
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            query: { action: 'chat' },
            body: {
              player_id: playerId,
              messages: [{ role: 'user', content: messageContent }],
              grade: 2
            },
            url: '/api/ai/chat'
          });
          const res = createMockRes();

          await aiHandler(req, res);

          // The key assertion: status should NOT be 403 (gate is not blocking)
          expect(res._statusCode).not.toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });
});


/**
 * Feature: progressive-parent-linking, Property 11: Basic gameplay unaffected by link status
 *
 * For any player regardless of link_status (unlinked, prompted, or linked),
 * API calls to basic game features (questions, sessions, answers) should
 * succeed without any link-related restrictions.
 *
 * Validates: Requirements 1.3, 4.3
 */

import questionsHandler from '../api/questions.js';
import sessionsHandler from '../api/sessions.js';
import answersHandler from '../api/answers.js';

// Arbitraries for Property 11
const anyLinkStatusArb = fc.constantFrom('unlinked', 'prompted', 'linked');
const subjectArb = fc.constantFrom('math', 'vietnamese');
const difficultyArb = fc.constantFrom('easy', 'medium', 'hard');
const gradeArb = fc.constantFrom(2, 3, 4, 5);
const scoreArb = fc.integer({ min: 0, max: 100 });
const totalQuestionsArb = fc.integer({ min: 1, max: 20 });

describe('Property 11: Basic gameplay unaffected by link status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * **Validates: Requirements 1.3, 4.3**
   *
   * Property: For any player with any link_status, fetching questions via GET
   * should NOT return 403. The game should work regardless of link state.
   */
  it('fetching questions succeeds regardless of link_status', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        anyLinkStatusArb,
        subjectArb,
        difficultyArb,
        gradeArb,
        async (playerId, linkStatus, subject, difficulty, grade) => {
          const mockDb = {
            execute: async ({ sql, args }) => {
              // Player grade lookup
              if (sql.includes('grade') && sql.includes('players') && sql.includes('id')) {
                return { rows: [{ grade, link_status: linkStatus }] };
              }
              // Questions query
              if (sql.includes('questions') && sql.includes('subject')) {
                return {
                  rows: [
                    { id: 1, question_text: 'Q1?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_answer: 'a', subject, difficulty, grade },
                    { id: 2, question_text: 'Q2?', option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D', correct_answer: 'b', subject, difficulty, grade },
                  ]
                };
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'GET',
            query: { subject, difficulty, limit: '10', grade: String(grade), player_id: String(playerId) }
          });
          const res = createMockRes();

          await questionsHandler(req, res);

          // Key assertion: status should NOT be 403 — no link-related gate
          expect(res._statusCode).not.toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 1.3, 4.3**
   *
   * Property: For any player with any link_status, saving a game session via POST
   * should NOT return 403. Sessions are basic gameplay, never gated.
   */
  it('saving sessions succeeds regardless of link_status', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        anyLinkStatusArb,
        subjectArb,
        difficultyArb,
        scoreArb,
        totalQuestionsArb,
        async (playerId, linkStatus, subject, difficulty, score, totalQuestions) => {
          const correctAnswers = Math.min(totalQuestions, Math.floor(Math.random() * totalQuestions));

          const mockDb = {
            execute: async ({ sql, args }) => {
              // Session insert
              if (sql.includes('INSERT INTO game_sessions')) {
                return { lastInsertRowid: 42 };
              }
              // If any link_status query happens, return the player's status
              if (sql.includes('link_status')) {
                return { rows: [{ link_status: linkStatus }] };
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            body: {
              player_id: playerId,
              subject,
              difficulty,
              score,
              total_questions: totalQuestions,
              correct_answers: correctAnswers,
              stars_earned: Math.floor(score / 30),
              combo_max: 3
            }
          });
          const res = createMockRes();

          await sessionsHandler(req, res);

          // Key assertion: status should NOT be 403 — no link-related gate
          expect(res._statusCode).not.toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Validates: Requirements 1.3, 4.3**
   *
   * Property: For any player with any link_status, logging answers via POST
   * should NOT return 403. Answer logging is basic gameplay, never gated.
   */
  it('logging answers succeeds regardless of link_status', async () => {
    await fc.assert(
      fc.asyncProperty(
        playerIdArb,
        anyLinkStatusArb,
        fc.integer({ min: 1, max: 1000 }), // question_id
        fc.constantFrom('a', 'b', 'c', 'd'), // selected_answer
        fc.constantFrom('a', 'b', 'c', 'd'), // correct_answer
        difficultyArb,
        async (playerId, linkStatus, questionId, selectedAnswer, correctAnswer, difficulty) => {
          const isCorrect = selectedAnswer === correctAnswer;

          const mockDb = {
            execute: async ({ sql, args }) => {
              // Answer insert
              if (sql.includes('INSERT INTO answer_logs')) {
                return { lastInsertRowid: 99 };
              }
              // Player lifetime_diamonds lookup (for correct answers)
              if (sql.includes('lifetime_diamonds') && sql.includes('players')) {
                return { rows: [{ lifetime_diamonds: 50, link_status: linkStatus }] };
              }
              // Diamond transaction insert
              if (sql.includes('INSERT INTO diamond_transactions')) {
                return { lastInsertRowid: 100 };
              }
              // Player update (diamonds)
              if (sql.includes('UPDATE players')) {
                return { rowsAffected: 1 };
              }
              // Get new total
              if (sql.includes('total_diamonds') && sql.includes('players') && sql.includes('id')) {
                return { rows: [{ total_diamonds: 55 }] };
              }
              // If any link_status check query
              if (sql.includes('link_status')) {
                return { rows: [{ link_status: linkStatus }] };
              }
              return { rows: [] };
            }
          };

          getDb.mockReturnValue(mockDb);

          const req = createMockReq({
            method: 'POST',
            body: {
              session_id: 1,
              player_id: playerId,
              question_id: questionId,
              selected_answer: selectedAnswer,
              correct_answer: correctAnswer,
              is_correct: isCorrect,
              time_spent_ms: 3000,
              difficulty,
              combo_streak: 2,
              hint_used: false
            }
          });
          const res = createMockRes();

          await answersHandler(req, res);

          // Key assertion: status should NOT be 403 — no link-related gate
          expect(res._statusCode).not.toBe(403);
        }
      ),
      { numRuns: 100 }
    );
  });
});
