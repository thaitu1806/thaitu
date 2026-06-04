# Implementation Plan: V6 Racing Game ("Đua Xe Trí Tuệ")

## Overview

Implement a 2-player local racing game at `public/v6/` where players answer quiz questions to advance cars along a visual CSS-based track. The implementation follows the established self-contained HTML/JS/CSS bundle pattern (like V2-V5) with pure game logic separated for testability.

## Tasks

- [x] 1. Create core game logic module (`public/v6/game-logic.js`)
  - [x] 1.1 Implement `calculateMovement` pure function
    - Accepts `roundResult` (p1Correct, p2Correct, p1Faster), `positions` (p1, p2), `obstacles` array, and `finishLine`
    - Returns `{ p1NewPos, p2NewPos, p1Events[], p2Events[] }`
    - Rules: correct = +2, correct+faster = +3, incorrect = +0, both incorrect = +1 each
    - Landing on obstacle = -1 (clamp to 0), reaching/exceeding finishLine = race ends
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.3, 6.1_

  - [x] 1.2 Implement `generateObstacles` function
    - Accepts `trackLength`, returns sorted array of obstacle tile indices
    - Count: `max(2, min(5, floor(trackLength * 0.2)))`
    - Eligible tiles: index 2 through trackLength-1 (exclude first 2 and finish)
    - Shuffle eligible tiles and pick the required count
    - _Requirements: 5.1, 5.4_

  - [x] 1.3 Implement `generateFallbackQuestions` function
    - Accepts `count`, returns array of question objects matching API shape
    - Generates simple addition/subtraction within 100
    - Each question has `question_text`, `option_a`, `option_b`, `option_c`, `option_d`, `correct_answer`, `subject`
    - _Requirements: 7.2_

  - [x] 1.4 Implement `shuffleArray` utility function
    - Fisher-Yates shuffle, returns new shuffled array (does not mutate input)
    - _Requirements: 7.4_

  - [x] 1.5 Implement `calculateStats` function
    - Accepts array of round results, returns per-player stats: `{ correct, totalTime, rounds }`
    - Average response time = totalTime / rounds
    - _Requirements: 6.4_

  - [x] 1.6 Implement `checkWinCondition` function
    - Accepts positions and finishLine, returns winner ('p1', 'p2', 'tie', or null)
    - If both reach finish same round, returns 'tie' (caller resolves by speed)
    - _Requirements: 6.1, 6.2_

  - [ ]* 1.7 Write property test: Movement calculation follows defined rules
    - **Property 1: Movement calculation follows defined rules**
    - Generate random (p1Correct, p2Correct, p1Time, p2Time) tuples, verify movement output matches rules
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

  - [ ]* 1.8 Write property test: Obstacle penalty with floor at zero
    - **Property 2: Obstacle penalty with floor at zero**
    - Generate random positions (0..trackLength) and obstacles, verify penalty clamps at 0
    - **Validates: Requirements 5.3**

  - [ ]* 1.9 Write property test: Obstacle generation produces valid placements
    - **Property 3: Obstacle generation produces valid placements**
    - Generate random track lengths from {10, 15, 20}, verify bounds and count
    - **Validates: Requirements 5.1, 5.4**

  - [ ]* 1.10 Write property test: Win detection triggers at finish line
    - **Property 4: Win detection triggers at finish line**
    - Generate positions near finish, verify race-end trigger
    - **Validates: Requirements 6.1**

  - [ ]* 1.11 Write property test: Tie-breaking by response speed
    - **Property 5: Tie-breaking by response speed**
    - Generate same-round finishes with different times, verify faster player wins
    - **Validates: Requirements 6.2**

  - [ ]* 1.12 Write property test: Fallback question generation produces valid math questions
    - **Property 6: Fallback question generation produces valid math questions**
    - Generate random count (1..50), verify all questions are valid and correct_answer matches actual result
    - **Validates: Requirements 7.2**

  - [ ]* 1.13 Write property test: Shuffle preserves all elements
    - **Property 7: Shuffle preserves all elements**
    - Generate random arrays, verify output is same length and contains same elements
    - **Validates: Requirements 7.4**

  - [ ]* 1.14 Write property test: Race statistics accurately reflect round history
    - **Property 8: Race statistics accurately reflect round history**
    - Generate random round histories, verify aggregation
    - **Validates: Requirements 6.4**

