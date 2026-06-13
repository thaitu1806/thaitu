# Implementation Plan: Hệ Thống Nhiệm Vụ Hằng Ngày, Kim Cương & Cửa Hàng

## Overview

Implement a gamification system for Hoc Vui with diamond rewards, daily quests, streaks, player levels, and a shop. All server-side logic in vanilla JS (ES Modules), SQLite/Turso backend, plain HTML/CSS/JS frontend. Tasks ordered by dependency: schema first, then core logic modules, then API endpoints, then frontend, then admin, then integration.

## Tasks

- [x] 1. Database schema extension and migrations
  - [x] 1.1 Add new columns to `players` table and create new tables
    - Add migration in `db/schema.sql` for: `daily_quests`, `shop_items`, `player_inventory`, `diamond_transactions`, `reward_vouchers` tables
    - Add ALTER TABLE statements in `db/database.js` `initDb()` for players columns: `total_diamonds`, `lifetime_diamonds`, `current_streak`, `longest_streak`, `last_active_date`, `equipped_avatar`, `equipped_frame`
    - Create all indexes as specified in design
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 1.2 Write property test for level assignment (Property 12)
    - **Property 12: Level assignment is deterministic from lifetime diamonds**
    - Test that for any non-negative integer `lifetime_diamonds`, `getPlayerLevel()` returns exactly one level where `level.min ≤ lifetime_diamonds ≤ level.max`, ranges are non-overlapping and cover all non-negative integers
    - **Validates: Requirements 4.1**

- [x] 2. Core logic modules (pure functions)
  - [x] 2.1 Create `lib/diamond-calc.js` with `calculateDiamonds(difficulty, comboStreak)` function
    - Implement base rewards: easy=1, medium=3, hard=5
    - Implement combo multiplier: streak ≥ 7 → ×3, streak ∈ [3,6] → ×2, else ×1
    - Export `PLAYER_LEVELS` and `STREAK_MILESTONES` constants
    - Export `getPlayerLevel(lifetimeDiamonds)` function
    - Export `checkStreakMilestone(newStreak)` function returning bonus or null
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 2.2 Write property tests for diamond calculation (Properties 1, 2, 3)
    - **Property 1: Diamond base reward matches difficulty mapping**
    - **Property 2: Combo multiplier correctly applied**
    - **Property 3: Wrong answers never deduct diamonds**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**

  - [x] 2.3 Create `lib/quest-generator.js` with deterministic quest generation
    - Implement `generateDailyQuests(playerId, dateStr)` that produces 3-5 quests using seeded pseudo-random selection
    - Define `QUEST_TEMPLATES` with types: `play_any`, `play_mode`, `combo_streak`, `accuracy`, `learn_lesson`
    - Ensure same player+date always produces same quests (deterministic seed)
    - Export `getVietnamDateStr()` helper returning current date in UTC+7 as 'YYYY-MM-DD'
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ]* 2.4 Write property tests for quest generation (Properties 5, 7)
    - **Property 5: Quest generation produces valid quests**
    - **Property 7: Quests are date-scoped**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.7**

  - [ ]* 2.5 Write property test for streak milestone (Property 10)
    - **Property 10: Streak milestone awards correct bonus**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Diamond reward API integration
  - [x] 4.1 Modify `api/answers.js` to award diamonds on correct answer
    - Import `calculateDiamonds` from `lib/diamond-calc.js`
    - Accept `difficulty` and `combo_streak` in request body
    - On correct answer: calculate diamonds, insert `diamond_transactions` record (type='earn', source='answer'), update `players.total_diamonds` and `players.lifetime_diamonds`
    - Check for level-up after updating lifetime_diamonds, award bonus if level changed
    - Return `{ ok: true, diamonds_earned, new_total }` in response
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 4.2_

  - [x] 4.2 Create `api/diamonds.js` endpoint for player diamond info
    - `GET /api/players/:id/diamonds` — return `{ total_diamonds, lifetime_diamonds, level, transactions: [...last 50] }`
    - _Requirements: 1.8, 7.3_

  - [ ]* 4.3 Write property tests for diamond balance invariant (Property 4)
    - **Property 4: Diamond balance invariant**
    - Test that `total_diamonds` equals sum of earn transactions minus sum of spend transactions
    - **Validates: Requirements 1.8**

  - [ ]* 4.4 Write property test for level-up bonus (Property 22)
    - **Property 22: Level-up awards bonus**
    - **Validates: Requirements 4.2**

