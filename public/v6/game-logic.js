// V6 Đua Xe Trí Tuệ - Pure Game Logic Module
// Contains all pure game logic functions (no DOM/window dependencies)
// Importable from both browser (ES module) and Node.js (vitest)

/**
 * Calculate car movements for a round result.
 * Movement Rules:
 * - Correct answer: +2 tiles
 * - Correct + faster than opponent: +3 tiles (2 base + 1 boost)
 * - Incorrect answer: +0 tiles
 * - Both incorrect: +1 tile each (anti-stall)
 * - Landing on obstacle: -1 tile (min 0)
 * - Reaching/exceeding finishLine: race ends
 *
 * @param {Object} roundResult - { p1Correct: boolean, p2Correct: boolean, p1Faster: boolean }
 * @param {Object} positions - { p1: number, p2: number }
 * @param {number[]} obstacles - tile indices with obstacles
 * @param {number} finishLine - finish tile index
 * @returns {{ p1NewPos: number, p2NewPos: number, p1Events: string[], p2Events: string[] }}
 */
export function calculateMovement(roundResult, positions, obstacles, finishLine) {
  const { p1Correct, p2Correct, p1Faster } = roundResult;
  const p1Events = [];
  const p2Events = [];

  let p1Move = 0;
  let p2Move = 0;

  if (p1Correct && p2Correct) {
    // Both correct — faster one gets boost (+3), slower gets +2
    if (p1Faster) {
      p1Move = 3;
      p2Move = 2;
      p1Events.push('boost');
      p1Events.push('correct');
      p2Events.push('correct');
    } else {
      p1Move = 2;
      p2Move = 3;
      p1Events.push('correct');
      p2Events.push('boost');
      p2Events.push('correct');
    }
  } else if (p1Correct && !p2Correct) {
    // Only P1 correct — +2 for being correct, +1 boost (faster than incorrect opponent)
    p1Move = 3;
    p2Move = 0;
    p1Events.push('correct');
    p1Events.push('boost');
    p2Events.push('incorrect');
  } else if (!p1Correct && p2Correct) {
    // Only P2 correct — +2 for being correct, +1 boost (faster than incorrect opponent)
    p1Move = 0;
    p2Move = 3;
    p1Events.push('incorrect');
    p2Events.push('correct');
    p2Events.push('boost');
  } else {
    // Both incorrect — anti-stall: +1 each
    p1Move = 1;
    p2Move = 1;
    p1Events.push('anti-stall');
    p2Events.push('anti-stall');
  }

  let p1NewPos = positions.p1 + p1Move;
  let p2NewPos = positions.p2 + p2Move;

  // Check obstacle penalty for P1
  if (obstacles.includes(p1NewPos) && p1NewPos < finishLine) {
    p1NewPos = Math.max(0, p1NewPos - 1);
    p1Events.push('obstacle');
  }

  // Check obstacle penalty for P2
  if (obstacles.includes(p2NewPos) && p2NewPos < finishLine) {
    p2NewPos = Math.max(0, p2NewPos - 1);
    p2Events.push('obstacle');
  }

  // Clamp to finishLine (don't exceed)
  p1NewPos = Math.min(p1NewPos, finishLine);
  p2NewPos = Math.min(p2NewPos, finishLine);

  return { p1NewPos, p2NewPos, p1Events, p2Events };
}

/**
 * Generate obstacle positions for the race track.
 * Count: max(2, min(5, floor(trackLength * 0.2)))
 * Eligible tiles: index 2 through trackLength-1 (exclude first 2 tiles and finish)
 *
 * @param {number} trackLength - total track length (e.g., 10, 15, 20)
 * @returns {number[]} sorted array of obstacle tile indices
 */
export function generateObstacles(trackLength) {
  const count = Math.max(2, Math.min(5, Math.floor(trackLength * 0.2)));
  const eligible = [];
  for (let i = 2; i < trackLength; i++) {
    eligible.push(i);
  }

  // Shuffle eligible tiles (Fisher-Yates)
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }

  return eligible.slice(0, count).sort((a, b) => a - b);
}

