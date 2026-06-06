import express from 'express';
import { createServer } from 'http';
import { initDb, getDb } from './db/database.js';
import { setupWebSocket } from './ws-server.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Basic auth for admin
function adminAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="Admin"');
    return res.status(401).send('Unauthorized');
  }
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  if (user === 'admin' && pass === 'admin') return next();
  res.set('WWW-Authenticate', 'Basic realm="Admin"');
  res.status(401).send('Unauthorized');
}

// Protect admin APIs only (not the HTML page)
app.use('/api/admin', adminAuth);

// Admin API - query param style (compatible with Vercel)
import adminHandler from './api/admin/index.js';
app.all('/api/admin', async (req, res) => {
  await adminHandler(req, res);
});

app.use(express.static(join(__dirname, 'public')));
app.use('/v2', express.static(join(__dirname, 'public/v2')));
app.use('/v3', express.static(join(__dirname, 'public/v3')));
app.use('/v4', express.static(join(__dirname, 'public/v4')));
app.use('/v5', express.static(join(__dirname, 'public/v5')));
app.use('/v6', express.static(join(__dirname, 'public/v6')));
app.use('/v7', express.static(join(__dirname, 'public/v7')));
app.use('/v8', express.static(join(__dirname, 'public/v8')));
app.use('/v9', express.static(join(__dirname, 'public/v9')));

// Home page -> game selector
app.get('/', (req, res) => res.sendFile(join(__dirname, 'public/home.html')));

// Initialize database
await initDb();

// Setup WebSocket for V4 online duel
setupWebSocket(server);

