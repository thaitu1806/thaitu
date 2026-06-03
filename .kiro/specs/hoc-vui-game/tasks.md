# Implementation Plan: Học Vui Game - Bug Fixes, Polish & Future Enhancements

## Overview

This plan covers three areas: (1) verifying existing functionality works correctly, (2) fixing known issues with admin API auth on Vercel, V4 polling reliability, and V3 duel layout, and (3) implementing the four future enhancement requirements (Vietnamese lessons, rewards system, adaptive difficulty, offline support). The core 16 requirements are already implemented — tasks here focus on hardening and extending.

## Tasks

- [ ] 1. Bug Fix: Admin API authentication on Vercel
  - [ ] 1.1 Fix admin API auth header handling in `api/admin/index.js` for Vercel serverless
    - Ensure the `checkAuth` function properly reads Authorization headers in Vercel's request format
    - Verify `req.headers.authorization` is correctly parsed in the serverless context
    - Remove the `req._adminAuthed` skip-auth pattern and unify auth logic for both local and Vercel
    - Test that unauthenticated requests to `/api/admin` return 401 on Vercel
    - _Requirements: 8.1_

  - [ ] 1.2 Add CORS and preflight handling for admin API on Vercel
    - Handle OPTIONS preflight requests that browsers send with Authorization headers
    - Ensure `vercel.json` routes admin requests correctly to `api/admin/index.js`
    - _Requirements: 8.1, 16.1, 16.2_

- [ ] 2. Bug Fix: V4 Online Mode polling reliability
  - [ ] 2.1 Fix polling synchronization issues in `public/v4/game.js`
    - Ensure poll responses are processed in order (ignore stale responses)
    - Add `lastUpdate` timestamp comparison to prevent processing outdated state
    - Handle race conditions when both players answer simultaneously
    - _Requirements: 5.3, 5.6_

  - [ ] 2.2 Improve room state management in `api/room.js`
    - Add room expiry/cleanup for abandoned rooms (prevent memory leaks in `globalThis.__rooms`)
    - Handle edge case where host starts game before guest poll confirms join
    - Add proper error responses when room code is invalid or expired
    - _Requirements: 5.1, 5.7_

  - [ ] 2.3 Add reconnection and disconnect handling for V4
    - Implement poll timeout detection (if no poll received for 10+ seconds, mark player disconnected)
    - Show disconnect notification to the other player per Requirement 5.7
    - Allow reconnection to existing room within a grace period
    - _Requirements: 5.7_

- [ ] 3. Bug Fix: V3 Duel Mode layout issues
  - [ ] 3.1 Fix split-screen layout rendering in `public/v3/style.css` and `public/v3/game.js`
    - Ensure Player 1 zone (top half, rotated 180°) renders correctly on all mobile screen sizes
    - Fix answer button tap targets overlapping between P1 and P2 zones
    - Ensure the middle question area divider properly separates the two halves
    - Test layout with safe-area-inset for notched devices
    - _Requirements: 4.1, 14.3, 14.4_

  - [ ] 3.2 Fix answer zone interaction for rotated P1 area
    - Ensure touch events register correctly in the 180° rotated zone
    - Verify score/combo display updates independently for each player
    - _Requirements: 4.2, 4.6_

- [ ] 4. Checkpoint - Verify bug fixes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Polish: Verify existing core features work correctly
  - [ ] 5.1 Verify Classic Mode (V1) end-to-end flow
    - Test subject/difficulty selection → question fetch → answer → score → game over
    - Verify timer countdown behavior for all 3 speeds (slow/normal/fast)
    - Verify combo system increments correctly on consecutive correct answers
    - Verify answer logging saves to database via POST `/api/answers`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ] 5.2 Verify Learn Module interactivity
    - Test all 6 topic areas load correctly with multi-slide navigation
    - Verify SVG clock drag interaction works on mobile touch events
    - Verify "Kiểm tra" feedback displays correctly
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 5.3 Verify Exam Mode flow
    - Test exam list → start exam → answer questions → grading → result display
    - Verify grade calculation matches spec (A+ ≥95%, A ≥85%, B ≥70%, C ≥55%, D ≥40%, F <40%)
    - Verify exam history retrieval works
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 5.4 Verify Admin Panel functionality
    - Test question generator preview and save flow
    - Test manual question entry form
    - Test question list filtering and pagination
    - Test exam creation with auto-question selection
    - Test player analytics display
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 6. Checkpoint - Verify all existing features
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Future Enhancement: Vietnamese Lessons (Requirement 17)
  - [ ] 7.1 Add Vietnamese topic data and lesson content to `public/learn.js`
    - Add 4 Vietnamese topics: vocabulary (Từ Vựng), sentence structure (Câu), reading comprehension (Đọc Hiểu), spelling (Chính Tả)
    - Create multi-slide lesson content arrays with age-appropriate visuals for grade 2
    - Add topic cards to `public/learn.html` for the new Vietnamese topics
    - _Requirements: 17.1, 17.2_

  - [ ] 7.2 Implement interactive Vietnamese exercises
    - Build drag-and-drop word ordering exercise (reorder words to form correct sentence)
    - Build fill-in-the-blank exercise (select correct word from options)
    - Add touch-friendly interactions with minimum 44x44px tap targets
    - _Requirements: 17.3, 14.4_

  - [ ] 7.3 Add practice quiz for Vietnamese lessons
    - Generate practice questions from lesson content after lesson completion
    - Reuse existing question display/answer UI pattern from Classic Mode
    - Track correct/incorrect answers in the interactive activities
    - _Requirements: 17.4, 6.8_

  - [ ]* 7.4 Write unit tests for Vietnamese lesson interactions
    - Test drag-and-drop word ordering logic validates correct sentence order
    - Test fill-in-the-blank answer checking
    - Test practice quiz generation from topic content
    - _Requirements: 17.2, 17.3, 17.4_

