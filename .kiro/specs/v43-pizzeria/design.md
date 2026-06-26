# V43 — Pizzeria Của Bé (Design)

## Architecture

V43 follows the V41/V42 module split:

```
public/v43/
  ├── index.html       # Screens: start, game, result
  ├── game.js          # UI/animation, fetch, save session
  ├── game-logic.js    # Pure functions
  └── style.css        # Pizzeria-themed palette
```

## State Model

```js
GameState = {
  totalCustomers: 6,
  customerIndex: 0,        // 0..totalCustomers
  toppingsRequired: 3,
  toppingsServed: 0,       // resets per customer
  patienceSeconds: 30,
  pizzas: [...],           // pricing per customer pre-rolled at run start
  earnings: 0,
  servedCount: 0,
  correct: 0,
  wrong: 0,
  outcome: 'open',         // 'open' | 'closed'
  startedAt: number,
}
```

Each `pizza` is `{ name, emoji, price, toppings: [emoji…] }`. Pizzas are pre-rolled so logic is deterministic given the seed; UI just renders them.

## Pure Logic API

```js
export const TOTAL_CUSTOMERS = 6;
export const TOPPINGS_REQUIRED = 3;
export const PATIENCE_SECONDS = 30;
export const TIP_TIERS = [
  { thresholdFraction: 2/3, rate: 0.30 },
  { thresholdFraction: 1/3, rate: 0.15 },
  { thresholdFraction: 0,   rate: 0    },
];
export const PIZZA_MENU = [ … ];   // pool of pizza recipes

export function initState({ pizzas, startedAt }) → GameState
export function applyCorrect(state, { msRemaining, patienceMs }) → GameState
export function applyWrongOrTimeout(state, { kind }) → GameState
export function isFinished(state) → boolean
export function tipRate(msRemaining, patienceMs) → number
export function rollPizzas(rng) → pizza[]
```

`applyCorrect` adds 1 topping. If that completes a pizza, it computes the tip rate from the timing at completion and adds `price × (1 + rate)` to earnings, then advances `customerIndex` and resets `toppingsServed`.

`applyWrongOrTimeout` with `kind='wrong'` increments `wrong`. With `kind='timeout'`, it marks the customer as walked-away (advancing customerIndex without earnings).

## Screens

1. **Start** — pizzeria title, totals (earnings + shifts), subject/difficulty selectors, "Mở Quán" button.
2. **Game** — queue indicator (6 spots), current customer, current pizza dish with placed toppings, patience timer bar, question card.
3. **Result** — earnings summary, retry, home.

## Question Source

Same as V41/V42: fetch `TOTAL_CUSTOMERS × TOPPINGS_REQUIRED = 18` questions from `/api/questions`, plus a small buffer. Use the same fallback math generator when cache exhausted.

## Session Persistence

```js
POST /api/sessions {
  player_id, subject, difficulty,
  score: state.earnings,
  total_questions: correct + wrong,
  correct_answers: correct,
  stars_earned: state.servedCount >= 5 ? 3 : state.servedCount >= 3 ? 2 : state.servedCount >= 1 ? 1 : 0,
  combo_max: maxCombo,
  mode: 'v43',
  accuracy
}
```

LocalStorage (`v43_pizzeria`): `{ totalEarnings, totalShifts }`.

## Routing & Discoverability

- `server.js`: `app.use('/v43', ...)`.
- `vercel.json`: `{ "src": "/v43/(.*)", "dest": "/public/v43/$1" }`.
- `home.html`: card with icon 🍕 label "Pizzeria".

## Test Strategy

- Unit tests cover tip-tier boundaries, pizza completion side effects, terminal conditions, fallback paths.
- Property tests cover P1-P7.
- Structural test ranges extended to include `43`.

## Decisions / Trade-offs

- Pre-roll pizzas so the logic is deterministic and easily testable. UI never overrides.
- Fixed 3 toppings per pizza for first release. Variable counts can be added later via a `toppingsRequired` field per pizza.
- No game over — losing customers reduces earnings only. Keeps the kid-friendly tone consistent with V42.
- No oven mini-game; simplicity wins.
