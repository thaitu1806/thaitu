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

const __dirname = dirname(fileURLToPath(import.meta.url));

const db = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function seed() {
  console.log('Creating tables...');
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  await db.executeMultiple(schema);

  console.log('Seeding questions...');
  const allQuestions = [
    ...mathQuestionsEasy.map(q => ({ ...q, subject: 'math', difficulty: 'easy' })),
    ...mathQuestionsMedium.map(q => ({ ...q, subject: 'math', difficulty: 'medium' })),
    ...mathQuestionsHard.map(q => ({ ...q, subject: 'math', difficulty: 'hard' })),
    ...vietQuestionsEasy.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'easy' })),
    ...vietQuestionsMedium.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'medium' })),
    ...vietQuestionsHard.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'hard' })),
  ];

  // Use batch insert for better reliability
  const batchSize = 10;
  for (let i = 0; i < allQuestions.length; i += batchSize) {
    const batch = allQuestions.slice(i, i + batchSize);
    const statements = batch.map(q => ({
      sql: `INSERT INTO questions (subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [q.subject, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || null],
    }));
    await db.batch(statements);
  }

  console.log(`Done! Seeded ${allQuestions.length} questions.`);
}

seed().catch(console.error);
