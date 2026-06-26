# V45 — Lập Trình Robot Mini (Design)

## Architecture

Same module split as V41-V44:

```
public/v45/
  ├── index.html       # Screens: start, level (game + tray), victory, try-again
  ├── game.js          # UI/animation, fetch, save
  ├── game-logic.js    # Pure functions
  └── style.css        # Grid + neon coder theme
```

## State Model

```js
GameState = {
  level: number,            // 1..LEVELS.length
  grid: { rows:5, cols:5 },
  start: { row:number, col:number, facing:'up'|'right'|'down'|'left' },
  goal:  { row:number, col:number },
  obstacles: [{row,col}, ...],
  robot: { row, col, facing },
  pool: string[],           // unlocked-but-unused commands, e.g. ['forward','left',...]
  program: string[],        // ordered commands the player has placed
  correct: 0, wrong: 0,
  questionsServed: 0,
  maxQuestions: 16,
  outcome: 'playing' | 'won' | 'try-again',
  startedAt: number,
}
```

Each unlocked command is randomly one of `['forward','left','right','jump']`. `jump` is `forward × 2`.

## Pure Logic API

```js
export const COMMANDS = ['forward','left','right','jump'];
export const DIRECTIONS = ['up','right','down','left']; // CW order
export const MAX_QUESTIONS = 16;
export const LEVELS = [ … ];

export function initState({ level=1, rng=Math.random, startedAt }) → GameState
export function applyCorrect(state, { rng=Math.random }) → GameState
export function applyWrongOrTimeout(state) → GameState
export function isFinished(state) → boolean

export function appendCommand(state, idx) → GameState
export function clearProgram(state) → GameState
export function executeProgram(state) → GameState

export function turnLeft(dir) → dir
export function turnRight(dir) → dir
export function moveForward(pos, dir, grid, obstacles, steps=1) → { row, col }
export function pickNextQuestion({ cache, usedIds }) → question | null
```

## Screens

1. **Start** — title, robot emoji, best level badge, subject/difficulty selectors, start button.
2. **Level** — grid (5x5) at top with robot, goal, obstacles. Command tray below grid (drag/tap-to-append). Program slot row. Question card at bottom. RUN button.
3. **Victory** — confetti, summary, "Next Level" button.
4. **Try-Again** — same maze, reset, retry.

## Animation

- Robot: emoji 🤖 placed via CSS `grid-row` / `grid-column`. Transition 0.4s between cells.
- Facing: rotate via transform.
- Obstacles: 🧱 emoji.
- Goal: 🏁 emoji.

## Levels (built-in)

Level 1: empty 5x5, start (4,0) facing up, goal (0,4). Reachable with 4 forwards + 1 right + 4 forwards (or shorter via diagonals via jump).
Level 2: 1 obstacle at (2,2).
Level 3: 2 obstacles.
Level 4: 3 obstacles, requires turns.
Level 5: 4 obstacles in a tighter path.

## Question Source

Same as V41-V44: fetch up to 20 questions. Fallback math addition.

## Session Persistence

```js
POST /api/sessions {
  player_id, subject, difficulty,
  score: state.level,
  total_questions, correct_answers,
  stars_earned: state.outcome === 'won' ? (state.wrong === 0 ? 3 : 2) : (state.correct >= 5 ? 1 : 0),
  combo_max, mode: 'v45', accuracy
}
```

LocalStorage (`v45_robot`): `{ bestLevel:int }`.

## Routing & Discoverability

- `server.js`: `app.use('/v45', ...)`.
- `vercel.json`: `{ "src": "/v45/(.*)", "dest": "/public/v45/$1" }`.
- `home.html`: card icon 🤖 label "Lập Trình Robot".

## Test Strategy

Unit + property tests cover:
- Direction rotations (P6).
- Movement within bounds and obstacles (P2).
- Program execution determinism (P5).
- Command unlock (P1).
- Win/try-again predicates (P3, P4).
- Session payload (P7).

## Decisions / Trade-offs

- Pool of 4 commands keeps the UI simple. More commands (e.g., `back`) reserved for future levels.
- Jump = forward 2 introduces a "puzzle" element without complicating movement physics.
- `try-again` instead of `lost` keeps tone friendly.
- No live-eval (the program runs after the player commits) — easier to test and clearer to children.
