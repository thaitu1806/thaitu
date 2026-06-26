# V42 — Khinh Khí Cầu Bay Cao (Requirements)

## Overview

V42 is a calm, vertical-progression quiz mode under `public/v42/`. The player pilots a hot-air balloon that rises with each correct answer and loses altitude on wrong/timeout. Reaching milestone altitudes (clouds → mountain → stratosphere) unlocks badges. Designed as a low-stress alternative to faster modes like V41.

## User Stories

### US1 — Fly the balloon by answering questions
As a grade 2-5 student, I want to fly my balloon higher each time I answer correctly, so that I feel relaxed and rewarded.

**Acceptance Criteria:**
- WHEN the run starts THEN the balloon begins at altitude 0 and the goal altitude is 100 (10 stations of 10 each).
- WHEN the player answers correctly THEN altitude increases by 10 + bonus (see US3).
- WHEN the player answers wrong or times out THEN altitude decreases by 5, clamped at 0.
- WHEN altitude reaches 100 THEN the run ends in a victory screen.
- WHEN the player has answered 12 questions without reaching 100 THEN the run ends in a "Cố gắng lần sau" screen (no game over — this mode is forgiving).

### US2 — Choose subject and difficulty
As a student, I want to pick the subject and difficulty before flying.

**Acceptance Criteria:**
- WHEN the start screen loads THEN selectors for subject (math / vietnamese / english / mix) and difficulty (easy / medium / hard) appear.
- WHEN unset THEN defaults are `mix` and `easy`.

### US3 — Speed bonus
As a player, I want fast correct answers to push the balloon a little higher than slow ones.

**Acceptance Criteria:**
- WHEN the player answers correctly within the first third of the 20-second timer THEN bonus is +5 (total +15).
- WHEN the player answers correctly between 33% and 66% of the timer THEN bonus is +2 (total +12).
- WHEN the player answers correctly with less than 33% of timer remaining THEN bonus is +0 (total +10).

### US4 — Badge milestones
As a child, I want to earn badges for crossing altitude milestones, so that progress feels celebratory.

**Acceptance Criteria:**
- WHEN altitude first crosses 30 THEN a "☁️ Mây" badge is awarded.
- WHEN altitude first crosses 60 THEN a "🏔️ Núi" badge is awarded.
- WHEN altitude first crosses 100 THEN a "🌌 Vũ Trụ" badge is awarded (only on victory).
- WHEN a badge is earned THEN a brief feedback line appears in the question card.

### US5 — Best altitude persists locally
As a returning player, I want my highest altitude saved.

**Acceptance Criteria:**
- WHEN the run ends THEN `bestAltitude`, total runs, and earned badges are saved to `localStorage` key `v42_balloon`.
- WHEN the start screen loads THEN the saved best altitude and badges are displayed.

### US6 — Conform to project conventions
As a maintainer, I want V42 to follow the v40/v41 module pattern.

**Acceptance Criteria:**
- WHEN V42 is added THEN `public/v42/index.html`, `public/v42/game.js`, `public/v42/game-logic.js`, `public/v42/style.css` all exist with the required scripts (`/tts.js`, `/link-gate.js`, `/quest-widget.js`, `/diamond-animation.js`, `/help-rules.js`) and `<script src="../api-config.js"></script>` in `<head>`.
- WHEN a run ends THEN a session is POSTed to `/api/sessions` with `mode: 'v42'`.
- WHEN routes are updated THEN `server.js` exposes `/v42` and `vercel.json` adds the route.
- WHEN `home.html` is updated THEN a card linking to `/v42/` with icon 🎈 and a Vietnamese label is added.

## Correctness Properties

(See `design.md`. Implementation in `public/v42/game-logic.js`; tests in `tests/v42-*.test.js`.)

1. **P1 — Altitude bounds**: For every state, `0 ≤ altitude ≤ maxAltitude (100)`.
2. **P2 — Correct increases altitude**: For every correct event, `altitude' ≥ altitude` (strictly greater unless already at max).
3. **P3 — Wrong/timeout decreases altitude**: For every wrong/timeout event, `altitude' ≤ altitude` (strictly lower unless already at 0).
4. **P4 — Bonus mapping**: For any correct event, the altitude delta is exactly one of `{10, 12, 15}` (until clamped at maxAltitude).
5. **P5 — Win iff altitude = 100**: `outcome === 'won'` iff `altitude === maxAltitude`.
6. **P6 — Question budget exhaustion**: For any sequence longer than `MAX_QUESTIONS` (12) that does not win, `outcome === 'try-again'`.
7. **P7 — Badge monotonicity**: For every state transition, the set of earned badges only grows (never loses a badge).
8. **P8 — Session payload validity**: For any ended run, `total_questions ≥ correct_answers ≥ 0`, `score = altitude`, `mode === 'v42'`.

## Out of Scope

- Online multiplayer or competitive leaderboards.
- Powerups / shop integration (can come later as a follow-up spec).
- Real-time physics simulation.
