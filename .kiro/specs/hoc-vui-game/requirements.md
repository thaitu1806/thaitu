# Requirements Document

## Introduction

Học Vui (Learn Fun) is a web-based educational game platform designed for a 7-year-old child transitioning from grade 1 to grade 2 in Vietnam. The platform combines Plants vs Zombies-style gameplay with Math and Vietnamese language learning. It features multiple game modes (classic, adventure, duel, online), interactive learning modules, exam testing, and a parent-facing admin panel. The platform is mobile-first, uses vanilla HTML/CSS/JS, and deploys on Vercel with Turso database.

## Glossary

- **Game_Platform**: The overall Học Vui web application including all game modes, learning modules, and admin features
- **Home_Page**: The main landing page with game mode selector cards
- **Classic_Mode**: V1 single-player game where player chooses subject and difficulty, answers questions to shoot zombies
- **Adventure_Mode**: V2 mode with 50-level world map, plant unlocks, daily quests, and power-ups
- **Duel_Mode**: V3 two-player mode on same device with split screen (P1 rotated 180° on top, P2 on bottom)
- **Online_Mode**: V4 two-player mode on separate phones connected via room codes
- **Learn_Module**: Interactive lesson system with visual explanations and practice quizzes
- **Exam_Mode**: Timed tests created by parents with grading and history
- **Admin_Panel**: Parent-facing management interface for questions, exams, players, and analytics
- **Question_Bank**: Database of ~557+ seed questions across 6 categories (math easy/medium/hard, vietnamese easy/medium/hard)
- **Question_Generator**: Algorithmic system in admin that creates unlimited questions by type
- **Player**: A child user who plays the game
- **Timer_System**: Configurable speed (slow/normal/fast) that controls zombie approach rate and answer time
- **Combo_System**: Streak-based bonus multiplier for consecutive correct answers
- **Power_Up**: Special items in Adventure_Mode (eliminate wrong answer, freeze zombie, double points)
- **Daily_Quest**: Daily missions in Adventure_Mode that reward coins/stars
- **Answer_Log**: Record of each player answer including question, selection, correctness, and time spent
- **Polling_System**: HTTP polling mechanism used for Online_Mode on Vercel (no WebSocket support)
- **WebSocket_System**: Real-time connection used for Online_Mode in local development

## Requirements

### Requirement 1: Home Page Navigation

**User Story:** As a Player, I want to see all available game modes on one page, so that I can quickly choose how to learn today.

#### Acceptance Criteria

1. THE Home_Page SHALL display 6 game mode cards: Kiến Thức (Learn), Luyện Tập (Classic), Phòng Thi (Exam), Phiêu Lưu (Adventure), Đấu 2 Bạn (Duel), and Đấu Online (Online)
2. WHEN a Player taps a game mode card, THE Home_Page SHALL navigate to the corresponding game mode page
3. THE Home_Page SHALL display an admin link labeled "Quản lý (bố mẹ)" at the bottom of the page
4. THE Home_Page SHALL render in a mobile-first layout with cards stacked vertically on screens narrower than 500px
5. WHEN the screen width is 500px or wider, THE Home_Page SHALL display game mode cards in a 2-column grid layout

### Requirement 2: Classic Mode Gameplay (V1)

**User Story:** As a Player, I want to answer questions to shoot zombies, so that I can practice Math and Vietnamese in a fun way.

#### Acceptance Criteria

