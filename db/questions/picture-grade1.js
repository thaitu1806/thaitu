// Câu hỏi HÌNH ẢNH cho lớp 1 — đếm trong phạm vi 10-20, cộng/trừ trong phạm vi
// 10 bằng hình, so sánh nhiều/ít, nhận biết hình khối, thứ tự số. Trực quan bằng
// emoji để bé lớp 1 (vừa biết đọc) nhìn–đếm–chọn. Đáp án xáo trộn vị trí.

const ICONS = ['🍎', '🍌', '🍓', '🐶', '🐱', '🐰', '⭐', '🎈', '🌸', '🍪', '🐟', '🚗', '🦋', '🌳', '🍊', '🐥', '⚽', '🧁'];

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rows(icon, n, per = 10) {
  // wrap into rows of `per` so 11-20 items stay readable
  const out = [];
  for (let i = 0; i < n; i += per) out.push(Array.from({ length: Math.min(per, n - i) }, () => icon).join(' '));
  return out.join('\n');
}
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

const letters = ['a', 'b', 'c', 'd'];
function mkNum(question_text, answer, spread, explanation) {
  const opts = new Set([answer]);
  let guard = 0;
  while (opts.size < 4 && guard++ < 60) { const w = answer + rnd(-spread, spread); if (w >= 0 && w !== answer) opts.add(w); }
  let n = answer + 1; while (opts.size < 4) { if (!opts.has(n)) opts.add(n); n++; }
  const arr = shuffle([...opts]);
  return {
    question_text,
    option_a: String(arr[0]), option_b: String(arr[1]), option_c: String(arr[2]), option_d: String(arr[3]),
    correct_answer: letters[arr.indexOf(answer)],
    explanation: explanation || '',
  };
}
function mkIcon(question_text, options, correctValue, explanation) {
  const arr = shuffle(options);
  return {
    question_text,
    option_a: String(arr[0]), option_b: String(arr[1]), option_c: String(arr[2]), option_d: String(arr[3]),
    correct_answer: letters[arr.indexOf(correctValue)],
    explanation: explanation || '',
  };
}

// Đếm 10-20.
function genCount() {
  const icon = pick(ICONS);
  const n = rnd(10, 20);
  return mkNum(`Đếm xem có mấy ${icon}?\n\n${rows(icon, n)}`, n, 3, `Có ${n} ${icon}.`);
}

// Cộng bằng hình (tổng ≤ 10).
function genAdd() {
  const icon = pick(ICONS);
  const a = rnd(1, 5), b = rnd(1, 10 - a);
  return mkNum(`Có mấy ${icon} tất cả?\n\n${rows(icon, a)}   ➕   ${rows(icon, b)}`, a + b, 3, `${a} + ${b} = ${a + b}.`);
}

// Trừ bằng hình.
function genSub() {
  const icon = pick(ICONS);
  const a = rnd(5, 10), b = rnd(1, a - 1);
  return mkNum(`Còn lại mấy ${icon}?\n\nCó: ${rows(icon, a)}\n(Bớt đi ${b} cái)`, a - b, 3, `${a} - ${b} = ${a - b}.`);
}

// Cần thêm mấy cái cho đủ.
function genMissing() {
  const icon = pick(ICONS);
  const total = rnd(8, 15), have = rnd(2, total - 1);
  return mkNum(`Cần thêm mấy ${icon} cho đủ ${total}?\n\nĐang có: ${rows(icon, have)}`, total - have, 3, `${total} - ${have} = ${total - have}.`);
}

// So sánh: số nào lớn hơn (kèm hình minh hoạ).
function genCompare() {
  let a = rnd(1, 10), b = rnd(1, 10); while (b === a) b = rnd(1, 10);
  const bigger = Math.max(a, b);
  return mkNum(`Số nào LỚN hơn?\n\n${a}  hay  ${b}?`, bigger, 2, `${bigger} lớn hơn ${Math.min(a, b)}.`);
}

// Nhận biết hình khối.
const SHAPES = [
  { name: 'HÌNH TRÒN', icon: '⭕' },
  { name: 'HÌNH VUÔNG', icon: '🟦' },
  { name: 'HÌNH TAM GIÁC', icon: '🔺' },
  { name: 'HÌNH CHỮ NHẬT', icon: '▭' },
  { name: 'NGÔI SAO', icon: '⭐' },
  { name: 'TRÁI TIM', icon: '❤️' },
];
function genShape() {
  const s = pick(SHAPES);
  const others = SHAPES.filter(x => x !== s);
  const d = shuffle(others).slice(0, 3).map(x => x.icon);
  return mkIcon(`Đâu là ${s.name}?`, [s.icon, ...d], s.icon, `${s.icon} là ${s.name.toLowerCase()}.`);
}

