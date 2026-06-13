# Implementation Plan: Hỗ Trợ Đa Khối Lớp & Tích Hợp AI

## Overview

Implement multi-grade support (grades 2-5) and AI integration (OpenAI/Deepseek) for the Hoc Vui educational game. The implementation follows dependency order: schema → core lib modules → API endpoints → frontend → admin panel → wiring.

## Tasks

- [x] 1. Database schema migration and seed updates
  - [x] 1.1 Add grade and source columns via migration in `db/database.js`
    - Add `ALTER TABLE players ADD COLUMN grade INTEGER DEFAULT 2`
    - Add `ALTER TABLE questions ADD COLUMN grade INTEGER DEFAULT 2`
    - Add `ALTER TABLE questions ADD COLUMN source TEXT DEFAULT 'manual'`
    - Create `ai_usage_logs` table in `db/schema.sql`
    - Add index `idx_questions_grade ON questions(subject, difficulty, grade)`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 1.2 Update seed scripts to support grade field
    - Update `db/seed.js` and `db/seed-turso.js` to include `grade: 2` for existing questions
    - Organize new seed structure to support grade-specific files
    - _Requirements: 2.3, 2.7_

- [x] 2. Core lib modules
  - [x] 2.1 Implement `lib/ai-service.js` — AI Service Module
    - Create provider config resolution (`getProviderConfig()` using env vars)
    - Implement `isAIEnabled()` checking for valid API key
    - Implement `callAI(messages, options)` using native `fetch`
    - Implement system prompts (explain, hint, chat, generate) in Vietnamese
    - Implement `generateExplanation(question, selectedAnswer, correctAnswer, grade)`
    - Implement `generateHint(question, grade, level)`
    - Implement `generateQuestions(subject, difficulty, grade, quantity)` with JSON parsing and retry (max 2 retries)
    - Implement `chatWithTutor(messages, lessonContext, grade)`
    - _Requirements: 3.1, 3.2, 3.4, 3.7, 3.8, 4.1, 4.2, 4.3, 4.4, 5.2, 5.3, 5.4, 6.2, 6.3, 6.7, 7.3, 7.4, 7.9, 10.1_

  - [ ]* 2.2 Write property tests for AI service config and provider routing
    - **Property 3: AI enabled only with valid API key**
    - **Property 4: Provider routing by configuration**
    - **Validates: Requirements 3.3, 3.4, 10.1, 10.2**

  - [ ]* 2.3 Write property test for AI-generated question schema validation
    - **Property 8: AI-generated questions conform to schema**
    - **Property 9: Retry on malformed AI response**
    - **Validates: Requirements 4.2, 4.4**

  - [x] 2.4 Implement `lib/ai-cache.js` — Response Cache
    - Create in-memory Map with TTL (1 hour default)
    - Implement `getCached(promptHash)` returning cached response or null
    - Implement `setCache(promptHash, response, ttlMs)` storing with expiry
    - Implement `clearExpired()` to remove stale entries
    - Implement prompt hash generation (simple string hash of prompt content)
    - _Requirements: 3.6, 9.6_

  - [ ]* 2.5 Write property test for cache behavior
    - **Property 6: Cache hit avoids API call**
    - **Validates: Requirements 3.6, 9.6**

  - [x] 2.6 Implement `lib/ai-rate-limiter.js` — Rate Limiter
    - Implement `checkRateLimit(playerId)` → `{ allowed, remaining, resetAt }`
    - Implement `recordUsage(playerId, feature, tokensUsed)` logging to `ai_usage_logs`
    - Use DB query (COUNT on ai_usage_logs WHERE date = today) for production-compatible limiting
    - Support configurable daily limit via `AI_DAILY_LIMIT` env var (default 50)
    - _Requirements: 3.5, 9.1, 9.4, 9.5_

  - [ ]* 2.7 Write property test for rate limiting enforcement
    - **Property 5: Rate limiting enforcement**
    - **Validates: Requirements 3.5, 9.1, 9.4, 9.5**

- [x] 3. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. API endpoints
  - [x] 4.1 Create `api/ai.js` — unified AI endpoint handler
    - Handle `GET /api/ai/status` → return `{ enabled, provider, model }`
    - Handle `POST /api/ai/explain` → call rate limiter, cache, AI service, log usage
    - Handle `POST /api/ai/hint` → validate hint_level (1 or 2), call AI, log usage
    - Handle `POST /api/ai/chat` → validate messages, enforce 20 msg/day limit, call AI
    - Handle `POST /api/ai/generate` → Admin only, call AI, parse JSON array, validate schema
    - Return consistent error format: `{ error, code, fallback }`
    - _Requirements: 3.1, 3.5, 3.6, 3.7, 4.1, 5.1, 5.2, 5.5, 6.1, 6.2, 6.4, 7.2, 7.6, 7.7, 9.1, 9.2, 10.3_

  - [ ]* 4.2 Write property tests for API behavior
    - **Property 7: No sensitive data in API responses**
    - **Property 11: Fallback to static explanation when AI unavailable**
    - **Property 12: Hint does not reveal answer**
    - **Property 15: Chat message daily limit**
    - **Property 17: AI usage logging**
    - **Validates: Requirements 3.7, 5.5, 6.2, 7.6, 9.2**

  - [x] 4.3 Update `api/questions.js` to filter by grade
    - Accept optional `grade` query param
    - If no grade param, use player's stored grade (requires player_id or fallback to grade 2)
    - Update SQL to `WHERE subject = ? AND difficulty = ? AND grade = ?`
    - _Requirements: 2.2, 2.4, 2.5_

  - [ ]* 4.4 Write property test for question filtering
    - **Property 2: Question filtering by grade**
    - **Validates: Requirements 2.2, 2.5**

  - [x] 4.5 Update `api/players.js` to support grade field
    - Include `grade` in player creation (default 2)
    - Add grade update endpoint (PUT with grade field)
    - _Requirements: 1.2, 1.3, 1.4_

  - [ ]* 4.6 Write property test for grade persistence
    - **Property 1: Grade persistence round-trip**
    - **Validates: Requirements 1.2, 1.3**

