# V41 — Phiêu Lưu Cùng Mario (Design)

## Architecture

V41 follows the V40/V39 module pattern:

```
public/v41/
  ├── index.html       # Screens: start, game, gameover, victory
  ├── game.js          # UI/animation, question fetching, session save
  ├── game-logic.js    # Pure functions (advance, decrementLives, computeStars, …)
  └── style.css        # Mario-themed colors + parallax background
```

Splitting **pure logic** into `game-logic.js` mirrors V5's approach so we can unit-test the rules without DOM.

## State Model

```js
// All fields are plain JS, no classes.
GameState = {
  totalStations: 8,           // fixed per world
  currentStation: 0,          // 0..totalStations, increments only on correct
  lives: 3,                   // 3..0
  correct: 0,                 // count of correct answers across whole run
  wrong: 0,                   // count of wrong + timeouts
  coins: 0,                   // 1 or 2 per correct (timing-dependent)
  outcome: 'playing',         // 'playing' | 'won' | 'lost'
  startedAt: number,          // Date.now() at run start
}
```

Status transitions:
- `playing → won` when `currentStation === totalStations`.
- `playing → lost` when `lives === 0`.

## Pure Logic API (`game-logic.js`)

```js
export const TOTAL_STATIONS = 8;
export const STARTING_LIVES = 3;
export const TIMER_SECONDS = 15;

export function initState(opts = {}) → GameState
export function applyCorrect(state, { msRemaining, timerMs = TIMER_SECONDS * 1000 }) → GameState
export function applyWrongOrTimeout(state) → GameState
export function isFinished(state) → boolean
export function computeStars({ correct, total, livesLost }) → 0 | 1 | 2 | 3
export function pickNextQuestion({ cache, usedIds }) → question | null
```

All functions are pure and return a new state object (no mutation). Coin reward rule:

```
let half = timerMs / 2
let coinsAwarded = msRemaining > half ? 2 : 1
```

Stars:

```
if (livesLost === 0 && accuracy >= 0.9) → 3
else if (accuracy >= 0.7) → 2
else if (accuracy >= 0.4) → 1
else 0
```

## Screens

1. **Start screen** — title, hero emoji (🍄), best world badge, total coins, subject + difficulty selectors, start button, home link.
2. **Game screen** — parallax sky/ground, hero sprite (CSS), station markers (8 flags), question card overlay with 4 option buttons, timer bar, HUD (lives, coins, station x/8).
3. **Victory screen** — flag animation, summary (correct/total, accuracy, lives left, coins earned, stars).
4. **Game over screen** — fallen hero, retry button.

## Animation

- Mario sprite is a `<div>` with two emoji states (🦸 idle, 🦘 jumping). Jump animation is a 600ms keyframe `translateY(-40px) rotate(-10deg)`.
- Background is two layered gradients animated with `background-position` for parallax.
- Pipes / clouds are pseudo-elements rendered with emoji (🌥, 🪴) at random offsets.

## Question Source

- Fetches up to `4 × totalStations = 32` questions from `/api/questions?subject=…&difficulty=…&limit=32&grade=…`.
- Maintains `cache` and `usedIds` set. Each station serves an unused question. Retry after wrong serves the **next** unused question rather than reusing.
- If cache runs out, fall back to a built-in math template (e.g., "2 + 3 = ?").

## Session Persistence

On `won` or `lost`:

```js
POST /api/sessions
{
  player_id, subject, difficulty,
  score: coins,
  total_questions: correct + wrong,
  correct_answers: correct,
  stars_earned: computeStars(...),
  combo_max: longest correct streak (tracked locally),
  mode: 'v41',
  accuracy
}
```

Local storage (`v41_mario`):

```json
{ "bestWorld": 1, "totalCoins": 42, "runsCompleted": 5 }
```

## Routing & Discoverability

- `server.js`: add `app.use('/v41', express.static(...))`.
- `vercel.json`: add `{ "src": "/v41/(.*)", "dest": "/public/v41/$1" }`.
- `home.html`: add a `.mode-card` linking to `/v41/` with icon 🍄 and Vietnamese label.

## Test Strategy

- **`tests/v41-game-logic.unit.test.js`** — exhaustive cases for boundary conditions (lives 0, station 8, msRemaining 0).
- **`tests/v41-game-logic.property.test.js`** — fast-check properties P1-P7 from requirements.
- The existing **`tests/game-versions.test.js`** and **`tests/routing-consistency.test.js`** are data-driven; we extend their range to include `v41` so structural checks (HTML scripts, vercel routes, server route, home card) run automatically.

## Decisions / Trade-offs

- Single world (8 stations) for first release. Multiple worlds (Bowser-style boss) can come later as level data, no logic change.
- No Mario trademarks (font, exact characters, music). The vibe is plumber-hero adventure, similar to how V14 was "rescue planet" not Star Wars.
- 3 lives + retry-on-wrong is a softer model than classic Mario, fitting the educational context where we want kids to keep playing.
- Coins are display-only for this release; integration with the shop/diamond system can come in a follow-up spec.
