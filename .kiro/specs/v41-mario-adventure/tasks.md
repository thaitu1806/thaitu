# V41 — Phiêu Lưu Cùng Mario (Tasks)

- [x] 1. Pure game logic
  - [x] 1.1 Create `public/v41/game-logic.js` exporting `TOTAL_STATIONS`, `STARTING_LIVES`, `TIMER_SECONDS`, `initState`, `applyCorrect`, `applyWrongOrTimeout`, `isFinished`, `computeStars`, `pickNextQuestion`.
  - [x] 1.2 Logic must be pure (no mutation, no DOM, no fetch). Return new state objects.

- [x] 2. Property tests for logic
  - [x] 2.1 Create `tests/v41-game-logic.property.test.js` covering P1-P7 from requirements (lives accounting, station advance, terminal states, coin bounds, star monotonicity, question reuse safety, session payload validity).
  - [x] 2.2 Create `tests/v41-game-logic.unit.test.js` covering boundary cases (livesLost=0, fast vs slow correct, accuracy edge thresholds).

- [ ] 3. UI scaffolding
  - [x] 3.1 Create `public/v41/index.html` with the four screens (start, game, gameover, victory). Include required global scripts and `<script src="../api-config.js"></script>`.
  - [x] 3.2 Create `public/v41/style.css` with Mario-themed palette, parallax background, and animation keyframes.

- [x] 4. Game controller (`public/v41/game.js`)
  - [x] 4.1 Load + persist `v41_mario` localStorage entry.
  - [x] 4.2 Implement start-screen rendering and selectors.
  - [x] 4.3 Implement question fetch with `/api/questions` (cache + fallback generator).
  - [x] 4.4 Wire UI to logic functions for each answer event (correct, wrong, timeout). Drive Mario jump animation on correct.
  - [x] 4.5 Implement victory + gameover screens, save session via `/api/sessions`.
  - [x] 4.6 Call `checkAndShowPrompt()` after run completes.

- [x] 5. Routing & discoverability
  - [x] 5.1 Add `app.use('/v41', express.static(...))` to `server.js`.
  - [x] 5.2 Add `/v41/` route entry to `vercel.json`.
  - [x] 5.3 Add a game card linking to `/v41/` in `public/home.html` (icon 🍄, label "Phiêu Lưu Mario").
  - [x] 5.4 Update the `vN` ranges in `tests/game-versions.test.js`, `tests/routing-consistency.test.js`, `tests/answer-comparison.test.js`, and `tests/script-includes.test.js` to include `41`.

- [x] 6. Mobile sync
  - [x] 6.1 Run `npm run inject:api` so `public/v41/index.html` gets the `api-config.js` include (if not already present).
  - [x] 6.2 Run `npm test` and ensure the full suite passes.
