import { getDb } from '../db.js';

// Basic auth check
function checkAuth(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) return false;
  const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  return user === 'admin' && pass === 'admin';
}

export default async function handler(req, res) {
  // Auth check - skip if already handled by middleware (local server.js)
  const skipAuth = req._adminAuthed;
  if (!skipAuth) {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    if (user !== 'admin' || pass !== 'admin') {
      res.setHeader('WWW-Authenticate', 'Basic realm="Admin"');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const db = getDb();
  const { resource, id, action } = req.query;

  // === QUESTIONS ===
  if (resource === 'questions') {
    if (req.method === 'GET') {
      const { subject, difficulty, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);
      let sql = `SELECT * FROM questions WHERE 1=1`;
      const args = [];
      if (subject) { sql += ` AND subject = ?`; args.push(subject); }
      if (difficulty) { sql += ` AND difficulty = ?`; args.push(difficulty); }
      sql += ` ORDER BY id DESC LIMIT ? OFFSET ?`;
      args.push(parseInt(limit), offset);
      const result = await db.execute({ sql, args });
      let countSql = `SELECT COUNT(*) as total FROM questions WHERE 1=1`;
      const countArgs = [];
      if (subject) { countSql += ` AND subject = ?`; countArgs.push(subject); }
      if (difficulty) { countSql += ` AND difficulty = ?`; countArgs.push(difficulty); }
      const countResult = await db.execute({ sql: countSql, args: countArgs });
      return res.json({ questions: result.rows, total: countResult.rows[0]?.total || 0 });
    }
    if (req.method === 'POST' && action === 'batch') {
      const { questions } = req.body;
      for (const q of questions) {
        await db.execute({
          sql: `INSERT INTO questions (subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [q.subject, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || null],
        });
      }
      return res.json({ inserted: questions.length });
    }
    if (req.method === 'POST') {
      const q = req.body;
      const result = await db.execute({
        sql: `INSERT INTO questions (subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [q.subject, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || null],
      });
      return res.json({ id: result.lastInsertRowid });
    }
    if (req.method === 'DELETE' && id) {
      await db.execute({ sql: `DELETE FROM questions WHERE id = ?`, args: [parseInt(id)] });
      return res.json({ ok: true });
    }
  }

  // === PLAYERS ===
  if (resource === 'players') {
    if (req.method === 'GET' && !id) {
      const result = await db.execute({
        sql: `SELECT p.*, p.adventure_level, (SELECT COUNT(*) FROM game_sessions WHERE player_id = p.id) as total_games, (SELECT SUM(stars_earned) FROM game_sessions WHERE player_id = p.id) as total_stars_earned, (SELECT SUM(correct_answers) FROM game_sessions WHERE player_id = p.id) as total_correct, (SELECT SUM(total_questions) FROM game_sessions WHERE player_id = p.id) as total_answered, (SELECT MAX(played_at) FROM game_sessions WHERE player_id = p.id) as last_played FROM players p ORDER BY p.created_at DESC`,
        args: [],
      });
      return res.json(result.rows);
    }
    if (req.method === 'GET' && id && action === 'weaknesses') {
      const playerId = parseInt(id);
      const missed = await db.execute({ sql: `SELECT q.id, q.subject, q.difficulty, q.question_text, COUNT(*) as times_attempted, SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) as times_wrong, ROUND(100.0 * SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(*), 1) as error_rate FROM answer_logs a JOIN questions q ON a.question_id = q.id WHERE a.player_id = ? GROUP BY q.id HAVING times_wrong > 0 ORDER BY error_rate DESC LIMIT 20`, args: [playerId] });
      const byCategory = await db.execute({ sql: `SELECT q.subject, q.difficulty, COUNT(*) as total, SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct, ROUND(100.0 * SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*), 1) as accuracy FROM answer_logs a JOIN questions q ON a.question_id = q.id WHERE a.player_id = ? GROUP BY q.subject, q.difficulty`, args: [playerId] });
      const progress = await db.execute({ sql: `SELECT played_at, subject, difficulty, correct_answers, total_questions, score, stars_earned, ROUND(100.0 * correct_answers / total_questions, 1) as accuracy FROM game_sessions WHERE player_id = ? AND total_questions > 0 ORDER BY played_at DESC LIMIT 30`, args: [playerId] });
      return res.json({ missed: missed.rows, byCategory: byCategory.rows, patterns: [], progress: progress.rows });
    }
    if (req.method === 'GET' && id && action === 'history') {
      const playerId = parseInt(id);
      const sessions = await db.execute({ sql: `SELECT * FROM game_sessions WHERE player_id = ? ORDER BY played_at DESC LIMIT 50`, args: [playerId] });
      const player = await db.execute({ sql: `SELECT * FROM players WHERE id = ?`, args: [playerId] });
      return res.json({ player: player.rows[0], sessions: sessions.rows });
    }
    if (req.method === 'DELETE' && id && action === 'delete') {
      const playerId = parseInt(id);
      // Delete related data first
      await db.execute({ sql: `DELETE FROM answer_logs WHERE player_id = ?`, args: [playerId] });
      await db.execute({ sql: `DELETE FROM game_sessions WHERE player_id = ?`, args: [playerId] });
      await db.execute({ sql: `DELETE FROM players WHERE id = ?`, args: [playerId] });
      return res.json({ ok: true });
    }
  }

  // === STATS ===
  if (resource === 'stats') {
    const totalQ = await db.execute({ sql: `SELECT COUNT(*) as count FROM questions`, args: [] });
    const totalP = await db.execute({ sql: `SELECT COUNT(*) as count FROM players`, args: [] });
    const totalS = await db.execute({ sql: `SELECT COUNT(*) as count FROM game_sessions`, args: [] });
    const bySubject = await db.execute({ sql: `SELECT subject, difficulty, COUNT(*) as count FROM questions GROUP BY subject, difficulty`, args: [] });
    const hardest = await db.execute({ sql: `SELECT q.id, q.subject, q.difficulty, q.question_text, COUNT(*) as attempts, SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) as wrong, ROUND(100.0 * SUM(CASE WHEN a.is_correct = 0 THEN 1 ELSE 0 END) / COUNT(*), 1) as error_rate FROM answer_logs a JOIN questions q ON a.question_id = q.id GROUP BY q.id HAVING attempts >= 3 ORDER BY error_rate DESC LIMIT 15`, args: [] });
    return res.json({ totalQuestions: totalQ.rows[0]?.count || 0, totalPlayers: totalP.rows[0]?.count || 0, totalSessions: totalS.rows[0]?.count || 0, bySubject: bySubject.rows, hardestQuestions: hardest.rows });
  }

  // === EXAMS ===
  if (resource === 'exams') {
    if (req.method === 'GET' && !id) {
      const result = await db.execute({ sql: `SELECT e.*, (SELECT COUNT(*) FROM exam_results WHERE exam_id = e.id) as times_taken FROM exams e ORDER BY e.created_at DESC`, args: [] });
      return res.json(result.rows);
    }
    if (req.method === 'GET' && id && action === 'results') {
      const result = await db.execute({ sql: `SELECT * FROM exam_results WHERE exam_id = ? ORDER BY taken_at DESC`, args: [parseInt(id)] });
      return res.json(result.rows);
    }
    if (req.method === 'POST') {
      const { title, subject, difficulty, total_questions, time_limit_minutes, question_ids } = req.body;
      let qIds = question_ids || [];
      if (qIds.length === 0) {
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
      return res.json({ id: result.lastInsertRowid, question_ids: qIds });
    }
    if (req.method === 'PUT' && id) {
      const { title, subject, difficulty, total_questions, time_limit_minutes, question_ids, is_active } = req.body;
      await db.execute({
        sql: `UPDATE exams SET title=?, subject=?, difficulty=?, total_questions=?, time_limit_minutes=?, question_ids=?, is_active=? WHERE id=?`,
        args: [title, subject, difficulty, total_questions, time_limit_minutes, JSON.stringify(question_ids), is_active ? 1 : 0, parseInt(id)],
      });
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE' && id) {
      await db.execute({ sql: `DELETE FROM exams WHERE id = ?`, args: [parseInt(id)] });
      return res.json({ ok: true });
    }
  }

  res.status(404).json({ error: 'Not found' });
}
