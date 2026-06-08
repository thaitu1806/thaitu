import { initDb, getDb } from './database.js';
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

async function seed() {
  console.log('Initializing database...');
  await initDb();
  const db = getDb();

  // Clear existing questions
  await db.execute('DELETE FROM questions');

  const allQuestions = [
    ...mathQuestionsEasy.map(q => ({ ...q, subject: 'math', difficulty: 'easy' })),
    ...extraMathEasy.map(q => ({ ...q, subject: 'math', difficulty: 'easy' })),
    ...mathQuestionsMedium.map(q => ({ ...q, subject: 'math', difficulty: 'medium' })),
    ...extraMathMedium.map(q => ({ ...q, subject: 'math', difficulty: 'medium' })),
    ...mathQuestionsHard.map(q => ({ ...q, subject: 'math', difficulty: 'hard' })),
    ...extraMathHard.map(q => ({ ...q, subject: 'math', difficulty: 'hard' })),
    ...vietQuestionsEasy.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'easy' })),
    ...extraVietEasy.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'easy' })),
    ...vietQuestionsMedium.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'medium' })),
    ...extraVietMedium.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'medium' })),
    ...vietQuestionsHard.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'hard' })),
    ...extraVietHard.map(q => ({ ...q, subject: 'vietnamese', difficulty: 'hard' })),
    ...englishQuestionsEasy.map(q => ({ ...q, subject: 'english', difficulty: 'easy' })),
    ...englishQuestionsMedium.map(q => ({ ...q, subject: 'english', difficulty: 'medium' })),
    ...englishQuestionsHard.map(q => ({ ...q, subject: 'english', difficulty: 'hard' })),
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
  console.log('- Math Easy:', mathQuestionsEasy.length + extraMathEasy.length);
  console.log('- Math Medium:', mathQuestionsMedium.length + extraMathMedium.length);
  console.log('- Math Hard:', mathQuestionsHard.length + extraMathHard.length);
  console.log('- Vietnamese Easy:', vietQuestionsEasy.length + extraVietEasy.length);
  console.log('- Vietnamese Medium:', vietQuestionsMedium.length + extraVietMedium.length);
  console.log('- Vietnamese Hard:', vietQuestionsHard.length + extraVietHard.length);
  console.log('- English Easy:', englishQuestionsEasy.length);
  console.log('- English Medium:', englishQuestionsMedium.length);
  console.log('- English Hard:', englishQuestionsHard.length);
}

seed().catch(console.error);
