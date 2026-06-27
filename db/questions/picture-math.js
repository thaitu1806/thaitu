// Toán bằng HÌNH ẢNH (emoji) cho lớp 2 — đếm, cộng, trừ, so sánh trực quan.
// Mỗi câu dùng emoji làm "hình" trong question_text để bé nhìn và đếm.
// Sinh tự động nhưng đáp án luôn đúng; xáo trộn vị trí đáp án để không đoán mẹo.

const ICONS = ['🍎', '🍌', '🍓', '🐶', '🐱', '🐰', '⭐', '🎈', '🌸', '🍪', '🐟', '🚗', '🦋', '🌳', '🍊', '🐥'];

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickIcon() { return ICONS[Math.floor(Math.random() * ICONS.length)]; }
function repeat(icon, n) { return Array.from({ length: n }, () => icon).join(''); }

// Build a 4-option MCQ from a correct number; wrong options are nearby numbers.
function mcq(question_text, answer, spread = 4, explanation = '') {
  const opts = new Set([answer]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 50) {
    const w = answer + rnd(-spread, spread);
    if (w >= 0 && w !== answer) opts.add(w);
  }
  // ensure 4 options even for small answers
  let n = answer + 1;
  while (opts.size < 4) { if (!opts.has(n)) opts.add(n); n++; }
  const arr = [...opts];
  // shuffle
  for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; }
  const letters = ['a', 'b', 'c', 'd'];
  return {
    question_text,
    option_a: String(arr[0]), option_b: String(arr[1]), option_c: String(arr[2]), option_d: String(arr[3]),
    correct_answer: letters[arr.indexOf(answer)],
    explanation,
  };
}

function genCount() {
  const icon = pickIcon();
  const n = rnd(2, 9);
  return mcq(`Đếm xem có mấy ${icon}?\n\n${repeat(icon, n)}`, n, 3, `Có ${n} ${icon}.`);
}

function genAdd() {
  const icon = pickIcon();
  const a = rnd(1, 6), b = rnd(1, 6);
  return mcq(`Có mấy ${icon} tất cả?\n\n${repeat(icon, a)}  +  ${repeat(icon, b)}`, a + b, 4, `${a} + ${b} = ${a + b}.`);
}

function genSub() {
  const icon = pickIcon();
  const a = rnd(4, 9), b = rnd(1, a - 1);
  return mcq(`Còn lại mấy ${icon}?\n\n${repeat(icon, a)}\n(Ăn mất ${b} cái)`, a - b, 3, `${a} - ${b} = ${a - b}.`);
}

function genCompareWhichMore() {
  const i1 = pickIcon(); let i2 = pickIcon(); while (i2 === i1) i2 = pickIcon();
  const a = rnd(2, 8); let b = rnd(2, 8); while (b === a) b = rnd(2, 8);
  const moreIcon = a > b ? i1 : i2;
  // Options are the two icons + two distractors
  const others = ICONS.filter(x => x !== i1 && x !== i2);
  const d1 = others[rnd(0, others.length - 1)];
  let d2 = others[rnd(0, others.length - 1)]; while (d2 === d1) d2 = others[rnd(0, others.length - 1)];
  const arr = [i1, i2, d1, d2];
  for (let k = arr.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [arr[k], arr[j]] = [arr[j], arr[k]]; }
  const letters = ['a', 'b', 'c', 'd'];
  return {
    question_text: `Hàng nào có NHIỀU hơn?\n\n${i1}: ${repeat(i1, a)}\n${i2}: ${repeat(i2, b)}`,
    option_a: arr[0], option_b: arr[1], option_c: arr[2], option_d: arr[3],
    correct_answer: letters[arr.indexOf(moreIcon)],
    explanation: `${moreIcon} nhiều hơn (${Math.max(a, b)} > ${Math.min(a, b)}).`,
  };
}

function genMissing() {
  const icon = pickIcon();
  const total = rnd(5, 10), have = rnd(1, total - 1);
  const need = total - have;
  return mcq(`Cần thêm mấy ${icon} cho đủ ${total}?\n\nĐang có: ${repeat(icon, have)}`, need, 3, `${total} - ${have} = ${need}.`);
}

const GENS = [genCount, genAdd, genSub, genCompareWhichMore, genMissing];

// Deterministic-ish builder so the set is stable enough but varied.
function build(count) {
  const out = [];
  const seenTexts = new Set();
  let guard = 0;
  while (out.length < count && guard++ < count * 8) {
    const q = GENS[out.length % GENS.length]();
    if (seenTexts.has(q.question_text)) continue;
    seenTexts.add(q.question_text);
    out.push(q);
  }
  return out;
}

// ~40 picture questions for grade-2 "easy" math.
export const pictureMathEasy = build(40);
