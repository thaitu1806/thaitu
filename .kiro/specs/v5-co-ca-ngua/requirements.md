# Requirements Document

## Introduction

V5 "Cờ Cá Ngựa" is a new game mode for the Học Vui educational platform, inspired by the Vietnamese Ludo board game. Players roll dice and move tokens around a circular board with ~30-40 tiles. To advance to a new tile, the player must correctly answer a quiz question. Wrong answers keep the player at their current position. The mode supports 1-4 players (including bot opponents) with special tiles (bonus stars, traps) and turn-based gameplay. First player to reach the finish wins. The UI is colorful, animated, and suitable for 7-8 year old Vietnamese children.

## Glossary

- **Board_Game**: The V5 Cờ Cá Ngựa game mode, a self-contained HTML/JS/CSS bundle served from public/v5/
- **Board**: A circular/loop track of 30-40 tiles that players navigate from start to finish
- **Tile**: An individual cell on the Board that a token can occupy
- **Star_Tile**: A special Tile that grants a bonus (extra dice roll or advance forward)
- **Trap_Tile**: A special Tile that moves the player backward a number of tiles
- **Token**: A colored character piece representing a player on the Board
- **Dice**: Two virtual dice that determine how many tiles a player can move (values 1-6 each)
- **Question_Popup**: A modal overlay displaying a quiz question when a player lands on a Tile
- **Turn_Indicator**: A UI element showing whose turn it is currently
- **Bot_Player**: A computer-controlled opponent with automated dice rolling and question answering
- **Game_Session**: A complete playthrough from start until a player reaches the finish
- **Player**: A human participant controlling a Token on the Board
- **Finish_Tile**: The final Tile on the Board that a player must reach to win

## Requirements

### Requirement 1: Game Setup and Player Configuration

**User Story:** As a Player, I want to set up a game with 2-4 players (human or bot), so that I can play Cờ Cá Ngựa with friends or practice alone.

#### Acceptance Criteria

1. WHEN a Player opens the V5 game mode, THE Board_Game SHALL display a setup screen allowing selection of 2, 3, or 4 total players
2. THE Board_Game SHALL allow the Player to assign each player slot as either "human" or "bot"
3. THE Board_Game SHALL require at least 1 human Player in every Game_Session
4. WHEN all player slots are configured, THE Board_Game SHALL allow the Player to select question subject (Math, Vietnamese, or Mixed) and difficulty (easy, medium, hard)
5. WHEN the Player taps the start button, THE Board_Game SHALL initialize the Board with all Tokens at the starting position
6. THE Board_Game SHALL assign a distinct color to each player's Token (e.g., red, blue, green, yellow)
7. THE Board_Game SHALL load the player name from localStorage (hocvui_profile) for the first human player slot

### Requirement 2: Board Layout and Tile System

**User Story:** As a Player, I want a colorful circular game board with special tiles, so that the game feels exciting and varied.

#### Acceptance Criteria

1. THE Board SHALL consist of 36 tiles arranged in a circular loop path from a shared start area to the Finish_Tile
2. THE Board SHALL include 4 Star_Tiles distributed evenly across the path
3. THE Board SHALL include 4 Trap_Tiles distributed evenly across the path, not adjacent to Star_Tiles
4. THE Board SHALL visually distinguish Star_Tiles (star icon/gold color) and Trap_Tiles (warning icon/dark color) from normal tiles
5. THE Board SHALL display each player's Token on their current Tile position
6. WHEN multiple Tokens occupy the same Tile, THE Board SHALL stack or offset the Tokens so all are visible
7. THE Board SHALL render responsively, fitting within a mobile phone screen in portrait orientation

### Requirement 3: Dice Rolling Mechanics

**User Story:** As a Player, I want to tap to roll dice with an animation, so that the game feels interactive and fun.

#### Acceptance Criteria

1. WHEN it is a human Player's turn, THE Board_Game SHALL display a tap target to roll the Dice
2. WHEN the Player taps the roll button, THE Board_Game SHALL animate the two Dice with a rolling effect lasting between 1 and 2 seconds
3. WHEN the Dice animation completes, THE Board_Game SHALL display the result (each die showing 1-6) and calculate the total move distance
4. THE Dice SHALL generate each die value using a uniform random distribution between 1 and 6
5. WHEN a Bot_Player's turn begins, THE Board_Game SHALL automatically roll the Dice after a 1-second delay

