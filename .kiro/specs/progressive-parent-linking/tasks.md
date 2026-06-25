# Implementation Plan: Progressive Parent Linking

## Overview

Implement a progressive parent-linking system that allows children to play freely while gradually encouraging and eventually requiring parent account linking for premium features (Shop, AI Chat). Implementation follows dependency order: schema → lib → API → frontend → wiring → migration.

## Tasks

- [ ] 1. Database schema migration
  - [x] 1.1 Add `link_code`, `link_status`, `last_prompt_date` columns to players table in `db/schema.sql`
    - Add `link_code TEXT DEFAULT NULL` with UNIQUE index
    - Add `link_status TEXT DEFAULT 'unlinked' CHECK(link_status IN ('unlinked', 'prompted', 'linked'))`
    - Add `last_prompt_date TEXT DEFAULT NULL`
    - Create unique index `idx_players_link_code` on `players(link_code)`
    - _Requirements: 1.2, 2.1, 2.2, 3.3, 4.4_

- [ ] 2. Link code generation library
  - [x] 2.1 Create `lib/link-code.js` with link code generation logic
    - Implement `generateLinkCode()` using charset `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (30 chars, no I/O/0/1)
    - Implement `generateUniqueLinkCode(db)` with retry loop (max 10 attempts) and DB collision check
    - Implement `validateLinkCodeFormat(code)` — returns true for valid 6-char uppercase alphanumeric (matching charset)
    - Export all three functions as named exports
    - _Requirements: 2.1, 2.2, 9.2_

  - [x] 2.2 Write property test for link code generation (Property 1)
    - **Property 1: New player gets valid unique link code**
    - **Validates: Requirements 1.2, 2.1, 2.2**

  - [x] 2.3 Write property test for invalid code rejection (Property 3)
    - **Property 3: Invalid codes are rejected**
    - **Validates: Requirements 2.4, 9.2**

- [ ] 3. New API endpoint: `api/link.js`
  - [x] 3.1 Create `api/link.js` handler for GET and POST link-status
    - GET `/api/players/:id/link-status`: return `{ status, code, session_count, current_streak, last_prompt_date, parents[] }`
    - Query session_count from `game_sessions` table, current_streak from `players` table
    - Query linked parents from `parent_children` + `parents` tables when status is `linked`
    - POST `/api/players/:id/link-status`: accept `{ action: 'dismiss' }` to update `link_status` to `prompted` and `last_prompt_date` to today
    - _Requirements: 8.1, 3.3, 3.4, 7.2_

  - [x] 3.2 Write property test for link status response (Property 12)
    - **Property 12: Link status response includes parent info when linked**
    - **Validates: Requirements 7.2**

- [ ] 4. Modify `api/parent.js` — add link-by-code action with rate limiting
  - [x] 4.1 Add in-memory rate limiting logic to `api/parent.js`
    - Implement rate limit Map: key=IP, value={count, firstAttempt}
    - 5 attempts max per 10-minute window per IP
    - Return 429 `Thử lại sau 30 phút` when exceeded
    - _Requirements: 9.3_

  - [x] 4.2 Add `link-by-code` action handler in `api/parent.js`
    - POST `/api/parent?action=link-by-code` with body `{ parent_id, link_code }`
    - Validate parent_id exists (authentication check)
    - Validate link_code format using `validateLinkCodeFormat()`
    - Check rate limit before DB lookup
    - Lookup player by `link_code`
    - Check for existing parent_children link (return 409 if duplicate)
    - Use `db.batch()` to atomically: INSERT parent_children + UPDATE player link_status='linked'
    - Return `{ ok: true, player: { id, name } }` on success
    - _Requirements: 2.3, 2.4, 6.1, 9.1, 9.2, 9.3, 9.4_

  - [x] 4.3 Write property test for link code round-trip (Property 2)
    - **Property 2: Link code round-trip**
    - **Validates: Requirements 2.3, 6.1**

  - [x] 4.4 Write property test for rate limiting (Property 9)
    - **Property 9: Rate limiting blocks after threshold**
    - **Validates: Requirements 9.3**

  - [x] 4.5 Write property test for authentication requirement (Property 13)
    - **Property 13: Authentication required for linking**
    - **Validates: Requirements 9.1**

  - [x] 4.6 Write property test for many-to-many linking (Property 8)
    - **Property 8: Many-to-many linking**
    - **Validates: Requirements 6.3, 6.4**

- [ ] 5. Checkpoint - Backend core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Modify `api/players.js` — generate link_code on player creation
  - [x] 6.1 Update POST handler in `api/players.js` to generate link_code for new players
    - Import `generateUniqueLinkCode` from `lib/link-code.js`
    - On new player creation: generate unique code, include in INSERT statement
    - Set `link_status = 'unlinked'` (default from schema is sufficient)
    - Return `link_code` and `link_status` in response
    - Also update the inline player creation in `server.js` POST `/api/players` route
    - _Requirements: 1.2, 2.1_

- [ ] 7. Premium gate enforcement in backend APIs
  - [x] 7.1 Add link_status check to `api/shop.js` — block purchases for unlinked players
    - In `handleBuyItem()`: query player's `link_status` before processing purchase
    - Return 403 with `{ error: 'Cần liên kết phụ huynh để sử dụng tính năng này', require_link: true }` if not `linked`
    - _Requirements: 5.1, 5.5_

  - [x] 7.2 Add link_status check to `api/ai.js` — block chat/explain/hint for unlinked players
    - In `handleChat()`, `handleExplain()`, `handleHint()`: check player's `link_status`
    - Return 403 with `{ error: 'Cần liên kết phụ huynh để sử dụng tính năng này', require_link: true }` if not `linked`
    - Admin generate endpoint should NOT be gated
    - _Requirements: 5.2, 5.5_

  - [x] 7.3 Write property test for premium gate enforcement (Property 6)
    - **Property 6: Premium gate enforcement**
    - **Validates: Requirements 5.1, 5.2, 5.5**

  - [x] 7.4 Write property test for linking unlocks premium (Property 7)
    - **Property 7: Linking unlocks premium access**
    - **Validates: Requirements 5.4**

  - [x] 7.5 Write property test for basic gameplay unaffected (Property 11)
    - **Property 11: Basic gameplay unaffected by link status**
    - **Validates: Requirements 1.3, 4.3**

- [ ] 8. Frontend: Link gate shared component
  - [x] 8.1 Create `public/link-gate.js` shared component
    - Export `showLinkGate(linkCode, playerId)` function
    - Render full-screen overlay with: player's link code (large, copyable), QR code image (URL: `/parent.html?code={CODE}`), Vietnamese instructions
    - Use a simple QR code library via CDN or generate QR as SVG inline
    - Implement 5-second polling of `/api/players/:id/link-status`
    - Auto-dismiss gate and call `onUnlocked()` callback when status becomes `linked`
    - Export `hideLinkGate()` for programmatic dismissal
    - _Requirements: 5.3, 5.4, 8.2, 8.3_

- [ ] 9. Frontend: Prompt system in game pages
  - [x] 9.1 Add prompt logic to game pages (post-session check)
    - Create `checkAndShowPrompt(playerId)` function (can be in link-gate.js or a separate inline script)
    - After game session ends: call GET `/api/players/:id/link-status`
    - If `unlinked` + session_count >= 1 + last_prompt_date ≠ today → show soft prompt "Muốn ba mẹ xem thành tích không? 🌟"
    - If `prompted` + session_count >= 5 or streak >= 3 + last_prompt_date ≠ today → show milestone prompt
    - Soft prompt has "Liên kết ngay" (shows link code) and "Để sau" (calls POST dismiss)
    - Integrate into main game.js and versioned game pages (v2-v12) after session completion
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4_

  - [x] 9.2 Write property test for prompt trigger conditions (Property 4)
    - **Property 4: Prompt trigger conditions**
    - **Validates: Requirements 3.1, 3.3, 4.1, 4.2**

  - [x] 9.3 Write property test for once-per-day prompt constraint (Property 5)
    - **Property 5: Once-per-day prompt constraint**
    - **Validates: Requirements 3.5, 4.4**

- [ ] 10. Frontend: Profile link section
  - [x] 10.1 Add link status section to `public/profile.html`
    - Show link code with copy button when `unlinked` or `prompted`
    - Show "Đưa mã này cho ba mẹ để liên kết nhé!" instruction
    - When `linked`: show "✅ Đã liên kết ba mẹ" with parent display_name(s)
    - Fetch link status from GET `/api/players/:id/link-status`
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 11. Frontend: Parent.html link-by-code form + QR auto-fill
  - [x] 11.1 Add link-by-code form to `public/parent.html`
    - Add "Liên kết bằng mã" section with 6-character code input field
    - On page load: read `?code=` from URL params and auto-fill input (for QR scan flow)
    - On submit: call POST `/api/parent?action=link-by-code` with `{ parent_id, link_code }`
    - Show success message with child's name on successful link
    - Show Vietnamese error messages on failure
    - Keep existing link-by-name flow intact (backward compatible)
    - _Requirements: 6.1, 6.2, 6.5, 10.4_

- [ ] 12. Checkpoint - Frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Server.js route wiring + vercel.json updates
  - [x] 13.1 Add link-status routes to `server.js`
    - Import `linkHandler` from `./api/link.js`
    - Add `app.get('/api/players/:id/link-status', ...)` route
    - Add `app.post('/api/players/:id/link-status', ...)` route
    - Wire query params: `req.query.id = req.params.id`
    - _Requirements: 8.1_

  - [x] 13.2 Add link-status route to `vercel.json`
    - Add route: `{ "src": "/api/players/(?<id>[^/]+)/link-status", "dest": "/api/link.js?id=$id" }`
    - Place before the generic `/api/players/(?<id>\\d+)` catch-all route
    - _Requirements: 8.1_

- [ ] 14. Migration script for existing players
  - [x] 14.1 Create `db/migrate-link-codes.js` migration script
    - Import `generateUniqueLinkCode` from `lib/link-code.js`
    - Run ALTER TABLE statements to add columns (if not exist)
    - Generate unique `link_code` for all existing players where `link_code IS NULL`
    - Set `link_status = 'linked'` for players with existing `parent_children` records
    - Set `link_status = 'unlinked'` for players without `parent_children` records (default)
    - Log progress (number of players migrated)
    - Make script idempotent (safe to re-run)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 14.2 Write property test for migration correctness (Property 10)
    - **Property 10: Migration assigns correct statuses and codes**
    - **Validates: Requirements 10.1, 10.2, 10.3**

- [ ] 15. Final checkpoint - Full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific scenarios and edge cases using vitest
- The link-gate.js component is shared across Shop, AI, and profile pages
- Rate limiting is in-memory (resets on server restart / cold start) — acceptable trade-off for serverless
- QR code can use a lightweight CDN library (e.g., qrcode-generator) or inline SVG generation
