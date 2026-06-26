# V41 — Phiêu Lưu Cùng Mario (Requirements)

## Overview

V41 is a Mario-themed quiz adventure mode under `public/v41/`. The player guides a Mario-like character through side-scrolling levels. Progress depends on answering quiz questions correctly — wrong answers cost a life, correct answers advance Mario past obstacles. The mode mirrors the architecture of the existing V40 module (self-contained HTML + JS + CSS bundle, no build step, fetches questions from `/api/questions`, saves sessions to `/api/sessions`).

## User Stories

### US1 — Play through a Mario world
As a grade 2-5 student, I want to play through a Mario-themed level by answering questions, so that learning feels like a real adventure game.

**Acceptance Criteria:**
- WHEN the player taps "Bắt đầu phiêu lưu" THEN the game loads a sequence of 8 question stations spread along a side-scrolling background.
- WHEN the player encounters a station THEN a question is shown with 4 options and a 15-second timer.
- WHEN the player answers correctly THEN Mario performs a jump animation and advances to the next station.
- WHEN the player answers wrong or time runs out THEN Mario loses 1 life and the same station retries with a fresh question.
- WHEN Mario completes all 8 stations THEN the player sees a victory screen showing total questions, accuracy, lives remaining, and coins collected.
- WHEN the player runs out of lives THEN the game ends with a "game over" screen and offers to retry.

### US2 — Choose subject and difficulty before starting
As a student, I want to pick subject and difficulty, so that I can practice what I need.

**Acceptance Criteria:**
- WHEN the start screen loads THEN the player can pick subject (math / vietnamese / english / mix) and difficulty (easy / medium / hard).
- WHEN the player taps the start button THEN the chosen selection is used for the entire run.
- WHEN no subject/difficulty is chosen THEN defaults are `mix` and `easy`.

### US3 — Collect coins and earn star rating
As a child, I want to collect coins by answering quickly and accurately, so that I get a star rating.

**Acceptance Criteria:**
- WHEN the player answers correctly within the first half of the timer THEN they earn 2 coins; otherwise correct answers earn 1 coin.
- WHEN the run ends THEN star rating is computed: 3 stars if accuracy ≥ 90% and all lives intact, 2 stars if accuracy ≥ 70%, 1 star otherwise.

### US4 — World progression saved locally
As a returning player, I want my best world reached to persist, so that I can continue where I left off.

**Acceptance Criteria:**
- WHEN the player finishes a world THEN their best world index is saved to `localStorage` under key `v41_mario` along with total coins.
- WHEN the start screen loads THEN the saved best world and total coins are displayed.

### US5 — Conform to project conventions
As a maintainer, I want V41 to follow the same patterns as v6-v40.

**Acceptance Criteria:**
- WHEN V41 files are added THEN `public/v41/index.html`, `public/v41/game.js`, `public/v41/style.css` all exist with the required scripts (`/tts.js`, `/link-gate.js`, `/quest-widget.js`, `/diamond-animation.js`, `/help-rules.js`).
- WHEN the page is opened THEN it includes `<script src="../api-config.js"></script>` so native shells can rewrite API calls.
- WHEN the player finishes a run THEN a session is POSTed to `/api/sessions` with `mode: 'v41'`.
- WHEN the routing files are updated THEN `server.js` exposes `/v41` and `vercel.json` adds the route.
- WHEN `home.html` is updated THEN a game card is added for V41 with a 🍄 icon and a Vietnamese label.

## Correctness Properties

(See `design.md` for full property descriptions. Implementation file: `public/v41/game-logic.js`, tests under `tests/v41-*.test.js`.)

1. **P1 — Lives accounting**: For every wrong answer or timeout, `state.lives` decreases by exactly 1; for every correct answer, lives are unchanged.
2. **P2 — Station advance on correct only**: For every correct answer, `state.currentStation` increases by exactly 1; for every wrong/timeout, it stays the same.
3. **P3 — Game over precondition**: The game enters "lost" state if and only if `state.lives === 0`. It enters "won" state if and only if `state.currentStation === totalStations`.
4. **P4 — Coin reward bounds**: For any combination of correct answers within a run, total coins satisfy `correct ≤ coins ≤ 2 × correct`.
5. **P5 — Star rating monotonicity**: For a fixed `totalQuestions`, a higher accuracy always yields a star rating ≥ a lower accuracy run (with the same lives left).
6. **P6 — Question reuse safety**: After a wrong answer, when the same station retries, the system serves a different question if more questions are available in the cache.
7. **P7 — Session output validity**: For any completed run, the payload sent to `/api/sessions` has `total_questions ≥ correct_answers ≥ 0`, `stars_earned ∈ {0,1,2,3}`, and `mode === 'v41'`.

## Out of Scope

- Multiplayer or online competition (V4 covers that).
- Mario-style physics or platforming (no jumping mechanics beyond a decorative jump animation).
- Audio sprites or licensed Mario music. Use emoji + CSS animation only to avoid IP concerns. Refer to the character as a generic plumber-style hero (red cap, mustache emoji 👨🏻‍🔧 or 🦸).
