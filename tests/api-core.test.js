/**
 * API Core Unit Tests
 * Tests the main API endpoints: questions, sessions, answers, players
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';

// ===== MOCK DB =====
const mockDbExecute = vi.fn(async () => ({ rows: [] }));
const mockDb = { execute: mockDbExecute };

vi.mock('../api/db.js', () => ({
  getDb: () => mockDb,
}));

vi.mock('../lib/link-code.js', () => ({
  generateUniqueLinkCode: vi.fn(async () => 'ABC-1234'),
}));

vi.mock('../lib/diamond-calc.js', () => ({
  calculateDiamonds: vi.fn(() => 5),
  getPlayerLevel: vi.fn((diamonds) => ({ name: 'bronze', label: 'Đồng' })),
}));

// Helper to create mock req/res
function createReq(method = 'GET', query = {}, body = {}) {
  return { method, query, body, headers: {}, url: '', params: {} };
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

// ===== QUESTIONS API =====
describe('api/questions.js', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    vi.mock('../api/db.js', () => ({ getDb: () => mockDb }));
    const mod = await import('../api/questions.js');
    handler = mod.default;
    mockDbExecute.mockReset();
  });

  test('GET returns questions array', async () => {
    const mockQuestions = [
      { id: 1, question_text: '1+1=?', option_a: '1', option_b: '2', option_c: '3', option_d: '4', correct_answer: 'b' },
      { id: 2, question_text: '2+2=?', option_a: '3', option_b: '4', option_c: '5', option_d: '6', correct_answer: 'b' },
    ];
    mockDbExecute.mockResolvedValue({ rows: mockQuestions });

    const req = createReq('GET', { subject: 'math', difficulty: 'easy', limit: '10' });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json).toEqual(mockQuestions);
  });

  test('GET resolves grade from player profile when player_id provided', async () => {
    mockDbExecute.mockImplementation(async ({ sql }) => {
      if (sql.includes('SELECT grade FROM players')) {
        return { rows: [{ grade: 3 }] };
      }
      return { rows: [] };
    });

    const req = createReq('GET', { subject: 'math', difficulty: 'easy', player_id: '5' });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    // Should have called DB twice: once for grade, once for questions
    expect(mockDbExecute).toHaveBeenCalledTimes(2);
    // Second call should include grade=3 in args
    const questionsCall = mockDbExecute.mock.calls[1][0];
    expect(questionsCall.args).toContain(3);
  });

  test('GET defaults grade to 2 when neither grade nor player_id given', async () => {
    mockDbExecute.mockResolvedValue({ rows: [] });

    const req = createReq('GET', { subject: 'math', difficulty: 'easy' });
    const res = createRes();
    await handler(req, res);

    const call = mockDbExecute.mock.calls[0][0];
    expect(call.args).toContain(2); // default grade
  });

  test('GET defaults limit to 10', async () => {
    mockDbExecute.mockResolvedValue({ rows: [] });

    const req = createReq('GET', { subject: 'math', difficulty: 'easy' });
    const res = createRes();
    await handler(req, res);

    const call = mockDbExecute.mock.calls[0][0];
    expect(call.args).toContain(10); // default limit
  });

  test('returns 405 for POST method', async () => {
    const req = createReq('POST', {}, {});
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });

  test('returns 500 on DB error', async () => {
    mockDbExecute.mockRejectedValue(new Error('DB connection failed'));

    const req = createReq('GET', { subject: 'math', difficulty: 'easy' });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(500);
    expect(res._json.error).toContain('DB connection failed');
  });
});

// ===== SESSIONS API =====
describe('api/sessions.js', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    vi.mock('../api/db.js', () => ({ getDb: () => mockDb }));
    const mod = await import('../api/sessions.js');
    handler = mod.default;
    mockDbExecute.mockReset();
    mockDbExecute.mockResolvedValue({ rows: [], lastInsertRowid: 1 });
  });

  test('POST saves session and returns id', async () => {
    const req = createReq('POST', {}, {
      player_id: 1,
      subject: 'math',
      difficulty: 'easy',
      score: 80,
      total_questions: 10,
      correct_answers: 8,
      stars_earned: 2,
      combo_max: 3,
    });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.id).toBe(1);
    expect(mockDbExecute).toHaveBeenCalled();
  });

  test('POST returns skipped when player_id is missing', async () => {
    const req = createReq('POST', {}, {
      subject: 'math',
      score: 80,
    });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.skipped).toBe(true);
  });

  test('POST handles missing optional fields gracefully', async () => {
    const req = createReq('POST', {}, { player_id: 1 });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    // Should use defaults for missing fields
    const call = mockDbExecute.mock.calls[0][0];
    expect(call.args).toContain('math'); // default subject
    expect(call.args).toContain('easy'); // default difficulty
    expect(call.args).toContain(0); // default score
  });

  test('returns 405 for GET method', async () => {
    const req = createReq('GET');
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });
});

// ===== ANSWERS API =====
describe('api/answers.js', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    vi.mock('../api/db.js', () => ({ getDb: () => mockDb }));
    vi.mock('../lib/diamond-calc.js', () => ({
      calculateDiamonds: vi.fn(() => 5),
      getPlayerLevel: vi.fn(() => ({ name: 'bronze', label: 'Đồng' })),
    }));
    const mod = await import('../api/answers.js');
    handler = mod.default;
    mockDbExecute.mockReset();
    mockDbExecute.mockResolvedValue({ rows: [{ lifetime_diamonds: 100, total_diamonds: 50 }], lastInsertRowid: 1 });
  });

  test('POST logs answer and returns diamonds for correct answer', async () => {
    const req = createReq('POST', {}, {
      player_id: 1,
      question_id: 5,
      selected_answer: 'b',
      correct_answer: 'b',
      is_correct: true,
      time_spent_ms: 3000,
      difficulty: 'easy',
      combo_streak: 2,
    });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.ok).toBe(true);
    expect(res._json.diamonds_earned).toBeGreaterThanOrEqual(0);
  });

  test('POST returns skipped when player_id is missing', async () => {
    const req = createReq('POST', {}, {
      question_id: 5,
      selected_answer: 'a',
    });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.skipped).toBe(true);
  });

  test('POST returns skipped when question_id is missing', async () => {
    const req = createReq('POST', {}, {
      player_id: 1,
      selected_answer: 'a',
    });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.skipped).toBe(true);
  });

  test('POST returns 0 diamonds for wrong answer', async () => {
    const req = createReq('POST', {}, {
      player_id: 1,
      question_id: 5,
      selected_answer: 'a',
      correct_answer: 'b',
      is_correct: false,
      difficulty: 'easy',
    });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.diamonds_earned).toBe(0);
  });

  test('returns 405 for GET method', async () => {
    const req = createReq('GET');
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });
});

// ===== PLAYERS API =====
describe('api/players.js', () => {
  let handler;

  beforeEach(async () => {
    vi.resetModules();
    vi.mock('../api/db.js', () => ({ getDb: () => mockDb }));
    vi.mock('../lib/link-code.js', () => ({
      generateUniqueLinkCode: vi.fn(async () => 'ABC-1234'),
    }));
    const mod = await import('../api/players.js');
    handler = mod.default;
    mockDbExecute.mockReset();
  });

  test('GET with id returns player data', async () => {
    mockDbExecute.mockResolvedValue({ rows: [{ id: 1, name: 'Test', grade: 2 }] });

    const req = createReq('GET', { id: '1' });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json).toHaveProperty('id', 1);
  });

  test('GET without id returns 400', async () => {
    const req = createReq('GET', {});
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });

  test('GET with non-existent id returns error', async () => {
    mockDbExecute.mockResolvedValue({ rows: [] });

    const req = createReq('GET', { id: '999' });
    const res = createRes();
    await handler(req, res);

    expect(res._json.error).toBe('not_found');
  });

  test('POST creates new player with link code', async () => {
    mockDbExecute.mockImplementation(async ({ sql }) => {
      if (sql.includes('SELECT')) return { rows: [] }; // No existing player
      if (sql.includes('INSERT')) return { rows: [], lastInsertRowid: 5 };
      return { rows: [] };
    });

    const req = createReq('POST', {}, { name: 'Bé Minh', grade: 2 });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.name).toBe('Bé Minh');
    expect(res._json.link_code).toBe('ABC-1234');
    expect(res._json.link_status).toBe('unlinked');
  });

  test('POST returns existing player on duplicate name', async () => {
    mockDbExecute.mockResolvedValue({ rows: [{ id: 3, name: 'Bé Minh', grade: 2, link_status: 'linked' }] });

    const req = createReq('POST', {}, { name: 'Bé Minh' });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.id).toBe(3);
  });

  test('POST returns 400 for empty name', async () => {
    const req = createReq('POST', {}, { name: '' });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });

  test('POST trims whitespace from name', async () => {
    mockDbExecute.mockImplementation(async ({ sql, args }) => {
      if (sql.includes('SELECT')) return { rows: [] };
      if (sql.includes('INSERT')) {
        // Verify trimmed name is used
        expect(args[0]).toBe('Bé Minh');
        return { rows: [], lastInsertRowid: 6 };
      }
      return { rows: [] };
    });

    const req = createReq('POST', {}, { name: '  Bé Minh  ', grade: 3 });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
  });

  test('PUT updates grade within valid range', async () => {
    mockDbExecute.mockImplementation(async ({ sql }) => {
      if (sql.includes('UPDATE')) return { rows: [] };
      if (sql.includes('SELECT')) return { rows: [{ id: 1, name: 'Test', grade: 4 }] };
      return { rows: [] };
    });

    const req = createReq('PUT', { id: '1' }, { id: 1, grade: 4 });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._json.grade).toBe(4);
  });

  test('PUT rejects grade outside 2-5 range', async () => {
    const req = createReq('PUT', { id: '1' }, { id: 1, grade: 6 });
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(400);
  });

  test('returns 405 for unsupported methods', async () => {
    const req = createReq('DELETE');
    const res = createRes();
    await handler(req, res);

    expect(res.statusCode).toBe(405);
  });
});