1. WHEN starting Classic_Mode, THE Game_Platform SHALL prompt the Player to select a subject (Math or Vietnamese) and difficulty level (easy, medium, or hard)
2. WHEN a game session starts, THE Classic_Mode SHALL fetch questions from the Question_Bank matching the selected subject and difficulty
3. WHEN a question is displayed, THE Classic_Mode SHALL show the question text and 4 answer options (A, B, C, D)
4. WHEN the Player selects the correct answer, THE Classic_Mode SHALL animate a projectile shooting at the zombie and increment the score
5. WHEN the Player selects an incorrect answer, THE Classic_Mode SHALL advance the zombie closer to the player's base
6. IF the zombie reaches the player's base, THEN THE Classic_Mode SHALL end the game session and display the final score
7. WHILE a question is active, THE Timer_System SHALL count down according to the configured speed (slow/normal/fast)
8. IF the timer expires before the Player answers, THEN THE Classic_Mode SHALL treat it as an incorrect answer
9. WHEN the Player answers correctly in succession, THE Combo_System SHALL increase the score multiplier
10. THE Classic_Mode SHALL log each answer to the Answer_Log with question_id, selected_answer, correct_answer, is_correct, and time_spent_ms

### Requirement 3: Adventure Mode (V2)

**User Story:** As a Player, I want to progress through levels on a world map, so that I feel a sense of achievement and unlock new plants.

#### Acceptance Criteria

1. THE Adventure_Mode SHALL display a world map with 50 levels organized in zones
2. WHEN a Player completes a level with 1 or more stars, THE Adventure_Mode SHALL unlock the next level on the map
3. WHEN starting a level, THE Adventure_Mode SHALL present waves of zombies that the Player defeats by answering questions correctly
4. THE Adventure_Mode SHALL award 1 to 3 stars per level based on accuracy and combo performance
5. WHEN specific levels are completed, THE Adventure_Mode SHALL unlock new plant characters for the Player
6. THE Adventure_Mode SHALL provide a daily quest system with missions that reward coins and stars
7. WHILE in battle, THE Adventure_Mode SHALL display power-ups (eliminate wrong answer, freeze zombie 5s, double points) with limited uses per level
8. WHEN a Player uses the "eliminate" power-up, THE Adventure_Mode SHALL remove one incorrect answer option from the current question
9. WHEN a Player uses the "freeze" power-up, THE Adventure_Mode SHALL pause zombie movement for 5 seconds
10. WHEN a Player uses the "double points" power-up, THE Adventure_Mode SHALL award 2x points for the current question
11. IF the Player loses all health points, THEN THE Adventure_Mode SHALL display a game-over screen with option to retry or return to map
12. THE Adventure_Mode SHALL allow the Player to configure timer speed (slow/normal/fast) at the start screen

### Requirement 4: Duel Mode (V3) - Same Device

**User Story:** As a Player, I want to compete with a friend on the same phone, so that we can learn together face-to-face.

#### Acceptance Criteria

1. THE Duel_Mode SHALL render a split-screen interface with Player 1 on the top half (rotated 180°) and Player 2 on the bottom half
2. WHEN a round starts, THE Duel_Mode SHALL display the same question to both players simultaneously
3. WHEN a Player answers correctly, THE Duel_Mode SHALL advance that player's projectile toward the opponent's zombie
4. WHEN a Player answers incorrectly, THE Duel_Mode SHALL advance the opponent's zombie toward that player's base
5. WHEN one player's zombie reaches their base, THE Duel_Mode SHALL declare the other player as the winner
6. THE Duel_Mode SHALL display each player's score, combo streak, and remaining health independently
7. THE Duel_Mode SHALL use questions from mixed subjects and difficulties for balanced competition

### Requirement 5: Online Mode (V4) - Separate Devices

**User Story:** As a Player, I want to compete with a friend on separate phones, so that we can play remotely.

#### Acceptance Criteria

1. WHEN a Player creates a room, THE Online_Mode SHALL generate a unique 4-character room code and display it for sharing
2. WHEN a second Player enters a valid room code, THE Online_Mode SHALL connect both players to the same game session
3. WHILE deployed on Vercel, THE Online_Mode SHALL use HTTP polling to synchronize game state between players
4. WHILE running locally, THE Online_Mode SHALL use WebSocket connections for real-time synchronization
5. WHEN both players are connected, THE Online_Mode SHALL start the game with synchronized questions
6. WHEN a Player answers a question, THE Online_Mode SHALL update both players' screens with the result
7. IF a Player disconnects during a game, THEN THE Online_Mode SHALL notify the other player and pause the game
8. THE Online_Mode SHALL determine the winner based on score when all questions are answered