- [ ] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Create HTML structure (`public/v6/index.html`)
  - [x] 3.1 Create setup screen markup
    - Player 1 and Player 2 name inputs with defaults "Xe Đỏ" / "Xe Xanh"
    - Subject selector: Toán / Tiếng Việt / Trộn (radio or button group)
    - Difficulty selector: Dễ / Vừa / Khó
    - Track length selector: Ngắn (10) / Vừa (15) / Dài (20)
    - Start button ("Bắt đầu đua!")
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.2 Create race screen markup
    - Track container with two lanes (`.lane-p1`, `.lane-p2`)
    - Car elements (🚗, 🚙) positioned in lanes
    - Timer progress bar below track
    - Question text display area
    - Split answer zones: P1 (left/top) and P2 (right/bottom) each with A/B/C/D buttons
    - Round counter display
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.6_

  - [x] 3.3 Create result screen markup
    - Winner declaration area with trophy emoji 🏆
    - Stats table: total rounds, correct answers per player, avg response time
    - "Chơi lại" (Play Again) button
    - "Về trang chủ" (Home) button linking to `/`
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

- [x] 4. Create CSS styling (`public/v6/style.css`)
  - [x] 4.1 Implement track rendering styles
    - Flexbox lanes with positioned car elements
    - Tile styling (40px squares with borders)
    - Car positioning via `transform: translateX()` with 600ms cubic-bezier transition
    - Obstacle tiles with distinct visual indicator (🕳️ or 🍌 emoji)
    - Finish line tile with checkered pattern or 🏁 emoji
    - Track scrolling wrapper with overflow hidden
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 4.2 Implement responsive layout
    - Wide screens (>=500px): horizontal track, side-by-side answer zones
    - Narrow screens (<500px): vertical track, stacked answer zones
    - Setup screen usable at 320px minimum width
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 4.3 Implement animations
    - `@keyframes shake` for obstacle hit (400ms)
    - `@keyframes speedLines` for boost effect (500ms, pseudo-elements)
    - `@keyframes starBurst` for correct answer (400ms, scale + fade)
    - `@keyframes confetti` for win celebration (2500ms)
    - Timer bar width transition (linear 15s) with color coding (green/orange/red)
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 4.4 Implement screen transitions and general styling
    - Setup/Race/Result screens as hidden/visible sections
    - Player answer zone styling with distinct P1/P2 colors (red/blue)
    - Button states: default, selected, locked ("Đã trả lời")
    - Overall game container, fonts (Nunito consistent with app), colors
    - _Requirements: 3.2, 3.3, 8.4_

