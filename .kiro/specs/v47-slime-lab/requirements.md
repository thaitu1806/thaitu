# V47 — Phòng Thí Nghiệm Slime (Requirements)

## Overview
Mix colored ingredients into a slime; each correct answer adds one drop of a randomly-chosen color. Hitting a combo of 3 same-color correct answers (no wrong between them) crafts a rare slime. Run ends after 20 questions or when 6 slimes have been crafted.

## User Stories
- US1 Drop ingredients: correct→ add 1 drop with a random color; wrong→ no drop, combo resets.
- US2 Craft slime: 3 same-color drops in a row complete a slime; jar resets.
- US3 Rare slimes: combo of 5 same-color spawns a "galaxy" rare slime instead of normal.
- US4 Run end: 20 questions OR 6 slimes crafted; whichever first.
- US5 Conventions: standard files, routing, home card 🧪 label "Phòng Thí Nghiệm Slime", mode v47.

## Correctness Properties
1. P1 Drop count: correct adds exactly 1 drop, wrong adds 0.
2. P2 Combo reset: any wrong resets `comboRun=0` and `jarColor=null`.
3. P3 Combo same-color: jar drops always share color while comboRun>0.
4. P4 Craft predicate: a slime is crafted iff `comboRun===3` after a correct; jar resets and comboRun→0.
5. P5 Rare spawn: a craft with `comboRun===5` produces a rare slime.
6. P6 Termination: outcome=closed iff questionsServed===20 OR slimesCrafted===6.
7. P7 Session payload validity.
