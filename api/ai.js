/**
 * api/ai.js — Unified AI endpoint handler
 * Handles all AI-related routes via action query param (Vercel) or URL path (Express).
 *
 * Routes:
 *   GET  /api/ai/status   → AI status info
 *   POST /api/ai/explain  → Answer explanation
 *   POST /api/ai/hint     → Hint for a question
 *   POST /api/ai/chat     → Chat with tutor
 *   POST /api/ai/generate → Generate questions (admin only)
 */

import { getDb } from './db.js';
import {
  isAIEnabled,
  getProviderConfig,
  generateExplanation,
  generateHint,
  generateQuestions,
  chatWithTutor,
} from '../lib/ai-service.js';
import { checkRateLimit, recordUsage } from '../lib/ai-rate-limiter.js';
import { hashPrompt, getCached, setCache } from '../lib/ai-cache.js';

// Chat-specific daily limit (separate from general AI limit)
const CHAT_DAILY_LIMIT = 20;

/**
 * Determine the action from the request (supports both Vercel query param and Express URL path).
 */
function getAction(req) {
  // Vercel style: ?action=explain
  if (req.query && req.query.action) {
    return req.query.action;
  }
  // Express style: /api/ai/explain → extract last segment
  if (req.url) {
    const path = req.url.split('?')[0];
    const segments = path.split('/').filter(Boolean);
    // e.g. ['api', 'ai', 'explain'] → 'explain'
    if (segments.length >= 3) {
      return segments[segments.length - 1];
    }
  }
  return 'status';
}

/**
 * Return consistent error response.
 */
function errorResponse(res, status, message, code, fallback = undefined) {
  const body = { error: message, code };
  if (fallback !== undefined) {
    body.fallback = fallback;
  }
  return res.status(status).json(body);
}

/**
 * Check admin auth (Basic Auth: admin/admin in dev).
 */
function isAdmin(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) return false;
  try {
    const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    return user === 'admin' && pass === 'admin';
  } catch {
    return false;
  }
}

// --- Action Handlers ---

async function handleStatus(req, res) {
  const config = getProviderConfig();
  return res.json({
    enabled: isAIEnabled(),
    provider: config.apiKey ? (process.env.AI_PROVIDER || 'openai') : null,
    model: config.model,
  });
}

async function handleExplain(req, res) {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed', 'INVALID_INPUT');
  }

  const { player_id, question_text, options, selected_answer, correct_answer, grade } = req.body || {};

  if (!player_id) {
    return errorResponse(res, 400, 'Thiếu player_id', 'INVALID_INPUT');
  }
  if (!question_text || !correct_answer) {
    return errorResponse(res, 400, 'Thiếu thông tin câu hỏi', 'INVALID_INPUT');
  }

  if (!isAIEnabled()) {
    // Fallback: try to find static explanation from DB
    const fallback = await getStaticExplanation(question_text);
    if (fallback) {
      return res.json({ explanation: fallback });
    }
    return errorResponse(res, 503, 'AI không khả dụng', 'AI_UNAVAILABLE', 'Tính năng AI chưa được kích hoạt.');
  }

  // Rate limit check
  const rateCheck = await checkRateLimit(player_id);
  if (!rateCheck.allowed) {
    const fallback = await getStaticExplanation(question_text);
    return errorResponse(res, 429, 'Hết lượt hôm nay rồi! Mai dùng tiếp nhé 🌟', 'RATE_LIMITED', fallback || undefined);
  }

  // Cache check
  const promptContent = `explain:${question_text}:${selected_answer}:${correct_answer}:${grade || 2}`;
  const promptHash = hashPrompt(promptContent);
  const cached = getCached(promptHash);
  if (cached) {
    // Still log usage for cached responses (counts toward daily limit)
    await recordUsage(player_id, 'explain', 0);
    return res.json({ explanation: cached });
  }

  // Call AI
  try {
    const explanation = await generateExplanation(
      question_text,
      selected_answer || '',
      correct_answer,
      grade || 2
    );
    setCache(promptHash, explanation);
    await recordUsage(player_id, 'explain', 0);
    return res.json({ explanation });
  } catch (err) {
    // Fallback on AI error
    const fallback = await getStaticExplanation(question_text);
    if (fallback) {
      return res.json({ explanation: fallback });
    }
    return errorResponse(res, 500, 'Không thể tạo giải thích', 'SERVER_ERROR', 'Có lỗi xảy ra, thử lại sau nhé!');
  }
}

async function handleHint(req, res) {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed', 'INVALID_INPUT');
  }

  const { player_id, question_text, options, grade, hint_level } = req.body || {};

  if (!player_id) {
    return errorResponse(res, 400, 'Thiếu player_id', 'INVALID_INPUT');
  }
  if (!question_text) {
    return errorResponse(res, 400, 'Thiếu thông tin câu hỏi', 'INVALID_INPUT');
  }
  if (hint_level !== 1 && hint_level !== 2) {
    return errorResponse(res, 400, 'hint_level phải là 1 hoặc 2', 'INVALID_INPUT');
  }

  if (!isAIEnabled()) {
    return errorResponse(res, 503, 'AI không khả dụng', 'AI_UNAVAILABLE');
  }

  // Rate limit check
  const rateCheck = await checkRateLimit(player_id);
  if (!rateCheck.allowed) {
    return errorResponse(res, 429, 'Hết lượt hôm nay rồi! Mai dùng tiếp nhé 🌟', 'RATE_LIMITED');
  }

  // Cache check
  const promptContent = `hint:${question_text}:${grade || 2}:${hint_level}`;
  const promptHash = hashPrompt(promptContent);
  const cached = getCached(promptHash);
  if (cached) {
    await recordUsage(player_id, 'hint', 0);
    return res.json({ hint: cached });
  }

  // Call AI
  try {
    const hint = await generateHint(question_text, grade || 2, hint_level);
    setCache(promptHash, hint);
    await recordUsage(player_id, 'hint', 0);
    return res.json({ hint });
  } catch (err) {
    return errorResponse(res, 500, 'Không thể tạo gợi ý', 'SERVER_ERROR');
  }
}

