# V42 — Khinh Khí Cầu Bay Cao (Design)

## Architecture

V42 mirrors the V41 pattern: split pure logic from UI controller.

```
public/v42/
  ├── index.html       # Screens: start, game, victory, try-again
  ├── game.js          # UI/animation, fetch, save session
  ├── game-logic.js    # Pure functions (apply events, badges, computeStars)
  └── style.css        # Sky-themed palette, cloud + balloon animations
```

## State Model

```js
GameState = {
  altitude: 0,            // 0..100
  maxAltitude: 100,
  correct: 0,
  wrong: 0,
  questionsServed: 0,     // increments on EVERY question (right or wrong)
  maxQuestions: 12,
  badges: [],             // ordered subset of ['cloud','mountain','space']
  outcome: 'playing',     // 'playing' | 'won' | 'try-again'
  startedAt: number,
}
```

Transitions:
- `playing → won` when altitude becomes 100 (capped).
- `playing → try-again` when `questionsServed >= maxQuestions` and altitude < 100.

## Pure Logic API (`game-logic.js`)

```js
export const MAX_ALTITUDE = 100;
export const MAX_QUESTIONS = 12;
export const TIMER_SECONDS = 20;
export const BASE_GAIN = 10;
export const PENALTY = 5;

// Badge thresholds (must be sorted asc)
export const BADGES = [
  { id: 'cloud',    icon: '☁️',  label: 'Mây',     threshold: 30 },
  { id: 'mountain', icon: '🏔️', label: 'Núi',     threshold: 60 },
  { id: 'space',    icon: '🌌',  label: 'Vũ Trụ',  threshold: 100 },
];

export function initState(opts = {}) → GameState
export function applyCorrect(state, { msRemaining, timerMs = TIMER_SECONDS * 1000 }) → GameState
export function applyWrongOrTimeout(state) → GameState
export function isFinished(state) → boolean
export function computeBonus(msRemaining, timerMs) → 0 | 2 | 5
export function newBadgesEarned(prevAltitude, nextAltitude) → string[]
export function pickNextQuestion({ cache, usedIds }) → question | null
```

### Bonus rule (US3)

```
fraction = msRemaining / timerMs   // 0..1
if fraction >  2/3 → bonus = 5   (fast)
elif fraction > 1/3 → bonus = 2  (medium)
else                  → bonus = 0  (slow)
```

So altitude delta on correct is `BASE_GAIN + bonus = 10 | 12 | 15`. The result is then clamped at `MAX_ALTITUDE`.

### Badge rule

After every state change, recompute earned badges from current altitude. Once earned, never removed (monotonic).

## Screens

1. **Start screen** — title, balloon emoji, best altitude badge row, subject/difficulty selectors, start button.
2. **Game screen** — vertical sky background (gradient from grass → clouds → space), balloon sprite at altitude position, altitude meter, timer bar, question card overlay.
3. **Victory screen** — balloon at the top with sun/stars, summary, retry button.
4. **Try-again screen** — balloon mid-air, summary with encouragement.

## Animation

- Balloon: `<div class="balloon">🎈</div>` positioned with `bottom: altitude%`. Transitions smoothly via CSS `transition: bottom 0.6s ease-out`.
- Background: vertical gradient `linear-gradient(0deg, #87ceeb 0%, #4682b4 60%, #000033 100%)` revealed by scrolling. We achieve this by giving the background a fixed 1000px height and scrolling its `background-position-y` proportionally to altitude (purely cosmetic; logic-independent).
- Clouds: emoji absolutely positioned at randomized horizontal offsets and slightly-different y; animated with a slow `floatX` keyframe.

## Question Source

Same as V41:
- Fetch up to `MAX_QUESTIONS + 8 = 20` questions from `/api/questions`.
- Maintain `usedIds`. Fall back to a generated math addition question if cache is exhausted.

## Session Persistence

```js
POST /api/sessions
{
  player_id, subject, difficulty,
  score: state.altitude,
  total_questions: state.correct + state.wrong,
  correct_answers: state.correct,
  stars_earned: state.badges.length,   // 0..3
  combo_max: longest correct streak,
  mode: 'v42',
  accuracy
}
```

LocalStorage (`v42_balloon`):

```json
{ "bestAltitude": 100, "totalRuns": 3, "badges": ["cloud","mountain","space"] }
```

## Routing & Discoverability

- `server.js`: `app.use('/v42', express.static(...))`.
- `vercel.json`: `{ "src": "/v42/(.*)", "dest": "/public/v42/$1" }`.
- `home.html`: new game card icon 🎈, label "Khinh Khí Cầu".

## Test Strategy

- **`tests/v42-game-logic.unit.test.js`** — boundary cases (altitude 0 + wrong, altitude 100 + correct, all bonus tiers, badge edge thresholds, max question budget).
- **`tests/v42-game-logic.property.test.js`** — fast-check for P1-P8.
- Structural ranges in `tests/game-versions.test.js`, `tests/routing-consistency.test.js`, `tests/answer-comparison.test.js`, `tests/script-includes.test.js`, `tests/game-lifecycle.test.js` extended to include `42`.

## Decisions / Trade-offs

- 12-question soft cap keeps a run under 5 minutes even with slow answers — appropriate for a "chill" mode.
- No lives system. The penalty for wrong is a 5-altitude drop, but never game over. Reduces frustration.
- Badges are a stand-in for the star rating used elsewhere (we still emit `stars_earned = badges.length` for quest/streak compatibility).
- Single-world only; multi-world (different sky themes per world) reserved for follow-up.
