# Tasks: V5 Cờ Cá Ngựa

## Task 1: Project Setup and Server Integration

- [x] 1.1 Create `public/v5/` directory structure with `index.html`, `game.js`, `style.css`
- [x] 1.2 Add `/v5` static route in `server.js`
- [x] 1.3 Create base `index.html` with screen containers (setup, board, victory), Nunito font, and meta viewport
- [x] 1.4 Add navigation link to V5 from `public/home.html`

## Task 2: Setup Screen

- [x] 2.1 Build setup screen HTML with player count selector (2/3/4 buttons)
- [x] 2.2 Implement player slot configuration UI (human/bot toggle per slot, color assignment)
- [x] 2.3 Add subject (Math/Vietnamese/Mixed) and difficulty (easy/medium/hard) selectors
- [x] 2.4 Load player name from `localStorage('hocvui_profile')` for first human slot
- [x] 2.5 Validate at least 1 human player before enabling start button
- [x] 2.6 Implement `initializeGame(config)` function to create game state

## Task 3: Board Rendering

- [x] 3.1 Define board layout constants (36 tiles, star positions [4,13,22,31], trap positions [8,17,26,35])
- [x] 3.2 Implement CSS grid rectangular-loop board layout (top/right/bottom/left sides)
- [x] 3.3 Render tiles with distinct styling for normal, star (⭐/gold), and trap (⚠️/dark) tiles
- [x] 3.4 Render player tokens as colored emoji on their current tile position
- [x] 3.5 Implement token stacking/offset when multiple tokens occupy same tile
- [x] 3.6 Add responsive styles for 320px-768px viewport widths

## Task 4: Dice System

- [x] 4.1 Create dice UI elements (two dice display + roll button)
- [x] 4.2 Implement `rollDice()` function returning two random [1-6] values
- [x] 4.3 Add CSS dice tumbling animation (1-2 seconds duration)
- [x] 4.4 Display dice result and calculate total move distance
- [x] 4.5 Implement target tile highlighting with pulsing CSS animation

## Task 5: Question System

- [x] 5.1 Implement `QuestionManager` with pre-fetch of 20 questions on game start
- [x] 5.2 Add cache refill logic when remaining questions < 5
- [x] 5.3 Implement no-repeat tracking using `usedIds` Set
- [x] 5.4 Add network retry logic (retry once after 2s, then show error)
- [x] 5.5 Build question popup UI (question text + 4 large answer buttons, 44px+ touch targets)
- [x] 5.6 Handle mixed subject by fetching half math / half vietnamese

## Task 6: Turn Flow State Machine

- [x] 6.1 Implement game state machine with states: waiting_roll, dice_rolling, waiting_tile_tap, showing_question, animating_move, special_effect, kick_animation, turn_transition, game_over
- [x] 6.2 Implement `getNextPlayer(currentIndex, playerCount)` turn rotation
- [x] 6.3 Add turn indicator UI showing current player name, color, and highlight
- [x] 6.4 Disable controls for non-active players
- [x] 6.5 Implement tile tap confirmation (player taps highlighted target tile to trigger question)

## Task 7: Movement and Answer Logic

- [x] 7.1 Implement `calculateTargetTile(position, diceTotal)` with finish clamping
- [x] 7.2 Handle correct answer: animate token tile-by-tile to target position
- [x] 7.3 Handle incorrect answer: keep position, briefly show correct answer
- [x] 7.4 Implement token movement CSS animation (smooth tile-by-tile)
- [x] 7.5 Log each answer via POST `/api/answers`

## Task 8: Special Tile Effects

- [x] 8.1 Implement `applySpecialTileEffect(position, tileType)` with boundary clamping
- [x] 8.2 Star tile: advance +2 tiles (clamped to finish), show "⭐ Tiến thêm 2 ô!" notification
- [x] 8.3 Trap tile: move back -3 tiles (clamped to 0), show "⚠️ Lùi 3 ô!" notification
- [x] 8.4 Add animation and sound for special tile triggers

## Task 9: Kick Mechanic

- [x] 9.1 Implement `checkKick(targetTile, allPlayerPositions, currentPlayerIndex)` detection
- [x] 9.2 Send kicked token back to position 0
- [x] 9.3 Add kick animation (token flying back) and notification "🦶 Đá [tên] về vạch xuất phát!"
- [x] 9.4 Play kick sound effect

## Task 10: Bot Player

- [x] 10.1 Implement bot auto-roll with 1s delay
- [x] 10.2 Implement bot auto-confirm tile tap with 1s delay
- [x] 10.3 Implement `botAnswer(question, difficulty)` with accuracy rates (60%/45%/30%)
- [x] 10.4 Display question on screen for 1.5s before revealing bot's answer
- [x] 10.5 Apply same movement/kick/special-tile rules to bot players

## Task 11: Win Condition and Victory Screen

- [x] 11.1 Implement `checkWinCondition(playerPositions)` — first to reach position 36
- [x] 11.2 Build victory screen with winner name, color, and confetti animation
- [x] 11.3 Display game statistics (total turns, correct/incorrect answers)
- [x] 11.4 Add "Chơi lại" and "Về trang chủ" buttons
- [x] 11.5 Save session via POST `/api/sessions` with mode "v5"

## Task 12: Progress and Analytics

- [x] 12.1 Implement `accumulateProgress(existing, newSession)` function
- [x] 12.2 Save progress via PUT `/api/players/:id/progress/v5` on game end
- [x] 12.3 Load existing progress on game start to accumulate (not overwrite)

## Task 13: Audio System

- [x] 13.1 Implement Web Audio API sound manager (same pattern as V2/V4)
- [x] 13.2 Add sound effects: dice_roll, correct, wrong, star_bonus, trap, kick, victory

## Task 14: Visual Polish and Animations

- [x] 14.1 Style board with bright, child-friendly colors and emoji tokens
- [x] 14.2 Add victory confetti particle animation
- [x] 14.3 Add token kick fly-back animation
- [x] 14.4 Add notification toast system for game events
- [x] 14.5 Ensure mobile-first responsive layout (safe-area-inset, min touch targets 44px)

## Task 15: Testing

- [x] 15.1 Install `vitest` and `fast-check` as dev dependencies
- [x] 15.2 Extract pure game logic functions into a testable module (`public/v5/game-logic.js`)
- [x] 15.3 Write property tests for Properties 1-12 (minimum 100 iterations each)
- [x] 15.4 Write unit tests for edge cases (boundary positions, empty cache, all bots rejected)