- [x] 5. Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Frontend integration
  - [x] 6.1 Add Grade Selector UI to profile flow
    - Add grade selector buttons (Lớp 2-5) to player creation flow in `public/game.js` or profile gate
    - Style with child-friendly icons and colors
    - Send grade with player creation POST
    - Add grade change option to profile page (`public/profile.html`)
    - _Requirements: 1.1, 1.3, 1.5, 1.6_

  - [x] 6.2 Add AI status check and conditional UI rendering
    - Create shared `checkAIStatus()` function that calls `GET /api/ai/status`
    - Show/hide all `.ai-feature` elements based on AI enabled state
    - Apply pattern to all game pages that use AI features
    - _Requirements: 10.2, 10.5, 6.6, 7.8_

  - [x] 6.3 Add "💡 Tại sao?" button (Answer Explainer) to game pages
    - Show button next to correct answer after player answers wrong
    - Call `POST /api/ai/explain` on click
    - Display explanation in a popup/tooltip with animation
    - Fallback: show static explanation from question data if AI unavailable
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 6.4 Add "💡 Gợi ý" button (Hint Provider) to game pages
    - Show hint button on each question (hidden if AI disabled)
    - Track hint usage per question (max 2: level 1 first, then level 2)
    - Call `POST /api/ai/hint` with appropriate level
    - Apply 50% diamond penalty when hint used
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 6.5 Write property tests for hint and diamond penalty
    - **Property 13: Maximum 2 hints per question per player**
    - **Property 14: Diamond penalty when hint used**
    - **Validates: Requirements 6.4, 6.5**

  - [x] 6.6 Add Tutor Chatbot to Learn page (`public/learn.html`)
    - Add floating "🤖 Hỏi Thầy AI" button (hidden if AI disabled)
    - Create chat panel UI: message list + text input
    - Manage session chat history in memory (lost on refresh)
    - Call `POST /api/ai/chat` with messages array and lesson context
    - Enforce 20 messages/day client-side display + server-side enforcement
    - Show "Hết lượt hỏi hôm nay rồi!" when limit reached
    - Content filter via system prompt (no non-educational answers)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [ ]* 6.7 Write property test for chat history
    - **Property 16: Chat history accumulates within session**
    - **Validates: Requirements 7.5**

- [x] 7. Admin panel updates
  - [x] 7.1 Add grade filter to admin question management
    - Add grade dropdown to question list filters in `public/admin.js`
    - Include grade field in question create/edit forms
    - Update `api/admin/index.js` to filter questions by grade
    - _Requirements: 2.6, 4.5_

  - [x] 7.2 Add "🤖 Tạo câu hỏi bằng AI" button to admin panel
    - Add form: select grade, subject, difficulty, quantity (1-20)
    - Call `POST /api/ai/generate` on submit
    - Display generated questions for preview/edit before saving
    - Save approved questions with `source = 'ai'` and selected grade
    - _Requirements: 4.5, 4.6, 4.7_

  - [ ]* 7.3 Write property test for AI-generated question persistence
    - **Property 10: AI-generated questions saved with source='ai'**
    - **Validates: Requirements 4.6**

  - [x] 7.4 Add AI usage statistics to admin dashboard
    - Display total AI requests/day, total tokens, estimated cost
    - Show AI status (enabled/disabled, provider name)
    - _Requirements: 9.3, 10.4_

- [x] 8. Integration and wiring
  - [x] 8.1 Update `server.js` with new AI routes
    - Import and wire `api/ai.js` handler
    - Add routes: GET `/api/ai/status`, POST `/api/ai/explain`, POST `/api/ai/hint`, POST `/api/ai/chat`, POST `/api/ai/generate` (admin auth)
    - _Requirements: 3.1, 4.1, 5.1, 6.1, 7.1_

  - [x] 8.2 Update `vercel.json` with AI route mappings
    - Add route `"/api/ai/status"` → `"/api/ai.js"`
    - Add route `"/api/ai/explain"` → `"/api/ai.js?action=explain"`
    - Add route `"/api/ai/hint"` → `"/api/ai.js?action=hint"`
    - Add route `"/api/ai/chat"` → `"/api/ai.js?action=chat"`
    - Add route `"/api/ai/generate"` → `"/api/ai.js?action=generate"`
    - _Requirements: 3.1_

  - [x] 8.3 Update `.env.example` with all new AI environment variables
    - Add `AI_PROVIDER`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `AI_DAILY_LIMIT`, `AI_MODEL`
    - Include descriptions in comments
    - _Requirements: 10.6_

- [x] 9. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from the design document
- AI features are additive — all existing game modes continue working without AI configured
- The implementation uses native `fetch` for AI API calls (no SDK dependency)
