// Câu hỏi HÌNH ẢNH cho bé 5 tuổi (mầm non) — đếm trong phạm vi 5, so sánh
// nhiều/ít, nhận biết to/nhỏ, màu sắc, con vật, hình khối. Tất cả đều trực quan
// bằng emoji để bé chưa biết đọc vẫn chơi được (kết hợp đọc to qua tts.js).
// Sinh tự động, đáp án luôn đúng, xáo trộn vị trí để không đoán mẹo.

const FRUITS = ['🍎', '🍌', '🍓', '🍊', '🍇', '🍉'];
const ANIMALS = ['🐶', '🐱', '🐰', '🐥', '🐸', '🐢', '🐟', '🦋'];
const TOYS = ['⭐', '🎈', '🌸', '🚗', '⚽', '🧸'];
const ALL = [...FRUITS, ...ANIMALS, ...TOYS];

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function repeat(icon, n) { return Array.from({ length: n }, () => icon).join(' '); }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const letters = ['a', 'b', 'c', 'd'];
function mkChoice(question_text, options, correctValue, explanation) {
  const arr = shuffle(options);
  return {
    question_text,
    option_a: String(arr[0]), option_b: String(arr[1]), option_c: String(arr[2]), option_d: String(arr[3]),
    correct_answer: letters[arr.indexOf(correctValue)],
    explanation: explanation || '',
  };
}

// Đếm số lượng (1..5), đáp án là SỐ.
function genCount() {
  const icon = pick(ALL);
  const n = rnd(1, 5);
  const opts = new Set([n]);
  while (opts.size < 4) { const w = rnd(1, 6); if (w !== n) opts.add(w); }
  return mkChoice(`Đếm xem có mấy ${icon}?\n\n${repeat(icon, n)}`, [...opts], n, `Có ${n} ${icon}.`);
}

// Hàng nào có NHIỀU hơn — đáp án là ICON.
function genMore() {
  let i1 = pick(ALL), i2 = pick(ALL); while (i2 === i1) i2 = pick(ALL);
  let a = rnd(1, 5), b = rnd(1, 5); while (b === a) b = rnd(1, 5);
  const moreIcon = a > b ? i1 : i2;
  const others = ALL.filter(x => x !== i1 && x !== i2);
  const d1 = pick(others); let d2 = pick(others); while (d2 === d1) d2 = pick(others);
  return mkChoice(`Hàng nào có NHIỀU hơn?\n\n${i1} : ${repeat(i1, a)}\n${i2} : ${repeat(i2, b)}`,
    [i1, i2, d1, d2], moreIcon, `${moreIcon} nhiều hơn (${Math.max(a, b)} > ${Math.min(a, b)}).`);
}

// Hàng nào có ÍT hơn — đáp án là ICON.
function genFewer() {
  let i1 = pick(ALL), i2 = pick(ALL); while (i2 === i1) i2 = pick(ALL);
  let a = rnd(1, 5), b = rnd(1, 5); while (b === a) b = rnd(1, 5);
  const fewerIcon = a < b ? i1 : i2;
  const others = ALL.filter(x => x !== i1 && x !== i2);
  const d1 = pick(others); let d2 = pick(others); while (d2 === d1) d2 = pick(others);
  return mkChoice(`Hàng nào có ÍT hơn?\n\n${i1} : ${repeat(i1, a)}\n${i2} : ${repeat(i2, b)}`,
    [i1, i2, d1, d2], fewerIcon, `${fewerIcon} ít hơn (${Math.min(a, b)} < ${Math.max(a, b)}).`);
}

