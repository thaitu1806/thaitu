// Seed script for Turso (production)
// Run: TURSO_URL=... TURSO_AUTH_TOKEN=... node db/seed-turso.js

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mathQuestionsEasy } from './questions/math-easy.js';
import { mathQuestionsMedium } from './questions/math-medium.js';
import { mathQuestionsHard } from './questions/math-hard.js';
import { vietQuestionsEasy } from './questions/viet-easy.js';
import { vietQuestionsMedium } from './questions/viet-medium.js';
import { vietQuestionsHard } from './questions/viet-hard.js';
import { extraMathEasy, extraMathMedium, extraMathHard, extraVietEasy, extraVietMedium, extraVietHard } from './questions/extra-questions.js';
import { englishQuestionsEasy } from './questions/english-easy.js';
import { englishQuestionsMedium } from './questions/english-medium.js';
import { englishQuestionsHard } from './questions/english-hard.js';
import { pictureMathEasy } from './questions/picture-math.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seed() {
  console.log('Creating tables...');
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  await db.executeMultiple(schema);

  // Clear existing questions to avoid duplicates
  console.log('Clearing old questions...');
  await db.execute('DELETE FROM questions');

  console.log('Seeding questions...');
  const allQuestions = [
    ...mathQuestionsEasy.map(q => ({ ...q, subject: 'math', difficulty: 'easy', grade: 2 })),
    ...extraMathEasy.map(q => ({ ...q, subject: 'math', difficulty: 'easy', grade: 2 })),
    ...pictureMathEasy.map(q => ({ ...q, subject: 'math', difficulty: 'easy', grade: 2 })),
    ...mathQuestionsMedium.map(q => ({ ...q, subject: 'math', difficulty: 'medium', grade: 2 })),
    ...extraMathMedium.map(q => ({ ...q, subject: 'math', difficulty: 'medium', grade: 2 })),
    ...mathQuestionsHard.map(q => ({ ...q, subject: 'math', difficulty: 'hard', grade: 2 })),
    ...extraMathHard.map(q => ({ ...q, subject: 'math', difficulty: 'hard', grade: 2 })),
    ...vietQuestionsEasy.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'easy', grade: 2 })),
    ...extraVietEasy.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'easy', grade: 2 })),
    ...vietQuestionsMedium.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'medium', grade: 2 })),
    ...extraVietMedium.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'medium', grade: 2 })),
    ...vietQuestionsHard.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'hard', grade: 2 })),
    ...extraVietHard.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'hard', grade: 2 })),
    ...englishQuestionsEasy.map(q => ({ ...q, subject: 'english', difficulty: 'easy', grade: 2 })),
    ...englishQuestionsMedium.map(q => ({ ...q, subject: 'english', difficulty: 'medium', grade: 2 })),
    ...englishQuestionsHard.map(q => ({ ...q, subject: 'english', difficulty: 'hard', grade: 2 })),
  ];

  // Use batch insert for better reliability
  const batchSize = 10;
  for (let i = 0; i < allQuestions.length; i += batchSize) {
    const batch = allQuestions.slice(i, i + batchSize);
    const statements = batch.map(q => ({
      sql: `INSERT INTO questions (subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [q.subject, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || null, q.grade || 2],
    }));
    await db.batch(statements);
  }

  console.log(`Done! Seeded ${allQuestions.length} questions.`);
}

seed().catch(console.error);
