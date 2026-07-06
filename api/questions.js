import { getDb } from './db.js';

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'];

export default async function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    const { subject, difficulty, limit = 10, grade, player_id } = req.query;
    try {
      // Determine grade: explicit param > player's stored grade > default 2
      let resolvedGrade = 2;
      if (grade) {
        resolvedGrade = parseInt(grade);
      } else if (player_id) {
        const playerResult = await db.execute({
          sql: `SELECT grade FROM players WHERE id = ?`,
          args: [parseInt(player_id)],
        });
        if (playerResult.rows.length > 0 && playerResult.rows[0].grade) {
          resolvedGrade = playerResult.rows[0].grade;
        }
      }

      const totalLimit = parseInt(limit);

      // ── Adaptive Difficulty Mixing ──
      // If player_id is provided, check recent accuracy and mix harder questions.
      let mixRatio = 0; // fraction of questions from the next difficulty level
      let nextDifficulty = null;
      if (player_id && difficulty) {
        const idx = DIFFICULTY_ORDER.indexOf(difficulty);
        if (idx >= 0 && idx < DIFFICULTY_ORDER.length - 1) {
          nextDifficulty = DIFFICULTY_ORDER[idx + 1];
          // Get recent accuracy (last 20 answers)
          try {
            const recent = await db.execute({
              sql: `SELECT is_correct FROM answer_logs WHERE player_id = ? ORDER BY answered_at DESC LIMIT 20`,
              args: [parseInt(player_id)],
            });
            if (recent.rows && recent.rows.length >= 10) {
              const correct = recent.rows.filter(r => r.is_correct === 1).length;
              const accuracy = correct / recent.rows.length;
              if (accuracy >= 0.9) mixRatio = 0.5;       // 90%+ → half harder
              else if (accuracy >= 0.8) mixRatio = 0.3;  // 80%+ → 30% harder
              else if (accuracy >= 0.7) mixRatio = 0.15; // 70%+ → 15% harder
            }
          } catch (e) { /* ignore — no mixing */ }
        }
      }

      const harderCount = Math.round(totalLimit * mixRatio);
      const baseCount = totalLimit - harderCount;

      // Fetch base difficulty questions
      const result = await db.execute({
        sql: `SELECT * FROM questions WHERE subject = ? AND difficulty = ? AND grade = ? ORDER BY RANDOM() LIMIT ?`,
        args: [subject, difficulty, resolvedGrade, baseCount],
      });
      let questions = result.rows || [];

      // Fetch harder questions if needed
      if (harderCount > 0 && nextDifficulty) {
        const harder = await db.execute({
          sql: `SELECT * FROM questions WHERE subject = ? AND difficulty = ? AND grade = ? ORDER BY RANDOM() LIMIT ?`,
          args: [subject, nextDifficulty, resolvedGrade, harderCount],
        });
        if (harder.rows && harder.rows.length > 0) {
          questions = questions.concat(harder.rows);
        }
      }

      // Shuffle the mixed result so harder questions aren't all at the end
      for (let i = questions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questions[i], questions[j]] = [questions[j], questions[i]];
      }

      return res.json(questions);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(405).json({ error: 'Method not allowed' });
}
