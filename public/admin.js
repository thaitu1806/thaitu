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

// Custom popup to replace alert()
function showPopup(icon, text) {
  let overlay = document.getElementById('admin-popup-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'admin-popup-overlay';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:18px;padding:28px 22px;text-align:center;max-width:320px;width:88%;box-shadow:0 20px 50px rgba(0,0,0,0.3);animation:popIn 0.25s;">
      <div style="font-size:2.5rem;margin-bottom:10px;">${icon}</div>
      <div style="font-size:1.05rem;font-weight:700;color:#333;margin-bottom:18px;line-height:1.4;">${text}</div>
      <button onclick="document.getElementById('admin-popup-overlay').remove()" style="padding:12px 32px;border:none;border-radius:10px;background:#4CAF50;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;">OK</button>
    </div>
  `;
  overlay.style.display = 'flex';
}

// Custom confirm dialog (replaces window.confirm). Returns a Promise<boolean>.
function showConfirm(text, { icon = '❓', okText = 'Đồng ý', cancelText = 'Hủy', danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';
    const okBg = danger ? '#e53935' : '#4CAF50';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:18px;padding:28px 22px;text-align:center;max-width:340px;width:88%;box-shadow:0 20px 50px rgba(0,0,0,0.3);animation:popIn 0.25s;">
        <div style="font-size:2.5rem;margin-bottom:10px;">${icon}</div>
        <div style="font-size:1.05rem;font-weight:700;color:#333;margin-bottom:20px;line-height:1.4;">${text}</div>
        <div style="display:flex;gap:12px;justify-content:center;">
          <button data-act="cancel" style="padding:12px 24px;border:none;border-radius:10px;background:#e0e0e0;color:#333;font-size:1rem;font-weight:700;cursor:pointer;">${cancelText}</button>
          <button data-act="ok" style="padding:12px 24px;border:none;border-radius:10px;background:${okBg};color:#fff;font-size:1rem;font-weight:700;cursor:pointer;">${okText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const close = (val) => { overlay.remove(); resolve(val); };
    overlay.querySelector('[data-act="ok"]').addEventListener('click', () => close(true));
    overlay.querySelector('[data-act="cancel"]').addEventListener('click', () => close(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(false); });
  });
}

// Custom prompt dialog (replaces window.prompt). Returns a Promise<string|null>.
function showPrompt(text, { icon = '✏️', placeholder = '', okText = 'OK', cancelText = 'Hủy' } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:10001;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:18px;padding:28px 22px;text-align:center;max-width:360px;width:88%;box-shadow:0 20px 50px rgba(0,0,0,0.3);animation:popIn 0.25s;">
        <div style="font-size:2.2rem;margin-bottom:10px;">${icon}</div>
        <div style="font-size:1.05rem;font-weight:700;color:#333;margin-bottom:16px;line-height:1.4;">${text}</div>
        <input type="text" data-act="input" placeholder="${placeholder}" style="width:100%;box-sizing:border-box;padding:12px;border:2px solid #ddd;border-radius:10px;font-size:1rem;margin-bottom:18px;" />
        <div style="display:flex;gap:12px;justify-content:center;">
          <button data-act="cancel" style="padding:12px 24px;border:none;border-radius:10px;background:#e0e0e0;color:#333;font-size:1rem;font-weight:700;cursor:pointer;">${cancelText}</button>
          <button data-act="ok" style="padding:12px 24px;border:none;border-radius:10px;background:#4CAF50;color:#fff;font-size:1rem;font-weight:700;cursor:pointer;">${okText}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const input = overlay.querySelector('[data-act="input"]');
    setTimeout(() => input.focus(), 50);
    const close = (val) => { overlay.remove(); resolve(val); };
    overlay.querySelector('[data-act="ok"]').addEventListener('click', () => close(input.value));
    overlay.querySelector('[data-act="cancel"]').addEventListener('click', () => close(null));
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') close(input.value); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
  });
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
    if (tab.dataset.tab === 'parents') loadParents();
    if (tab.dataset.tab === 'exams') loadExamsList();
    if (tab.dataset.tab === 'shop') loadShopTab();
    if (tab.dataset.tab === 'ai-generator') loadAIGeneratorStatus();
  });
});

// === QUESTION GENERATOR ===
const questionTypes = {
  math: {
    easy: [
      { value: 'add10', label: 'Cộng trong phạm vi 10' },
      { value: 'add20', label: 'Cộng trong phạm vi 20' },
      { value: 'add20carry', label: 'Cộng có nhớ phạm vi 20' },
      { value: 'add100nocarry', label: 'Cộng không nhớ phạm vi 100' },
      { value: 'sub10', label: 'Trừ trong phạm vi 10' },
      { value: 'sub20', label: 'Trừ trong phạm vi 20' },
      { value: 'sub20borrow', label: 'Trừ có nhớ phạm vi 20' },
      { value: 'sub100noborrow', label: 'Trừ không nhớ phạm vi 100' },
      { value: 'compare', label: 'So sánh số' },
      { value: 'sequence', label: 'Số liền trước/sau' },
      { value: 'add3nums', label: 'Cộng 3 số' },
    ],
    medium: [
      { value: 'add100', label: 'Cộng có nhớ (phạm vi 100)' },
      { value: 'sub100', label: 'Trừ có nhớ (phạm vi 100)' },
      { value: 'add500', label: 'Cộng phạm vi 500' },
      { value: 'sub500', label: 'Trừ phạm vi 500' },
      { value: 'add1000', label: 'Cộng phạm vi 1000' },
      { value: 'sub1000', label: 'Trừ phạm vi 1000' },
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
      { value: 'add1000hard', label: 'Cộng trừ phạm vi 1000 (khó)' },
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
    case 'add20carry': {
      const a = rand(5, 12), b = rand(9 - (a % 10) + 1, 12);
      const answer = a + b;
      return { question_text: `${a} + ${b} = ?`, ...makeOptions(answer, 3) };
    }
    case 'sub20borrow': {
      const a = rand(11, 20), b = rand(a % 10 + 1, Math.min(a - 1, 9));
      const answer = a - b;
      return { question_text: `${a} - ${b} = ?`, ...makeOptions(answer, 3) };
    }
    case 'add100nocarry': {
      const a = rand(10, 60), b = rand(10, 30);
      const answer = a + b;
      return { question_text: `Đặt tính:\n  ${a}\n+ ${b}\n———`, ...makeOptions(answer, 5) };
    }
    case 'sub100noborrow': {
      const a = rand(40, 99), b = rand(10, Math.min(a - 10, 40));
      const answer = a - b;
      return { question_text: `Đặt tính:\n  ${a}\n- ${b}\n———`, ...makeOptions(answer, 5) };
    }
    case 'add500': {
      const a = rand(100, 350), b = rand(50, 200);
      const answer = a + b;
      return { question_text: `Đặt tính:\n ${a}\n+${b}\n———`, ...makeOptions(answer, 10) };
    }
    case 'sub500': {
      const a = rand(200, 500), b = rand(50, a - 50);
      const answer = a - b;
      return { question_text: `Đặt tính:\n ${a}\n-${b}\n———`, ...makeOptions(answer, 10) };
    }
    case 'add1000': {
      const a = rand(200, 700), b = rand(100, 400);
      const answer = a + b;
      return { question_text: `Đặt tính:\n ${a}\n+${b}\n———`, ...makeOptions(answer, 15) };
    }
    case 'sub1000': {
      const a = rand(400, 1000), b = rand(100, a - 100);
      const answer = a - b;
      return { question_text: `Đặt tính:\n ${a}\n-${b}\n———`, ...makeOptions(answer, 15) };
    }
    case 'add1000hard': {
      const a = rand(300, 800), b = rand(200, 600);
      const answer = a + b;
      const isSub = rand(0, 1);
      if (isSub) {
        const a2 = rand(500, 1000), b2 = rand(200, a2 - 100);
        return { question_text: `${a2} - ${b2} = ?`, ...makeOptions(a2 - b2, 20) };
      }
      return { question_text: `${a} + ${b} = ?`, ...makeOptions(answer, 20) };
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
    const res = await adminFetch('/api/admin?resource=questions&action=batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: generatedQuestions }),
    });
    const data = await res.json();
    showPopup('✅', `Đã lưu ${data.inserted} câu hỏi!`);
    generatedQuestions = [];
    document.getElementById('gen-preview').classList.add('hidden');
  } catch (e) {
    showPopup('❌', 'Lỗi: ' + e.message);
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
  const grade = document.getElementById('filter-grade').value;
  let url = adminUrl('questions') + `&limit=20`;
  if (subject) url += `&subject=${subject}`;
  if (difficulty) url += `&difficulty=${difficulty}`;
  if (grade) url += `&grade=${grade}`;

  try {
    const res = await adminFetch(url);
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
            <span class="badge badge-grade">Lớp ${q.grade || 2}</span>
            ${q.source === 'ai' ? '<span class="badge badge-ai">🤖 AI</span>' : ''}
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
  if (!await showConfirm('Xóa câu hỏi này?', { icon: '🗑️', okText: 'Xóa', danger: true })) return;
  await adminFetch(adminUrl('questions', {id}), { method: 'DELETE' });
  loadQuestionsList();
}

// === STATS & PLAYER ANALYTICS ===
async function loadStats() {
  // Load AI stats first
  await loadAIStats();
  
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
    const missed = weakness.missed || [];
    const byCategory = weakness.byCategory || [];
    const progress = weakness.progress || [];

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
          <span>Level PL</span>
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
            <span>🗺️ ${p.adventure_level || 1}</span>
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
  if (!await showConfirm(`Xóa người chơi "${name}" và tất cả dữ liệu liên quan?`, { icon: '🗑️', okText: 'Xóa', danger: true })) return;
  try {
    const res = await adminFetch(adminUrl('players', { id, action: 'delete' }), { method: 'DELETE' });
    if (res.ok) {
      showPopup('✅', 'Đã xóa người chơi!');
      loadPlayers();
    } else {
      let msg = 'Lỗi xóa người chơi!';
      try { const d = await res.json(); if (d.error) msg = d.error; } catch {}
      showPopup('❌', msg);
    }
  } catch (e) {
    showPopup('❌', 'Lỗi: ' + e.message);
  }
}

// === PARENTS ADMIN ===
async function loadParents() {
  const content = document.getElementById('parents-content');
  content.innerHTML = '<p>Đang tải...</p>';
  try {
    const res = await adminFetch(adminUrl('parents'));
    const parents = await res.json();
    const list = Array.isArray(parents) ? parents : [];
    if (list.length === 0) {
      content.innerHTML = '<p class="empty-hint">Chưa có phụ huynh nào đăng ký.</p>';
      return;
    }
    content.innerHTML = `<p class="list-total">Tổng: ${list.length} phụ huynh</p>` + list.map(p => `
      <div class="parent-item" id="parent-row-${p.id}">
        <div class="parent-main">
          <div class="parent-info">
            <strong>👨‍👩‍👧 ${escapeHtml(p.display_name || p.username)}</strong>
            <span class="parent-meta">@${escapeHtml(p.username)} • 🧒 ${p.children_count} con • ${p.created_at ? new Date(p.created_at).toLocaleDateString('vi') : ''}</span>
          </div>
          <div class="parent-actions">
            <button class="btn-sm" onclick="toggleParentChildren(${p.id})">👁️ Xem con</button>
            <button class="btn-sm btn-sm-danger" onclick="deleteParent(${p.id}, '${escapeAttr(p.display_name || p.username)}')">🗑️</button>
          </div>
        </div>
        <div class="parent-children hidden" id="parent-children-${p.id}"></div>
      </div>
    `).join('');
  } catch (e) {
    content.innerHTML = '<p>Lỗi tải dữ liệu phụ huynh</p>';
  }
}

async function toggleParentChildren(parentId) {
  const box = document.getElementById(`parent-children-${parentId}`);
  if (!box) return;
  if (!box.classList.contains('hidden')) { box.classList.add('hidden'); return; }
  box.classList.remove('hidden');
  box.innerHTML = '<p style="padding:8px;color:#888;">Đang tải...</p>';
  try {
    const res = await adminFetch(adminUrl('parents', { id: parentId, action: 'children' }));
    const children = await res.json();
    const list = Array.isArray(children) ? children : [];
    if (list.length === 0) { box.innerHTML = '<p style="padding:8px;color:#888;">Chưa liên kết con nào.</p>'; return; }
    box.innerHTML = list.map(c => `
      <div class="child-link-row">
        <span>🧒 <strong>${escapeHtml(c.name)}</strong> • Lớp ${c.grade || 2} • ⭐ ${c.total_stars || 0} • 💎 ${c.total_diamonds || 0}</span>
        <button class="btn-sm btn-sm-danger" onclick="unlinkParentChild(${parentId}, ${c.id})">Gỡ liên kết</button>
      </div>
    `).join('');
  } catch (e) {
    box.innerHTML = '<p style="padding:8px;color:#c00;">Lỗi tải danh sách con</p>';
  }
}

async function unlinkParentChild(parentId, playerId) {
  if (!await showConfirm('Gỡ liên kết con này khỏi phụ huynh?', { icon: '🔗', okText: 'Gỡ', danger: true })) return;
  try {
    const res = await adminFetch(adminUrl('parents', { id: parentId, action: 'unlink', player_id: playerId }), { method: 'DELETE' });
    if (res.ok) {
      showPopup('✅', 'Đã gỡ liên kết!');
      // Refresh the open children list and the parent row counts.
      const box = document.getElementById(`parent-children-${parentId}`);
      if (box) box.classList.add('hidden');
      toggleParentChildren(parentId);
      loadParents();
    } else showPopup('❌', 'Lỗi gỡ liên kết');
  } catch (e) { showPopup('❌', 'Lỗi: ' + e.message); }
}

async function deleteParent(id, name) {
  if (!await showConfirm(`Xóa tài khoản phụ huynh "${name}"? Các liên kết với con cũng bị gỡ.`, { icon: '🗑️', okText: 'Xóa', danger: true })) return;
  try {
    const res = await adminFetch(adminUrl('parents', { id }), { method: 'DELETE' });
    if (res.ok) { showPopup('✅', 'Đã xóa phụ huynh!'); loadParents(); }
    else showPopup('❌', 'Lỗi xóa phụ huynh');
  } catch (e) { showPopup('❌', 'Lỗi: ' + e.message); }
}

function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/'/g, '&#39;'); }


// === EXAM ADMIN ===
document.getElementById('btn-create-exam').addEventListener('click', async () => {
  const title = document.getElementById('ea-title').value.trim();
  if (!title) { showPopup('⚠️', 'Nhập tên bài thi!'); return; }

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
    showPopup('✅', `Đã tạo bài thi "${title}" với ${result.question_ids.length} câu hỏi!`);
    document.getElementById('ea-title').value = '';
    loadExamsList();
  } catch (e) { showPopup('❌', 'Lỗi: ' + e.message); }
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
  if (!await showConfirm('Xóa bài thi này?', { icon: '🗑️', okText: 'Xóa', danger: true })) return;
  await adminFetch(adminUrl('exams', {id}), { method: 'DELETE' });
  loadExamsList();
}


// === SHOP MANAGEMENT ===
async function loadShopTab() {
  await Promise.all([loadDiamondStats(), loadShopItems(), loadVouchers()]);
}

async function loadDiamondStats() {
  try {
    const res = await adminFetch('/api/admin/diamond-stats');
    const data = await res.json();
    document.getElementById('stat-earned').textContent = data.total_earned || 0;
    document.getElementById('stat-spent').textContent = data.total_spent || 0;
    const topItems = data.top_items || [];
    document.getElementById('stat-top').textContent = topItems.length > 0 ? topItems[0].name : '-';
  } catch (e) {
    console.error('Lỗi tải stats:', e);
  }
}

async function loadShopItems() {
  const list = document.getElementById('shop-items-list');
  try {
    const res = await adminFetch('/api/admin/shop/items');
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      list.innerHTML = '<p>Chưa có vật phẩm nào. Hãy thêm mới!</p>';
      return;
    }

    const catLabels = { avatar: '🧑 Avatar', frame: '🖼️ Khung', sticker: '✨ Sticker', powerup: '⚡ Power-up', voucher: '🎁 Voucher' };
    const levelLabels = { bronze: '🥉', silver: '🥈', gold: '🥇', diamond: '💎', master: '👑' };

    list.innerHTML = items.map(item => `
      <div class="ea-item">
        <div class="ea-item-info">
          <strong>${item.image_url || '📦'} ${item.name}</strong>
          <span class="ea-meta">
            ${catLabels[item.category] || item.category} • ${item.price_diamonds}💎 • ${levelLabels[item.min_level] || ''} ${item.min_level}
            ${item.max_per_week ? '• Max ' + item.max_per_week + '/tuần' : ''}
            • ${item.is_active ? '🟢 Active' : '🔴 Ẩn'}
          </span>
        </div>
        <div class="ea-item-actions">
          <button onclick="editShopItem(${item.id})" class="btn-sm">✏️ Sửa</button>
          <button onclick="toggleShopItem(${item.id}, ${item.is_active ? 0 : 1})" class="btn-sm">${item.is_active ? '🙈 Ẩn' : '👁️ Hiện'}</button>
          <button onclick="deleteShopItem(${item.id})" class="btn-sm btn-sm-danger">🗑️</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = '<p>Lỗi tải vật phẩm</p>';
  }
}

