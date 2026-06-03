// === ADMIN LOGIN ===
(function() {
  const saved = sessionStorage.getItem('adminAuth');
  if (saved) { showAdmin(); return; }

  document.getElementById('btn-login').addEventListener('click', tryLogin);
  document.getElementById('login-pass').addEventListener('keypress', (e) => { if (e.key === 'Enter') tryLogin(); });

  function tryLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (user === 'admin' && pass === 'admin') {
      sessionStorage.setItem('adminAuth', btoa('admin:admin'));
      showAdmin();
    } else {
      document.getElementById('login-error').textContent = '❌ Sai tên đăng nhập hoặc mật khẩu!';
    }
  }

  function showAdmin() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-main').style.display = 'block';
  }
})();

// === ADMIN API HELPER ===
function adminUrl(resource, params = {}) {
  const p = new URLSearchParams({ resource, ...params });
  return `/api/admin?${p.toString()}`;
}

function adminFetch(url, options = {}) {
  return fetch(url, { ...options, headers: { ...options.headers, 'Authorization': 'Basic ' + btoa('admin:admin') } });
}

// === TABS ===
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    if (tab.dataset.tab === 'list') loadQuestionsList();
    if (tab.dataset.tab === 'stats') loadStats();
    if (tab.dataset.tab === 'players') loadPlayers();
    if (tab.dataset.tab === 'exams') loadExamsList();
  });
});

// === QUESTION GENERATOR ===
const questionTypes = {
  math: {
    easy: [
      { value: 'add10', label: 'Cộng trong phạm vi 10' },
      { value: 'add20', label: 'Cộng trong phạm vi 20' },
      { value: 'sub10', label: 'Trừ trong phạm vi 10' },
      { value: 'sub20', label: 'Trừ trong phạm vi 20' },
      { value: 'compare', label: 'So sánh số' },
      { value: 'sequence', label: 'Số liền trước/sau' },
      { value: 'add3nums', label: 'Cộng 3 số' },
    ],
    medium: [
      { value: 'add100', label: 'Cộng có nhớ (phạm vi 100)' },
      { value: 'sub100', label: 'Trừ có nhớ (phạm vi 100)' },
      { value: 'mul2', label: 'Bảng nhân 2' },
      { value: 'mul3', label: 'Bảng nhân 3' },
      { value: 'mul4', label: 'Bảng nhân 4' },
      { value: 'mul5', label: 'Bảng nhân 5' },
      { value: 'div', label: 'Phép chia' },
      { value: 'clock', label: 'Đọc giờ đồng hồ' },
    ],
    hard: [
      { value: 'findMissing', label: 'Tìm số còn thiếu' },
      { value: 'pattern', label: 'Dãy số quy luật' },
      { value: 'wordProblem', label: 'Bài toán có lời văn' },
      { value: 'fastCalc', label: 'Tính nhanh' },
      { value: 'logic', label: 'Logic tư duy' },
    ],
  },
  vietnamese: {
    easy: [
      { value: 'spelling_ln', label: 'Chính tả l/n' },
      { value: 'spelling_sx', label: 'Chính tả s/x' },
      { value: 'spelling_chtr', label: 'Chính tả ch/tr' },
      { value: 'tone', label: 'Điền dấu thanh' },
      { value: 'rhyme', label: 'Nhận biết vần' },
    ],
    medium: [
      { value: 'antonym', label: 'Từ trái nghĩa' },
      { value: 'synonym', label: 'Từ đồng nghĩa' },
      { value: 'fillBlank', label: 'Điền từ vào chỗ trống' },
      { value: 'arrange', label: 'Sắp xếp câu' },
      { value: 'wordType', label: 'Phân loại từ' },
    ],
    hard: [
      { value: 'findError', label: 'Tìm lỗi sai' },
      { value: 'reading', label: 'Đọc hiểu' },
      { value: 'proverb', label: 'Thành ngữ tục ngữ' },
      { value: 'grammar', label: 'Ngữ pháp câu' },
      { value: 'rhetoric', label: 'Biện pháp tu từ' },
    ],
  },
};

function updateTypeOptions() {
  const subject = document.getElementById('gen-subject').value;
  const difficulty = document.getElementById('gen-difficulty').value;
  const typeSelect = document.getElementById('gen-type');
  const types = questionTypes[subject]?.[difficulty] || [];
  typeSelect.innerHTML = types.map(t => `<option value="${t.value}">${t.label}</option>`).join('');
}

document.getElementById('gen-subject').addEventListener('change', updateTypeOptions);
document.getElementById('gen-difficulty').addEventListener('change', updateTypeOptions);
updateTypeOptions();

// === QUESTION GENERATOR ENGINE ===
function generateQuestions(subject, difficulty, type, count) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    let q = null;
    if (subject === 'math') {
      q = generateMathQuestion(difficulty, type);
    } else {
      q = generateVietnameseQuestion(difficulty, type);
    }
    if (q) {
      q.subject = subject;
      q.difficulty = difficulty;
      questions.push(q);
    }
  }
  return questions;
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

