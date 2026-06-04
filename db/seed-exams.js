// Seed 5 exams for production
// Run: TURSO_URL=... TURSO_AUTH_TOKEN=... node db/seed-exams.js
// Or locally: node db/seed-exams.js

import { createClient } from '@libsql/client';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = process.env.TURSO_URL
  ? createClient({ url: process.env.TURSO_URL, authToken: process.env.TURSO_AUTH_TOKEN })
  : createClient({ url: 'file:' + join(__dirname, 'local.db') });

async function seedExams() {
  console.log('Creating 5 exams...');

  const exams = [
    { title: '📝 Toán Dễ - Ôn tập cộng trừ', subject: 'math', difficulty: 'easy', total_questions: 10, time_limit_minutes: 15 },
    { title: '📝 Toán Trung Bình - Đặt tính', subject: 'math', difficulty: 'medium', total_questions: 10, time_limit_minutes: 15 },
    { title: '📝 Toán Khó - Thử thách', subject: 'math', difficulty: 'hard', total_questions: 10, time_limit_minutes: 20 },
    { title: '📝 Tiếng Việt - Chính tả & Từ vựng', subject: 'vietnamese', difficulty: 'easy', total_questions: 10, time_limit_minutes: 15 },
    { title: '📝 Tổng hợp - Toán + Tiếng Việt', subject: 'mix', difficulty: 'medium', total_questions: 15, time_limit_minutes: 20 },
  ];

  for (const exam of exams) {
    let qIds = [];

    if (exam.subject === 'mix') {
      const half = Math.ceil(exam.total_questions / 2);
      const math = await db.execute({
        sql: `SELECT id FROM questions WHERE subject = 'math' AND difficulty = ? ORDER BY RANDOM() LIMIT ?`,
        args: [exam.difficulty, half],
      });
      const viet = await db.execute({
        sql: `SELECT id FROM questions WHERE subject = 'vietnamese' AND difficulty = ? ORDER BY RANDOM() LIMIT ?`,
        args: [exam.difficulty, exam.total_questions - half],
      });
      qIds = [...math.rows.map(r => r.id), ...viet.rows.map(r => r.id)];
    } else {
      const result = await db.execute({
        sql: `SELECT id FROM questions WHERE subject = ? AND difficulty = ? ORDER BY RANDOM() LIMIT ?`,
        args: [exam.subject, exam.difficulty, exam.total_questions],
      });
      qIds = result.rows.map(r => r.id);
    }

    await db.execute({
      sql: `INSERT INTO exams (title, subject, difficulty, total_questions, time_limit_minutes, question_ids) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [exam.title, exam.subject, exam.difficulty, exam.total_questions, exam.time_limit_minutes, JSON.stringify(qIds)],
    });

    console.log(`✅ ${exam.title} (${qIds.length} câu)`);
  }

  console.log('\nDone! Created 5 exams.');
}

seedExams().catch(console.error);
