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
import { pictureMathEasy } from './questions/picture-math.js';
import { preschoolPicture } from './questions/picture-preschool.js';
import { grade1Picture } from './questions/picture-grade1.js';
import { englishPreschool, englishGrade1 } from './questions/english-preschool-grade1.js';

async function seed() {
  console.log('Initializing database...');
  await initDb();
  const db = getDb();

  // Clear existing questions
  await db.execute('DELETE FROM questions');

  const allQuestions = [
    ...preschoolPicture.map(q => ({ ...q, subject: 'math', difficulty: 'easy', grade: 0 })),
    ...englishPreschool.map(q => ({ ...q, subject: 'english', difficulty: 'easy', grade: 0 })),
    ...grade1Picture.map(q => ({ ...q, subject: 'math', difficulty: 'easy', grade: 1 })),
    ...englishGrade1.map(q => ({ ...q, subject: 'english', difficulty: 'easy', grade: 1 })),
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

  console.log(`Seeding ${allQuestions.length} questions...`);

  const batchSize = 50;
  for (let i = 0; i < allQuestions.length; i += batchSize) {
    const batch = allQuestions.slice(i, i + batchSize);
    const statements = batch.map(q => ({
      sql: `INSERT INTO questions (subject, difficulty, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [q.subject, q.difficulty, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation || null, q.grade ?? 2],
    }));
    await db.batch(statements);
  }

  console.log(`Done! Seeded ${allQuestions.length} questions.`);
  console.log('- Preschool (grade 0) picture:', preschoolPicture.length);
  console.log('- Grade 1 picture:', grade1Picture.length);
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