function makeOptions(correct, range = 5) {
  const options = new Set([correct]);
  while (options.size < 4) {
    let wrong = correct + rand(-range, range);
    if (wrong !== correct && wrong >= 0) options.add(wrong);
  }
  const arr = shuffle([...options]);
  const correctIdx = arr.indexOf(correct);
  const labels = ['a', 'b', 'c', 'd'];
  return {
    option_a: String(arr[0]),
    option_b: String(arr[1]),
    option_c: String(arr[2]),
    option_d: String(arr[3]),
    correct_answer: labels[correctIdx],
  };
}

function generateMathQuestion(difficulty, type) {
  switch (type) {
    case 'add10': {
      const a = rand(1, 9), b = rand(1, 9 - a);
      const answer = a + b;
      return { question_text: `${a} + ${b} = ?`, ...makeOptions(answer, 3) };
    }
    case 'add20': {
      const a = rand(5, 12), b = rand(3, 9);
      const answer = a + b;
      return { question_text: `${a} + ${b} = ?`, ...makeOptions(answer, 4) };
    }
    case 'sub10': {
      const a = rand(3, 10), b = rand(1, a - 1);
      const answer = a - b;
      return { question_text: `${a} - ${b} = ?`, ...makeOptions(answer, 3) };
    }
    case 'sub20': {
      const a = rand(11, 20), b = rand(3, a - 1);
      const answer = a - b;
      return { question_text: `${a} - ${b} = ?`, ...makeOptions(answer, 4) };
    }
    case 'compare': {
      const a = rand(1, 20), b = rand(1, 20);
      const signs = ['<', '>', '='];
      const correct = a < b ? '<' : a > b ? '>' : '=';
      const opts = shuffle([...signs, 'Không biết']);
      const labels = ['a', 'b', 'c', 'd'];
      return {
        question_text: `Điền dấu: ${a} ... ${b}`,
        option_a: opts[0], option_b: opts[1], option_c: opts[2], option_d: opts[3],
        correct_answer: labels[opts.indexOf(correct)],
      };
    }
    case 'sequence': {
      const n = rand(2, 18);
      const isAfter = rand(0, 1);
      const answer = isAfter ? n + 1 : n - 1;
      const text = isAfter ? `Số liền sau số ${n} là?` : `Số liền trước số ${n} là?`;
      return { question_text: text, ...makeOptions(answer, 2) };
    }
    case 'add3nums': {
      const a = rand(1, 6), b = rand(1, 6), c = rand(1, 6);
      const answer = a + b + c;
      return { question_text: `${a} + ${b} + ${c} = ?`, ...makeOptions(answer, 4) };
    }
    case 'add100': {
      const a = rand(15, 60), b = rand(15, 50);
      const answer = a + b;
      return { question_text: `${a} + ${b} = ?`, ...makeOptions(answer, 5) };
    }
    case 'sub100': {
      const a = rand(40, 95), b = rand(15, a - 10);
      const answer = a - b;
      return { question_text: `${a} - ${b} = ?`, ...makeOptions(answer, 5) };
    }
    case 'mul2': case 'mul3': case 'mul4': case 'mul5': {
      const multiplier = parseInt(type.replace('mul', ''));
      const n = rand(1, 10);
      const answer = multiplier * n;
      return { question_text: `${multiplier} x ${n} = ?`, ...makeOptions(answer, multiplier * 2) };
    }
    case 'div': {
      const divisor = rand(2, 5);
      const quotient = rand(2, 10);
      const dividend = divisor * quotient;
      return { question_text: `${dividend} : ${divisor} = ?`, ...makeOptions(quotient, 3) };
    }
    case 'findMissing': {
      const ops = ['+', '-', 'x'];
      const op = ops[rand(0, 2)];
      let a, b, answer, text;
      if (op === '+') {
        answer = rand(3, 30); b = rand(5, 40); a = answer + b;
        text = `? + ${b} = ${a}`;
      } else if (op === '-') {
        a = rand(20, 60); answer = rand(5, 20); b = a - answer;
        text = `${a} - ? = ${b}`;
      } else {
        const mul = rand(2, 5); answer = rand(2, 9);
        text = `? x ${mul} = ${mul * answer}`;
      }
      return { question_text: text, ...makeOptions(answer, 4) };
    }
    case 'pattern': {
      const step = rand(2, 5);
      const start = rand(1, 10);
      const seq = Array.from({ length: 5 }, (_, i) => start + step * i);
      const hideIdx = rand(2, 4);
      const answer = seq[hideIdx];
      const display = seq.map((n, i) => i === hideIdx ? '?' : n).join(', ');
      return { question_text: `Tìm số còn thiếu: ${display}`, ...makeOptions(answer, step * 2) };
    }
    case 'fastCalc': {
      const a = rand(10, 50), b = rand(10, 50);
      const answer = a + b;
      return { question_text: `${a} + ${b} = ? (Tính nhanh)`, ...makeOptions(answer, 8) };
    }
    case 'wordProblem': {
      const templates = [
        () => { const a = rand(10, 40), b = rand(5, 20); return { text: `Lan có ${a} viên bi, cho bạn ${b} viên. Lan còn mấy viên?`, ans: a - b }; },
        () => { const a = rand(2, 5), b = rand(3, 8); return { text: `Mẹ mua ${a} túi cam, mỗi túi ${b} quả. Mẹ mua tất cả mấy quả?`, ans: a * b }; },
        () => { const total = rand(12, 30), parts = rand(2, 5); const each = Math.floor(total / parts) * parts === total ? total / parts : null; if (!each) return null; return { text: `Có ${total} cái kẹo chia đều cho ${parts} bạn. Mỗi bạn được mấy cái?`, ans: each }; },
        () => { const a = rand(20, 50), b = rand(10, 30); return { text: `Lớp có ${a} học sinh, thêm ${b} bạn mới. Lớp có tất cả mấy bạn?`, ans: a + b }; },
      ];
      let result = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        const tmpl = templates[rand(0, templates.length - 1)]();
        if (tmpl) { result = tmpl; break; }
      }
      if (!result) { const a = rand(10, 30), b = rand(5, 15); result = { text: `An có ${a} trang sách, đọc ${b} trang. Còn mấy trang?`, ans: a - b }; }
      return { question_text: result.text, ...makeOptions(result.ans, 5) };
    }
    case 'logic': {
      const a = rand(5, 12);
      const answer = a + 5;
      return { question_text: `Năm nay em ${a} tuổi. 5 năm nữa em mấy tuổi?`, ...makeOptions(answer, 3) };
    }
    case 'clock': {
      const hour = rand(1, 12);
      const min = [0, 30][rand(0, 1)];
      const answer = min === 0 ? 12 : 6;
      return {
        question_text: `${hour} giờ ${min === 0 ? 'đúng' : '30 phút'}, kim dài chỉ số mấy?`,
        ...makeOptions(answer, 3),
      };
    }
    default:
      return generateMathQuestion('easy', 'add10');
  }
}