/**
 * Generate fallback math questions (addition/subtraction within 100).
 * Used when API fetch fails. Matches API question shape.
 *
 * @param {number} count - number of questions to generate
 * @returns {Array<{question_text: string, option_a: string, option_b: string, option_c: string, option_d: string, correct_answer: string, subject: string}>}
 */
export function generateFallbackQuestions(count) {
  const questions = [];

  for (let i = 0; i < count; i++) {
    const isAddition = Math.random() < 0.5;
    let a, b, correctValue;

    if (isAddition) {
      a = Math.floor(Math.random() * 90) + 1;  // 1-90
      b = Math.floor(Math.random() * (100 - a)) + 1;  // ensures sum <= 100
      correctValue = a + b;
    } else {
      a = Math.floor(Math.random() * 90) + 10; // 10-99
      b = Math.floor(Math.random() * a) + 1;   // ensures positive result
      correctValue = a - b;
    }

    const questionText = isAddition ? `${a} + ${b} = ?` : `${a} - ${b} = ?`;

    // Generate 3 wrong answers (distinct from correct and each other)
    const wrongAnswers = new Set();
    while (wrongAnswers.size < 3) {
      const offset = Math.floor(Math.random() * 10) + 1;
      const wrong = Math.random() < 0.5 ? correctValue + offset : correctValue - offset;
      if (wrong !== correctValue && wrong >= 0 && wrong <= 100) {
        wrongAnswers.add(wrong);
      }
    }

    // Shuffle options: place correct answer in random slot
    const options = [correctValue, ...wrongAnswers];
    // Fisher-Yates on 4 elements
    for (let j = options.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [options[j], options[k]] = [options[k], options[j]];
    }

    const correctIndex = options.indexOf(correctValue);
    const answerKeys = ['a', 'b', 'c', 'd'];

    questions.push({
      question_text: questionText,
      option_a: String(options[0]),
      option_b: String(options[1]),
      option_c: String(options[2]),
      option_d: String(options[3]),
      correct_answer: answerKeys[correctIndex],
      subject: 'math',
    });
  }

  return questions;
}

/**
 * Fisher-Yates shuffle. Returns a new shuffled array (does not mutate input).
 *
 * @param {Array} array - input array to shuffle
 * @returns {Array} new shuffled array
 */
export function shuffleArray(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Calculate race statistics from an array of round results.
 *
 * @param {Array<{p1Correct: boolean, p2Correct: boolean, p1Time: number, p2Time: number}>} roundResults
 * @returns {{ p1: { correct: number, totalTime: number, rounds: number }, p2: { correct: number, totalTime: number, rounds: number } }}
 */
export function calculateStats(roundResults) {
  const stats = {
    p1: { correct: 0, totalTime: 0, rounds: 0 },
    p2: { correct: 0, totalTime: 0, rounds: 0 },
  };

  for (const round of roundResults) {
    stats.p1.rounds++;
    stats.p2.rounds++;

    if (round.p1Correct) {
      stats.p1.correct++;
    }
    if (round.p2Correct) {
      stats.p2.correct++;
    }

    stats.p1.totalTime += round.p1Time;
    stats.p2.totalTime += round.p2Time;
  }

  return stats;
}

/**
 * Check if a win condition is met.
 * Returns 'p1' if only P1 reached finish, 'p2' if only P2, 'tie' if both, null if neither.
 *
 * @param {Object} positions - { p1: number, p2: number }
 * @param {number} finishLine - finish tile index
 * @returns {'p1' | 'p2' | 'tie' | null}
 */
export function checkWinCondition(positions, finishLine) {
  const p1Finished = positions.p1 >= finishLine;
  const p2Finished = positions.p2 >= finishLine;

  if (p1Finished && p2Finished) return 'tie';
  if (p1Finished) return 'p1';
  if (p2Finished) return 'p2';
  return null;
}