let shopItemsCache = [];

function toggleShopForm() {
  const form = document.getElementById('shop-item-form');
  form.classList.toggle('hidden');
  if (!form.classList.contains('hidden')) {
    document.getElementById('shop-edit-id').value = '';
    document.getElementById('shop-name').value = '';
    document.getElementById('shop-desc').value = '';
    document.getElementById('shop-category').value = 'avatar';
    document.getElementById('shop-price').value = '10';
    document.getElementById('shop-level').value = 'bronze';
    document.getElementById('shop-image').value = '';
    document.getElementById('shop-max-week').value = '';
  }
}

function cancelShopForm() {
  document.getElementById('shop-item-form').classList.add('hidden');
}

async function saveShopItem() {
  const editId = document.getElementById('shop-edit-id').value;
  const name = document.getElementById('shop-name').value.trim();
  const description = document.getElementById('shop-desc').value.trim();
  const category = document.getElementById('shop-category').value;
  const price_diamonds = parseInt(document.getElementById('shop-price').value);
  const min_level = document.getElementById('shop-level').value;
  const image_url = document.getElementById('shop-image').value.trim() || null;
  const maxWeekVal = document.getElementById('shop-max-week').value;
  const max_per_week = maxWeekVal ? parseInt(maxWeekVal) : null;

  if (!name) { showPopup('⚠️', 'Nhập tên vật phẩm!'); return; }
  if (!price_diamonds || price_diamonds < 1) { showPopup('⚠️', 'Giá phải >= 1!'); return; }

  const body = { name, description, category, price_diamonds, min_level, image_url, max_per_week };

  try {
    let res;
    if (editId) {
      body.item_id = parseInt(editId);
      res = await adminFetch(`/api/admin/shop/items/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } else {
      res = await adminFetch('/api/admin/shop/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    }
    const result = await res.json();
    if (result.ok || result.id) {
      showPopup('✅', editId ? 'Đã cập nhật vật phẩm!' : 'Đã tạo vật phẩm mới!');
      cancelShopForm();
      loadShopItems();
    } else {
      showPopup('❌', result.error || 'Lỗi lưu vật phẩm');
    }
  } catch (e) {
    showPopup('❌', 'Lỗi: ' + e.message);
  }
}

async function editShopItem(id) {
  try {
    const res = await adminFetch('/api/admin/shop/items');
    const data = await res.json();
    const item = (data.items || []).find(i => i.id === id);
    if (!item) return;

    document.getElementById('shop-item-form').classList.remove('hidden');
    document.getElementById('shop-edit-id').value = item.id;
    document.getElementById('shop-name').value = item.name || '';
    document.getElementById('shop-desc').value = item.description || '';
    document.getElementById('shop-category').value = item.category || 'avatar';
    document.getElementById('shop-price').value = item.price_diamonds || 10;
    document.getElementById('shop-level').value = item.min_level || 'bronze';
    document.getElementById('shop-image').value = item.image_url || '';
    document.getElementById('shop-max-week').value = item.max_per_week || '';
  } catch (e) {
    showPopup('❌', 'Lỗi: ' + e.message);
  }
}

async function toggleShopItem(id, newActive) {
  try {
    const res = await adminFetch(`/api/admin/shop/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: id, is_active: newActive }),
    });
    const result = await res.json();
    if (result.ok) {
      loadShopItems();
    } else {
      showPopup('❌', result.error || 'Lỗi');
    }
  } catch (e) {
    showPopup('❌', 'Lỗi: ' + e.message);
  }
}

