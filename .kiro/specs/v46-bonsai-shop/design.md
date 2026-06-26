# V46 — Tiệm Cây Cảnh (Design)

## State

```js
GameState = {
  totalPots: 6,
  pots: [{ stage: 0..4, species: 'cactus'|'rose'|... }, ...],
  selectedPotIndex: 0..5,
  correct: 0, wrong: 0,
  questionsServed: 0, maxQuestions: 24,
  collectedCount: 0,
  outcome: 'tending'|'won'|'closed',
  startedAt: number,
}
```

## API

```js
export const TOTAL_POTS = 6;
export const MAX_QUESTIONS = 24;
export const MAX_STAGE = 4;
export const TIMER_SECONDS = 25;
export const PLANT_SPECIES = [
  { id:'cactus', emoji:'🌵', name:'Xương rồng' },
  { id:'rose',   emoji:'🌹', name:'Hoa hồng' },
  ... ];

initState({ rng, startedAt }) → state
applyCorrect(state) → state                 // grows selectedPot
applyWrongOrTimeout(state) → state
selectPot(state, idx) → state
isFinished(state) → boolean
pickNextQuestion({ cache, usedIds })
```

`applyCorrect` rules:
- If selected pot stage < MAX_STAGE: stage++. If reaches MAX_STAGE: increment collectedCount.
- Auto-advance selectedPotIndex to next non-full pot (cycle).

## Screens
1. Start — title, hero emoji, totals (bonsai grown, unique species), selectors.
2. Game — pot row with selectable pots, current question card, progress.
3. Won / Closed — summary.

## Tests
- Unit: growth boundary, selectedPot auto-shift, finalize.
- Property: P1-P7.

## Routing
- server.js /v46 mount; vercel.json route; home.html card 🌵.
