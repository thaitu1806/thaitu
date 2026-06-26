# V46 — Tiệm Cây Cảnh (Requirements)

## Overview

V46 is a low-pressure quiz mode where the player tends a bonsai shop. Each correct answer waters a plant; plants grow through 4 stages (seed → sprout → bush → bonsai). Filling the shop's 6 plant slots wins the run. No game over — only "shop closes" when the question budget runs out.

## User Stories

### US1 — Water plants by answering questions
**Acceptance Criteria:**
- WHEN a run starts THEN 6 empty pots are visible and a question is shown.
- WHEN player answers correctly THEN the currently selected pot advances one growth stage.
- WHEN player answers wrong/timeout THEN no growth, no penalty.
- WHEN a pot reaches the bonsai stage (stage 4) THEN it counts as "collected".

### US2 — Collect 6 unique plant species
**Acceptance Criteria:**
- WHEN a pot is freshly planted THEN a random plant species from `PLANT_SPECIES` is assigned.
- WHEN the 6 pots are all at bonsai stage THEN the run ends with `won`.
- WHEN the question budget (24) is exhausted with fewer than 6 bonsai THEN `closed`.

### US3 — Choose subject + difficulty
**Acceptance Criteria:** subject in {math, vietnamese, english, mix}, difficulty in {easy, medium, hard}; defaults `mix` + `easy`.

### US4 — Persistent collection
**Acceptance Criteria:**
- WHEN a run ends THEN `species_collected` accumulates in `localStorage` key `v46_bonsai`.
- WHEN start screen loads THEN total bonsai grown and unique species are shown.

### US5 — Conform to project conventions
Required files, scripts, routing, home card icon 🌵 label "Tiệm Cây Cảnh". `mode: 'v46'` for `/api/sessions`.

## Correctness Properties

1. **P1** — Growth bounds: every pot's `stage ∈ {0,1,2,3,4}`.
2. **P2** — Correct grows by 1: a correct event applied to a pot at stage `< 4` advances that pot's stage by exactly 1.
3. **P3** — Wrong leaves stages unchanged: no pot's stage changes on a wrong/timeout event.
4. **P4** — Collected predicate: a pot is collected iff `stage === 4`. `state.collectedCount === sum(pot.stage === 4)`.
5. **P5** — Win predicate: `outcome === 'won'` iff `state.collectedCount === state.totalPots`.
6. **P6** — Budget exhaustion: `outcome === 'closed'` iff `questionsServed === maxQuestions AND collectedCount < totalPots`.
7. **P7** — Session payload validity: total ≥ correct ≥ 0, `mode === 'v46'`.

## Out of Scope
- Selling plants for in-game currency. Reserved for follow-up.
- Day/night cycle.