function generateVietnameseQuestion(difficulty, type) {
  switch (type) {
    case 'spelling_ln': {
      const words = [
        { word: 'lên', blank: '...ên', correct: 'l', wrong: ['n', 'nh', 'ng'] },
        { word: 'nước', blank: '...ước', correct: 'n', wrong: ['l', 'nh', 'ng'] },
        { word: 'lá', blank: '...á', correct: 'l', wrong: ['n', 'nh', 'ng'] },
        { word: 'nói', blank: '...ói', correct: 'n', wrong: ['l', 'nh', 'ng'] },
        { word: 'lắng', blank: '...ắng nghe', correct: 'l', wrong: ['n', 'nh', 'ng'] },
        { word: 'năm', blank: '...ăm học', correct: 'n', wrong: ['l', 'nh', 'ng'] },
        { word: 'lớp', blank: '...ớp học', correct: 'l', wrong: ['n', 'nh', 'ng'] },
        { word: 'nấu', blank: '...ấu ăn', correct: 'n', wrong: ['l', 'nh', 'ng'] },
        { word: 'lười', blank: '...ười biếng', correct: 'l', wrong: ['n', 'nh', 'ng'] },
        { word: 'nắng', blank: '...ắng nóng', correct: 'n', wrong: ['l', 'nh', 'ng'] },
      ];
      const w = words[rand(0, words.length - 1)];
      const opts = shuffle([w.correct, ...w.wrong]);
      const labels = ['a', 'b', 'c', 'd'];
      return {
        question_text: `Điền l hay n: ${w.blank}`,
        option_a: opts[0], option_b: opts[1], option_c: opts[2], option_d: opts[3],
        correct_answer: labels[opts.indexOf(w.correct)],
      };
    }
    case 'spelling_sx': {
      const words = [
        { blank: '...ách vở', correct: 's', wrong: ['x', 'ch', 'tr'] },
        { blank: '...e đạp', correct: 'x', wrong: ['s', 'ch', 'tr'] },
        { blank: '...ông nước', correct: 's', wrong: ['x', 'ch', 'tr'] },
        { blank: '...uân', correct: 'x', wrong: ['s', 'ch', 'tr'] },
        { blank: '...áng sớm', correct: 's', wrong: ['x', 'ch', 'tr'] },
        { blank: '...ung quanh', correct: 'x', wrong: ['s', 'ch', 'tr'] },
        { blank: '...ạch sẽ', correct: 's', wrong: ['x', 'ch', 'tr'] },
        { blank: '...inh đẹp', correct: 'x', wrong: ['s', 'ch', 'tr'] },
      ];
      const w = words[rand(0, words.length - 1)];
      const opts = shuffle([w.correct, ...w.wrong]);
      const labels = ['a', 'b', 'c', 'd'];
      return {
        question_text: `Điền s hay x: ${w.blank}`,
        option_a: opts[0], option_b: opts[1], option_c: opts[2], option_d: opts[3],
        correct_answer: labels[opts.indexOf(w.correct)],
      };
    }
    case 'spelling_chtr': {
      const words = [
        { blank: '...ời nắng', correct: 'tr', wrong: ['ch', 's', 'x'] },
        { blank: '...ơi đùa', correct: 'ch', wrong: ['tr', 's', 'x'] },
        { blank: '...ường học', correct: 'tr', wrong: ['ch', 's', 'x'] },
        { blank: '...ào hỏi', correct: 'ch', wrong: ['tr', 's', 'x'] },
        { blank: '...ăm chỉ', correct: 'ch', wrong: ['tr', 's', 'x'] },
        { blank: '...ẻ em', correct: 'tr', wrong: ['ch', 's', 'x'] },
        { blank: '...uyện cổ tích', correct: 'tr', wrong: ['ch', 's', 'x'] },
        { blank: '...iếc lá', correct: 'ch', wrong: ['tr', 's', 'x'] },
      ];
      const w = words[rand(0, words.length - 1)];
      const opts = shuffle([w.correct, ...w.wrong]);
      const labels = ['a', 'b', 'c', 'd'];
      return {
        question_text: `Điền ch hay tr: ${w.blank}`,
        option_a: opts[0], option_b: opts[1], option_c: opts[2], option_d: opts[3],
        correct_answer: labels[opts.indexOf(w.correct)],
      };
    }
    case 'antonym': {
      const pairs = [
        ['to', 'nhỏ'], ['nóng', 'lạnh'], ['dài', 'ngắn'], ['đẹp', 'xấu'],
        ['sáng', 'tối'], ['vui', 'buồn'], ['nhanh', 'chậm'], ['cao', 'thấp'],
        ['khỏe', 'yếu'], ['giàu', 'nghèo'], ['đúng', 'sai'], ['già', 'trẻ'],
        ['mở', 'đóng'], ['trước', 'sau'], ['trên', 'dưới'], ['trong', 'ngoài'],
      ];
      const pair = pairs[rand(0, pairs.length - 1)];
      const wrongAnswers = pairs.filter(p => p[1] !== pair[1]).map(p => p[1]);
      const wrongs = shuffle(wrongAnswers).slice(0, 3);
      const opts = shuffle([pair[1], ...wrongs]);
      const labels = ['a', 'b', 'c', 'd'];
      return {
        question_text: `Trái nghĩa của '${pair[0]}' là gì?`,
        option_a: opts[0], option_b: opts[1], option_c: opts[2], option_d: opts[3],
        correct_answer: labels[opts.indexOf(pair[1])],
      };
    }
    case 'synonym': {
      const pairs = [
        ['xinh', 'đẹp'], ['vui', 'vui vẻ'], ['nhanh', 'mau'], ['to', 'lớn'],
        ['thông minh', 'giỏi'], ['dũng cảm', 'can đảm'], ['tốt bụng', 'hiền lành'],
        ['buồn', 'u sầu'], ['chăm chỉ', 'siêng năng'],
      ];
      const pair = pairs[rand(0, pairs.length - 1)];
      const wrongAnswers = ['lười', 'xấu', 'chậm', 'nhỏ', 'yếu', 'dốt', 'ác'];
      const wrongs = shuffle(wrongAnswers.filter(w => w !== pair[1])).slice(0, 3);
      const opts = shuffle([pair[1], ...wrongs]);
      const labels = ['a', 'b', 'c', 'd'];
      return {
        question_text: `Từ nào đồng nghĩa với '${pair[0]}'?`,
        option_a: opts[0], option_b: opts[1], option_c: opts[2], option_d: opts[3],
        correct_answer: labels[opts.indexOf(pair[1])],
      };
    }
    case 'fillBlank': {
      const sentences = [
        { text: 'Em ... đến trường mỗi sáng.', correct: 'đi', wrong: ['bay', 'bơi', 'ngủ'] },
        { text: 'Con mèo ... chuột.', correct: 'bắt', wrong: ['yêu', 'giúp', 'cho'] },
        { text: 'Mùa đông trời rất ...', correct: 'lạnh', wrong: ['nóng', 'mát', 'ấm'] },
        { text: 'Cá ... dưới nước.', correct: 'bơi', wrong: ['bay', 'chạy', 'nhảy'] },
        { text: 'Mẹ ... cơm cho cả nhà.', correct: 'nấu', wrong: ['đọc', 'viết', 'vẽ'] },
        { text: 'Con chim ... trên cành cây.', correct: 'hót', wrong: ['bơi', 'chạy', 'nhảy'] },
        { text: 'Em ... bài trước khi đi ngủ.', correct: 'học', wrong: ['chơi', 'ăn', 'xem'] },
        { text: 'Bầu trời hôm nay rất ...', correct: 'xanh', wrong: ['đỏ', 'đen', 'tím'] },
      ];
      const s = sentences[rand(0, sentences.length - 1)];
      const opts = shuffle([s.correct, ...s.wrong]);
      const labels = ['a', 'b', 'c', 'd'];
      return {
        question_text: s.text,
        option_a: opts[0], option_b: opts[1], option_c: opts[2], option_d: opts[3],
        correct_answer: labels[opts.indexOf(s.correct)],
      };
    }
    case 'tone': {
      const words = [
        { base: 'ban', toned: 'bạn', tone: 'Dấu nặng', wrong: ['Dấu huyền', 'Dấu sắc', 'Dấu hỏi'] },
        { base: 'hoc', toned: 'học', tone: 'Dấu nặng', wrong: ['Dấu huyền', 'Dấu sắc', 'Dấu hỏi'] },
        { base: 'sach', toned: 'sách', tone: 'Dấu sắc', wrong: ['Dấu huyền', 'Dấu nặng', 'Dấu hỏi'] },
        { base: 'bai', toned: 'bài', tone: 'Dấu huyền', wrong: ['Dấu sắc', 'Dấu nặng', 'Dấu hỏi'] },
        { base: 'co', toned: 'cỏ', tone: 'Dấu hỏi', wrong: ['Dấu sắc', 'Dấu nặng', 'Dấu ngã'] },
      ];
      const w = words[rand(0, words.length - 1)];
      const opts = shuffle([w.tone, ...w.wrong]);
      const labels = ['a', 'b', 'c', 'd'];
      return {
        question_text: `Thêm dấu nào cho '${w.base}' thành '${w.toned}'?`,
        option_a: opts[0], option_b: opts[1], option_c: opts[2], option_d: opts[3],
        correct_answer: labels[opts.indexOf(w.tone)],
      };
    }
    case 'rhyme': {
      const words = [
        { word: 'bàn', rhyme: 'an', wrong: ['ăn', 'ân', 'en'] },
        { word: 'trăng', rhyme: 'ăng', wrong: ['ang', 'âng', 'ung'] },
        { word: 'sông', rhyme: 'ông', wrong: ['ong', 'ung', 'ông'] },
        { word: 'mưa', rhyme: 'ưa', wrong: ['ua', 'oa', 'ia'] },
        { word: 'hoa', rhyme: 'oa', wrong: ['ua', 'ia', 'ưa'] },
      ];
      const w = words[rand(0, words.length - 1)];
      const opts = shuffle([w.rhyme, ...w.wrong]);
      const labels = ['a', 'b', 'c', 'd'];
      return {
        question_text: `Từ '${w.word}' có vần gì?`,
        option_a: opts[0], option_b: opts[1], option_c: opts[2], option_d: opts[3],
        correct_answer: labels[opts.indexOf(w.rhyme)],
      };
    }
    default:
      return generateVietnameseQuestion('easy', 'spelling_ln');
  }
}

