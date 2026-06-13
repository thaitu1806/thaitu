/**
 * Unit tests for lib/ai-service.js
 * Tests config resolution, system prompts, isAIEnabled, callAI, and response parsing.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AI_CONFIG,
  SYSTEM_PROMPTS,
  getProviderConfig,
  isAIEnabled,
  generateExplanation,
  generateHint,
  generateQuestions,
  chatWithTutor,
  callAI,
} from '../lib/ai-service.js';

// --- Provider Config Tests ---

describe('getProviderConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns OpenAI config by default', () => {
    AI_CONFIG.provider = 'openai';
    AI_CONFIG.model = null;
    process.env.OPENAI_API_KEY = 'sk-test-key';

    const config = getProviderConfig();
    expect(config.baseUrl).toBe('https://api.openai.com/v1');
    expect(config.model).toBe('gpt-4o-mini');
    expect(config.apiKey).toBe('sk-test-key');
  });

  test('returns Deepseek config when provider is deepseek', () => {
    AI_CONFIG.provider = 'deepseek';
    AI_CONFIG.model = null;
    process.env.DEEPSEEK_API_KEY = 'ds-test-key';

    const config = getProviderConfig();
    expect(config.baseUrl).toBe('https://api.deepseek.com/v1');
    expect(config.model).toBe('deepseek-chat');
    expect(config.apiKey).toBe('ds-test-key');
  });

  test('uses custom model when AI_MODEL is set', () => {
    AI_CONFIG.provider = 'openai';
    AI_CONFIG.model = 'gpt-4';
    process.env.OPENAI_API_KEY = 'sk-test';

    const config = getProviderConfig();
    expect(config.model).toBe('gpt-4');
  });
});

// --- isAIEnabled Tests ---

describe('isAIEnabled', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    AI_CONFIG.provider = 'openai';
    AI_CONFIG.model = null;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('returns true when API key is set', () => {
    process.env.OPENAI_API_KEY = 'sk-valid-key';
    expect(isAIEnabled()).toBe(true);
  });

  test('returns false when no API key', () => {
    delete process.env.OPENAI_API_KEY;
    expect(isAIEnabled()).toBe(false);
  });

  test('returns false when API key is empty string', () => {
    process.env.OPENAI_API_KEY = '';
    expect(isAIEnabled()).toBe(false);
  });

  test('returns false when API key is only whitespace', () => {
    process.env.OPENAI_API_KEY = '   ';
    expect(isAIEnabled()).toBe(false);
  });

  test('returns true for deepseek with valid key', () => {
    AI_CONFIG.provider = 'deepseek';
    process.env.DEEPSEEK_API_KEY = 'ds-valid-key';
    expect(isAIEnabled()).toBe(true);
  });
});

// --- System Prompts Tests ---

describe('SYSTEM_PROMPTS', () => {
  test('explain prompt includes grade and age', () => {
    const prompt = SYSTEM_PROMPTS.explain(3);
    expect(prompt).toContain('lớp 3');
    expect(prompt).toContain('8 tuổi'); // grade + 5
    expect(prompt).toContain('tối đa 3 câu');
  });

  test('hint prompt level 1 does not reveal answer', () => {
    const prompt = SYSTEM_PROMPTS.hint(2, 1);
    expect(prompt).toContain('lớp 2');
    expect(prompt).toContain('KHÔNG tiết lộ đáp án');
    expect(prompt).toContain('1 câu ngắn');
  });

  test('hint prompt level 2 gives more specific hint', () => {
    const prompt = SYSTEM_PROMPTS.hint(4, 2);
    expect(prompt).toContain('lớp 4');
    expect(prompt).toContain('KHÔNG nói thẳng đáp án');
    expect(prompt).toContain('cụ thể hơn');
  });

  test('chat prompt includes context when provided', () => {
    const prompt = SYSTEM_PROMPTS.chat(3, 'Bài học phép nhân');
    expect(prompt).toContain('lớp 3');
    expect(prompt).toContain('Bài học phép nhân');
    expect(prompt).toContain('Hỏi bài thôi nhé! 📚');
  });

  test('chat prompt without context', () => {
    const prompt = SYSTEM_PROMPTS.chat(2, null);
    expect(prompt).toContain('lớp 2');
    expect(prompt).not.toContain('Ngữ cảnh bài học hiện tại');
  });

  test('generate prompt for math', () => {
    const prompt = SYSTEM_PROMPTS.generate('math', 'easy', 3);
    expect(prompt).toContain('Toán');
    expect(prompt).toContain('lớp 3');
    expect(prompt).toContain('easy');
    expect(prompt).toContain('JSON array');
  });

  test('generate prompt for vietnamese', () => {
    const prompt = SYSTEM_PROMPTS.generate('vietnamese', 'medium', 4);
    expect(prompt).toContain('Tiếng Việt');
  });

  test('generate prompt for english', () => {
    const prompt = SYSTEM_PROMPTS.generate('english', 'hard', 5);
    expect(prompt).toContain('Tiếng Anh');
  });
});

// --- callAI Tests ---

describe('callAI', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    AI_CONFIG.provider = 'openai';
    AI_CONFIG.model = null;
    process.env.OPENAI_API_KEY = 'sk-test-key';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  test('throws AI_UNAVAILABLE when no API key', async () => {
    delete process.env.OPENAI_API_KEY;
    await expect(callAI([{ role: 'user', content: 'test' }]))
      .rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });

  test('makes correct fetch call with proper headers', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello' } }],
        usage: { total_tokens: 10 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const messages = [{ role: 'user', content: 'Hi' }];
    const result = await callAI(messages, { max_tokens: 100 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-test-key',
        },
      })
    );

    expect(result.content).toBe('Hello');
    expect(result.tokens_used).toBe(10);
  });

  test('throws AI_API_ERROR on non-ok response', async () => {
    const mockResponse = {
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await expect(callAI([{ role: 'user', content: 'test' }]))
      .rejects.toMatchObject({ code: 'AI_API_ERROR', status: 429 });
  });

  test('throws AI_EMPTY_RESPONSE when no content', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ choices: [] }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await expect(callAI([{ role: 'user', content: 'test' }]))
      .rejects.toMatchObject({ code: 'AI_EMPTY_RESPONSE' });
  });
});

// --- generateExplanation Tests ---

describe('generateExplanation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    AI_CONFIG.provider = 'openai';
    AI_CONFIG.model = null;
    process.env.OPENAI_API_KEY = 'sk-test-key';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  test('calls AI with correct system prompt and user message', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Vì 2 + 3 = 5, đáp án B là đúng.' } }],
        usage: { total_tokens: 20 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const result = await generateExplanation('2 + 3 = ?', 'A. 4', 'B. 5', 2);
    expect(result).toBe('Vì 2 + 3 = 5, đáp án B là đúng.');

    const fetchCall = globalThis.fetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('lớp 2');
    expect(body.messages[1].content).toContain('2 + 3 = ?');
  });
});

// --- generateHint Tests ---

describe('generateHint', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    AI_CONFIG.provider = 'openai';
    AI_CONFIG.model = null;
    process.env.OPENAI_API_KEY = 'sk-test-key';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  test('generates hint with correct level', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hãy nghĩ về phép cộng có nhớ nhé!' } }],
        usage: { total_tokens: 15 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const result = await generateHint('45 + 27 = ?', 3, 1);
    expect(result).toBe('Hãy nghĩ về phép cộng có nhớ nhé!');
  });
});

// --- generateQuestions Tests ---

describe('generateQuestions', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    AI_CONFIG.provider = 'openai';
    AI_CONFIG.model = null;
    process.env.OPENAI_API_KEY = 'sk-test-key';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  test('parses valid JSON response', async () => {
    const validQuestions = JSON.stringify([{
      question_text: '2 + 2 = ?',
      option_a: '3',
      option_b: '4',
      option_c: '5',
      option_d: '6',
      correct_answer: 'b',
      explanation: 'Vì 2 + 2 = 4'
    }]);

    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: validQuestions } }],
        usage: { total_tokens: 50 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const result = await generateQuestions('math', 'easy', 2, 1);
    expect(result).toHaveLength(1);
    expect(result[0].question_text).toBe('2 + 2 = ?');
    expect(result[0].correct_answer).toBe('b');
  });

  test('handles JSON wrapped in markdown code block', async () => {
    const wrappedJson = '```json\n[{"question_text":"Test?","option_a":"A","option_b":"B","option_c":"C","option_d":"D","correct_answer":"a","explanation":"Because"}]\n```';

    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: wrappedJson } }],
        usage: { total_tokens: 30 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const result = await generateQuestions('math', 'easy', 2, 1);
    expect(result).toHaveLength(1);
    expect(result[0].question_text).toBe('Test?');
  });

  test('retries on malformed JSON (max 2 retries)', async () => {
    const malformedResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Not valid JSON at all' } }],
        usage: { total_tokens: 10 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(malformedResponse);

    await expect(generateQuestions('math', 'easy', 2, 1))
      .rejects.toMatchObject({ code: 'PARSE_ERROR' });

    // Should have been called 3 times total (1 initial + 2 retries)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  test('does not retry on non-parse errors', async () => {
    const errorResponse = {
      ok: false,
      status: 500,
      text: async () => 'Server error',
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(errorResponse);

    await expect(generateQuestions('math', 'easy', 2, 1))
      .rejects.toMatchObject({ code: 'AI_API_ERROR' });

    // Should only call once (no retry for API errors)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  test('rejects questions with invalid correct_answer', async () => {
    const invalidAnswer = JSON.stringify([{
      question_text: 'Test?',
      option_a: 'A',
      option_b: 'B',
      option_c: 'C',
      option_d: 'D',
      correct_answer: 'e', // invalid
      explanation: 'Because'
    }]);

    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: invalidAnswer } }],
        usage: { total_tokens: 20 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    await expect(generateQuestions('math', 'easy', 2, 1))
      .rejects.toMatchObject({ code: 'PARSE_ERROR' });
  });
});

// --- chatWithTutor Tests ---

describe('chatWithTutor', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    AI_CONFIG.provider = 'openai';
    AI_CONFIG.model = null;
    process.env.OPENAI_API_KEY = 'sk-test-key';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  test('sends system prompt with lesson context and message history', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Phép nhân là phép cộng nhiều lần nhé!' } }],
        usage: { total_tokens: 25 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const messages = [
      { role: 'user', content: 'Phép nhân là gì thầy?' }
    ];
    const result = await chatWithTutor(messages, 'Bài: Phép nhân', 3);
    expect(result).toBe('Phép nhân là phép cộng nhiều lần nhé!');

    const fetchCall = globalThis.fetch.mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);
    // System message + user messages
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0].role).toBe('system');
    expect(body.messages[0].content).toContain('Bài: Phép nhân');
    expect(body.messages[1].role).toBe('user');
  });

  test('works without lesson context', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hỏi bài thôi nhé! 📚' } }],
        usage: { total_tokens: 15 },
      }),
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

    const messages = [{ role: 'user', content: 'Hello' }];
    const result = await chatWithTutor(messages, null, 2);
    expect(result).toBe('Hỏi bài thôi nhé! 📚');
  });
});
