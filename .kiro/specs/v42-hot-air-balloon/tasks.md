# V42 — Khinh Khí Cầu Bay Cao (Tasks)

- [x] 1. Pure game logic
  - [x] 1.1 Create `public/v42/game-logic.js` exporting `MAX_ALTITUDE`, `MAX_QUESTIONS`, `TIMER_SECONDS`, `BASE_GAIN`, `PENALTY`, `BADGES`, `initState`, `applyCorrect`, `applyWrongOrTimeout`, `isFinished`, `computeBonus`, `newBadgesEarned`, `pickNextQuestion`. All pure.

- [ ] 2. Tests
  - [x] 2.1 Create `tests/v42-game-logic.unit.test.js` covering bonus tiers, clamping, badge thresholds, question budget exhaustion.
  - [x] 2.2 Create `tests/v42-game-logic.property.test.js` covering P1-P8.

- [ ] 3. UI scaffolding
  - [x] 3.1 Create `public/v42/index.html` (start, game, victory, try-again screens) with required global scripts + `../api-config.js`.
  - [x] 3.2 Create `public/v42/style.css` (sky palette, balloon position transition, floating clouds).

- [x] 4. Game controller
  - [x] 4.1 `public/v42/game.js` — persist v42_balloon, render start screen.
  - [x] 4.2 Question fetch + cache with fallback.
  - [x] 4.3 Wire UI to logic (correct, wrong, timeout) including balloon altitude animation and badge popup.
  - [x] 4.4 End-of-run screens + saveSession to `/api/sessions`, call `checkAndShowPrompt`.

- [x] 5. Routing & discoverability
  - [x] 5.1 Add `app.use('/v42', ...)` to `server.js`.
  - [x] 5.2 Add `/v42/` route to `vercel.json`.
  - [x] 5.3 Add 🎈 card to `home.html`.
  - [x] 5.4 Extend version ranges in structural test files to include `42`.

- [x] 6. Final verification
  - [x] 6.1 Run `npm run inject:api`.
  - [x] 6.2 Run targeted vitest suite (V42 + structural tests) and ensure all pass.