### Requirement 4: Movement and Question Challenge

**User Story:** As a Player, I want to answer a question correctly to move to my target tile, so that learning is integrated into every move.

#### Acceptance Criteria

1. WHEN the Dice result is determined, THE Board_Game SHALL calculate the target Tile (current position + dice total) and highlight it on the Board with a pulsing animation
2. WHEN the target Tile is highlighted, THE Board_Game SHALL wait for the Player to tap the highlighted Tile to confirm the move
3. WHEN the Player taps the highlighted target Tile, THE Board_Game SHALL display the Question_Popup with a question fetched from the /api/questions endpoint matching the configured subject and difficulty
4. WHEN the Player answers the question correctly, THE Board_Game SHALL animate the Token moving tile-by-tile from the current position to the target Tile
5. WHEN the Player answers the question incorrectly, THE Board_Game SHALL keep the Token at its current position and display the correct answer briefly
6. IF the target Tile position exceeds the Finish_Tile, THEN THE Board_Game SHALL treat it as landing exactly on the Finish_Tile
7. THE Question_Popup SHALL display the question text and 4 answer options (A, B, C, D) with tap targets large enough for children (minimum 44x44px)
8. WHEN the Player answers (correct or incorrect), THE Board_Game SHALL log the answer to the server via POST /api/answers
9. WHEN a Player answers correctly AND the target Tile is occupied by another player's Token, THE Board_Game SHALL send the occupying Token back to position 0 (starting tile) with a kick animation and notification (e.g., "🦶 Đá [tên] về vạch xuất phát!")
10. WHEN a Token is kicked back to start, THE Board_Game SHALL play a sound effect and display a brief animation showing the kicked Token flying back

### Requirement 5: Special Tile Effects

**User Story:** As a Player, I want bonus and trap tiles to create surprises during the game, so that each round feels unpredictable.

#### Acceptance Criteria

1. WHEN a Token lands on a Star_Tile after a correct answer, THE Board_Game SHALL grant a bonus of advancing 2 additional tiles forward without requiring another question
2. WHEN a Token lands on a Trap_Tile after a correct answer, THE Board_Game SHALL move the Token backward 3 tiles from the landing position
3. WHEN a bonus or trap effect would move a Token past the start or before position 0, THE Board_Game SHALL clamp the Token position to the nearest valid boundary (position 0 or Finish_Tile)
4. THE Board_Game SHALL display a brief animation and sound effect when a Star_Tile or Trap_Tile effect is triggered
5. THE Board_Game SHALL show a notification text explaining the bonus or trap effect to the Player (e.g., "⭐ Tiến thêm 2 ô!" or "⚠️ Lùi 3 ô!")

### Requirement 6: Turn-Based Gameplay Flow

**User Story:** As a Player, I want clear turn indicators and smooth transitions, so that I always know whose turn it is.

#### Acceptance Criteria

1. THE Turn_Indicator SHALL display the current player's name, Token color, and a visual highlight
2. WHEN a player's turn ends (after answering a question or being affected by a special tile), THE Board_Game SHALL advance to the next player's turn in clockwise order
3. WHEN it is a Bot_Player's turn, THE Board_Game SHALL automatically roll dice, display the question briefly (1.5 seconds), and then reveal the bot's answer
4. THE Bot_Player SHALL answer questions correctly with a probability of 60% on easy, 45% on medium, and 30% on hard difficulty
5. WHILE a Player's turn is active, THE Board_Game SHALL highlight that player's Token on the Board
6. THE Board_Game SHALL disable dice rolling and answer buttons for players whose turn it is not

### Requirement 7: Win Condition and Victory Screen

**User Story:** As a Player, I want a satisfying victory celebration when I win, so that reaching the finish feels rewarding.

#### Acceptance Criteria