// === GENERATE BUTTON ===
document.getElementById('btn-generate').addEventListener('click', () => {
  const subject = document.getElementById('gen-subject').value;
  const difficulty = document.getElementById('gen-difficulty').value;
  const type = document.getElementById('gen-type').value;
  const count = parseInt(document.getElementById('gen-count').value);

  const questions = generateQuestions(subject, difficulty, type, count);
  displayPreview(questions);
});

let generatedQuestions = [];

function displayPreview(questions) {
  generatedQuestions = questions;
  const preview = document.getElementById('gen-preview');
  const list = document.getElementById('gen-preview-list');
  document.getElementById('gen-preview-count').textContent = questions.length;
  preview.classList.remove('hidden');

  list.innerHTML = questions.map((q, i) => `
    <div class="preview-item">
      <span class="preview-num">#${i + 1}</span>
      <span class="preview-q">${q.question_text}</span>
      <span class="preview-ans">
        A:${q.option_a} B:${q.option_b} C:${q.option_c} D:${q.option_d}
        ✓ ${q.correct_answer.toUpperCase()}
      </span>
      <button class="btn-remove" onclick="removePreview(${i})">✕</button>
    </div>
  `).join('');
}

function removePreview(idx) {
  generatedQuestions.splice(idx, 1);
  displayPreview(generatedQuestions);
}

