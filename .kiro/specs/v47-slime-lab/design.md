# V47 — Slime Lab (Design)

## State
```
{
  questionsServed, maxQuestions: 20,
  slimesCrafted, maxSlimes: 6,
  slimes: [{ color, rare }, ...],
  jarColor: 'red'|'blue'|...|null,
  jarDrops: 0,
  comboRun: 0,
  correct, wrong,
  outcome: 'mixing'|'closed',
  startedAt,
}
```

## API
```js
COLORS = ['red','blue','green','yellow','purple']
MAX_QUESTIONS = 20
MAX_SLIMES = 6
TIMER_SECONDS = 20

initState({ rng, startedAt })
applyCorrect(state, { rng })  // adds drop with rng-chosen color (or matches jar)
applyWrongOrTimeout(state)
isFinished(state)
pickNextQuestion(...)
```

Drop rule: if jar empty, pick random color via rng; else extend with same color. After 3 drops same color, slime crafted (rare if comboRun reached 5 before that).
