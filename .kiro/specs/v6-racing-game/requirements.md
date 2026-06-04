# Requirements Document

## Introduction

V6 Racing Game ("Đua Xe Trí Tuệ") is a new game mode for the "Học Vui" educational app. Two players race cars along a track by answering quiz questions correctly. Unlike the existing V3 Local Duel (which uses a score-based system), V6 uses a visual racing track where cars physically advance toward a finish line. The first car to cross the finish line wins.

This mode is designed for 2 players on the **same device** (like V3), targeting Vietnamese grade-2 students (7-8 years old). The racing metaphor provides a more exciting, visually engaging experience with spatial progress feedback that young children intuitively understand.

**Key Differentiators from V3 Local Duel:**
- Visual racing track with animated cars instead of numeric scores
- Position-based progress (cars moving forward) instead of point accumulation
- Speed bonus mechanic: answering faster = car moves further
- Obstacles and boost items on the track for added excitement
- Win by reaching finish line first (not by highest score after N rounds)

## Glossary

- **Race_Engine**: The core game logic module that manages race state, car positions, question flow, and win detection
- **Track_Renderer**: The visual component that draws the racing track, car positions, and animations
- **Car**: A player's avatar on the racing track, represented as an emoji or SVG vehicle
- **Track**: A horizontal or vertical lane showing the race course from start to finish
- **Tile**: One unit of progress on the track (the track consists of a fixed number of tiles)
- **Boost**: An extra tile advancement awarded for answering faster than the opponent
- **Obstacle**: A penalty (lose 1 tile) triggered when a player answers incorrectly
- **Finish_Line**: The final tile on the track; the first car to reach or pass it wins
- **Round**: One question-answer cycle where both players answer the same question
- **Setup_Screen**: The initial screen where players configure the race (names, subject, difficulty, track length)
- **Race_Screen**: The main game screen showing the track, cars, question, and answer buttons
- **Result_Screen**: The final screen showing the winner, stats, and replay option

## Requirements

### Requirement 1: Game Setup

**User Story:** As a player, I want to configure the race settings before starting, so that I can choose my preferred subject and difficulty.

#### Acceptance Criteria

1. THE Setup_Screen SHALL display input fields for Player 1 name and Player 2 name with default values "Xe Đỏ" and "Xe Xanh"
2. THE Setup_Screen SHALL display subject selection options: Toán (math), Tiếng Việt (vietnamese), and Trộn (mix)
3. THE Setup_Screen SHALL display difficulty selection options: Dễ (easy), Vừa (medium), and Khó (hard)
4. THE Setup_Screen SHALL display track length selection options: Ngắn (10 tiles), Vừa (15 tiles), and Dài (20 tiles)
5. WHEN a player taps the start button, THE Race_Engine SHALL fetch questions from the API using the selected subject and difficulty parameters
6. THE Setup_Screen SHALL auto-fill Player 1 name from the stored player profile if one exists in localStorage

### Requirement 2: Race Track Display

**User Story:** As a player, I want to see a visual racing track with cars, so that I can understand my progress in the race.

#### Acceptance Criteria

1. THE Track_Renderer SHALL display two parallel horizontal lanes, one per player, with distinct car colors (red for Player 1, blue for Player 2)
2. THE Track_Renderer SHALL display tile markers along each lane showing the total track length
3. THE Track_Renderer SHALL display a checkered Finish_Line at the end of the track
4. THE Track_Renderer SHALL display each Car at its current tile position within its lane
5. WHEN a Car advances, THE Track_Renderer SHALL animate the car moving smoothly to its new tile position
6. THE Track_Renderer SHALL scroll the track view to keep both cars visible when the track extends beyond the screen width

### Requirement 3: Question and Answer Flow

**User Story:** As a player, I want to answer questions to move my car forward, so that I can race to the finish line.

#### Acceptance Criteria

1. WHEN a Round starts, THE Race_Engine SHALL display one question with four answer options (A, B, C, D) below the track
2. THE Race_Engine SHALL provide each player with their own set of four answer buttons, visually separated (Player 1 on the left, Player 2 on the right)
3. WHEN a player selects an answer, THE Race_Engine SHALL lock that player's buttons and show a "Đã trả lời" confirmation
4. WHEN both players have answered, THE Race_Engine SHALL resolve the round immediately
5. WHEN the 15-second timer expires, THE Race_Engine SHALL auto-resolve the round treating unanswered players as incorrect
6. THE Race_Engine SHALL display a countdown timer (15 seconds) visible to both players during each round

### Requirement 4: Car Movement Rules

**User Story:** As a player, I want my car to move when I answer correctly and get a bonus for being fast, so that speed and accuracy are both rewarded.

#### Acceptance Criteria