async function handleChat(req, res) {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed', 'INVALID_INPUT');
  }

  const { player_id, messages, lesson_context, grade } = req.body || {};

  if (!player_id) {
    return errorResponse(res, 400, 'Thiếu player_id', 'INVALID_INPUT');
  }
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return errorResponse(res, 400, 'Thiếu messages hoặc messages không hợp lệ', 'INVALID_INPUT');
  }

  if (!isAIEnabled()) {
    return errorResponse(res, 503, 'AI không khả dụng', 'AI_UNAVAILABLE');
  }

  // Chat-specific daily limit (20 messages/day)
  const db = getDb();
  const chatCountResult = await db.execute({
    sql: `SELECT COUNT(*) as count FROM ai_usage_logs WHERE player_id = ? AND feature = 'chat' AND date(created_at) = date('now')`,
    args: [player_id],
  });
  const chatUsedToday = chatCountResult.rows[0]?.count ?? 0;

  if (chatUsedToday >= CHAT_DAILY_LIMIT) {
    return errorResponse(
      res,
      429,
      'Hết lượt hỏi hôm nay rồi! Mai hỏi tiếp nhé 🌟',
      'RATE_LIMITED'
    );
  }

  // Also check general rate limit
  const rateCheck = await checkRateLimit(player_id);
  if (!rateCheck.allowed) {
    return errorResponse(res, 429, 'Hết lượt hôm nay rồi! Mai dùng tiếp nhé 🌟', 'RATE_LIMITED');
  }

  // Call AI
  try {
    const reply = await chatWithTutor(messages, lesson_context || null, grade || 2);
    await recordUsage(player_id, 'chat', 0);

    const messagesRemaining = CHAT_DAILY_LIMIT - chatUsedToday - 1;
    return res.json({ reply, messages_remaining: Math.max(0, messagesRemaining) });
  } catch (err) {
    return errorResponse(res, 500, 'Không thể trả lời', 'SERVER_ERROR');
  }
}

async function handleGenerate(req, res) {
  if (req.method !== 'POST') {
    return errorResponse(res, 405, 'Method not allowed', 'INVALID_INPUT');
  }

  // Admin only
  if (!isAdmin(req)) {
    return errorResponse(res, 401, 'Chỉ Admin mới được sử dụng tính năng này', 'UNAUTHORIZED');
  }

  const { subject, difficulty, grade, quantity } = req.body || {};

  if (!subject || !difficulty || !grade || !quantity) {
    return errorResponse(res, 400, 'Thiếu thông tin: subject, difficulty, grade, quantity', 'INVALID_INPUT');
  }

  if (quantity < 1 || quantity > 20) {
    return errorResponse(res, 400, 'quantity phải từ 1 đến 20', 'INVALID_INPUT');
  }

  if (!isAIEnabled()) {
    return errorResponse(res, 503, 'AI không khả dụng', 'AI_UNAVAILABLE');
  }

  // Call AI to generate questions
  try {
    const questions = await generateQuestions(subject, difficulty, grade, quantity);

    // Validate schema of each question
    const requiredFields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
    const validAnswers = ['a', 'b', 'c', 'd'];

    for (const q of questions) {
      for (const field of requiredFields) {
        if (!q[field] && q[field] !== '') {
          return errorResponse(res, 500, `Câu hỏi AI thiếu trường: ${field}`, 'SERVER_ERROR');
        }
      }
      if (!validAnswers.includes(q.correct_answer)) {
        return errorResponse(res, 500, `correct_answer không hợp lệ: ${q.correct_answer}`, 'SERVER_ERROR');
      }
    }

    await recordUsage(0, 'generate', 0); // admin usage, player_id 0

    return res.json({ questions });
  } catch (err) {
    return errorResponse(res, 500, 'Không thể tạo câu hỏi', 'SERVER_ERROR');
  }
}

// --- Helper ---

/**
 * Try to find a static explanation from the DB for a given question text.
 * Used as fallback when AI is unavailable.
 */
async function getStaticExplanation(questionText) {
  try {
    const db = getDb();
    const result = await db.execute({
      sql: `SELECT explanation FROM questions WHERE question_text = ? AND explanation IS NOT NULL LIMIT 1`,
      args: [questionText],
    });
    if (result.rows.length > 0 && result.rows[0].explanation) {
      return result.rows[0].explanation;
    }
  } catch {
    // Ignore DB errors for fallback
  }
  return null;
}

// --- Main Handler ---

export default async function handler(req, res) {
  const action = getAction(req);

  try {
    switch (action) {
      case 'status':
        return await handleStatus(req, res);
      case 'explain':
        return await handleExplain(req, res);
      case 'hint':
        return await handleHint(req, res);
      case 'chat':
        return await handleChat(req, res);
      case 'generate':
        return await handleGenerate(req, res);
      default:
        return errorResponse(res, 404, `Action không hợp lệ: ${action}`, 'INVALID_INPUT');
    }
  } catch (err) {
    console.error('AI endpoint error:', err);
    return errorResponse(res, 500, 'Lỗi hệ thống', 'SERVER_ERROR');
  }
}