### Requirement 6: Learn Module - Interactive Lessons

**User Story:** As a Player, I want to learn Math concepts through visual explanations and hands-on activities, so that I understand before practicing.

#### Acceptance Criteria

1. THE Learn_Module SHALL provide 6 topic areas: Clock (Đồng Hồ), Measurement (Đo Lường), Multiplication Tables (Bảng Nhân), Addition with Carry (Cộng Có Nhớ), Shapes (Hình Học), and Vietnamese Money (Tiền Việt Nam)
2. WHEN a Player selects a topic, THE Learn_Module SHALL display a multi-slide lesson with visual explanations
3. THE Learn_Module SHALL provide navigation controls (previous, next, page dots) for moving between lesson slides
4. WHEN the Player reaches the Clock interactive activity, THE Learn_Module SHALL display an SVG clock with draggable hour and minute hands
5. WHEN the Player drags a clock hand, THE Learn_Module SHALL update the clock display in real-time showing the current time
6. WHEN the Player taps "Kiểm tra" (Check) in the clock activity, THE Learn_Module SHALL compare the set time with the target time and display correct/incorrect feedback
7. WHEN a lesson is completed, THE Learn_Module SHALL offer a practice quiz on the topic covered
8. THE Learn_Module SHALL track correct and incorrect answers in the interactive activities

### Requirement 7: Exam Mode

**User Story:** As a parent, I want to create timed tests for my child, so that I can assess their knowledge and track progress.

#### Acceptance Criteria

1. THE Exam_Mode SHALL display a list of active exams available to the Player
2. WHEN a Player starts an exam, THE Exam_Mode SHALL display questions one at a time with a countdown timer based on the exam's time_limit_minutes setting
3. WHEN the Player submits an answer, THE Exam_Mode SHALL record the answer and advance to the next question
4. WHEN all questions are answered or time expires, THE Exam_Mode SHALL calculate the score and assign a letter grade (A+ for ≥95%, A for ≥85%, B for ≥70%, C for ≥55%, D for ≥40%, F for <40%)
5. THE Exam_Mode SHALL store exam results including score, correct_answers, total_questions, time_spent_seconds, and detailed answer records
6. WHEN an exam is completed, THE Exam_Mode SHALL display the result with grade, score, and time spent
7. THE Exam_Mode SHALL allow reviewing past exam results with answer details

### Requirement 8: Admin Panel - Question Management

**User Story:** As a parent, I want to manage the question bank easily, so that my child always has fresh and appropriate questions.

#### Acceptance Criteria

1. THE Admin_Panel SHALL be protected by basic authentication (username and password)
2. THE Admin_Panel SHALL provide a question generator that creates questions algorithmically by subject (Math/Vietnamese), difficulty (easy/medium/hard), and type
3. WHEN the parent configures generation parameters and clicks generate, THE Question_Generator SHALL create the specified number of questions and display a preview
4. WHEN the parent confirms the preview, THE Admin_Panel SHALL save all generated questions to the Question_Bank
5. THE Admin_Panel SHALL provide a manual question entry form with fields for subject, difficulty, question text, 4 options, correct answer, and optional explanation
6. THE Admin_Panel SHALL provide a filterable list view of all questions in the Question_Bank with pagination
7. THE Admin_Panel SHALL allow deleting individual questions from the Question_Bank

### Requirement 9: Admin Panel - Exam Management

**User Story:** As a parent, I want to create and manage exams, so that I can test my child on specific topics.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide an exam creation form with fields for title, subject, difficulty, number of questions, and time limit
2. WHEN creating an exam, THE Admin_Panel SHALL automatically select questions from the Question_Bank matching the specified subject and difficulty
3. THE Admin_Panel SHALL display a list of all created exams with their status (active/inactive)
4. THE Admin_Panel SHALL allow viewing exam results for each exam including player names, scores, and grades
5. THE Admin_Panel SHALL allow toggling exam active status