// Số liền sau.
function genNext() {
  const n = rnd(1, 19);
  return mkNum(`Số liền SAU số ${n} là số nào?`, n + 1, 2, `Sau ${n} là ${n + 1}.`);
}

// Số liền trước.
function genPrev() {
  const n = rnd(2, 20);
  return mkNum(`Số liền TRƯỚC số ${n} là số nào?`, n - 1, 2, `Trước ${n} là ${n - 1}.`);
}

const GENS = [genCount, genAdd, genSub, genMissing, genCompare, genShape, genNext, genPrev, genAdd, genCount, genAnimal, genAnimalEn, genAnimal, genAnimalEn];

// Con vật — nhận biết tiếng Việt.
const ANIMALS = [
  { name: 'con chó', icon: '🐶' },
  { name: 'con mèo', icon: '🐱' },
  { name: 'con gà', icon: '🐓' },
  { name: 'con vịt', icon: '🦆' },
  { name: 'con bò', icon: '🐮' },
  { name: 'con lợn', icon: '🐷' },
  { name: 'con cá', icon: '🐟' },
  { name: 'con chim', icon: '🐦' },
  { name: 'con thỏ', icon: '🐰' },
  { name: 'con rùa', icon: '🐢' },
  { name: 'con ong', icon: '🐝' },
  { name: 'con bướm', icon: '🦋' },
  { name: 'con voi', icon: '🐘' },
  { name: 'con sư tử', icon: '🦁' },
  { name: 'con khỉ', icon: '🐵' },
];
function genAnimal() {
  const a = pick(ANIMALS);
  const wrongs = shuffle(ANIMALS.filter(x => x !== a)).slice(0, 3).map(x => x.icon);
  return mkIcon(`Đâu là ${a.name}? ${a.icon.slice(0,0)}`, [a.icon, ...wrongs], a.icon, `${a.icon} là ${a.name}.`);
}

// Con vật — tiếng Anh (grade 1 English).
const ANIMALS_EN = [
  { en: 'dog', vi: 'con chó', icon: '🐶' },
  { en: 'cat', vi: 'con mèo', icon: '🐱' },
  { en: 'fish', vi: 'con cá', icon: '🐟' },
  { en: 'bird', vi: 'con chim', icon: '🐦' },
  { en: 'rabbit', vi: 'con thỏ', icon: '🐰' },
  { en: 'duck', vi: 'vịt', icon: '🦆' },
  { en: 'cow', vi: 'con bò', icon: '🐮' },
  { en: 'pig', vi: 'con lợn', icon: '🐷' },
  { en: 'elephant', vi: 'con voi', icon: '🐘' },
  { en: 'lion', vi: 'sư tử', icon: '🦁' },
  { en: 'monkey', vi: 'con khỉ', icon: '🐵' },
  { en: 'butterfly', vi: 'bướm', icon: '🦋' },
  { en: 'turtle', vi: 'con rùa', icon: '🐢' },
  { en: 'bee', vi: 'con ong', icon: '🐝' },
];
function genAnimalEn() {
  const a = pick(ANIMALS_EN);
  const mode = rnd(0, 1); // 0: which icon is "dog"?  1: this icon 🐶 is called...?
  if (mode === 0) {
    const wrongs = shuffle(ANIMALS_EN.filter(x => x !== a)).slice(0, 3).map(x => x.icon);
    return mkIcon(`"${a.en}" là con nào?\n(${a.en} = ${a.vi})`, [a.icon, ...wrongs], a.icon, `${a.icon} là "${a.en}" (${a.vi}).`);
  } else {
    const wrongs = shuffle(ANIMALS_EN.filter(x => x !== a)).slice(0, 3).map(x => x.en);
    return mkIcon(`${a.icon} tiếng Anh gọi là gì?`, [a.en, ...wrongs], a.en, `${a.icon} = "${a.en}".`);
  }
}

function build(count) {
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const q = GENS[out.length % GENS.length]();
    if (seen.has(q.question_text)) continue;
    seen.add(q.question_text);
    out.push(q);
  }
  return out;
}

// Lớp 1 (grade 1) — toán + con vật + tiếng Anh bằng hình ảnh.
export const grade1Picture = build(80);
