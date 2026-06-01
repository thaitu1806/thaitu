import { getDb } from './db.js';

export default async function handler(req, res) {
  const db = getDb();
  const { id, action } = req.query;

  // GET /api/exams - list active exams
  if (req.method === 'GET' && !id) {
    try {
      const result = await db.execute({ sql: `SELECT id, title, subject, difficulty, total_questions, time_limit_minutes, created_at FROM exams WHERE is_active = 1 ORDER BY created_at DESC`, args: [] });
      return res.json(result.rows);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // GET /api/exams?id=X - get exam with questions
  if (req.method === 'GET' && id && !action) {
    try {
      const exam = await db.execute({ sql: `SELECT * FROM exams WHERE id = ? AND is_active = 1`, args: [parseInt(id)] });
      if (exam.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const e = exam.rows[0];
      const qIds = JSON.parse(e.question_ids);
      let questions = [];
      if (qIds.length > 0) {
        const placeholders = qIds.map(() => '?').join(',');
        const qResult = await db.execute({ sql: `SELECT id, subject, difficulty, question_text, option_a, option_b, option_c, option_d FROM questions WHERE id IN (${placeholders})`, args: qIds });
        questions = qResult.rows;
      }
      return res.json({ ...e, questions });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // POST /api/exams?id=X&action=submit - submit exam
  if (req.method === 'POST' && id && action === 'submit') {
    const { player_name, answers, time_spent_seconds } = req.body;
    try {
      const exam = await db.execute({ sql: `SELECT * FROM exams WHERE id = ?`, args: [parseInt(id)] });
      if (exam.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      const e = exam.rows[0];
      const qIds = JSON.parse(e.question_ids);
      const placeholders = qIds.map(() => '?').join(',');
      const qResult = await db.execute({ sql: `SELECT id, correct_answer FROM questions WHERE id IN (${placeholders})`, args: qIds });
      const correctMap = {};
      qResult.rows.forEach(q => { correctMap[q.id] = q.correct_answer; });

      let correct = 0;
      const detail = answers.map(a => {
        const isCorrect = correctMap[a.question_id] === a.answer;
        if (isCorrect) correct++;
        return { ...a, correct_answer: correctMap[a.question_id], is_correct: isCorrect };
      });

      const total = qIds.length;
      const score = Math.round((correct / total) * 100);
      const grade = score >= 90 ? 'A+' : score >= 80 ? 'A' : score >= 70 ? 'B' : score >= 60 ? 'C' : score >= 50 ? 'D' : 'F';

      await db.execute({
        sql: `INSERT INTO exam_results (exam_id, player_name, score, correct_answers, total_questions, time_spent_seconds, answers_detail, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [parseInt(id), player_name, score, correct, total, time_spent_seconds, JSON.stringify(detail), grade],
      });
      return res.json({ score, correct, total, grade, detail });
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  // GET /api/exams?action=history&name=X
  if (req.method === 'GET' && action === 'history') {
    const { name } = req.query;
    try {
      const result = await db.execute({
        sql: `SELECT er.*, e.title, e.subject, e.difficulty FROM exam_results er JOIN exams e ON er.exam_id = e.id WHERE er.player_name = ? ORDER BY er.taken_at DESC LIMIT 50`,
        args: [name],
      });
      return res.json(result.rows);
    } catch (err) { return res.status(500).json({ error: err.message }); }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