- [x] 5. Daily quest system API
  - [x] 5.1 Create `api/quests.js` endpoint
    - `GET /api/players/:id/quests` — fetch today's quests (auto-generate via `generateDailyQuests` if none exist for today), return array with progress
    - `POST /api/players/:id/quests/check` — accept session data, update `current_value` for matching quests, mark `is_completed=1` when target reached, award quest diamonds, check all-quests-complete bonus (15 diamonds)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

  - [ ]* 5.2 Write property tests for quest completion (Properties 6, 8)
    - **Property 6: All-quests-complete bonus**
    - **Property 8: Completed session increments quest progress**
    - **Validates: Requirements 2.5, 2.8**

- [x] 6. Streak and level system API
  - [x] 6.1 Create `api/streak.js` endpoint
    - `GET /api/players/:id/streak` — return `{ current_streak, longest_streak, last_active_date, next_milestone }`
    - `POST /api/players/:id/streak/check` — called after quest completion; update `last_active_date`, increment/reset `current_streak`, check milestone bonuses, update `longest_streak`
    - Use Vietnam timezone (UTC+7) for date comparison
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 6.2 Write property tests for streak (Properties 9, 11)
    - **Property 9: Streak increments on consecutive active days**
    - **Property 11: Streak resets on missed day**
    - **Validates: Requirements 3.1, 3.6**

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Shop system API
  - [x] 8.1 Create `api/shop.js` endpoint
    - `GET /api/shop/items` — list active shop items, filter by category and player level, mark items as "new" if created within 7 days
    - `POST /api/shop/buy` — validate: player exists, item active, sufficient diamonds, level requirement met, weekly limit not exceeded; atomically: deduct diamonds, insert inventory record, insert spend transaction, create voucher record if category='voucher'
    - `GET /api/players/:id/inventory` — return player's purchased items with equipped status
    - `PUT /api/players/:id/equip` — equip avatar or frame (validate ownership, unequip previous)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.2, 7.4_

  - [ ]* 8.2 Write property tests for shop purchase (Properties 13, 14, 15, 16)
    - **Property 13: Purchase deducts diamonds and adds inventory**
    - **Property 14: Insufficient diamonds rejects purchase**
    - **Property 15: Voucher-category purchase creates pending voucher**
    - **Property 16: Level gates shop purchases**
    - **Validates: Requirements 5.2, 5.3, 5.4, 4.3, 5.6**

  - [ ]* 8.3 Write property tests for inventory (Properties 17, 21)
    - **Property 17: New item flag based on creation date**
    - **Property 21: Only owned items can be equipped**
    - **Validates: Requirements 5.7, 7.4**

- [x] 9. Admin shop management and voucher API
  - [x] 9.1 Create `api/admin/shop.js` endpoint
    - `GET /api/admin/shop/items` — list all items including inactive
    - `POST /api/admin/shop/items` — create new shop item (name, description, category, price, min_level, image_url, max_per_week)
    - `PUT /api/admin/shop/items/:id` — update item fields
    - `DELETE /api/admin/shop/items/:id` — delete item
    - `GET /api/admin/diamond-stats` — return total_earned, total_spent, top purchased items
    - _Requirements: 6.1, 6.2, 6.6_

  - [x] 9.2 Create `api/admin/vouchers.js` endpoint
    - `GET /api/admin/vouchers` — list pending vouchers with player name and item info
    - `PUT /api/admin/vouchers/:id` — approve or reject (validate status='pending' before transition, set resolved_at)
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ]* 9.3 Write property tests for admin operations (Properties 18, 19, 20)
    - **Property 18: Shop item CRUD round-trip**
    - **Property 19: Voucher status transitions are valid**
    - **Property 20: Diamond economy stats are accurate**
    - **Validates: Requirements 6.1, 6.2, 6.4, 6.5, 6.6**

