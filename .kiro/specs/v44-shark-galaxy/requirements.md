# V44 — Vũ Trụ Cá Mập (Requirements)

## Overview

V44 is a space-racing quiz mode where the player pilots a ship through a galaxy, gathering speed with each correct answer, racing toward a boss "Cá Mập Vũ Trụ" at the end. Wrong answers slow the ship. The boss fight phase spikes question difficulty for 30 seconds.

## User Stories

### US1 — Race through space
As a grade 2-5 student, I want to race a ship through the galaxy by answering questions, so that I feel exciting and engaged.

**Acceptance Criteria:**
- WHEN a run starts THEN ship distance is 0 and goal distance is 100.
- WHEN player answers correctly THEN ship gains 10 distance.
- WHEN player answers wrong or times out THEN ship loses 4 distance (clamped at 0).
- WHEN ship reaches distance 80 THEN boss phase begins for at most 5 questions (each 8-second timer).
- WHEN ship reaches distance 100 THEN player wins.
- WHEN boss phase ends with ship < 100 THEN player loses (caught by shark).

### US2 — Boss phase
As a player, I want a climactic boss fight at the end with harder timing.

**Acceptance Criteria:**
- WHEN entering boss phase THEN timer drops from 15s per question to 8s per question.
- WHEN correct in boss phase THEN +6 distance (lower than base because timer is harsher).
- WHEN wrong or timeout in boss phase THEN −8 distance (heavier penalty).
- WHEN player makes 5 boss attempts without reaching 100 THEN player loses.

### US3 — Choose subject and difficulty
As a student, I want to pick subject and difficulty before launching.

**Acceptance Criteria:**
- WHEN start screen loads THEN selectors for subject (math / vietnamese / english / mix) and difficulty (easy / medium / hard).
- WHEN unset THEN defaults are `mix` and `easy`.

### US4 — Best distance and runs persist
As a returning player, I want my fastest finish and total runs saved.

**Acceptance Criteria:**
- WHEN run ends THEN `bestDistance` (max distance reached) and `totalRuns` saved to `localStorage` key `v44_shark`.
- WHEN start screen loads THEN saved values displayed.

### US5 — Conform to project conventions
As a maintainer, I want V44 to follow the v40+ module pattern.

**Acceptance Criteria:**
- WHEN V44 is added THEN `public/v44/index.html`, `public/v44/game.js`, `public/v44/game-logic.js`, `public/v44/style.css` exist with required global scripts and `<script src="../api-config.js"></script>` in `<head>`.
- WHEN run ends THEN session POSTed to `/api/sessions` with `mode: 'v44'`.
- WHEN routes are updated THEN `server.js` exposes `/v44` and `vercel.json` adds the route.
- WHEN `home.html` is updated THEN a card linking to `/v44/` with icon 🦈 and a Vietnamese label is added.

## Correctness Properties

1. **P1 — Distance bounds**: For every state, `0 ≤ distance ≤ goalDistance (100)`.
2. **P2 — Correct increases distance**: For every correct event, `distance' ≥ distance` (strictly when not capped).
3. **P3 — Wrong decreases distance**: For every wrong/timeout event, `distance' ≤ distance` (strictly when not at 0).
4. **P4 — Phase transition**: `phase === 'boss'` iff `distance ≥ 80 AND distance < 100`.
5. **P5 — Outcome predicates**: `outcome === 'won'` iff `distance === 100`; `outcome === 'lost'` iff `phase === 'boss' AND bossAttempts === MAX_BOSS_ATTEMPTS AND distance < 100`.
6. **P6 — Boss attempt counter**: For every event in boss phase, `bossAttempts` increments by exactly 1; outside boss phase it stays at 0.
7. **P7 — Session payload validity**: For any ended run, `total_questions ≥ correct_answers ≥ 0`, `score = distance`, `mode === 'v44'`.

## Out of Scope

- Multiple ship cosmetics. Reserved for follow-up.
- Real physics; movement is discrete per question.
- Multiplayer races.
