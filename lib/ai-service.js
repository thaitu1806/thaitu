/**
 * AI Service Module
 * Manages all interactions with AI providers (OpenAI / Deepseek).
 * Uses native fetch — no SDK dependency.
 */

// --- Configuration ---

export const AI_CONFIG = {
  provider: process.env.AI_PROVIDER || 'openai',
  model: process.env.AI_MODEL || null,
  dailyLimit: parseInt(process.env.AI_DAILY_LIMIT || '50'),
};

// --- System Prompts (Vietnamese, child-friendly) ---

export const SYSTEM_PROMPTS = {
  explain: (grade) => `Bạn là giáo viên tiểu học Việt Nam dạy lớp ${grade}. 
Giải thích ngắn gọn (tối đa 3 câu) tại sao đáp án đúng, dùng ngôn ngữ dễ hiểu cho trẻ ${grade + 5} tuổi.
Dùng ví dụ cụ thể nếu có thể.`,

  hint: (grade, level) => `Bạn là giáo viên tiểu học Việt Nam dạy lớp ${grade}.
${level === 1
    ? 'Cho gợi ý hướng suy nghĩ (1 câu ngắn). KHÔNG tiết lộ đáp án.'
    : 'Cho gợi ý cụ thể hơn (1-2 câu) giúp học sinh tìm ra đáp án. KHÔNG nói thẳng đáp án.'}`,

  chat: (grade, context) => `Bạn là gia sư AI cho học sinh lớp ${grade} Việt Nam.
Trả lời ngắn gọn (tối đa 4-5 câu), dễ hiểu.
CHỈ trả lời câu hỏi liên quan đến học tập.
Nếu câu hỏi không liên quan học tập, nhắc nhở: "Hỏi bài thôi nhé! 📚"
${context ? `Ngữ cảnh bài học hiện tại: ${context}` : ''}`,

  generate: (subject, difficulty, grade) => `Tạo câu hỏi trắc nghiệm ${subject === 'math' ? 'Toán' : subject === 'vietnamese' ? 'Tiếng Việt' : 'Tiếng Anh'} lớp ${grade}, độ khó ${difficulty}.
Theo chương trình giáo dục Việt Nam.
Trả về JSON array với format:
[{"question_text":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","correct_answer":"a|b|c|d","explanation":"..."}]`
};

// --- Provider Config Resolution ---

/**
 * Resolve provider configuration based on env vars.
 * @returns {{ baseUrl: string, model: string, apiKey: string|undefined }}
 */
export function getProviderConfig() {
  if (AI_CONFIG.provider === 'deepseek') {
    return {
      baseUrl: 'https://api.deepseek.com/v1',
      model: AI_CONFIG.model || 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY,
    };
  }
  return {
    baseUrl: 'https://api.openai.com/v1',
    model: AI_CONFIG.model || 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY,
  };
}

// --- Public API ---

/**
 * Check if AI is enabled (valid API key configured).
 * @returns {boolean}
 */
export function isAIEnabled() {
  const config = getProviderConfig();
  return !!(config.apiKey && config.apiKey.trim().length > 0);
}

/**
 * Generate an explanation for why an answer is correct.
 * @param {string} question - The question text
 * @param {string} selectedAnswer - The answer the player selected
 * @param {string} correctAnswer - The correct answer
 * @param {number} grade - Player's grade (2-5)
 * @returns {Promise<string>} The explanation text
 */
export async function generateExplanation(question, selectedAnswer, correctAnswer, grade) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.explain(grade) },
    {
      role: 'user',
      content: `Câu hỏi: ${question}\nHọc sinh chọn: ${selectedAnswer}\nĐáp án đúng: ${correctAnswer}\nGiải thích tại sao đáp án đúng là "${correctAnswer}".`
    }
  ];

  const result = await callAI(messages, { max_tokens: 200 });
  return result.content;
}

/**
 * Generate a hint for a question.
 * @param {string} question - The question text
 * @param {number} grade - Player's grade (2-5)
 * @param {number} level - Hint level (1 = directional, 2 = more specific)
 * @returns {Promise<string>} The hint text
 */
export async function generateHint(question, grade, level) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.hint(grade, level) },
    {
      role: 'user',
      content: `Câu hỏi: ${question}\nCho gợi ý mức ${level}.`
    }
  ];

  const result = await callAI(messages, { max_tokens: 150 });
  return result.content;
}