- [x] 5. Create game JavaScript (`public/v6/game.js`)
  - [x] 5.1 Implement state machine and screen transitions
    - Define states: SETUP, LOADING, RACING, ROUND_ACTIVE, ROUND_RESOLVING, ANIMATING, RACE_OVER, RESULT
    - `transition(newState)` function that shows/hides appropriate screens
    - Prevent invalid state transitions
    - _Requirements: 1.5, 3.4, 3.5, 6.1_

  - [x] 5.2 Implement question fetching and management
    - Fetch from `/api/questions?subject=X&difficulty=Y&limit=30`
    - On fetch failure, call `generateFallbackQuestions(30)` from game-logic.js
    - Track question index, fetch more when pool exhausted
    - Shuffle questions before use via `shuffleArray` from game-logic.js
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 5.3 Implement input handling
    - Bind A/B/C/D buttons for each player zone
    - On answer: lock that player's buttons, show "Đã trả lời" state, record timestamp
    - Support both touch and click events
    - Ignore input after timer expired or player already answered
    - Keyboard support: Player 1 keys (1/2/3/4), Player 2 keys (7/8/9/0)
    - _Requirements: 3.2, 3.3, 3.4_

  - [x] 5.4 Implement round timer
    - 15-second countdown with 100ms interval for smooth visual updates
    - Timer progress bar depletes from 100% to 0%
    - Color transitions: green (>50%), orange (20-50%), red (<20%)
    - On expiry: auto-resolve round treating unanswered as incorrect
    - _Requirements: 3.5, 3.6, 4.5_

  - [x] 5.5 Implement race flow (round lifecycle)
    - Display question and start timer → wait for both answers or timeout
    - Call `calculateMovement` from game-logic.js with round results
    - Animate car movements using Track Controller
    - Check `checkWinCondition` after animation completes
    - If win: transition to RACE_OVER → RESULT with `calculateStats`
    - If no win: proceed to next round
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.3, 6.1, 6.2_

  - [x] 5.6 Implement track controller (DOM manipulation)
    - `initTrack(trackLength, obstacles)`: create tile elements in both lanes
    - `moveCar(player, toTile)`: update car transform, scroll track to keep both visible
    - `showObstacleHit(player)`: add shake class, animate car back 1 tile
    - `showBoostEffect(player)`: add speed-lines class temporarily
    - `showCorrectEffect(player)`: add star-burst class temporarily
    - `showFinishAnimation(winner)`: trigger confetti celebration
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.2, 8.3, 8.5_

  - [x] 5.7 Implement audio engine
    - Create AudioContext lazily on first user interaction (Start button tap)
    - Oscillator-based sounds: correct (ascending), wrong (descending), boost (quick sweep), obstacle (thud), win (fanfare), start (beep)
    - All `playSound` calls wrapped in try/catch — audio failure never blocks gameplay
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 5.8 Implement setup screen logic
    - Auto-fill P1 name from `localStorage.getItem('hocvui_profile')`
    - If no profile exists, redirect to `/` for profile creation
    - Validate inputs on start: use defaults for empty names
    - Read selected subject, difficulty, track length and initialize race state
    - Call `generateObstacles` from game-logic.js
    - _Requirements: 1.1, 1.5, 1.6, 10.3_

  - [x] 5.9 Implement result screen logic
    - Display winner name with 🏆 and celebration animation
    - Populate stats table from `calculateStats`
    - "Chơi lại" button resets state to SETUP
    - "Về trang chủ" button navigates to `/`
    - _Requirements: 6.3, 6.4, 6.5, 6.6_

- [ ] 6. Checkpoint - Ensure game loads and plays through a full race
  - Ensure all tests pass, ask the user if questions arise.

- [-] 7. Integration with app
  - [x] 7.1 Add V6 navigation card to home page
    - Add a new `<a href="/v6/" class="mode-card">` entry in `public/home.html`
    - Icon: 🏎️, Title: "Đua Xe Trí Tuệ", Description: "Ai về đích trước thắng!"
    - Add 8th child border color in CSS (both mobile and desktop variants)
    - _Requirements: 10.2_

  - [x] 7.2 Add V6 static route to server.js
    - Add `app.use('/v6', express.static(join(__dirname, 'public/v6')));` following the V5 pattern
    - Add V6 console.log line in server startup message
    - _Requirements: 10.1_

  - [x] 7.3 Add V6 route to vercel.json
    - Add `{ "src": "/v6/(.*)", "dest": "/public/v6/$1" }` route entry before the catch-all routes
    - _Requirements: 10.1_

- [ ] 8. Final checkpoint - Ensure all tests pass and game is fully integrated
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- The game-logic.js module exports pure functions (no DOM) for testability, matching the V5 pattern
- Unit tests and property tests go in `tests/v6-game-logic.test.js`
- fast-check library is used for property-based tests (install as dev dependency)