1. WHEN a Token reaches the Finish_Tile, THE Board_Game SHALL declare that player as the winner and end the Game_Session
2. WHEN a winner is declared, THE Board_Game SHALL display a victory screen with confetti animation and the winner's name and Token color
3. THE victory screen SHALL display game statistics: total turns taken, questions answered correctly, questions answered incorrectly
4. THE victory screen SHALL provide buttons to "Chơi lại" (Play Again) and "Về trang chủ" (Go Home)
5. WHEN the game ends, THE Board_Game SHALL save the session to the server via POST /api/sessions with player_id, score (tiles advanced), total_questions, and correct_answers

### Requirement 8: Bot Player Behavior

**User Story:** As a Player, I want to play against bots when no friends are available, so that I can practice alone.

#### Acceptance Criteria

1. THE Bot_Player SHALL have a visible name displayed as "Bot 1", "Bot 2", or "Bot 3" depending on slot position
2. WHEN it is a Bot_Player's turn, THE Board_Game SHALL simulate dice rolling with the same animation as human players
3. WHEN a Bot_Player faces a question, THE Board_Game SHALL display the question on screen briefly before revealing the bot's answer
4. WHEN the Bot_Player answers incorrectly, THE Board_Game SHALL keep the bot's Token at its current position (same rule as human players)
5. THE Bot_Player SHALL introduce a brief delay (1-2 seconds) between actions to feel natural and allow the human Player to follow

### Requirement 9: Question Fetching and Caching

**User Story:** As a Player, I want questions to load quickly without noticeable delay, so that the game flow remains smooth.

#### Acceptance Criteria

1. WHEN the Game_Session starts, THE Board_Game SHALL pre-fetch a batch of 20 questions from /api/questions matching the configured subject and difficulty
2. WHEN the cached questions fall below 5 remaining, THE Board_Game SHALL fetch another batch of 20 questions in the background
3. IF the question fetch fails due to network error, THEN THE Board_Game SHALL retry once after 2 seconds and display a loading indicator
4. IF questions cannot be loaded after retry, THEN THE Board_Game SHALL display an error message and offer to return to the setup screen
5. THE Board_Game SHALL not repeat a question within the same Game_Session until all fetched questions have been used

### Requirement 10: Progress Saving

**User Story:** As a Player, I want my game stats tracked, so that my parents can see how I'm learning through the board game.

#### Acceptance Criteria

1. WHEN a Game_Session ends, THE Board_Game SHALL save progress via PUT /api/players/:id/progress/v5 containing games_played, total_correct, total_questions, and wins count
2. THE Board_Game SHALL accumulate progress data across multiple Game_Sessions (not overwrite previous data)
3. WHEN a Game_Session ends, THE Board_Game SHALL log the session via POST /api/sessions with game mode identifier "v5"
4. THE Board_Game SHALL record each answer during gameplay via POST /api/answers for detailed analytics in the Admin_Panel

### Requirement 11: Visual Design and Animations

**User Story:** As a Player, I want a colorful, animated game board with cute characters, so that the game is fun and appealing for young children.

#### Acceptance Criteria

1. THE Board_Game SHALL use bright, high-contrast colors suitable for children aged 7-8
2. THE Board_Game SHALL render Token movement as a smooth tile-by-tile animation (not teleportation)
3. THE Board_Game SHALL display dice rolling with a CSS/JS animation showing tumbling dice faces
4. THE Board_Game SHALL use emoji or simple SVG illustrations for tokens and special tiles
5. THE Board_Game SHALL play sound effects via Web Audio API for dice rolling, correct answer, wrong answer, landing on special tiles, and victory
6. THE Board_Game SHALL display the victory screen with a particle/confetti animation effect
7. THE Board_Game SHALL use the Nunito font family consistent with the rest of the Học Vui platform

### Requirement 12: Responsive Layout and Accessibility

**User Story:** As a Player, I want to play comfortably on my parent's phone, so that the board and controls are easy to see and tap.

#### Acceptance Criteria

1. THE Board_Game SHALL render the Board, dice area, and question popup within a single mobile viewport without requiring scrolling during gameplay
2. THE Board_Game SHALL ensure all interactive elements (dice button, answer options, navigation buttons) have a minimum touch target of 44x44px
3. THE Board_Game SHALL support safe-area-inset for devices with notches or rounded corners
4. THE Board_Game SHALL display readable text at a minimum size of 16px for question text and 14px for UI labels
5. THE Board_Game SHALL maintain usability on screen widths from 320px to 768px
