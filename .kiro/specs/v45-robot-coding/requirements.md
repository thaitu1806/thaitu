# V45 — Lập Trình Robot Mini (Requirements)

## Overview

V45 is a programming-themed quiz mode where the player builds a sequence of movement commands to drive a robot through a grid maze to a goal. Each command is **locked** until the player unlocks it by answering a quiz question correctly. After assembling a program, the player presses RUN to see the robot execute the commands step-by-step.

## User Stories

### US1 — Unlock commands with correct answers
As a grade 2-5 student, I want to earn movement commands by answering questions, so that I learn while planning.

**Acceptance Criteria:**
- WHEN a level starts THEN the command tray shows 0 unlocked commands and a question card.
- WHEN I answer correctly THEN exactly one command of a fixed pool {forward, left, right, jump} is added to my available pool.
- WHEN I answer wrong or time out THEN no command is added (no penalty beyond the pool not growing).
- WHEN I have at least 1 command in the pool THEN I can drag it (or tap) to append it to the program.

### US2 — Build and run a program
As a player, I want to compose commands into a program and run it.

**Acceptance Criteria:**
- WHEN I tap RUN THEN the program executes one command per 600 ms, updating the robot position on the grid.
- WHEN the robot exits the grid bounds during execution THEN it stays at the last valid cell and the run halts.
- WHEN execution finishes THEN the program is reset (cleared) so the player can try a different one.

### US3 — Reach the goal to win the level
As a player, I want to win by reaching the goal cell.

**Acceptance Criteria:**
- WHEN the robot ends a step at the goal cell THEN the level is marked as won.
- WHEN the program runs out of commands and the robot is not at the goal THEN the level is **not** lost — the player keeps unlocking more commands by answering more questions.
- WHEN total questions answered exceeds 16 without winning THEN the level ends with `try-again` outcome.

### US4 — Multiple levels with growing difficulty
As a returning player, I want a sequence of mazes with increasing complexity.

**Acceptance Criteria:**
- WHEN winning level N THEN level N+1 unlocks. Best level cleared persists to `localStorage` key `v45_robot`.
- WHEN the start screen loads THEN the highest cleared level is displayed and the player can resume there.
- WHEN N exceeds the built-in level list (5 mazes) THEN the player sees "🎉 Mọi cấp đã chinh phục!".

### US5 — Choose subject and difficulty
As a student, I want to pick a subject and difficulty.

**Acceptance Criteria:**
- WHEN the start screen loads THEN selectors for subject (math / vietnamese / english / mix) and difficulty (easy / medium / hard).
- WHEN unset THEN defaults are `mix` and `easy`.

### US6 — Conform to project conventions
As a maintainer, I want V45 to follow the v40+ module pattern.

**Acceptance Criteria:**
- WHEN V45 is added THEN `public/v45/index.html`, `public/v45/game.js`, `public/v45/game-logic.js`, `public/v45/style.css` exist with required global scripts and `<script src="../api-config.js"></script>` in `<head>`.
- WHEN a level ends THEN a session is POSTed to `/api/sessions` with `mode: 'v45'`.
- WHEN routes are updated THEN `server.js` exposes `/v45` and `vercel.json` adds the route.
- WHEN `home.html` is updated THEN a card linking to `/v45/` with icon 🤖 and a Vietnamese label is added.

## Correctness Properties

1. **P1 — Command unlock**: For every correct answer, the command pool grows by 1; for every wrong/timeout, it stays the same.
2. **P2 — Grid bounds**: For every executed command, the robot's position satisfies `0 ≤ row < ROWS` and `0 ≤ col < COLS`. Out-of-bounds moves are no-ops.
3. **P3 — Win predicate**: `outcome === 'won'` iff after an executed step `robot.row === goal.row AND robot.col === goal.col`.
4. **P4 — Try-again threshold**: After 16 total answered questions without winning, `outcome === 'try-again'`.
5. **P5 — Program execution determinism**: Given the same `initRobotPos` and program, `executeProgram` returns the same final position every time.
6. **P6 — Direction rotation**: `turnLeft` and `turnRight` rotate the robot's facing exactly 90° CCW/CW respectively, with `turnLeft(turnRight(d)) === d` for every direction d.
7. **P7 — Session payload validity**: For any ended level, `total_questions ≥ correct_answers ≥ 0`, `score = levelsCleared`, `mode === 'v45'`.

## Out of Scope

- Loops (`repeat N`) or conditionals (`if wall ahead`). Reserved for a follow-up.
- Saving programs across runs. Each run is a fresh program.
- Multiplayer or shared maze design.