// Get random questions by subject and difficulty
app.get('/api/questions', async (req, res) => {
  const { subject, difficulty, limit = 10 } = req.query;
  const db = getDb();
  try {
    const result = await db.execute({
      sql: `SELECT * FROM questions WHERE subject = ? AND difficulty = ? ORDER BY RANDOM() LIMIT ?`,
      args: [subject, difficulty, parseInt(limit)],
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save game session
app.post('/api/sessions', async (req, res) => {
  const { player_id, subject, difficulty, score, total_questions, correct_answers, stars_earned, combo_max } = req.body;
  const db = getDb();
  try {
    const result = await db.execute({
      sql: `INSERT INTO game_sessions (player_id, subject, difficulty, score, total_questions, correct_answers, stars_earned, combo_max) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [player_id, subject, difficulty, score, total_questions, correct_answers, stars_earned, combo_max],
    });
    // Also update adventure_level from player_progress if available
    const prog = await db.execute({ sql: `SELECT progress_data FROM player_progress WHERE player_id = ? AND game_mode = 'v2'`, args: [player_id] });
    if (prog.rows.length > 0) {
      const data = JSON.parse(prog.rows[0].progress_data);
      if (data.level) {
        await db.execute({ sql: `UPDATE players SET adventure_level = ? WHERE id = ?`, args: [parseInt(data.level), player_id] });
      }
    }
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create or get player
app.post('/api/players', async (req, res) => {
  const { name } = req.body;
  const db = getDb();
  try {
    const existing = await db.execute({ sql: `SELECT * FROM players WHERE name = ?`, args: [name] });
    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }
    const result = await db.execute({ sql: `INSERT INTO players (name) VALUES (?)`, args: [name] });
    res.json({ id: result.lastInsertRowid, name, total_stars: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get player stats
app.get('/api/players/:id/stats', async (req, res) => {
  const db = getDb();
  try {
    const sessions = await db.execute({
      sql: `SELECT subject, difficulty, SUM(stars_earned) as stars, COUNT(*) as games, SUM(correct_answers) as correct, SUM(total_questions) as total FROM game_sessions WHERE player_id = ? GROUP BY subject, difficulty`,
      args: [parseInt(req.params.id)],
    });
    res.json(sessions.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update player profile
app.put('/api/players/:id', async (req, res) => {
  const { name } = req.body;
  const db = getDb();
  try {
    await db.execute({ sql: `UPDATE players SET name = ? WHERE id = ?`, args: [name, parseInt(req.params.id)] });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Save/load player progress (for V2 map, etc.)
app.get('/api/players/:id/progress/:mode', async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({ sql: `SELECT progress_data FROM player_progress WHERE player_id = ? AND game_mode = ?`, args: [parseInt(req.params.id), req.params.mode] });
    if (result.rows.length > 0) return res.json(JSON.parse(result.rows[0].progress_data));
    res.json(null);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/players/:id/progress/:mode', async (req, res) => {
  const db = getDb();
  const data = JSON.stringify(req.body);
  try {
    await db.execute({ sql: `INSERT INTO player_progress (player_id, game_mode, progress_data) VALUES (?, ?, ?) ON CONFLICT(player_id, game_mode) DO UPDATE SET progress_data = ?, updated_at = CURRENT_TIMESTAMP`, args: [parseInt(req.params.id), req.params.mode, data, data] });
    // Update adventure_level in players table for V2
    if (req.params.mode === 'v2' && req.body.level) {
      await db.execute({ sql: `UPDATE players SET adventure_level = ? WHERE id = ?`, args: [parseInt(req.body.level), parseInt(req.params.id)] });
    }
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// === ADMIN APIs ===

// Log individual answers
app.post('/api/answers', async (req, res) => {
  const { session_id, player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms } = req.body;
  const db = getDb();
  try {
    await db.execute({
      sql: `INSERT INTO answer_logs (session_id, player_id, question_id, selected_answer, correct_answer, is_correct, time_spent_ms) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [session_id, player_id, question_id, selected_answer, correct_answer, is_correct ? 1 : 0, time_spent_ms || 0],
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all players with summary
app.get('/api/admin/players', async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({
      sql: `SELECT p.*, 
        (SELECT COUNT(*) FROM game_sessions WHERE player_id = p.id) as total_games,
        (SELECT SUM(stars_earned) FROM game_sessions WHERE player_id = p.id) as total_stars_earned,
        (SELECT SUM(correct_answers) FROM game_sessions WHERE player_id = p.id) as total_correct,
        (SELECT SUM(total_questions) FROM game_sessions WHERE player_id = p.id) as total_answered,
        (SELECT MAX(played_at) FROM game_sessions WHERE player_id = p.id) as last_played
      FROM players p ORDER BY p.created_at DESC`,
      args: [],
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get player detail with session history
app.get('/api/admin/players/:id/history', async (req, res) => {
  const db = getDb();
  const playerId = parseInt(req.params.id);
  try {
    const sessions = await db.execute({
      sql: `SELECT * FROM game_sessions WHERE player_id = ? ORDER BY played_at DESC LIMIT 50`,
      args: [playerId],
    });
    const player = await db.execute({ sql: `SELECT * FROM players WHERE id = ?`, args: [playerId] });
    res.json({ player: player.rows[0], sessions: sessions.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get player weakness analysis - questions they get wrong most
app.get('/api/admin/players/:id/weaknesses', async (req, res) => {
  const db = getDb();
  const playerId = parseInt(req.params.id);
  try {
    // Most missed questions
    const missed = await db.execute({
      sql: `SELECT q.id, q.subject, q.difficulty, q.question_text, q.correct_answer,
        COUNT(*) as times_attempted,
        SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) as times_wrong,
        ROUND(100.0 * SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(*), 1) as error_rate
      FROM answer_logs a
      JOIN questions q ON a.question_id = q.id
      WHERE a.player_id = ?
      GROUP BY q.id
      HAVING times_wrong > 0
      ORDER BY error_rate DESC, times_wrong DESC
      LIMIT 20`,
      args: [playerId],
    });

    // Performance by subject + difficulty
    const byCategory = await db.execute({
      sql: `SELECT q.subject, q.difficulty,
        COUNT(*) as total,
        SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(100.0 * SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as accuracy
      FROM answer_logs a
      JOIN questions q ON a.question_id = q.id
      WHERE a.player_id = ?
      GROUP BY q.subject, q.difficulty
      ORDER BY q.subject, q.difficulty`,
      args: [playerId],
    });

    // Common wrong answer patterns (what they pick when wrong)
    const patterns = await db.execute({
      sql: `SELECT q.subject, q.difficulty,
        a.selected_answer, a.correct_answer,
        COUNT(*) as count
      FROM answer_logs a
      JOIN questions q ON a.question_id = q.id
      WHERE a.player_id = ? AND a.is_correct = 0
      GROUP BY q.subject, q.difficulty, a.selected_answer, a.correct_answer
      ORDER BY count DESC
      LIMIT 10`,
      args: [playerId],
    });

    // Progress over time (last 30 sessions)
    const progress = await db.execute({
      sql: `SELECT played_at, subject, difficulty, correct_answers, total_questions, score, stars_earned,
        ROUND(100.0 * correct_answers / total_questions, 1) as accuracy
      FROM game_sessions
      WHERE player_id = ? AND total_questions > 0
      ORDER BY played_at DESC
      LIMIT 30`,
      args: [playerId],
    });

    res.json({ missed: missed.rows, byCategory: byCategory.rows, patterns: patterns.rows, progress: progress.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Global stats for admin dashboard
app.get('/api/admin/stats', async (req, res) => {
  const db = getDb();
  try {
    const totalQ = await db.execute({ sql: `SELECT COUNT(*) as count FROM questions`, args: [] });
    const totalP = await db.execute({ sql: `SELECT COUNT(*) as count FROM players`, args: [] });
    const totalS = await db.execute({ sql: `SELECT COUNT(*) as count FROM game_sessions`, args: [] });
    const bySubject = await db.execute({
      sql: `SELECT subject, difficulty, COUNT(*) as count FROM questions GROUP BY subject, difficulty`,
      args: [],
    });
    const hardestQuestions = await db.execute({
      sql: `SELECT q.id, q.subject, q.difficulty, q.question_text,
        COUNT(*) as attempts,
        SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) as wrong,
        ROUND(100.0 * SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(*), 1) as error_rate
      FROM answer_logs a
      JOIN questions q ON a.question_id = q.id
      GROUP BY q.id
      HAVING attempts >= 3
      ORDER BY error_rate DESC
      LIMIT 15`,
      args: [],
    });

    res.json({
      totalQuestions: totalQ.rows[0]?.count || 0,
      totalPlayers: totalP.rows[0]?.count || 0,
      totalSessions: totalS.rows[0]?.count || 0,
      bySubject: bySubject.rows,
      hardestQuestions: hardestQuestions.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CRUD questions
app.get('/api/admin/questions', async (req, res) => {
  const { subject, difficulty, page = 1, limit = 20 } = req.query;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let sql = `SELECT * FROM questions WHERE 1=1`;
  const args = [];
  if (subject) { sql += ` AND subject = ?`; args.push(subject); }
  if (difficulty) { sql += ` AND difficulty = ?`; args.push(difficulty); }
  sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
  args.push(parseInt(limit), offset);
  try {
    const result = await db.execute({ sql, args });
    // Count total
    let countSql = `SELECT COUNT(*) as total FROM questions WHERE 1=1`;
    const countArgs = [];
    if (subject) { countSql += ` AND subject = ?`; countArgs.push(subject); }
    if (difficulty) { countSql += ` AND difficulty = ?`; countArgs.push(difficulty); }
    const countResult = await db.execute({ sql: countSql, args: countArgs });
    res.json({ questions: result.rows, total: countResult.rows[0]?.total || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/questions', async (req, res) => {
  const { subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation } = req.body;
  const db = getDb();
  try {
    const result = await db.execute({
      sql: `INSERT INTO questions (subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation || null],
    });
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/questions/batch', async (req, res) => {
  const { questions } = req.body;
  const db = getDb();
  try {
    const statements = questions.map(q => ({
      sql: `INSERT INTO questions (subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [q.subject, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || null],
    }));
    await db.batch(statements);
    res.json({ inserted: questions.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/questions/:id', async (req, res) => {
  const db = getDb();
  try {
    await db.execute({ sql: `DELETE FROM questions WHERE id = ?`, args: [parseInt(req.params.id)] });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === V4 ROOM API (polling-based for local + Vercel) ===
import roomHandler from './api/room.js';
app.all('/api/room', async (req, res) => {
  await roomHandler(req, res);
});

// === EXAM APIs ===

// List exams (public - for students)
app.get('/api/exams', async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({ sql: `SELECT id, title, subject, difficulty, total_questions, time_limit_minutes, created_at FROM exams WHERE is_active = 1 ORDER BY created_at DESC`, args: [] });
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get exam detail with questions (for taking exam)
app.get('/api/exams/:id', async (req, res) => {
  const db = getDb();
  try {
    const exam = await db.execute({ sql: `SELECT * FROM exams WHERE id = ? AND is_active = 1`, args: [parseInt(req.params.id)] });
    if (exam.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy bài thi' });

    const e = exam.rows[0];
    const qIds = JSON.parse(e.question_ids);
    let questions = [];
    if (qIds.length > 0) {
      const placeholders = qIds.map(() => '?').join(',');
      const qResult = await db.execute({ sql: `SELECT id, subject, difficulty, question_text, option_a, option_b, option_c, option_d FROM questions WHERE id IN (${placeholders})`, args: qIds });
      questions = qResult.rows;
    }
    res.json({ ...e, questions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Submit exam result (public)
app.post('/api/exams/:id/submit', async (req, res) => {
  const db = getDb();
  const { player_name, answers, time_spent_seconds } = req.body;
  try {
    const exam = await db.execute({ sql: `SELECT * FROM exams WHERE id = ?`, args: [parseInt(req.params.id)] });
    if (exam.rows.length === 0) return res.status(404).json({ error: 'Không tìm thấy bài thi' });

    const e = exam.rows[0];
    const qIds = JSON.parse(e.question_ids);

    // Get correct answers
    const placeholders = qIds.map(() => '?').join(',');
    const qResult = await db.execute({ sql: `SELECT id, correct_answer FROM questions WHERE id IN (${placeholders})`, args: qIds });
    const correctMap = {};
    qResult.rows.forEach(q => { correctMap[q.id] = q.correct_answer; });

    // Grade
    let correct = 0;
    const detail = answers.map(a => {
      const isCorrect = correctMap[a.question_id] === a.answer;
      if (isCorrect) correct++;
      return { ...a, correct_answer: correctMap[a.question_id], is_correct: isCorrect };
    });

    const total = qIds.length;
    const score = Math.round((correct / total) * 100);
    const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

    const result = await db.execute({
      sql: `INSERT INTO exam_results (exam_id, player_name, score, correct_answers, total_questions, time_spent_seconds, answers_detail, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [parseInt(req.params.id), player_name, score, correct, total, time_spent_seconds, JSON.stringify(detail), grade],
    });

    res.json({ id: result.lastInsertRowid, score, correct, total, grade, detail });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get exam history for a player (public)
app.get('/api/exams/history/:name', async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({
      sql: `SELECT er.*, e.title, e.subject, e.difficulty FROM exam_results er JOIN exams e ON er.exam_id = e.id WHERE er.player_name = ? ORDER BY er.taken_at DESC LIMIT 50`,
      args: [req.params.name],
    });
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// === ADMIN EXAM APIs ===

// Admin: list all exams
app.get('/api/admin/exams', async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({ sql: `SELECT e.*, (SELECT COUNT(*) FROM exam_results WHERE exam_id = e.id) as times_taken FROM exams e ORDER BY e.created_at DESC`, args: [] });
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: create exam (auto-generate questions)
app.post('/api/admin/exams', async (req, res) => {
  const db = getDb();
  const { title, subject, difficulty, total_questions, time_limit_minutes, question_ids } = req.body;
  try {
    let qIds = question_ids || [];

    // Auto-generate if no specific questions provided
    if (qIds.length === 0) {
      let sql, args;
      if (subject === 'mix') {
        const half = Math.ceil(total_questions / 2);
        const diff = difficulty === 'mix' ? 'easy' : difficulty;
        const math = await db.execute({ sql: `SELECT id FROM questions WHERE subject = 'math' AND difficulty = ? ORDER BY RANDOM() LIMIT ?`, args: [diff, half] });
        const viet = await db.execute({ sql: `SELECT id FROM questions WHERE subject = 'vietnamese' AND difficulty = ? ORDER BY RANDOM() LIMIT ?`, args: [diff, total_questions - half] });
        qIds = [...math.rows.map(r => r.id), ...viet.rows.map(r => r.id)];
      } else {
        const diff = difficulty === 'mix' ? 'easy' : difficulty;
        const result = await db.execute({ sql: `SELECT id FROM questions WHERE subject = ? AND difficulty = ? ORDER BY RANDOM() LIMIT ?`, args: [subject, diff, total_questions] });
        qIds = result.rows.map(r => r.id);
      }
    }

    const result = await db.execute({
      sql: `INSERT INTO exams (title, subject, difficulty, total_questions, time_limit_minutes, question_ids) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [title, subject, difficulty, total_questions, time_limit_minutes, JSON.stringify(qIds)],
    });
    res.json({ id: result.lastInsertRowid, question_ids: qIds });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: update exam
app.put('/api/admin/exams/:id', async (req, res) => {
  const db = getDb();
  const { title, subject, difficulty, total_questions, time_limit_minutes, question_ids, is_active } = req.body;
  try {
    await db.execute({
      sql: `UPDATE exams SET title=?, subject=?, difficulty=?, total_questions=?, time_limit_minutes=?, question_ids=?, is_active=? WHERE id=?`,
      args: [title, subject, difficulty, total_questions, time_limit_minutes, JSON.stringify(question_ids), is_active ? 1 : 0, parseInt(req.params.id)],
    });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: delete exam
app.delete('/api/admin/exams/:id', async (req, res) => {
  const db = getDb();
  try {
    await db.execute({ sql: `DELETE FROM exams WHERE id = ?`, args: [parseInt(req.params.id)] });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin: exam results
app.get('/api/admin/exams/:id/results', async (req, res) => {
  const db = getDb();
  try {
    const result = await db.execute({
      sql: `SELECT * FROM exam_results WHERE exam_id = ? ORDER BY taken_at DESC`,
      args: [parseInt(req.params.id)],
    });
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

server.listen(PORT, () => {
  console.log(`🎮 Game V1 (Classic):   http://localhost:${PORT}`);
  console.log(`🎮 Game V2 (Adventure): http://localhost:${PORT}/v2/`);
  console.log(`🎮 Game V3 (Duel 2P):   http://localhost:${PORT}/v3/`);
  console.log(`🎮 Game V4 (Online):    http://localhost:${PORT}/v4/`);
  console.log(`📝 Bài thi:             http://localhost:${PORT}/exam.html`);
  console.log(`🛠️  Admin:               http://localhost:${PORT}/admin.html`);
});
