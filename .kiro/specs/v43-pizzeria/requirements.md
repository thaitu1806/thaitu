# V43 — Pizzeria Của Bé (Requirements)

## Overview

V43 is a pizza-shop themed quiz mode under `public/v43/`. The player serves a queue of customers, each ordering a pizza that needs a fixed number of toppings. Every correct answer adds one topping; wrong answers waste an attempt. When all toppings on a pizza are filled before the order timer expires, the customer pays and tips. Tips persist across runs and can be used (in this release) to display total income only.

## User Stories

### US1 — Serve a queue of customers
As a grade 2-5 student, I want to serve pizzas to a queue of customers by answering questions, so that running a pizzeria feels rewarding.

**Acceptance Criteria:**
- WHEN a shift starts THEN 6 customers are queued, each with a pizza needing exactly 3 toppings.
- WHEN the player answers correctly THEN one topping is added to the current pizza.
- WHEN the pizza has all 3 toppings THEN the customer is served, the player earns a base reward (price + tip), and the next customer is served.
- WHEN the player answers wrong THEN no topping is added and the order timer continues (no game over).
- WHEN the order timer hits 0 THEN the customer leaves without paying; the player still earns nothing from that order.
- WHEN all 6 customers have either been served or left THEN the shift ends with a results screen.

### US2 — Order timer with speed tip
As a player, I want a faster service to earn higher tips.

**Acceptance Criteria:**
- WHEN a customer starts their order THEN they have 30 seconds (their patience).
- WHEN the customer is served with more than 2/3 patience remaining THEN tip is +30% of price.
- WHEN served with more than 1/3 patience remaining THEN tip is +15%.
- WHEN served at the last 1/3 of patience THEN tip is +0% (price only).

### US3 — Choose subject and difficulty
As a student, I want to pick the subject and difficulty before opening the shop.

**Acceptance Criteria:**
- WHEN the start screen loads THEN selectors for subject (math / vietnamese / english / mix) and difficulty (easy / medium / hard) appear.
- WHEN unset THEN defaults are `mix` and `easy`.

### US4 — Income persists locally
As a returning player, I want my total earnings saved across shifts.

**Acceptance Criteria:**
- WHEN a shift ends THEN total earnings and total shifts increment in `localStorage` key `v43_pizzeria`.
- WHEN the start screen loads THEN saved earnings and shifts are displayed.

### US5 — Conform to project conventions
As a maintainer, I want V43 to follow the v40/v41/v42 module pattern.

**Acceptance Criteria:**
- WHEN V43 is added THEN `public/v43/index.html`, `public/v43/game.js`, `public/v43/game-logic.js`, `public/v43/style.css` all exist with the required scripts (`/tts.js`, `/link-gate.js`, `/quest-widget.js`, `/diamond-animation.js`, `/help-rules.js`) and `<script src="../api-config.js"></script>` in `<head>`.
- WHEN a shift ends THEN a session is POSTed to `/api/sessions` with `mode: 'v43'`.
- WHEN routes are updated THEN `server.js` exposes `/v43` and `vercel.json` adds the route.
- WHEN `home.html` is updated THEN a card linking to `/v43/` with icon 🍕 and a Vietnamese label is added.

## Correctness Properties

(See `design.md`. Implementation in `public/v43/game-logic.js`; tests in `tests/v43-*.test.js`.)

1. **P1 — Topping accumulation**: For every correct answer applied to an unfinished pizza, `state.toppingsServed` increases by exactly 1. For wrong/timeout, it stays the same.
2. **P2 — Pizza completion**: A pizza is considered served iff `toppingsServed === toppingsRequired`. Reaching this state advances `customerIndex` by 1 and resets `toppingsServed` to 0.
3. **P3 — Tip tier mapping**: For each served pizza, the tip rate is exactly one of `{0, 0.15, 0.30}` of the base price, chosen by patience-remaining fraction.
4. **P4 — Shift termination**: `outcome === 'closed'` iff `customerIndex === totalCustomers`.
5. **P5 — Earnings bound**: For any shift with `N` served pizzas at prices `p_i`, total earnings `E ≤ Σ p_i × 1.30`.
6. **P6 — Earnings monotonicity**: For every event, `state.earnings` only grows (never decreases).
7. **P7 — Session payload validity**: For any ended shift, `total_questions ≥ correct_answers ≥ 0`, `score = state.earnings`, `mode === 'v43'`.

## Out of Scope

- Upgrades (oven, menu expansion). Reserved for a follow-up spec.
- Pizza customization choices by the player.
- Multiplayer or real-time leaderboards.