async function deleteShopItem(id) {
  if (!await showConfirm('Xóa vật phẩm này?', { icon: '🗑️', okText: 'Xóa', danger: true })) return;
  try {
    const res = await adminFetch(`/api/admin/shop/items/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (result.ok) {
      showPopup('✅', 'Đã xóa!');
      loadShopItems();
    } else {
      showPopup('❌', result.error || 'Lỗi xóa');
    }
  } catch (e) {
    showPopup('❌', 'Lỗi: ' + e.message);
  }
}

// === VOUCHER APPROVAL ===
async function loadVouchers() {
  const list = document.getElementById('vouchers-list');
  try {
    const res = await adminFetch('/api/admin/vouchers?status=pending');
    const data = await res.json();
    const vouchers = data.vouchers || [];

    if (vouchers.length === 0) {
      list.innerHTML = '<p>✅ Không có phiếu thưởng nào đang chờ duyệt.</p>';
      return;
    }

    list.innerHTML = vouchers.map(v => `
      <div class="ea-item">
        <div class="ea-item-info">
          <strong>🎫 ${v.item_name}</strong> — ${v.player_name}
          <span class="ea-meta">
            ${v.category} • ${v.price_diamonds}💎 • Yêu cầu lúc: ${new Date(v.requested_at).toLocaleString('vi')}
          </span>
        </div>
        <div class="ea-item-actions">
          <button onclick="resolveVoucher(${v.id}, 'approved')" class="btn-sm" style="background:#c8e6c9;">✅ Duyệt</button>
          <button onclick="resolveVoucher(${v.id}, 'rejected')" class="btn-sm btn-sm-danger">❌ Từ chối</button>
        </div>
      </div>
    `).join('');
  } catch (e) {
    list.innerHTML = '<p>Lỗi tải phiếu thưởng</p>';
  }
}

async function resolveVoucher(id, status) {
  if (status === 'rejected') {
    const confirmed = await showConfirm('Từ chối phiếu thưởng này?', { icon: '❌', okText: 'Từ chối', danger: true });
    if (!confirmed) return;
  }
  const admin_note = status === 'rejected' ? (await showPrompt('Lý do từ chối (tùy chọn):', { icon: '📝', placeholder: 'Nhập lý do...' })) : '';
  // Cancelling the reason prompt aborts the rejection.
  if (status === 'rejected' && admin_note === null) return;
  try {
    const res = await adminFetch(`/api/admin/vouchers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voucher_id: id, status, admin_note: admin_note || '' }),
    });
    const result = await res.json();
    if (result.ok) {
      showPopup('✅', status === 'approved' ? 'Đã duyệt phiếu thưởng!' : 'Đã từ chối phiếu thưởng.');
      loadVouchers();
    } else {
      showPopup('❌', result.error || 'Lỗi');
    }
  } catch (e) {
    showPopup('❌', 'Lỗi: ' + e.message);
  }
}

