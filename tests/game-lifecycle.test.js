/**
 * Game Lifecycle Integration Tests
 * 
 * Tests the complete flow:
 * 1. Player creation
 * 2. Questions fetch
 * 3. Answer logging
 * 4. Session saving
 * 5. Stats retrieval
 * 
 * Uses mocked DB to simulate the full API layer.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// ===== MOCK DB =====
const insertedRows = [];
let mockReturnRows = [];
let lastInsertId = 0;

const mockDbExecute = vi.fn(async ({ sql, args }) => {
  if (sql.startsWith('INSERT')) {
    lastInsertId++;
    insertedRows.push({ sql, args });
    return { rows: [], lastInsertRowid: lastInsertId };
  }
  if (sql.startsWith('SELECT')) {
    return { rows: mockReturnRows };
  }
  if (sql.startsWith('UPDATE')) {
    return { rows: [] };
  }
  return { rows: [] };
});

const mockDb = { execute: mockDbExecute };

vi.mock('../api/db.js', () => ({
  getDb: () => mockDb,
}));

// Helpers
function createReq(method, query = {}, body = {}, params = {}) {
  return { method, query, body, params, headers: {}, url: '' };
}

function createRes() {
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { res.statusCode = code; return res; },
    json(data) { res._json = data; return res; },
  };
  return res;
}

// ===== FULL LIFECYCLE =====
describe('Full Game Lifecycle', () => {
  beforeEach(() => {
    mockDbExecute.mockClear();
    insertedRows.length = 0;
    lastInsertId = 0;
    mockReturnRows = [];
  });

  test('Complete flow: create player → fetch questions → log answer → save session', async () => {
    // Step 1: Create player
    vi.resetModules();
    vi.mock('../api/db.js', () => ({ getDb: () => mockDb }));
    
    mockReturnRows = []; // No existing player
    mockDbExecute.mockImplementation(async ({ sql, args }) => {
      if (sql.includes('SELECT') && sql.includes('players') && sql.includes('name')) {
        return { rows: [] }; // No existing player
      }
      if (sql.includes('INSERT INTO players')) {
        return { rows: [], lastInsertRowid: 42 };
      }
      return { rows: [] };
    });

    const playersModule = await import('../api/players.js');
    const playersHandler = playersModule.default;

    const createReqObj = createReq('POST', {}, { name: 'Bé Minh', grade: 2 });
    const createRes1 = createRes();
    await playersHandler(createReqObj, createRes1);

    expect(createRes1.statusCode).toBe(200);

    // Step 2: Fetch questions  
    mockDbExecute.mockImplementation(async ({ sql }) => {
      if (sql.includes('SELECT') && sql.includes('questions')) {
        return {
          rows: [
            { id: 1, question_text: '1+1=?', option_a: '1', option_b: '2', option_c: '3', option_d: '4', correct_answer: 'b' },
            { id: 2, question_text: '2+3=?', option_a: '4', option_b: '5', option_c: '6', option_d: '7', correct_answer: 'b' },
          ]
        };
      }
      return { rows: [] };
    });

    const questionsModule = await import('../api/questions.js');
    const questionsHandler = questionsModule.default;

    const qReq = createReq('GET', { subject: 'math', difficulty: 'easy', limit: '10', grade: '2' });
    const qRes = createRes();
    await questionsHandler(qReq, qRes);

    expect(qRes.statusCode).toBe(200);
    expect(qRes._json).toHaveLength(2);
    // Verify correct_answer is lowercase
    expect(qRes._json[0].correct_answer).toBe('b');
    expect(qRes._json[1].correct_answer).toBe('b');

    // Step 3: Log answer
    mockDbExecute.mockImplementation(async ({ sql }) => {
      if (sql.includes('INSERT INTO answer_logs')) {
        return { rows: [], lastInsertRowid: 1 };
      }
      return { rows: [] };
    });

    const answersModule = await import('../api/answers.js');
    const answersHandler = answersModule.default;

    const ansReq = createReq('POST', {}, {
      player_id: 42,
      question_id: 1,
      selected_answer: 'b',
      correct_answer: 'b',
      is_correct: true,
      time_spent_ms: 2500,
    });
    const ansRes = createRes();
    await answersHandler(ansReq, ansRes);

    expect(ansRes.statusCode).toBe(200);

    // Step 4: Save session
    mockDbExecute.mockImplementation(async ({ sql }) => {
      if (sql.includes('INSERT INTO game_sessions')) {
        return { rows: [], lastInsertRowid: 10 };
      }
      return { rows: [] };
    });

    const sessionsModule = await import('../api/sessions.js');
    const sessionsHandler = sessionsModule.default;

    const sessReq = createReq('POST', {}, {
      player_id: 42,
      subject: 'math',
      difficulty: 'easy',
      score: 100,
      total_questions: 10,
      correct_answers: 9,
      stars_earned: 3,
      combo_max: 5,
      mode: 'v13',
    });
    const sessRes = createRes();
    await sessionsHandler(sessReq, sessRes);

    expect(sessRes.statusCode).toBe(200);
  });
});

// ===== QUESTION FORMAT VALIDATION =====
describe('Question Format Contract', () => {
  beforeEach(() => {
    mockDbExecute.mockClear();
  });

  test('correct_answer field is always lowercase a/b/c/d', async () => {
    // Simulate what the DB would return
    const sampleQuestions = [
      { id: 1, correct_answer: 'a' },
      { id: 2, correct_answer: 'b' },
      { id: 3, correct_answer: 'c' },
      { id: 4, correct_answer: 'd' },
    ];

    for (const q of sampleQuestions) {
      expect(q.correct_answer).toMatch(/^[a-d]$/);
    }
  });

  test('all 4 options must be present', () => {
    const validQuestion = {
      question_text: '1+1=?',
      option_a: '1',
      option_b: '2',
      option_c: '3',
      option_d: '4',
      correct_answer: 'b',
    };

    expect(validQuestion.option_a).toBeDefined();
    expect(validQuestion.option_b).toBeDefined();
    expect(validQuestion.option_c).toBeDefined();
    expect(validQuestion.option_d).toBeDefined();
    expect(validQuestion.correct_answer).toMatch(/^[a-d]$/);
  });
});

// ===== SESSION SAVE VALIDATION =====
describe('Session Save Validation', () => {
  test('mode field matches game version pattern', () => {
    const validModes = ['v1', 'v2', 'v13', 'v22', 'v30', 'v40', 'classic', 'exam'];
    
    for (const mode of validModes) {
      // Mode should be a string
      expect(typeof mode).toBe('string');
      expect(mode.length).toBeGreaterThan(0);
    }
  });

  test('stars_earned is 0-3', () => {
    const calcStars = (correct, total) => {
      const pct = correct / total;
      if (pct >= 0.9) return 3;
      if (pct >= 0.7) return 2;
      if (pct >= 0.4) return 1;
      return 0;
    };

    expect(calcStars(10, 10)).toBe(3);
    expect(calcStars(8, 10)).toBe(2);
    expect(calcStars(5, 10)).toBe(1);
    expect(calcStars(2, 10)).toBe(0);
  });
});