document.getElementById('btn-save-generated').addEventListener('click', async () => {
  if (generatedQuestions.length === 0) return;
  try {
    const res = await fetch('/api/admin?resource=questions&action=batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: generatedQuestions }),
    });
    const data = await res.json();
    alert(`✅ Đã lưu ${data.inserted} câu hỏi!`);
    generatedQuestions = [];
    document.getElementById('gen-preview').classList.add('hidden');
  } catch (e) {
    alert('❌ Lỗi: ' + e.message);
  }
});

document.getElementById('btn-clear-preview').addEventListener('click', () => {
  generatedQuestions = [];
  document.getElementById('gen-preview').classList.add('hidden');
});

// === MANUAL FORM ===
document.getElementById('manual-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  try {
    const res = await adminFetch(adminUrl('questions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      showMessage('manual-message', '✅ Đã lưu câu hỏi!', 'success');
      form.reset();
    }
  } catch (e) {
    showMessage('manual-message', '❌ Lỗi: ' + e.message, 'error');
  }
});

function showMessage(id, text, type) {
  const el = document.getElementById(id);
  el.textContent = text;
  el.className = `message ${type}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3000);
}

// === QUESTIONS LIST ===
async function loadQuestionsList() {
  const subject = document.getElementById('filter-subject').value;
  const difficulty = document.getElementById('filter-difficulty').value;
  let url = adminUrl('questions') + `&limit=20`;
  if (subject) url += `&subject=${subject}`;
  if (difficulty) url += `&difficulty=${difficulty}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const questions = data.questions || [];
    const total = data.total || 0;
    const list = document.getElementById('questions-list');
    list.innerHTML = `<p class="list-total">Tổng: ${total} câu hỏi</p>` +
      questions.map(q => `
        <div class="q-item">
          <div class="q-meta">
            <span class="badge badge-${q.subject}">${q.subject === 'math' ? '🔢' : '📖'}</span>
            <span class="badge badge-${q.difficulty}">${q.difficulty}</span>
          </div>
          <div class="q-text">${q.question_text}</div>
          <div class="q-options">
            A:${q.option_a} | B:${q.option_b} | C:${q.option_c} | D:${q.option_d}
            <strong>✓${q.correct_answer.toUpperCase()}</strong>
          </div>
          <button class="btn-delete" onclick="deleteQuestion(${q.id})">🗑️</button>
        </div>
      `).join('');
  } catch (e) {
    document.getElementById('questions-list').innerHTML = '<p>Lỗi tải dữ liệu</p>';
  }
}