- [ ] 8. Future Enhancement: Progress Rewards and Motivation (Requirement 18)
  - [ ] 8.1 Implement star award system across all game modes
    - Ensure all game sessions award 1-3 stars based on accuracy thresholds
    - Update `POST /api/sessions` to validate star calculation (≥90% = 3 stars, ≥70% = 2 stars, else 1 star)
    - Display star awards prominently on game-over screens
    - _Requirements: 18.1_

  - [ ] 8.2 Implement coin economy and daily streak tracking
    - Add `coins` and `streak_days` columns to players table (or use localStorage for MVP)
    - Award coins based on game performance (base coins + bonus for stars/combos)
    - Track consecutive practice days and display streak counter on home page
    - _Requirements: 18.2, 18.3_

  - [ ] 8.3 Connect daily quest rewards in Adventure Mode
    - Ensure daily quest completion in V2 awards bonus coins and stars
    - Persist coin balance in localStorage alongside V2 adventure progress
    - _Requirements: 18.4_

  - [ ] 8.4 Build progress dashboard component
    - Create a progress overview section (accessible from home page)
    - Show player advancement: stars earned, coins balance, streak days, levels per subject
    - Show subject breakdown with accuracy percentages
    - _Requirements: 18.5_

  - [ ]* 8.5 Write unit tests for rewards calculations
    - Test star calculation from accuracy
    - Test coin award formula
    - Test streak tracking logic (increment on new day, reset on missed day)
    - _Requirements: 18.1, 18.2, 18.3_

- [ ] 9. Future Enhancement: Adaptive Difficulty (Requirement 19)
  - [ ] 9.1 Implement difficulty recommendation engine
    - Analyze recent answer_logs (last 20 answers per subject/difficulty) to calculate accuracy
    - When accuracy > 90%: recommend or auto-increase difficulty
    - When accuracy < 50%: recommend or auto-decrease difficulty
    - Add a new API endpoint `GET /api/players/:id/difficulty-recommendation` returning suggestions
    - _Requirements: 19.1, 19.2_

  - [ ] 9.2 Implement weak-area question prioritization
    - Modify `GET /api/questions` to accept optional `player_id` parameter
    - When player_id is provided, weight question selection toward categories with low accuracy from answer_logs
    - Ensure at least 30% of questions come from weak areas, rest random from requested difficulty
    - _Requirements: 19.3_

  - [ ] 9.3 Add adaptive difficulty UI prompts in game modes
    - Show difficulty suggestion banner before game starts in Classic Mode if recommendation exists
    - Allow player to accept or dismiss the suggestion
    - _Requirements: 19.1, 19.2_

  - [ ] 9.4 Display adaptive difficulty insights in Admin Panel
    - Add "Difficulty Recommendations" section to player detail view in admin
    - Show current accuracy per subject/difficulty and what the system recommends
    - _Requirements: 19.4_

  - [ ]* 9.5 Write unit tests for adaptive difficulty logic
    - Test that >90% accuracy triggers difficulty increase recommendation
    - Test that <50% accuracy triggers difficulty decrease recommendation
    - Test weak-area question weighting algorithm
    - _Requirements: 19.1, 19.2, 19.3_

- [ ] 10. Checkpoint - Verify future enhancements (Req 17-19)
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Future Enhancement: Offline Support (Requirement 20)
  - [ ] 11.1 Create Service Worker for asset caching
    - Create `public/sw.js` with cache-first strategy for static assets (HTML, CSS, JS, fonts)
    - Register service worker from each HTML page
    - Define cache version and asset list covering all game mode files
    - _Requirements: 20.1_

  - [ ] 11.2 Implement offline question pre-download
    - On first load or when online, fetch and cache a batch of questions (50 per subject/difficulty) to IndexedDB
    - Provide a fallback question source in game.js that reads from IndexedDB when fetch fails
    - _Requirements: 20.2_

  - [ ] 11.3 Enable offline play for Classic Mode and Learn Module
    - Detect offline state via `navigator.onLine` and `online`/`offline` events
    - When offline, use cached questions from IndexedDB for Classic Mode gameplay
    - Ensure Learn Module lessons render from cached assets without network
    - Show subtle offline indicator badge so player knows they're offline
    - _Requirements: 20.3_

  - [ ] 11.4 Implement offline answer log sync
    - Store answer logs and session data in IndexedDB when offline
    - When connectivity restores, batch-sync offline data to server via POST `/api/answers` and POST `/api/sessions`
    - Clear synced records from IndexedDB after successful upload
    - Handle conflict resolution (server timestamp vs offline timestamp)
    - _Requirements: 20.4_

  - [ ]* 11.5 Write unit tests for offline sync logic
    - Test that answers are queued in IndexedDB when offline
    - Test that sync fires on `online` event
    - Test that synced records are cleared after successful upload
    - _Requirements: 20.4_

- [ ] 12. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The core 16 requirements (1-16) are already implemented — tasks 1-6 focus on verification and bug fixes
- Tasks 7-11 implement the 4 future enhancement requirements (17-20)
- Checkpoints ensure incremental validation between bug fixes, verification, and new features
- All new code should follow existing patterns: vanilla JS, no frameworks, mobile-first, Nunito font
