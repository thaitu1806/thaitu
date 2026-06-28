CREATE TABLE IF NOT EXISTS questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subject TEXT NOT NULL CHECK(subject IN ('math', 'vietnamese', 'english')),
  difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK(correct_answer IN ('a', 'b', 'c', 'd')),
  explanation TEXT,
  grade INTEGER DEFAULT 2,
  source TEXT DEFAULT 'manual',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  total_stars INTEGER DEFAULT 0,
  current_level_math INTEGER DEFAULT 1,
  current_level_viet INTEGER DEFAULT 1,
  adventure_level INTEGER DEFAULT 1,
  grade INTEGER DEFAULT 2,
  total_diamonds INTEGER DEFAULT 0,
  lifetime_diamonds INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date TEXT,
  equipped_avatar TEXT,
  equipped_frame TEXT,
  link_code TEXT DEFAULT NULL,
  link_status TEXT DEFAULT 'unlinked' CHECK(link_status IN ('unlinked', 'prompted', 'linked')),
  last_prompt_date TEXT DEFAULT NULL,
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_players_link_code ON players(link_code);

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

-- Daily Quest & Reward Shop System Tables

CREATE TABLE IF NOT EXISTS daily_quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  quest_type TEXT NOT NULL,
  quest_description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  current_value INTEGER DEFAULT 0,
  diamond_reward INTEGER NOT NULL,
  is_completed INTEGER DEFAULT 0,
  quest_date TEXT NOT NULL,
  completed_at DATETIME DEFAULT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_daily_quests_player_date ON daily_quests(player_id, quest_date);

CREATE TABLE IF NOT EXISTS shop_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT NOT NULL CHECK(category IN ('avatar', 'frame', 'sticker', 'powerup', 'voucher')),
  price_diamonds INTEGER NOT NULL,
  min_level TEXT DEFAULT 'bronze' CHECK(min_level IN ('bronze', 'silver', 'gold', 'diamond', 'master')),
  image_url TEXT DEFAULT NULL,
  is_active INTEGER DEFAULT 1,
  max_per_week INTEGER DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shop_items_category ON shop_items(category);

CREATE TABLE IF NOT EXISTS player_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_equipped INTEGER DEFAULT 0,
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (item_id) REFERENCES shop_items(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_player ON player_inventory(player_id);

CREATE TABLE IF NOT EXISTS diamond_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('earn', 'spend')),
  source TEXT NOT NULL CHECK(source IN ('answer', 'quest', 'streak', 'level_up', 'shop', 'all_quests_bonus')),
  reference_id INTEGER DEFAULT NULL,
  description TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_diamond_tx_player ON diamond_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_diamond_tx_created ON diamond_transactions(created_at);

CREATE TABLE IF NOT EXISTS reward_vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME DEFAULT NULL,
  admin_note TEXT DEFAULT NULL,
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (item_id) REFERENCES shop_items(id)
);

CREATE INDEX IF NOT EXISTS idx_vouchers_status ON reward_vouchers(status);
CREATE INDEX IF NOT EXISTS idx_vouchers_player ON reward_vouchers(player_id);

-- Parent Dashboard Tables

CREATE TABLE IF NOT EXISTS parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  display_name TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parent_children (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  linked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(parent_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_children_parent ON parent_children(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_children_player ON parent_children(player_id);

-- Multi-Grade & AI Integration Tables

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  feature TEXT NOT NULL CHECK(feature IN ('explain', 'hint', 'chat', 'generate')),
  tokens_used INTEGER DEFAULT 0,
  prompt_hash TEXT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_player_date ON ai_usage_logs(player_id, created_at);

-- Parent-created Rewards ("Quà từ bố mẹ")
-- Parents define real-life rewards (e.g. "Đi công viên") that their child can
-- redeem with diamonds. A redemption creates a claim the parent fulfills.

CREATE TABLE IF NOT EXISTS parent_rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '🎁',
  price_diamonds INTEGER NOT NULL DEFAULT 50,
  max_per_week INTEGER DEFAULT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE INDEX IF NOT EXISTS idx_parent_rewards_player ON parent_rewards(player_id, is_active);

CREATE TABLE IF NOT EXISTS parent_reward_claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reward_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  parent_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '🎁',
  price_diamonds INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'fulfilled')),
  claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  fulfilled_at DATETIME DEFAULT NULL,
  FOREIGN KEY (reward_id) REFERENCES parent_rewards(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  FOREIGN KEY (parent_id) REFERENCES parents(id)
);

CREATE INDEX IF NOT EXISTS idx_parent_reward_claims_parent ON parent_reward_claims(parent_id, status);
CREATE INDEX IF NOT EXISTS idx_parent_reward_claims_player ON parent_reward_claims(player_id);
