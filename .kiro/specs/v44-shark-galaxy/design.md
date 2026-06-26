# V44 — Vũ Trụ Cá Mập (Design)

## Architecture

Same module split as V41/V42/V43:

```
public/v44/
  ├── index.html       # Screens: start, game, victory, defeat
  ├── game.js          # UI/animation, fetch, save session
  ├── game-logic.js    # Pure functions
  └── style.css        # Space + neon palette
```

## State Model

```js
GameState = {
  distance: 0,
  goalDistance: 100,
  bossThreshold: 80,
  correct: 0,
  wrong: 0,
  phase: 'race',         // 'race' | 'boss'
  bossAttempts: 0,
  maxBossAttempts: 5,
  outcome: 'playing',    // 'playing' | 'won' | 'lost'
  startedAt: number,
}
```

Transitions:
- `playing → won` when `distance === 100`.
- `playing → lost` when in boss phase and bossAttempts reach 5 without winning.

## Pure Logic API

```js
export const GOAL_DISTANCE = 100;
export const BOSS_THRESHOLD = 80;
export const MAX_BOSS_ATTEMPTS = 5;
export const RACE_TIMER_SECONDS = 15;
export const BOSS_TIMER_SECONDS = 8;
export const RACE_GAIN = 10;
export const RACE_PENALTY = 4;
export const BOSS_GAIN = 6;
export const BOSS_PENALTY = 8;

export function initState(opts) → GameState
export function applyCorrect(state) → GameState
export function applyWrongOrTimeout(state) → GameState
export function isFinished(state) → boolean
export function getPhase(distance, bossAttempts, maxBossAttempts) → 'race' | 'boss'
export function timerSecondsFor(phase) → number
export function pickNextQuestion({ cache, usedIds }) → question | null
```

Boss phase entry: any event after `distance ≥ 80` enters boss phase and increments `bossAttempts`. Boss attempts cap to 5; on the 5th, if not at 100, outcome = lost.

## Screens

1. **Start** — title, ship emoji, best distance + total runs, subject/difficulty selectors, launch button.
2. **Game** — horizontal track from earth → space → shark. Ship sprite advances by `distance%`. Boss shark appears at 80%+ and glares with red eyes. Question card overlay.
3. **Victory** — ship past shark with confetti, summary.
4. **Defeat** — shark with chomp animation, summary, retry.

## Animation

- Ship: `<div class="ship">🚀</div>` positioned with `left: distance%`. Transition smooth (0.5s ease-out).
- Background: starfield via CSS `radial-gradient` repeating, slow horizontal scroll.
- Boss shark: hidden until `distance ≥ 60`, then fade in and oscillate.

## Question Source

Same as V41-V43: fetch up to 25 questions from `/api/questions`. Fallback to math addition.

## Session Persistence

```js
POST /api/sessions {
  player_id, subject, difficulty,
  score: state.distance,
  total_questions, correct_answers, stars_earned, combo_max,
  mode: 'v44', accuracy
}
```

Stars: 3 if won with no wrongs, 2 if won, 1 if reached boss but lost, 0 otherwise.

LocalStorage (`v44_shark`): `{ bestDistance, totalRuns, wins }`.

## Routing & Discoverability

- `server.js`: `app.use('/v44', ...)`.
- `vercel.json`: `{ "src": "/v44/(.*)", "dest": "/public/v44/$1" }`.
- `home.html`: card with icon 🦈 label "Vũ Trụ Cá Mập".

## Test Strategy

- Unit: gain/penalty under each phase, phase transition at boundary, lose condition.
- Property: P1-P7.
- Structural test ranges extended to include `44`.

## Decisions / Trade-offs

- Boss "shark" is a generic galaxy boss; no licensed reference. Emoji 🦈 in space context is fine.
- 5 boss attempts is a soft cap — too few feels punishing, too many drags out.
- Different gain/penalty per phase creates strategic tension without complex mechanics.