// === AI QUESTION GENERATOR ===
let aiGeneratedQuestions = [];

async function loadAIGeneratorStatus() {
  const statusEl = document.getElementById('ai-gen-status');
  try {
    const res = await adminFetch('/api/ai/status');
    const data = await res.json();
    if (data.enabled) {
      statusEl.innerHTML = `<span class="ai-status-on">🟢 AI đang hoạt động — ${data.provider} (${data.model})</span>`;
      document.getElementById('btn-ai-generate').disabled = false;
    } else {
      statusEl.innerHTML = `<span class="ai-status-off">🔴 AI chưa được kích hoạt (thiếu API key)</span>` + aiSetupHelpHtml();
      document.getElementById('btn-ai-generate').disabled = true;
    }
  } catch (e) {
    statusEl.innerHTML = `<span class="ai-status-off">🔴 Không thể kết nối AI service</span>` + aiSetupHelpHtml();
    document.getElementById('btn-ai-generate').disabled = true;
  }
}

// Instructions panel: where to add the AI token (OpenAI/ChatGPT or Deepseek).
// API keys are read from environment variables — on Vercel they must be set in
// the project's Environment Variables (Settings → Environment Variables), then redeploy.
function aiSetupHelpHtml() {
  return `
    <div class="ai-setup-help">
      <h4>🔑 Cách thêm token AI</h4>
      <p>API key được đọc từ <b>biến môi trường</b>. Vì lý do bảo mật, key không nhập trực tiếp trên web mà phải đặt ở server.</p>
      <p><b>Trên Vercel:</b> Project → <b>Settings</b> → <b>Environment Variables</b> → thêm các biến dưới đây → <b>Redeploy</b>.</p>
      <p><b>Chạy máy (local):</b> thêm vào file <code>.env</code> rồi khởi động lại server.</p>

      <div class="ai-setup-cols">
        <div class="ai-setup-col">
          <div class="ai-setup-title">🤖 ChatGPT (OpenAI)</div>
          <pre>AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini   (tùy chọn)</pre>
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener">Lấy key OpenAI →</a>
        </div>
        <div class="ai-setup-col">
          <div class="ai-setup-title">🐳 Deepseek</div>
          <pre>AI_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-...
AI_MODEL=deepseek-chat   (tùy chọn)</pre>
          <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener">Lấy key Deepseek →</a>
        </div>
      </div>
      <p class="ai-setup-note">Sau khi đặt biến và <b>redeploy</b>, quay lại tab này — trạng thái sẽ chuyển 🟢.</p>
    </div>`;
}