1. WHEN a player answers correctly, THE Race_Engine SHALL advance that player's Car by 2 tiles
2. WHEN a player answers correctly and faster than the opponent, THE Race_Engine SHALL award a Boost of 1 additional tile (total 3 tiles)
3. WHEN a player answers incorrectly, THE Race_Engine SHALL not advance that player's Car
4. WHEN both players answer incorrectly, THE Race_Engine SHALL advance both cars by 1 tile to prevent stalling
5. IF a player does not answer before the timer expires, THEN THE Race_Engine SHALL treat that player's response as incorrect

### Requirement 5: Obstacle Mechanic

**User Story:** As a player, I want occasional obstacles on the track to add surprise and excitement to the race.

#### Acceptance Criteria

1. THE Race_Engine SHALL place obstacle markers at random tile positions (excluding the first 2 tiles and the Finish_Line tile) when the race starts
2. WHEN a Car lands on or passes an Obstacle tile, THE Track_Renderer SHALL display an obstacle animation (pothole or banana peel emoji)
3. WHEN a Car lands on an Obstacle tile, THE Race_Engine SHALL move that Car back by 1 tile (minimum position is tile 0)
4. THE Race_Engine SHALL place obstacles on approximately 20% of tiles, with a minimum of 2 obstacles and maximum of 5 obstacles per track

### Requirement 6: Win Condition and Race End

**User Story:** As a player, I want a clear winner declaration when someone crosses the finish line, so that the race has a satisfying conclusion.

#### Acceptance Criteria

1. WHEN a Car's position reaches or exceeds the Finish_Line tile, THE Race_Engine SHALL immediately end the race and declare that player the winner
2. WHEN both Cars reach the Finish_Line in the same round, THE Race_Engine SHALL declare the player who answered faster as the winner
3. WHEN the race ends, THE Result_Screen SHALL display the winner's name with a celebration animation and trophy emoji
4. WHEN the race ends, THE Result_Screen SHALL display race statistics: total rounds played, correct answers per player, and average response time per player
5. THE Result_Screen SHALL provide a "Chơi lại" (Play Again) button that returns to the Setup_Screen
6. THE Result_Screen SHALL provide a "Về trang chủ" (Home) button that navigates to the main home page

### Requirement 7: Question Fetching and Fallback

**User Story:** As a developer, I want the game to handle API failures gracefully, so that kids can still play even with connectivity issues.

#### Acceptance Criteria

1. WHEN the race starts, THE Race_Engine SHALL fetch at least 30 questions from the API endpoint `/api/questions` with the configured subject, difficulty, and limit parameters
2. IF the API request fails, THEN THE Race_Engine SHALL generate fallback math questions locally (simple addition/subtraction within 100)
3. IF the fetched questions run out during a race, THEN THE Race_Engine SHALL fetch additional questions from the API
4. THE Race_Engine SHALL shuffle the fetched questions before presenting them to players

### Requirement 8: Visual Feedback and Engagement

**User Story:** As a young player, I want fun animations and sounds so that the game feels exciting and rewarding.

#### Acceptance Criteria

1. WHEN a player answers correctly, THE Track_Renderer SHALL display a brief positive visual effect (star burst) near that player's car
2. WHEN a player receives a Boost, THE Track_Renderer SHALL display a speed-line animation on that player's car
3. WHEN the race ends, THE Track_Renderer SHALL display a celebration animation (confetti or fireworks) for the winner
4. THE Track_Renderer SHALL display car emojis (🚗 for Player 1, 🚙 for Player 2) as the player avatars on the track
5. WHEN an Obstacle triggers, THE Track_Renderer SHALL briefly shake the affected car element

### Requirement 9: Responsive Layout

**User Story:** As a player, I want the game to work well on both phones and tablets, so that I can play on any device.

#### Acceptance Criteria

1. THE Track_Renderer SHALL display the track horizontally on screens wider than 500px and vertically on narrower screens
2. THE Race_Screen SHALL arrange Player 1 buttons on the left side and Player 2 buttons on the right side on wide screens
3. THE Race_Screen SHALL stack Player 1 buttons above Player 2 buttons on narrow screens (below 500px width)
4. THE Setup_Screen SHALL be usable on screens as narrow as 320px without horizontal scrolling

### Requirement 10: Integration with App Navigation

**User Story:** As a player, I want to access V6 Racing from the home page, so that I can easily find and start the game.

#### Acceptance Criteria

1. THE Race_Engine SHALL be deployed as a self-contained bundle at the path `/v6/` containing index.html, game.js, and style.css
2. THE home page SHALL include a navigation card for V6 Racing with the icon 🏎️, title "Đua Xe Trí Tuệ", and description "Ai về đích trước thắng!"
3. WHEN a player without a stored profile navigates to `/v6/`, THE Setup_Screen SHALL redirect that player to the home page for profile creation