### Requirement 10: Admin Panel - Player Analytics

**User Story:** As a parent, I want to see my child's strengths and weaknesses, so that I can guide their learning.

#### Acceptance Criteria

1. THE Admin_Panel SHALL display a list of all registered players with their total stars and current levels
2. WHEN a parent selects a player, THE Admin_Panel SHALL display detailed analytics including game sessions, accuracy rates, and subject performance breakdown
3. THE Admin_Panel SHALL identify weak areas by analyzing answer logs to find question categories with low accuracy
4. THE Admin_Panel SHALL display session history showing date, subject, difficulty, score, and accuracy for each game played
5. THE Admin_Panel SHALL show overall statistics including total questions in the bank, total sessions played, and average accuracy

### Requirement 11: Question Bank and Seeding

**User Story:** As a parent, I want a rich pre-built question bank, so that the game works immediately without manual setup.

#### Acceptance Criteria

1. THE Question_Bank SHALL contain seed questions across 6 categories: math-easy, math-medium, math-hard, vietnamese-easy, vietnamese-medium, and vietnamese-hard
2. THE Question_Bank SHALL store each question with: subject, difficulty, question_text, 4 options (a/b/c/d), correct_answer, and optional explanation
3. THE Game_Platform SHALL support both SQLite (local development via better-sqlite3) and Turso (production via @libsql/client) as database backends
4. THE Game_Platform SHALL provide seed scripts that populate the Question_Bank with initial questions for both local and production databases

### Requirement 12: Timer and Difficulty System

**User Story:** As a Player, I want to adjust the game speed, so that I can play at a comfortable pace while learning.

#### Acceptance Criteria

1. THE Timer_System SHALL offer 3 speed settings: slow (more time to answer), normal, and fast (challenging)
2. WHEN the Player selects "slow" speed, THE Timer_System SHALL provide extended time per question
3. WHEN the Player selects "fast" speed, THE Timer_System SHALL provide reduced time per question creating higher difficulty
4. THE Timer_System SHALL be configurable at the start of Classic_Mode and Adventure_Mode game sessions
5. THE Timer_System SHALL display a visual countdown indicator during gameplay

### Requirement 13: Sound Effects and Visual Feedback

**User Story:** As a Player, I want fun sounds and animations when I play, so that the game feels exciting and rewarding.

#### Acceptance Criteria

1. THE Game_Platform SHALL play sound effects using the Web Audio API for game events (correct answer, wrong answer, shooting, zombie defeat, combo)
2. WHEN the Player answers correctly, THE Game_Platform SHALL display particle effects celebrating the correct answer
3. WHEN the Player achieves a combo streak, THE Game_Platform SHALL display a combo counter with escalating visual feedback
4. THE Game_Platform SHALL display score bonuses with animated floating text when bonus points are awarded

### Requirement 14: Mobile-First Responsive Design

**User Story:** As a Player, I want to play on my parent's phone comfortably, so that I can learn anywhere.

#### Acceptance Criteria

1. THE Game_Platform SHALL use a mobile-first responsive design optimized for phone screens
2. THE Game_Platform SHALL use the Nunito font family for all text rendering
3. THE Game_Platform SHALL support safe-area-inset for devices with notches or rounded corners
4. THE Game_Platform SHALL ensure all tap targets are large enough for a child's fingers (minimum 44x44px touch area)
5. THE Game_Platform SHALL render all game modes in portrait orientation optimized for phone usage

### Requirement 15: Answer Logging and Progress Tracking

**User Story:** As a parent, I want detailed records of my child's answers, so that I can understand their learning patterns.

#### Acceptance Criteria