document.getElementById('btn-ai-generate').addEventListener('click', async () => {
  const grade = parseInt(document.getElementById('ai-gen-grade').value);
  const subject = document.getElementById('ai-gen-subject').value;
  const difficulty = document.getElementById('ai-gen-difficulty').value;
  const quantity = parseInt(document.getElementById('ai-gen-count').value);

  if (quantity < 1 || quantity > 20) {
    showPopup('⚠️', 'Số lượng phải từ 1 đến 20!');
    return;
  }

  document.getElementById('ai-gen-loading').classList.remove('hidden');
  document.getElementById('ai-gen-preview').classList.add('hidden');

  try {
    const res = await adminFetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, difficulty, grade, quantity }),
    });
    const data = await res.json();

    if (data.error) {
      showPopup('❌', data.error);
      return;
    }

    const questions = (data.questions || []).map(q => ({
      ...q,
      subject,
      difficulty,
      grade,
      source: 'ai',
    }));

    displayAIPreview(questions);
  } catch (e) {
    showPopup('❌', 'Lỗi kết nối: ' + e.message);
  } finally {
    document.getElementById('ai-gen-loading').classList.add('hidden');
  }
});

function displayAIPreview(questions) {
  aiGeneratedQuestions = questions;
  const preview = document.getElementById('ai-gen-preview');
  const list = document.getElementById('ai-gen-preview-list');
  document.getElementById('ai-gen-preview-count').textContent = questions.length;
  preview.classList.remove('hidden');

  list.innerHTML = questions.map((q, i) => `
    <div class="preview-item">
      <span class="preview-num">#${i + 1}</span>
      <span class="preview-q">${q.question_text}</span>
      <span class="preview-ans">
        A:${q.option_a} B:${q.option_b} C:${q.option_c} D:${q.option_d}
        ✓ ${q.correct_answer.toUpperCase()}
        ${q.explanation ? '💡 ' + q.explanation : ''}
      </span>
      <button class="btn-remove" onclick="removeAIPreview(${i})">✕</button>
    </div>
  `).join('');
}

