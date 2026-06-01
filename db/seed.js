import { initDb, getDb } from './database.js';
import { mathQuestionsEasy } from './questions/math-easy.js';
import { mathQuestionsMedium } from './questions/math-medium.js';
import { mathQuestionsHard } from './questions/math-hard.js';
import { vietQuestionsEasy } from './questions/viet-easy.js';
import { vietQuestionsMedium } from './questions/viet-medium.js';
import { vietQuestionsHard } from './questions/viet-hard.js';

async function seed() {
  console.log('Initializing database...');
  await initDb();
  const db = getDb();

  // Clear existing questions
  await db.execute('DELETE FROM questions');

  const allQuestions = [
    ...mathQuestionsEasy.map(q => ({ ...q, subject: 'math', difficulty: 'easy' })),
    ...mathQuestionsMedium.map(q => ({ ...q, subject: 'math', difficulty: 'medium' })),
    ...mathQuestionsHard.map(q => ({ ...q, subject: 'math', difficulty: 'hard' })),
    ...vietQuestionsEasy.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'easy' })),
    ...vietQuestionsMedium.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'medium' })),
    ...vietQuestionsHard.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'hard' })),
  ];

  console.log(`Seeding ${allQuestions.length} questions...`);

  const batchSize = 50;
  for (let i = 0; i < allQuestions.length; i += batchSize) {
    const batch = allQuestions.slice(i, i + batchSize);
    const statements = batch.map(q => ({
      sql: `INSERT INTO questions (subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [q.subject, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || null],
    }));
    await db.batch(statements);
  }

  console.log(`Done! Seeded ${allQuestions.length} questions.`);
  console.log('- Math Easy:', mathQuestionsEasy.length);
  console.log('- Math Medium:', mathQuestionsMedium.length);
  console.log('- Math Hard:', mathQuestionsHard.length);
  console.log('- Vietnamese Easy:', vietQuestionsEasy.length);
  console.log('- Vietnamese Medium:', vietQuestionsMedium.length);
  console.log('- Vietnamese Hard:', vietQuestionsHard.length);
}

seed().catch(console.error);