// Cái nào TO nhất / NHỎ nhất (dùng cỡ chữ emoji bằng cách lặp đôi để gợi ý? -> dùng câu chữ).
const BIG_SMALL = [
  { big: '🐘', small: '🐭', note: 'Con voi to hơn con chuột.' },
  { big: '🐳', small: '🐟', note: 'Cá voi to hơn con cá nhỏ.' },
  { big: '🌳', small: '🌱', note: 'Cây to hơn mầm cây.' },
  { big: '🚌', small: '🚲', note: 'Xe buýt to hơn xe đạp.' },
  { big: '🍉', small: '🍒', note: 'Quả dưa hấu to hơn quả anh đào.' },
];
function genBigger() {
  const pair = pick(BIG_SMALL);
  const others = ['⚽', '🎈', '🐝', '🦋', '🐞'];
  const d1 = pick(others); let d2 = pick(others); while (d2 === d1) d2 = pick(others);
  return mkChoice(`Cái nào TO hơn?\n\n${pair.big}   và   ${pair.small}`, [pair.big, pair.small, d1, d2], pair.big, pair.note);
}
function genSmaller() {
  const pair = pick(BIG_SMALL);
  const others = ['⚽', '🎈', '🐝', '🦋', '🐞'];
  const d1 = pick(others); let d2 = pick(others); while (d2 === d1) d2 = pick(others);
  return mkChoice(`Cái nào NHỎ hơn?\n\n${pair.big}   và   ${pair.small}`, [pair.big, pair.small, d1, d2], pair.small, pair.note);
}

// Nhận biết MÀU SẮC qua đồ vật.
const COLORS = [
  { name: 'ĐỎ', icon: '🔴', items: '🍎🍓🌹' },
  { name: 'VÀNG', icon: '🟡', items: '🍌🌟🌼' },
  { name: 'XANH LÁ', icon: '🟢', items: '🍀🥦🐸' },
  { name: 'XANH DƯƠNG', icon: '🔵', items: '💧🐬🌊' },
  { name: 'CAM', icon: '🟠', items: '🍊🥕🦊' },
  { name: 'TÍM', icon: '🟣', items: '🍇🍆🔮' },
];
function genColor() {
  const c = pick(COLORS);
  const others = COLORS.filter(x => x !== c);
  const d = shuffle(others).slice(0, 3).map(x => x.icon);
  return mkChoice(`Chấm tròn nào màu ${c.name}?\n\n(Như ${c.items})`, [c.icon, ...d], c.icon, `${c.icon} là màu ${c.name.toLowerCase()}.`);
}

// Con vật nào kêu ... (âm thanh quen thuộc).
const SOUNDS = [
  { q: 'Con gì kêu "Gâu gâu"?', a: '🐶' },
  { q: 'Con gì kêu "Meo meo"?', a: '🐱' },
  { q: 'Con gì kêu "Ò ó o"?', a: '🐓' },
  { q: 'Con gì kêu "Ụt ịt"?', a: '🐷' },
  { q: 'Con gì kêu "Cạp cạp"?', a: '🦆' },
  { q: 'Con gì kêu "Bò ò"?', a: '🐮' },
];
function genSound() {
  const s = pick(SOUNDS);
  const others = ['🐶', '🐱', '🐓', '🐷', '🦆', '🐮', '🐸', '🐰'].filter(x => x !== s.a);
  const d = shuffle(others).slice(0, 3);
  return mkChoice(s.q, [s.a, ...d], s.a, `Đáp án là ${s.a}.`);
}

// Tiếp theo là gì? (mẫu lặp đơn giản A B A B ?)
function genPattern() {
  let i1 = pick(ALL), i2 = pick(ALL); while (i2 === i1) i2 = pick(ALL);
  const next = i1; // ...A B A B -> next is A
  const others = ALL.filter(x => x !== i1 && x !== i2);
  const d1 = i2; const d2 = pick(others);
  let d3 = pick(others); while (d3 === d2) d3 = pick(others);
  return mkChoice(`Tiếp theo là hình gì?\n\n${i1} ${i2} ${i1} ${i2} ❓`, [next, d1, d2, d3], next, `Mẫu lặp lại: ${i1} ${i2}, nên tiếp theo là ${next}.`);
}

const GENS = [genCount, genMore, genFewer, genBigger, genSmaller, genColor, genSound, genPattern, genCount, genMore];

function build(count) {
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard++ < count * 12) {
    const q = GENS[out.length % GENS.length]();
    if (seen.has(q.question_text)) continue;
    seen.add(q.question_text);
    out.push(q);
  }
  return out;
}

// Bé 5 tuổi (grade 0) — toán/nhận biết bằng hình ảnh, mức "easy".
export const preschoolPicture = build(40);