1. WHEN a Player answers a question in any game mode, THE Game_Platform SHALL record the answer in the Answer_Log with session_id, player_id, question_id, selected_answer, correct_answer, is_correct, and time_spent_ms
2. THE Game_Platform SHALL maintain game session records including player_id, subject, difficulty, score, total_questions, correct_answers, stars_earned, and max_combo
3. THE Game_Platform SHALL maintain player profiles with cumulative stats including total_stars, current_level_math, and current_level_viet
4. WHEN the same question is answered incorrectly multiple times across sessions, THE Admin_Panel SHALL highlight it as a weakness area for that player


### Requirement 16: Deployment and Infrastructure

**User Story:** As a parent (developer), I want the app to deploy easily on Vercel, so that my child can access it from any device.

#### Acceptance Criteria

1. THE Game_Platform SHALL deploy as a Vercel application with serverless API functions and static frontend files
2. THE Game_Platform SHALL route API requests through /api/* paths to serverless functions
3. THE Game_Platform SHALL serve static files from the /public directory
4. THE Game_Platform SHALL support local development via Express server with SQLite database
5. THE Game_Platform SHALL support production deployment with Turso database using @libsql/client
6. IF the environment is Vercel production, THEN THE Online_Mode SHALL use HTTP polling instead of WebSocket for multiplayer synchronization

### Requirement 17: Future Enhancement - Vietnamese Lessons

**User Story:** As a Player, I want interactive Vietnamese language lessons, so that I can improve reading and writing alongside Math.

#### Acceptance Criteria

1. THE Learn_Module SHALL provide Vietnamese language topics including: vocabulary, sentence structure, reading comprehension, and spelling
2. WHEN a Player selects a Vietnamese topic, THE Learn_Module SHALL display age-appropriate visual lessons for a grade 2 student
3. THE Learn_Module SHALL include interactive exercises for Vietnamese such as drag-and-drop word ordering and fill-in-the-blank
4. WHEN a Vietnamese lesson is completed, THE Learn_Module SHALL offer a practice quiz on the topic covered

### Requirement 18: Future Enhancement - Progress Rewards and Motivation

**User Story:** As a Player, I want to earn rewards and see my progress, so that I stay motivated to learn every day.

#### Acceptance Criteria

1. THE Game_Platform SHALL award stars for completing game sessions based on accuracy (1-3 stars per session)
2. THE Game_Platform SHALL maintain a coin economy earned through gameplay that can be spent on cosmetic items
3. THE Game_Platform SHALL display streak tracking showing consecutive days the Player has practiced
4. WHEN the Player completes a daily quest in Adventure_Mode, THE Game_Platform SHALL award bonus coins and stars
5. THE Game_Platform SHALL display a progress dashboard showing the Player's advancement across all subjects and modes

### Requirement 19: Future Enhancement - Adaptive Difficulty

**User Story:** As a parent, I want the game to automatically adjust difficulty based on my child's performance, so that the challenge stays appropriate.

#### Acceptance Criteria

1. WHEN a Player consistently achieves above 90% accuracy at a given difficulty, THE Game_Platform SHALL suggest or automatically increase the difficulty level
2. WHEN a Player consistently scores below 50% accuracy at a given difficulty, THE Game_Platform SHALL suggest or automatically decrease the difficulty level
3. THE Game_Platform SHALL prioritize questions from weak areas identified in the Answer_Log when generating game sessions
4. THE Admin_Panel SHALL display adaptive difficulty recommendations based on player performance data

### Requirement 20: Future Enhancement - Offline Support

**User Story:** As a Player, I want to play without internet, so that I can learn during car rides or when there is no WiFi.

#### Acceptance Criteria

1. THE Game_Platform SHALL cache essential game assets (HTML, CSS, JS, fonts) for offline use via a Service Worker
2. THE Game_Platform SHALL pre-download a subset of questions from the Question_Bank for offline gameplay
3. WHEN the Player is offline, THE Classic_Mode and Learn_Module SHALL function using cached questions and lessons
4. WHEN internet connectivity is restored, THE Game_Platform SHALL sync offline answer logs and session data to the server