function removeAIPreview(idx) {
  aiGeneratedQuestions.splice(idx, 1);
  displayAIPreview(aiGeneratedQuestions);
}

document.getElementById('btn-save-ai-generated').addEventListener('click', async () => {
  if (aiGeneratedQuestions.length === 0) return;
  try {
    const res = await adminFetch('/api/admin?resource=questions&action=batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: aiGeneratedQuestions }),
    });
    const data = await res.json();
    showPopup('✅', `Đã lưu ${data.inserted} câu hỏi AI!`);
    aiGeneratedQuestions = [];
    document.getElementById('ai-gen-preview').classList.add('hidden');
  } catch (e) {
    showPopup('❌', 'Lỗi: ' + e.message);
  }
});

document.getElementById('btn-clear-ai-preview').addEventListener('click', () => {
  aiGeneratedQuestions = [];
  document.getElementById('ai-gen-preview').classList.add('hidden');
});

// === AI USAGE STATS (in Stats tab) ===
async function loadAIStats() {
  const section = document.getElementById('ai-stats-section');
  try {
    const [statsRes, statusRes] = await Promise.all([
      adminFetch(adminUrl('ai-stats')),
      adminFetch('/api/ai/status'),
    ]);
    const stats = await statsRes.json();
    const status = await statusRes.json();

    section.innerHTML = `
      <div class="ai-stats-panel">
        <h3>🤖 AI Usage</h3>
        <div class="ai-status-info">
          ${status.enabled
            ? `<span class="ai-status-on">🟢 Đang hoạt động — ${status.provider} (${status.model})</span>`
            : '<span class="ai-status-off">🔴 AI chưa kích hoạt</span>'}
        </div>
        <div class="stats-overview" style="margin-top:12px;">
          <div class="stat-card" style="background:linear-gradient(135deg,#43a047,#66bb6a);">
            <div class="stat-number">${stats.total_requests || 0}</div>
            <div class="stat-label">Requests hôm nay</div>
          </div>
          <div class="stat-card" style="background:linear-gradient(135deg,#1e88e5,#42a5f5);">
            <div class="stat-number">${stats.total_tokens || 0}</div>
            <div class="stat-label">Tokens hôm nay</div>
          </div>
          <div class="stat-card" style="background:linear-gradient(135deg,#f4511e,#ff7043);">
            <div class="stat-number">$${stats.estimated_cost || '0.0000'}</div>
            <div class="stat-label">Chi phí ước tính</div>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    section.innerHTML = '<p style="color:#999;">Không thể tải thống kê AI</p>';
  }
}