document.getElementById('btn-filter').addEventListener('click', loadQuestionsList);

async function deleteQuestion(id) {
  if (!confirm('Xóa câu hỏi này?')) return;
  await adminFetch(adminUrl('questions', {id}), { method: 'DELETE' });
  loadQuestionsList();
}

// === STATS & PLAYER ANALYTICS ===
async function loadStats() {
  const content = document.getElementById('stats-content');
  try {
    const [statsRes, playersRes] = await Promise.all([
      adminFetch(adminUrl('stats')),
      adminFetch(adminUrl('players')),
    ]);
    const stats = await statsRes.json();
    const players = await playersRes.json();

    const bySubject = stats.bySubject || [];
    const hardestQuestions = stats.hardestQuestions || [];
    const playerList = Array.isArray(players) ? players : [];

    content.innerHTML = `
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-number">${stats.totalQuestions || 0}</div>
          <div class="stat-label">Câu hỏi</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.totalPlayers || 0}</div>
          <div class="stat-label">Người chơi</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.totalSessions || 0}</div>
          <div class="stat-label">Lượt chơi</div>
        </div>
      </div>

      <div class="stats-section">
        <h3>📊 Phân bổ câu hỏi</h3>
        <div class="category-grid">
          ${bySubject.map(c => `
            <div class="cat-item">
              <span>${c.subject === 'math' ? '🔢' : '📖'} ${c.difficulty}</span>
              <strong>${c.count}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      ${hardestQuestions.length > 0 ? `
      <div class="stats-section">
        <h3>🔥 Câu hỏi khó nhất (hay sai nhất)</h3>
        <div class="hard-questions">
          ${hardestQuestions.map(q => `
            <div class="hard-q-item">
              <span class="badge badge-${q.subject}">${q.subject === 'math' ? '🔢' : '📖'}</span>
              <span class="hard-q-text">${q.question_text}</span>
              <span class="error-rate">${q.error_rate}% sai (${q.wrong}/${q.attempts})</span>
            </div>
          `).join('')}
        </div>
      </div>` : ''}

      <div class="stats-section">
        <h3>👤 Người chơi</h3>
        <div class="players-list">
          ${playerList.length === 0 ? '<p>Chưa có người chơi nào</p>' : playerList.map(p => `
            <div class="player-card" onclick="showPlayerDetail(${p.id})">
              <div class="player-name">${p.name}</div>
              <div class="player-stats-mini">
                <span>🎮 ${p.total_games || 0} lượt</span>
                <span>⭐ ${p.total_stars_earned || 0}</span>
                <span>✓ ${p.total_answered ? Math.round(100 * p.total_correct / p.total_answered) : 0}%</span>
                <span>📅 ${p.last_played ? new Date(p.last_played).toLocaleDateString('vi') : 'Chưa chơi'}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div id="player-detail-modal" class="modal hidden"></div>
    `;
  } catch (e) {
    content.innerHTML = `<p>Lỗi tải thống kê: ${e.message}</p>`;
  }
}

async function showPlayerDetail(playerId) {
  const modal = document.getElementById('player-detail-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = '<p>Đang tải...</p>';

  try {
    const [historyRes, weakRes] = await Promise.all([
      adminFetch(adminUrl('players', {id: playerId, action: 'history'})),
      adminFetch(adminUrl('players', {id: playerId, action: 'weaknesses'})),
    ]);
    const history = await historyRes.json();
    const weakness = await weakRes.json();

    const player = history.player || { name: 'Unknown', created_at: '' };
    const sessions = history.sessions || [];
    const missed = missed || [];
    const byCategory = byCategory || [];
    const progress = progress || [];

    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" onclick="document.getElementById('player-detail-modal').classList.add('hidden')">✕</button>
        <h2>👤 ${player.name}</h2>
        <p>Tham gia: ${new Date(player.created_at).toLocaleDateString('vi')}</p>

        <div class="detail-section">
          <h3>📈 Tiến trình theo môn</h3>
          <div class="accuracy-grid">
            ${byCategory.map(c => `
              <div class="accuracy-item ${c.accuracy >= 80 ? 'good' : c.accuracy >= 50 ? 'ok' : 'weak'}">
                <div>${c.subject === 'math' ? '🔢' : '📖'} ${c.difficulty}</div>
                <div class="accuracy-bar">
                  <div class="accuracy-fill" style="width:${c.accuracy}%"></div>
                </div>
                <div>${c.accuracy}% (${c.correct}/${c.total})</div>
              </div>
            `).join('') || '<p>Chưa có dữ liệu</p>'}
          </div>
        </div>

        <div class="detail-section">
          <h3>⚠️ Dạng hay sai / nhầm lẫn</h3>
          ${missed.length === 0 ? '<p>Chưa có dữ liệu</p>' : `
          <div class="missed-list">
            ${missed.slice(0, 10).map(q => `
              <div class="missed-item">
                <span class="badge badge-${q.subject}">${q.subject === 'math' ? '🔢' : '📖'} ${q.difficulty}</span>
                <span class="missed-text">${q.question_text}</span>
                <span class="missed-rate">Sai ${q.times_wrong}/${q.times_attempted} lần (${q.error_rate}%)</span>
              </div>
            `).join('')}
          </div>`}
        </div>

        <div class="detail-section">
          <h3>📉 Xu hướng điểm số</h3>
          <div class="progress-chart">
            ${progress.slice(0, 15).reverse().map(s => `
              <div class="progress-bar-item">
                <div class="progress-label">${new Date(s.played_at).toLocaleDateString('vi')} ${s.subject === 'math' ? '🔢' : '📖'}</div>
                <div class="progress-bar-track">
                  <div class="progress-bar-fill ${s.accuracy >= 80 ? 'good' : s.accuracy >= 50 ? 'ok' : 'weak'}" style="width:${s.accuracy}%"></div>
                </div>
                <span>${s.accuracy}% ⭐${s.stars_earned}</span>
              </div>
            `).join('') || '<p>Chưa có dữ liệu</p>'}
          </div>
        </div>

        <div class="detail-section">
          <h3>🕐 Lịch sử chơi gần đây</h3>
          <div class="session-list">
            ${sessions.slice(0, 10).map(s => `
              <div class="session-item">
                <span>${new Date(s.played_at).toLocaleString('vi')}</span>
                <span>${s.subject === 'math' ? '🔢 Toán' : '📖 TV'} - ${s.difficulty}</span>
                <span>✓${s.correct_answers}/${s.total_questions}</span>
                <span>⭐${s.stars_earned} 🔥${s.combo_max}</span>
                <span>💰${s.score}</span>
              </div>
            `).join('') || '<p>Chưa có lịch sử</p>'}
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    modal.innerHTML = `<p>Lỗi: ${e.message}</p>`;
  }
}

// === PLAYERS TAB ===
async function loadPlayers() {
  const content = document.getElementById('players-content');
  try {
    const res = await adminFetch(adminUrl('players'));
    const players = await res.json();

    if (!Array.isArray(players) || players.length === 0) {
      content.innerHTML = '<p>Chưa có người chơi nào. Hãy chơi game trước!</p>';
      return;
    }

    content.innerHTML = `
      <div class="players-table">
        <div class="table-header">
          <span>Tên</span>
          <span>Lượt chơi</span>
          <span>Tổng sao</span>
          <span>Tỉ lệ đúng</span>
          <span>Lần chơi cuối</span>
          <span></span>
        </div>
        ${players.map(p => {
          const accuracy = p.total_answered ? Math.round(100 * p.total_correct / p.total_answered) : 0;
          const accClass = accuracy >= 80 ? 'good' : accuracy >= 50 ? 'ok' : 'weak';
          return `
          <div class="table-row">
            <span class="player-name-cell">${p.name}</span>
            <span>🎮 ${p.total_games || 0}</span>
            <span>⭐ ${p.total_stars_earned || 0}</span>
            <span class="acc-${accClass}">${accuracy}%</span>
            <span>${p.last_played ? new Date(p.last_played).toLocaleDateString('vi') : '-'}</span>
            <span>
              <button class="btn-detail" onclick="showPlayerDetail(${p.id})">📊 Chi tiết</button>
              <button class="btn-delete" onclick="deletePlayer(${p.id}, '${p.name.replace(/'/g, "\\'")}')">🗑️</button>
            </span>
          </div>`;
        }).join('')}
      </div>
    `;
  } catch (e) {
    content.innerHTML = `<p>Lỗi: ${e.message}</p>`;
  }
}

async function deletePlayer(id, name) {
  if (!confirm(`Xóa người chơi "${name}" và tất cả dữ liệu liên quan?`)) return;
  try {
    const res = await adminFetch(adminUrl('players', { id, action: 'delete' }), { method: 'DELETE' });
    if (res.ok) {
      loadPlayers();
    } else {
      alert('Lỗi xóa người chơi!');
    }
  } catch (e) {
    alert('Lỗi: ' + e.message);
  }
}

// === EXAM ADMIN ===
document.getElementById('btn-create-exam').addEventListener('click', async () => {
  const title = document.getElementById('ea-title').value.trim();
  if (!title) { alert('Nhập tên bài thi!'); return; }

  const data = {
    title,
    subject: document.getElementById('ea-subject').value,
    difficulty: document.getElementById('ea-difficulty').value,
    total_questions: parseInt(document.getElementById('ea-count').value),
    time_limit_minutes: parseInt(document.getElementById('ea-time').value),
  };

  try {
    const res = await adminFetch(adminUrl('exams'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    alert(`✅ Đã tạo bài thi "${title}" với ${result.question_ids.length} câu hỏi!`);
    document.getElementById('ea-title').value = '';
    loadExamsList();
  } catch (e) { alert('Lỗi: ' + e.message); }
});

async function loadExamsList() {
  try {
    const res = await adminFetch(adminUrl('exams'));
    const exams = await res.json();
    const list = document.getElementById('ea-list');
    if (exams.length === 0) { list.innerHTML = '<p>Chưa có bài thi nào</p>'; return; }

    list.innerHTML = exams.map(e => `
      <div class="ea-item">
        <div class="ea-item-info">
          <strong>${e.title}</strong>
          <span class="ea-meta">
            ${e.subject === 'math' ? '🔢' : e.subject === 'vietnamese' ? '📖' : '📚'} ${e.difficulty} • ${e.total_questions} câu • ${e.time_limit_minutes} phút
            • ${e.is_active ? '🟢 Đang mở' : '🔴 Đã đóng'}
            • ${e.times_taken || 0} lượt thi
          </span>
        </div>
        <div class="ea-item-actions">
          <button onclick="viewExamResults(${e.id})" class="btn-sm">📊 Kết quả</button>
          <button onclick="toggleExam(${e.id}, ${e.is_active ? 0 : 1})" class="btn-sm">${e.is_active ? '🔒 Đóng' : '🔓 Mở'}</button>
          <button onclick="deleteExam(${e.id})" class="btn-sm btn-sm-danger">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch { document.getElementById('ea-list').innerHTML = '<p>Lỗi tải</p>'; }
}

async function viewExamResults(examId) {
  const modal = document.getElementById('exam-results-modal');
  modal.classList.remove('hidden');
  modal.innerHTML = '<div class="modal-content"><p>Đang tải...</p></div>';

  try {
    const res = await adminFetch(adminUrl('exams', {id: examId, action: 'results'}));
    const results = await res.json();

    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" onclick="document.getElementById('exam-results-modal').classList.add('hidden')">✕</button>
        <h3>📊 Kết quả bài thi</h3>
        ${results.length === 0 ? '<p>Chưa có ai thi</p>' : `
        <div class="exam-results-list">
          ${results.map(r => `
            <div class="er-item">
              <div class="er-info">
                <strong>${r.player_name}</strong>
                <span>${new Date(r.taken_at).toLocaleString('vi')}</span>
              </div>
              <div class="er-score">
                <span class="er-grade">${r.grade}</span>
                <span>${r.score} điểm • ${r.correct_answers}/${r.total_questions} • ${Math.floor(r.time_spent_seconds / 60)}:${(r.time_spent_seconds % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>
          `).join('')}
        </div>`}
      </div>
    `;
  } catch { modal.innerHTML = '<div class="modal-content"><p>Lỗi</p></div>'; }
}

async function toggleExam(id, active) {
  try {
    const res = await adminFetch(adminUrl('exams'));
    const exams = await res.json();
    const exam = exams.find(e => e.id === id);
    if (!exam) return;

    await adminFetch(adminUrl('exams', {id}), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...exam, question_ids: JSON.parse(exam.question_ids), is_active: active }),
    });
    loadExamsList();
  } catch {}
}

async function deleteExam(id) {
  if (!confirm('Xóa bài thi này?')) return;
  await adminFetch(adminUrl('exams', {id}), { method: 'DELETE' });
  loadExamsList();
}