- [x] 10. Wire API routes into server.js
  - [x] 10.1 Register all new API routes in `server.js`
    - Import and mount: diamonds, quests, streak, shop, admin/shop, admin/vouchers
    - Add admin auth middleware to admin shop/voucher routes
    - Update `POST /api/sessions` to call quest progress check and streak check after session save
    - _Requirements: 2.8, 3.1_

  - [x] 10.2 Create Vercel serverless handler files
    - Create `api/diamonds.js`, `api/quests.js`, `api/streak.js`, `api/shop.js` as Vercel-compatible handlers
    - Create `api/admin/shop.js` and `api/admin/vouchers.js` for Vercel
    - Update `vercel.json` with new route mappings
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Frontend - Shop page
  - [x] 12.1 Create `public/shop.html`, `public/shop.js`, `public/shop.css`
    - Display shop items organized by category tabs (Avatars, Khung, Stickers, Power-ups, Phần thưởng thực)
    - Show diamond balance at top
    - Each item card: image/emoji, name, price, level requirement badge, "MỚI" tag if applicable
    - Buy button disabled with "Chưa đủ 💎" if insufficient diamonds or level too low
    - Purchase confirmation modal
    - Vietnamese UI, mobile-first design for 7-8 year olds
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6, 5.7_

- [x] 13. Frontend - Profile page extension
  - [x] 13.1 Extend `public/profile.html` with reward system info
    - Add avatar + equipped frame display at top
    - Show player level badge + progress bar to next level
    - Show diamond balance and streak (🔥 X ngày)
    - Add "Kho Đồ" tab showing purchased items with equip buttons
    - Add "Lịch Sử Thưởng" tab showing diamond transaction history
    - Add quick link to Shop
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 4.4, 4.5, 3.7_

- [x] 14. Frontend - Quest widget and diamond animation
  - [x] 14.1 Create quest widget component for game pages
    - Floating/collapsible quest panel showing today's quests with progress bars
    - Quest completion notification with diamond animation
    - All-quests-complete celebration animation
    - _Requirements: 2.4, 2.6_

  - [x] 14.2 Create diamond animation overlay
    - "+X 💎" floating animation that plays when diamonds are earned (correct answer)
    - CSS keyframe animation, appended to game page DOM
    - Triggered by response from modified `/api/answers` endpoint
    - _Requirements: 1.7_

  - [x] 14.3 Integrate quest widget and diamond animation into game pages
    - Add quest widget + diamond animation to main game pages (v5-v12 and game.html)
    - Pass `difficulty` and `combo_streak` to `/api/answers` calls from game JS
    - Call quest check API when session ends
    - _Requirements: 1.7, 2.4, 2.6, 2.8_

- [x] 15. Frontend - Admin shop management UI
  - [x] 15.1 Add Shop Management tab to `public/admin.html`
    - CRUD interface for shop items (create, edit, toggle active, delete)
    - Form with fields: name, description, category dropdown, price, min_level dropdown, image_url/emoji, max_per_week
    - Voucher approval section: list pending vouchers, approve/reject buttons with optional admin_note
    - Diamond economy stats display (total earned, total spent, top items)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 16. Frontend - Home page streak badge
  - [x] 16.1 Add streak display and quick quest status to `public/home.html`
    - Show streak icon 🔥 with current streak count
    - Show mini quest progress indicator (e.g., "2/4 nhiệm vụ")
    - _Requirements: 3.7, 2.6_

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- All server-side logic uses the existing `db/database.js` abstraction (works with both better-sqlite3 and Turso)
- Frontend is plain HTML/CSS/JS, no build step, Vietnamese throughout
