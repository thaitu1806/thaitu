/**
 * Unit tests for api/ai.js — Unified AI endpoint handler
 * Tests action routing, validation, error format, rate limiting, and caching.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock dependencies before importing the handler
vi.mock('../lib/ai-service.js', () => ({
  isAIEnabled: vi.fn(() => true),
  getProviderConfig: vi.fn(() => ({
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    apiKey: 'sk-test',
  })),
  generateExplanation: vi.fn(async () => 'Giải thích mẫu'),
  generateHint: vi.fn(async () => 'Gợi ý mẫu'),
  generateQuestions: vi.fn(async () => [{
    question_text: 'Test?',
    option_a: 'A',
    option_b: 'B',
    option_c: 'C',
    option_d: 'D',
    correct_answer: 'a',
    explanation: 'Because',
  }]),
  chatWithTutor: vi.fn(async () => 'Trả lời mẫu'),
}));

vi.mock('../lib/ai-rate-limiter.js', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, remaining: 45, resetAt: '2024-01-02T00:00:00.000Z' })),
  recordUsage: vi.fn(async () => {}),
}));

vi.mock('../lib/ai-cache.js', () => ({
  hashPrompt: vi.fn((s) => 'hash_' + s.slice(0, 10)),
  getCached: vi.fn(() => null),
  setCache: vi.fn(),
}));

// Create a controllable mock DB
const mockDbExecute = vi.fn(async () => ({ rows: [] }));
const mockDb = { execute: mockDbExecute };

vi.mock('../api/db.js', () => ({
  getDb: () => mockDb,
}));

import handler from '../api/ai.js';
import { isAIEnabled, generateExplanation, generateHint, chatWithTutor, generateQuestions } from '../lib/ai-service.js';
import { checkRateLimit, recordUsage } from '../lib/ai-rate-limiter.js';
import { getCached, setCache } from '../lib/ai-cache.js';

// Helper to create mock req/res
function createMockReq(method, query = {}, body = {}, headers = {}, url = '/api/ai/status') {
  return { method, query, body, headers, url };
}

function createMockRes() {
  const res = {
    statusCode: 200,
    _json: null,
    status(code) { res.statusCode = code; return res; },
    json(data) { res._json = data; return res; },
  };
  return res;
}

describe('api/ai.js - Action routing', () => {
  test('routes to status via query param', async () => {
    const req = createMockReq('GET', { action: 'status' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._json).toHaveProperty('enabled');
    expect(res._json).toHaveProperty('provider');
    expect(res._json).toHaveProperty('model');
  });

  test('routes to status via URL path', async () => {
    const req = createMockReq('GET', {}, {}, {}, '/api/ai/status');
    const res = createMockRes();
    await handler(req, res);
    expect(res._json.enabled).toBe(true);
  });

  test('returns 404 for unknown action', async () => {
    const req = createMockReq('GET', { action: 'unknown' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(404);
    expect(res._json.code).toBe('INVALID_INPUT');
  });
});

describe('api/ai.js - GET /api/ai/status', () => {
  test('returns enabled status with provider and model', async () => {
    const req = createMockReq('GET', { action: 'status' });
    const res = createMockRes();
    await handler(req, res);
    expect(res._json).toEqual({
      enabled: true,
      provider: 'openai',
      model: 'gpt-4o-mini',
    });
  });
});

describe('api/ai.js - POST /api/ai/explain', () => {
  beforeEach(() => {
    // Clear call history but keep implementations
    generateExplanation.mockClear();
    recordUsage.mockClear();
    checkRateLimit.mockClear();
    getCached.mockClear();
    
    isAIEnabled.mockReturnValue(true);
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 45, resetAt: '' });
    getCached.mockReturnValue(null);
    generateExplanation.mockResolvedValue('Giải thích mẫu');
    recordUsage.mockResolvedValue(undefined);
    mockDbExecute.mockReset();
    mockDbExecute.mockResolvedValue({ rows: [] });
  });

  test('returns explanation on success', async () => {
    const req = createMockReq('POST', { action: 'explain' }, {
      player_id: 1,
      question_text: '2 + 2 = ?',
      selected_answer: 'A. 3',
      correct_answer: 'B. 4',
      grade: 2,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._json).toEqual({ explanation: 'Giải thích mẫu' });
  });

  test('returns 400 when player_id is missing', async () => {
    const req = createMockReq('POST', { action: 'explain' }, {
      question_text: '2 + 2 = ?',
      correct_answer: 'B',
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._json.code).toBe('INVALID_INPUT');
  });

  test('returns 400 when question_text is missing', async () => {
    const req = createMockReq('POST', { action: 'explain' }, {
      player_id: 1,
      correct_answer: 'B',
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._json.code).toBe('INVALID_INPUT');
  });

  test('returns 429 when rate limited', async () => {
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: '' });
    const req = createMockReq('POST', { action: 'explain' }, {
      player_id: 1,
      question_text: '2 + 2 = ?',
      correct_answer: 'B',
      grade: 2,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(429);
    expect(res._json.code).toBe('RATE_LIMITED');
  });

  test('returns cached response when available', async () => {
    getCached.mockReturnValue('Cached explanation');
    const req = createMockReq('POST', { action: 'explain' }, {
      player_id: 1,
      question_text: '2 + 2 = ?',
      correct_answer: 'B',
      grade: 2,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res._json).toEqual({ explanation: 'Cached explanation' });
    expect(generateExplanation).not.toHaveBeenCalled();
  });

  test('returns 503 with fallback when AI is disabled', async () => {
    isAIEnabled.mockReturnValue(false);
    const req = createMockReq('POST', { action: 'explain' }, {
      player_id: 1,
      question_text: '2 + 2 = ?',
      correct_answer: 'B',
      grade: 2,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(503);
    expect(res._json.code).toBe('AI_UNAVAILABLE');
  });

  test('returns static explanation as fallback when AI is disabled and DB has explanation', async () => {
    isAIEnabled.mockReturnValue(false);
    mockDbExecute.mockReset();
    mockDbExecute.mockResolvedValue({ rows: [{ explanation: 'Static fallback' }] });
    const req = createMockReq('POST', { action: 'explain' }, {
      player_id: 1,
      question_text: '2 + 2 = ?',
      correct_answer: 'B',
      grade: 2,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._json).toEqual({ explanation: 'Static fallback' });
  });

  test('returns 405 for non-POST method', async () => {
    const req = createMockReq('GET', { action: 'explain' });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  test('logs usage after successful call', async () => {
    const req = createMockReq('POST', { action: 'explain' }, {
      player_id: 1,
      question_text: '2 + 2 = ?',
      correct_answer: 'B',
      grade: 2,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(recordUsage).toHaveBeenCalledWith(1, 'explain', 0);
  });
});

describe('api/ai.js - POST /api/ai/hint', () => {
  beforeEach(() => {
    isAIEnabled.mockReturnValue(true);
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 45, resetAt: '' });
    getCached.mockReturnValue(null);
    generateHint.mockResolvedValue('Gợi ý mẫu');
    recordUsage.mockResolvedValue(undefined);
  });

  test('returns hint on success', async () => {
    const req = createMockReq('POST', { action: 'hint' }, {
      player_id: 1,
      question_text: '5 + 3 = ?',
      grade: 2,
      hint_level: 1,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._json).toEqual({ hint: 'Gợi ý mẫu' });
  });

  test('returns 400 when hint_level is invalid', async () => {
    const req = createMockReq('POST', { action: 'hint' }, {
      player_id: 1,
      question_text: '5 + 3 = ?',
      grade: 2,
      hint_level: 3,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._json.error).toContain('hint_level');
  });

  test('accepts hint_level 2', async () => {
    const req = createMockReq('POST', { action: 'hint' }, {
      player_id: 1,
      question_text: '5 + 3 = ?',
      grade: 2,
      hint_level: 2,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });
});

describe('api/ai.js - POST /api/ai/chat', () => {
  beforeEach(() => {
    isAIEnabled.mockReturnValue(true);
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 45, resetAt: '' });
    chatWithTutor.mockResolvedValue('Trả lời mẫu');
    recordUsage.mockResolvedValue(undefined);
    mockDbExecute.mockReset();
    mockDbExecute.mockResolvedValue({ rows: [{ count: 5 }] });
  });

  test('returns reply and messages_remaining', async () => {
    const req = createMockReq('POST', { action: 'chat' }, {
      player_id: 1,
      messages: [{ role: 'user', content: 'Xin chào' }],
      grade: 3,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._json.reply).toBe('Trả lời mẫu');
    expect(res._json.messages_remaining).toBe(14); // 20 - 5 - 1
  });

  test('returns 400 when messages is empty array', async () => {
    const req = createMockReq('POST', { action: 'chat' }, {
      player_id: 1,
      messages: [],
      grade: 3,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._json.code).toBe('INVALID_INPUT');
  });

  test('returns 429 when chat daily limit reached', async () => {
    mockDbExecute.mockReset();
    mockDbExecute.mockResolvedValue({ rows: [{ count: 20 }] });
    const req = createMockReq('POST', { action: 'chat' }, {
      player_id: 1,
      messages: [{ role: 'user', content: 'Hi' }],
      grade: 3,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(429);
    expect(res._json.code).toBe('RATE_LIMITED');
  });
});

describe('api/ai.js - POST /api/ai/generate', () => {
  beforeEach(() => {
    isAIEnabled.mockReturnValue(true);
    recordUsage.mockResolvedValue(undefined);
    generateQuestions.mockResolvedValue([{
      question_text: 'Test?',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_answer: 'a',
      explanation: 'Because',
    }]);
  });

  test('returns 401 without admin auth', async () => {
    const req = createMockReq('POST', { action: 'generate' }, {
      subject: 'math',
      difficulty: 'easy',
      grade: 2,
      quantity: 5,
    });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res._json.code).toBe('UNAUTHORIZED');
  });

  test('returns questions with valid admin auth', async () => {
    const authHeader = 'Basic ' + Buffer.from('admin:admin').toString('base64');
    const req = createMockReq('POST', { action: 'generate' }, {
      subject: 'math',
      difficulty: 'easy',
      grade: 2,
      quantity: 5,
    }, { authorization: authHeader });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._json.questions).toHaveLength(1);
    expect(res._json.questions[0].correct_answer).toBe('a');
  });

  test('returns 400 when quantity is out of range', async () => {
    const authHeader = 'Basic ' + Buffer.from('admin:admin').toString('base64');
    const req = createMockReq('POST', { action: 'generate' }, {
      subject: 'math',
      difficulty: 'easy',
      grade: 2,
      quantity: 25,
    }, { authorization: authHeader });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._json.code).toBe('INVALID_INPUT');
  });

  test('returns 400 when required fields are missing', async () => {
    const authHeader = 'Basic ' + Buffer.from('admin:admin').toString('base64');
    const req = createMockReq('POST', { action: 'generate' }, {
      subject: 'math',
    }, { authorization: authHeader });
    const res = createMockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });
});

describe('api/ai.js - Error response format', () => {
  test('all errors have consistent format with error and code fields', async () => {
    const req = createMockReq('POST', { action: 'explain' }, {});
    const res = createMockRes();
    await handler(req, res);
    expect(res._json).toHaveProperty('error');
    expect(res._json).toHaveProperty('code');
    expect(typeof res._json.error).toBe('string');
    expect(typeof res._json.code).toBe('string');
  });
});
