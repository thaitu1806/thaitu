// Tiếng Anh cơ bản cho bé 5 tuổi (grade 0) và lớp 1 (grade 1).
// Học từ vựng qua hình ảnh emoji: con vật, màu sắc, trái cây, số đếm, chào hỏi.
// Mỗi câu hiển thị emoji + từ tiếng Anh, bé chọn đáp án đúng.

function rnd(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const letters = ['a', 'b', 'c', 'd'];
function mkChoice(question_text, options, correctValue, explanation) {
  const arr = shuffle(options.map(String));
  return {
    question_text,
    option_a: arr[0], option_b: arr[1], option_c: arr[2], option_d: arr[3],
    correct_answer: letters[arr.indexOf(String(correctValue))],
    explanation: explanation || '',
  };
}

// === ANIMALS ===
const ANIMALS = [
  { en: 'dog', vi: 'con chó', icon: '🐶' },
  { en: 'cat', vi: 'con mèo', icon: '🐱' },
  { en: 'fish', vi: 'con cá', icon: '🐟' },
  { en: 'bird', vi: 'con chim', icon: '🐦' },
  { en: 'rabbit', vi: 'con thỏ', icon: '🐰' },
  { en: 'duck', vi: 'con vịt', icon: '🦆' },
  { en: 'cow', vi: 'con bò', icon: '🐮' },
  { en: 'pig', vi: 'con lợn', icon: '🐷' },
  { en: 'elephant', vi: 'con voi', icon: '🐘' },
  { en: 'lion', vi: 'sư tử', icon: '🦁' },
  { en: 'monkey', vi: 'con khỉ', icon: '🐵' },
  { en: 'butterfly', vi: 'bướm', icon: '🦋' },
  { en: 'turtle', vi: 'con rùa', icon: '🐢' },
  { en: 'bee', vi: 'con ong', icon: '🐝' },
  { en: 'frog', vi: 'con ếch', icon: '🐸' },
];
function genAnimalToEn() {
  const a = pick(ANIMALS);
  const wrongs = shuffle(ANIMALS.filter(x => x !== a)).slice(0, 3).map(x => x.en);
  return mkChoice(`${a.icon} Tiếng Anh gọi là gì?`, [a.en, ...wrongs], a.en, `${a.icon} = "${a.en}" (${a.vi}).`);
}
function genAnimalToIcon() {
  const a = pick(ANIMALS);
  const wrongs = shuffle(ANIMALS.filter(x => x !== a)).slice(0, 3).map(x => x.icon);
  return mkChoice(`"${a.en}" là con nào?`, [a.icon, ...wrongs], a.icon, `"${a.en}" = ${a.icon} (${a.vi}).`);
}

// === COLORS ===
const COLORS = [
  { en: 'red', vi: 'đỏ', icon: '🔴' },
  { en: 'blue', vi: 'xanh dương', icon: '🔵' },
  { en: 'yellow', vi: 'vàng', icon: '🟡' },
  { en: 'green', vi: 'xanh lá', icon: '🟢' },
  { en: 'orange', vi: 'cam', icon: '🟠' },
  { en: 'purple', vi: 'tím', icon: '🟣' },
  { en: 'white', vi: 'trắng', icon: '⚪' },
  { en: 'black', vi: 'đen', icon: '⚫' },
];
function genColorToEn() {
  const c = pick(COLORS);
  const wrongs = shuffle(COLORS.filter(x => x !== c)).slice(0, 3).map(x => x.en);
  return mkChoice(`${c.icon} Màu này tiếng Anh gọi là?`, [c.en, ...wrongs], c.en, `${c.icon} = "${c.en}" (${c.vi}).`);
}
function genColorToIcon() {
  const c = pick(COLORS);
  const wrongs = shuffle(COLORS.filter(x => x !== c)).slice(0, 3).map(x => x.icon);
  return mkChoice(`"${c.en}" là màu nào?`, [c.icon, ...wrongs], c.icon, `"${c.en}" = ${c.icon} (${c.vi}).`);
}

// === FRUITS ===
const FRUITS = [
  { en: 'apple', vi: 'táo', icon: '🍎' },
  { en: 'banana', vi: 'chuối', icon: '🍌' },
  { en: 'strawberry', vi: 'dâu', icon: '🍓' },
  { en: 'orange', vi: 'cam', icon: '🍊' },
  { en: 'grape', vi: 'nho', icon: '🍇' },
  { en: 'watermelon', vi: 'dưa hấu', icon: '🍉' },
  { en: 'cherry', vi: 'anh đào', icon: '🍒' },
  { en: 'pineapple', vi: 'dứa', icon: '🍍' },
];
function genFruitToEn() {
  const f = pick(FRUITS);
  const wrongs = shuffle(FRUITS.filter(x => x !== f)).slice(0, 3).map(x => x.en);
  return mkChoice(`${f.icon} Quả này tiếng Anh gọi là?`, [f.en, ...wrongs], f.en, `${f.icon} = "${f.en}" (${f.vi}).`);
}
function genFruitToIcon() {
  const f = pick(FRUITS);
  const wrongs = shuffle(FRUITS.filter(x => x !== f)).slice(0, 3).map(x => x.icon);
  return mkChoice(`"${f.en}" là quả nào?`, [f.icon, ...wrongs], f.icon, `"${f.en}" = ${f.icon} (${f.vi}).`);
}

// === NUMBERS 1-10 ===
const NUMBERS = [
  { en: 'one', n: 1 }, { en: 'two', n: 2 }, { en: 'three', n: 3 },
  { en: 'four', n: 4 }, { en: 'five', n: 5 }, { en: 'six', n: 6 },
  { en: 'seven', n: 7 }, { en: 'eight', n: 8 }, { en: 'nine', n: 9 }, { en: 'ten', n: 10 },
];
function genNumberToEn() {
  const num = pick(NUMBERS);
  const wrongs = shuffle(NUMBERS.filter(x => x !== num)).slice(0, 3).map(x => x.en);
  return mkChoice(`Số ${num.n} tiếng Anh đọc là?`, [num.en, ...wrongs], num.en, `${num.n} = "${num.en}".`);
}
function genNumberToDigit() {
  const num = pick(NUMBERS);
  const wrongs = shuffle(NUMBERS.filter(x => x !== num)).slice(0, 3).map(x => String(x.n));
  return mkChoice(`"${num.en}" là số mấy?`, [String(num.n), ...wrongs], String(num.n), `"${num.en}" = ${num.n}.`);
}

// === GREETINGS / SIMPLE PHRASES ===
const PHRASES = [
  { en: 'Hello', vi: 'Xin chào' },
  { en: 'Goodbye', vi: 'Tạm biệt' },
  { en: 'Thank you', vi: 'Cảm ơn' },
  { en: 'Sorry', vi: 'Xin lỗi' },
  { en: 'Yes', vi: 'Có / Vâng' },
  { en: 'No', vi: 'Không' },
  { en: 'Please', vi: 'Làm ơn' },
  { en: 'Good morning', vi: 'Chào buổi sáng' },
];
function genPhraseToVi() {
  const p = pick(PHRASES);
  const wrongs = shuffle(PHRASES.filter(x => x !== p)).slice(0, 3).map(x => x.vi);
  return mkChoice(`"${p.en}" nghĩa là gì?`, [p.vi, ...wrongs], p.vi, `"${p.en}" = "${p.vi}".`);
}
function genPhraseToEn() {
  const p = pick(PHRASES);
  const wrongs = shuffle(PHRASES.filter(x => x !== p)).slice(0, 3).map(x => x.en);
  return mkChoice(`"${p.vi}" tiếng Anh nói là?`, [p.en, ...wrongs], p.en, `"${p.vi}" = "${p.en}".`);
}

// === BODY PARTS (grade 1) ===
const BODY = [
  { en: 'head', vi: 'đầu' },
  { en: 'hand', vi: 'tay' },
  { en: 'foot', vi: 'chân' },
  { en: 'eye', vi: 'mắt' },
  { en: 'ear', vi: 'tai' },
  { en: 'nose', vi: 'mũi' },
  { en: 'mouth', vi: 'miệng' },
];
function genBodyToEn() {
  const b = pick(BODY);
  const wrongs = shuffle(BODY.filter(x => x !== b)).slice(0, 3).map(x => x.en);
  return mkChoice(`"${b.vi}" tiếng Anh là gì?`, [b.en, ...wrongs], b.en, `"${b.vi}" = "${b.en}".`);
}
function genBodyToVi() {
  const b = pick(BODY);
  const wrongs = shuffle(BODY.filter(x => x !== b)).slice(0, 3).map(x => x.vi);
  return mkChoice(`"${b.en}" nghĩa là gì?`, [b.vi, ...wrongs], b.vi, `"${b.en}" = "${b.vi}".`);
}

// === BUILD ===
// Preschool (simpler): animals, colors, fruits, numbers, greetings
const GENS_PRE = [genAnimalToEn, genAnimalToIcon, genColorToEn, genColorToIcon, genFruitToEn, genFruitToIcon, genNumberToEn, genNumberToDigit, genPhraseToVi];
// Grade 1 (adds body, more phrases)
const GENS_G1 = [...GENS_PRE, genPhraseToEn, genBodyToEn, genBodyToVi];

function build(gens, count) {
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < count && guard++ < count * 20) {
    const q = gens[out.length % gens.length]();
    if (seen.has(q.question_text)) continue;
    seen.add(q.question_text);
    out.push(q);
  }
  return out;
}

// 5 tuổi — tiếng Anh cơ bản (con vật, màu, trái cây, số, chào hỏi)
export const englishPreschool = build(GENS_PRE, 50);
// Lớp 1 — tiếng Anh (thêm bộ phận cơ thể, câu giao tiếp)
export const englishGrade1 = build(GENS_G1, 60);