/**
 * Generate multiple-choice questions using AI.
 * Retries up to 2 times on malformed JSON response.
 * @param {string} subject - 'math' | 'vietnamese' | 'english'
 * @param {string} difficulty - 'easy' | 'medium' | 'hard'
 * @param {number} grade - Grade level (2-5)
 * @param {number} quantity - Number of questions to generate (1-20)
 * @returns {Promise<Array>} Array of question objects
 */
export async function generateQuestions(subject, difficulty, grade, quantity) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPTS.generate(subject, difficulty, grade) },
    {
      role: 'user',
      content: `Tạo ${quantity} câu hỏi.`
    }
  ];

  const maxRetries = 2;
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await callAI(messages, { max_tokens: 2000 });
      const questions = parseQuestionsResponse(result.content);
      return questions;
    } catch (err) {
      lastError = err;
      // Only retry on parse errors, not on network/API errors
      if (err.code === 'PARSE_ERROR' && attempt < maxRetries) {
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Chat with the AI tutor.
 * @param {Array<{role: string, content: string}>} messages - Chat history
 * @param {string|null} lessonContext - Current lesson context
 * @param {number} grade - Player's grade (2-5)
 * @returns {Promise<string>} The tutor's reply
 */
export async function chatWithTutor(messages, lessonContext, grade) {
  const systemMessage = { role: 'system', content: SYSTEM_PROMPTS.chat(grade, lessonContext) };
  const allMessages = [systemMessage, ...messages];

  const result = await callAI(allMessages, { max_tokens: 300 });
  return result.content;
}

// --- Internal Helpers ---

/**
 * Make a call to the AI provider using native fetch.
 * @param {Array<{role: string, content: string}>} messages - Messages to send
 * @param {object} options - Additional options (max_tokens, temperature)
 * @returns {Promise<{content: string, tokens_used: number}>}
 */
export async function callAI(messages, options = {}) {
  const config = getProviderConfig();

  if (!config.apiKey || config.apiKey.trim().length === 0) {
    throw Object.assign(new Error('AI service is not configured. Missing API key.'), { code: 'AI_UNAVAILABLE' });
  }

  const body = {
    model: config.model,
    messages,
    max_tokens: options.max_tokens || 500,
    temperature: options.temperature ?? 0.7,
  };

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw Object.assign(
      new Error(`AI API error: ${response.status} - ${errorText}`),
      { code: 'AI_API_ERROR', status: response.status }
    );
  }

  const data = await response.json();
  const choice = data.choices && data.choices[0];

  if (!choice || !choice.message || !choice.message.content) {
    throw Object.assign(new Error('AI returned empty response'), { code: 'AI_EMPTY_RESPONSE' });
  }

  return {
    content: choice.message.content.trim(),
    tokens_used: data.usage ? data.usage.total_tokens : 0,
  };
}

/**
 * Parse AI response as JSON array of questions and validate schema.
 * @param {string} responseText - Raw text from AI
 * @returns {Array} Validated array of question objects
 * @throws {Error} With code 'PARSE_ERROR' if parsing or validation fails
 */
function parseQuestionsResponse(responseText) {
  // Try to extract JSON from the response (AI might wrap in markdown code blocks)
  let jsonStr = responseText.trim();

  // Remove markdown code block wrappers if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw Object.assign(
      new Error(`Failed to parse AI response as JSON: ${e.message}`),
      { code: 'PARSE_ERROR' }
    );
  }

  if (!Array.isArray(parsed)) {
    throw Object.assign(
      new Error('AI response is not a JSON array'),
      { code: 'PARSE_ERROR' }
    );
  }

  // Validate each question object
  const requiredFields = ['question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
  const validAnswers = ['a', 'b', 'c', 'd'];

  for (let i = 0; i < parsed.length; i++) {
    const q = parsed[i];
    for (const field of requiredFields) {
      if (!q[field] && q[field] !== '') {
        throw Object.assign(
          new Error(`Question ${i} missing required field: ${field}`),
          { code: 'PARSE_ERROR' }
        );
      }
    }
    if (!validAnswers.includes(q.correct_answer)) {
      throw Object.assign(
        new Error(`Question ${i} has invalid correct_answer: ${q.correct_answer}`),
        { code: 'PARSE_ERROR' }
      );
    }
  }

  return parsed;
}
