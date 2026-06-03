CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL CHECK(subject IN ('math', 'vietnamese')),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK(correct_answer IN ('a', 'b', 'c', 'd')),
  explanation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  total_stars INTEGER DEFAULT 0,
  current_level_math INTEGER DEFAULT 1,
  current_level_viet INTEGER DEFAULT 1,
  adventure_level INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  stars_earned INTEGER DEFAULT 0,
  combo_max INTEGER DEFAULT 0,
  played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE IF NOT EXISTS answer_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  selected_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0,
  time_spent_ms INTEGER DEFAULT 0,
  answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE INDEX IF NOT EXISTS idx_questions_subject_difficulty ON questions(subject, difficulty);
CREATE INDEX IF NOT EXISTS idx_sessions_player ON game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_answer_logs_player ON answer_logs(player_id);
CREATE INDEX IF NOT EXISTS idx_answer_logs_question ON answer_logs(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_logs_session ON answer_logs(session_id);

CREATE TABLE IF NOT EXISTS exams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subject TEXT NOT NULL CHECK(subject IN ('math', 'vietnamese', 'mix')),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard', 'mix')),
  total_questions INTEGER NOT NULL DEFAULT 10,
  time_limit_minutes INTEGER NOT NULL DEFAULT 15,
  question_ids TEXT NOT NULL DEFAULT '[]',
  created_by TEXT DEFAULT 'admin',
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exam_id INTEGER NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  answers_detail TEXT DEFAULT '[]',
  grade TEXT DEFAULT '',
  taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id)
);

CREATE INDEX IF NOT EXISTS idx_exam_results_exam ON exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_player ON exam_results(player_name);

CREATE TABLE IF NOT EXISTS player_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  game_mode TEXT NOT NULL DEFAULT 'v2',
  progress_data TEXT NOT NULL DEFAULT '{}',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(player_id, game_mode)
);

CREATE INDEX IF NOT EXISTS idx_progress_player ON player_progress(player_id, game_mode);
