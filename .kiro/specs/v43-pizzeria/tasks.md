# V43 — Pizzeria Của Bé (Tasks)

- [ ] 1. Pure game logic
  - [ ] 1.1 Create `public/v43/game-logic.js` with constants, `initState`, `applyCorrect`, `applyWrongOrTimeout`, `isFinished`, `tipRate`, `rollPizzas`, `pickNextQuestion`.

- [ ] 2. Tests
  - [ ] 2.1 `tests/v43-game-logic.unit.test.js` — tip tier boundaries, pizza completion, walked-away handling.
  - [ ] 2.2 `tests/v43-game-logic.property.test.js` — P1-P7.

- [ ] 3. UI
  - [ ] 3.1 `public/v43/index.html` — start, game, result screens.
  - [ ] 3.2 `public/v43/style.css` — pizzeria theme.

- [ ] 4. Controller
  - [ ] 4.1 `public/v43/game.js` — localStorage, render, fetch, wire to logic, save session.

- [ ] 5. Routing
  - [ ] 5.1 `server.js` static mount.
  - [ ] 5.2 `vercel.json` route.
  - [ ] 5.3 `home.html` card 🍕.
  - [ ] 5.4 Update version ranges in structural test files to `43`.

- [ ] 6. Verify
  - [ ] 6.1 Run V43 + structural tests; ensure pass.
