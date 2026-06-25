// V28 - Truyện Cổ Tích (Fairy Tales)
(function() {
'use strict';

const STORAGE_KEY = 'v28_tales';
const TIMER_SECONDS = 15;

// ========== TALE DATA ==========
const TALES = [
  {
    id: 'tam-cam',
    name: 'Tấm Cám',
    icon: '👸',
    pages: [
      {
        illustration: '👧✨🧹',
        text: 'Ngày xưa có cô Tấm hiền lành, chăm chỉ. Tấm sống với dì ghẻ và em Cám. Hàng ngày Tấm phải làm việc vất vả từ sáng đến tối.'
      },
      {
        illustration: '🐟💛🏺',
        text: 'Tấm có một con cá bống làm bạn. Mỗi ngày Tấm cho cá ăn cơm. Nhưng Cám lén giết mất cá bống, Tấm buồn lắm và khóc rất nhiều.'
      },
      {
        illustration: '👗✨🎉',
        text: 'Bụt hiện lên giúp Tấm. Bụt cho Tấm quần áo đẹp để đi dự hội. Tấm vui mừng mặc đồ đẹp đi chơi hội làng.'
      },
      {
        illustration: '👠💫👑',
        text: 'Trên đường về, Tấm đánh rơi một chiếc giày. Hoàng tử nhặt được chiếc giày nhỏ xinh. Hoàng tử muốn tìm chủ nhân của chiếc giày.'
      },
      {
        illustration: '👸🤴💒',
        text: 'Hoàng tử đi khắp nơi tìm người vừa giày. Tấm thử giày vừa khít. Hoàng tử vui mừng và cưới Tấm làm vợ.'
      },
      {
        illustration: '🏰🌈🎊',
        text: 'Tấm trở thành hoàng hậu, sống hạnh phúc trong cung điện. Người hiền lành cuối cùng luôn được hưởng phúc. Hết!'
      }
    ]
  },
  {
    id: 'thach-sanh',
    name: 'Thạch Sanh',
    icon: '⚔️',
    pages: [
      {
        illustration: '👦🪓🌲',
        text: 'Thạch Sanh là chàng trai mồ côi, nghèo khổ. Chàng sống một mình dưới gốc đa. Thạch Sanh chặt củi kiếm sống qua ngày.'
      },
      {
        illustration: '🐍⚔️💥',
        text: 'Một đêm, trăn tinh khổng lồ đến ăn thịt người. Thạch Sanh dũng cảm cầm rìu chiến đấu. Chàng chém chết trăn tinh, cứu dân làng.'
      },
      {
        illustration: '🎸✨🎶',
        text: 'Từ xác trăn tinh, Thạch Sanh nhận được cây đàn thần. Tiếng đàn vang lên ai cũng mê say. Cây đàn có sức mạnh kỳ diệu.'
      },
      {
        illustration: '🦅👸😱',
        text: 'Đại bàng khổng lồ bắt công chúa bay đi. Cả nước lo lắng, không ai dám cứu. Thạch Sanh quyết tâm đi cứu công chúa.'
      },
      {
        illustration: '⚔️🦅🔥',
        text: 'Thạch Sanh chiến đấu với đại bàng dưới hang sâu. Chàng dùng rìu và sức mạnh phi thường. Cuối cùng Thạch Sanh hạ được đại bàng, cứu công chúa.'
      },
      {
        illustration: '👑🎸🏰',
        text: 'Nhà vua gả công chúa cho Thạch Sanh. Chàng dùng đàn thần đuổi giặc ngoại xâm. Thạch Sanh trở thành vua hiền, đất nước thái bình. Hết!'
      }
    ]
  },
  {
    id: 'so-dua',
    name: 'Sọ Dừa',
    icon: '🥥',
    pages: [
      {
        illustration: '👩🥥😢',
        text: 'Ngày xưa có bà mẹ nghèo sinh ra đứa con hình tròn như quả dừa. Bà đặt tên con là Sọ Dừa. Dù xấu xí nhưng bà vẫn thương con.'
      },
      {
        illustration: '🥥🐃🌾',
        text: 'Sọ Dừa xin đi chăn bò cho nhà phú ông. Mọi người cười chê nhưng Sọ Dừa chăn bò rất giỏi. Bò ngày nào cũng béo tốt, ai cũng ngạc nhiên.'
      },
      {
        illustration: '👧💕🥥',
        text: 'Phú ông có ba cô con gái mang cơm cho Sọ Dừa. Hai cô chị khinh thường, chỉ có cô út tốt bụng. Cô út luôn mang cơm đầy đủ cho Sọ Dừa.'
      },
      {
        illustration: '🥥📚🎓',
        text: 'Sọ Dừa thật ra rất thông minh. Chàng xin phú ông cho đi thi. Sọ Dừa đỗ trạng nguyên, ai cũng kinh ngạc.'
      },
      {
        illustration: '✨👦🤵',
        text: 'Đêm trăng sáng, Sọ Dừa biến thành chàng trai tuấn tú. Cô út nhìn thấy và rất vui mừng. Sọ Dừa cầu hôn cô út, phú ông đồng ý.'
      },
      {
        illustration: '🎊👫🏰',
        text: 'Sọ Dừa cưới cô út, sống hạnh phúc bên nhau. Chàng trở thành quan lớn, giúp đỡ dân nghèo. Ai hiền lành, tốt bụng sẽ được hưởng phúc. Hết!'
      }
    ]
  },
  {
    id: 'cay-tre',
    name: 'Cây Tre Trăm Đốt',
    icon: '🎋',
    pages: [
      {
        illustration: '👴💪🌾',
        text: 'Ngày xưa có anh nông dân hiền lành, chăm chỉ. Anh làm thuê cho phú ông. Phú ông hứa gả con gái nếu anh làm tốt.'
      },
      {
        illustration: '😈🤥💰',
        text: 'Phú ông là người gian xảo, muốn lừa anh nông dân. Ông ta bảo anh phải tìm cây tre trăm đốt. Phú ông nghĩ rằng không ai tìm được cây tre như vậy.'
      },
      {
        illustration: '🌲😰🔍',
        text: 'Anh nông dân vào rừng sâu tìm kiếm. Anh tìm mãi nhưng không thấy cây tre nào trăm đốt. Anh buồn lắm, ngồi khóc giữa rừng.'
      },
      {
        illustration: '✨👼💫',
        text: 'Bụt hiện lên hỏi anh vì sao khóc. Anh kể chuyện phú ông bắt tìm tre trăm đốt. Bụt dạy anh câu thần chú: "Khắc nhập, khắc xuất".'
      },
      {
        illustration: '🎋✨💯',
        text: 'Anh nông dân lấy nhiều đốt tre, đọc "Khắc nhập!" Các đốt tre dính liền thành cây tre trăm đốt. Anh vui mừng mang tre về cho phú ông.'
      },
      {
        illustration: '😈🎋😱',
        text: 'Phú ông sờ vào cây tre, anh đọc "Khắc nhập!" Phú ông bị dính vào tre, van xin tha. Cuối cùng phú ông phải giữ lời hứa gả con gái. Hết!'
      }
    ]
  },
  {
    id: 'dua-hau',
    name: 'Sự Tích Dưa Hấu',
    icon: '🍉',
    pages: [
      {
        illustration: '👦👑🏰',
        text: 'An Tiêm là con nuôi của nhà vua. Chàng thông minh, được vua yêu quý. An Tiêm sống sung sướng trong cung điện.'
      },
      {
        illustration: '😡🏝️😢',
        text: 'Có kẻ xấu ghen ghét, nói xấu An Tiêm với vua. Vua tức giận, đày An Tiêm ra đảo hoang. An Tiêm cùng vợ con sống trên đảo vắng.'
      },
      {
        illustration: '🐦🌱✨',
        text: 'Một hôm chim lạ bay tới đảo, thả mấy hạt giống. An Tiêm trồng hạt giống xuống đất. Cây mọc lên xanh tốt, ra quả to tròn.'
      },
      {
        illustration: '🍉😋💚',
        text: 'Quả chín có vỏ xanh, ruột đỏ, ngọt lịm. An Tiêm đặt tên là dưa hấu. Cả gia đình vui mừng vì có thức ăn ngon.'
      },
      {
        illustration: '🍉🚢🤝',
        text: 'An Tiêm khắc tên lên dưa, thả trôi ra biển. Thuyền buôn nhặt được, tìm đến đảo đổi hàng. Dần dần ai cũng biết đến dưa hấu ngon.'
      },
      {
        illustration: '👑🍉🎉',
        text: 'Tin đồn về dưa hấu đến tai nhà vua. Vua biết An Tiêm tài giỏi, cho đón về. An Tiêm dạy mọi người trồng dưa hấu, ai cũng giàu có. Hết!'
      }
    ]
  }
];

// ========== STATE ==========
let state = {
  currentTale: null,
  currentPage: 0,
  unlockedPages: {}, // { taleId: [true, true, false, ...] }
  completedTales: [], // ['tam-cam', ...]
  quizTimer: null,
  quizTimeLeft: 0
};

// ========== PERSISTENCE ==========
function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      state.unlockedPages = data.unlockedPages || {};
      state.completedTales = data.completedTales || [];
    }
  } catch(e) { /* ignore */ }
  // Initialize unlocked pages for each tale (page 0 always unlocked)
  TALES.forEach(tale => {
    if (!state.unlockedPages[tale.id]) {
      state.unlockedPages[tale.id] = [true, false, false, false, false, false];
    }
  });
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      unlockedPages: state.unlockedPages,
      completedTales: state.completedTales
    }));
  } catch(e) { /* ignore */ }
}

// ========== SCREENS ==========
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ========== TALE SELECT ==========
function renderTaleSelect() {
  renderBadges();
  const grid = document.getElementById('tale-grid');
  grid.innerHTML = '';
  TALES.forEach(tale => {
    const completed = state.completedTales.includes(tale.id);
    const unlocked = state.unlockedPages[tale.id] || [];
    const readCount = unlocked.filter(Boolean).length;

    const card = document.createElement('div');
    card.className = 'tale-card' + (completed ? ' completed' : '');
    card.innerHTML = `
      <span class="tale-icon">${tale.icon}</span>
      <div class="tale-info">
        <span class="tale-name">${tale.name}</span>
        <span class="tale-progress">${completed ? 'Đã đọc xong ✨' : `Đã mở ${readCount}/6 trang`}</span>
        <div class="tale-dots">
          ${unlocked.map((u, i) => `<span class="tale-dot ${u ? 'read' : (i === readCount ? 'current' : '')}"></span>`).join('')}
        </div>
      </div>
    `;
    card.addEventListener('click', () => openTale(tale.id));
    grid.appendChild(card);
  });
}

function renderBadges() {
  const bar = document.getElementById('badge-bar');
  bar.innerHTML = TALES.map(tale => {
    const earned = state.completedTales.includes(tale.id);
    return `<div class="badge-item ${earned ? 'earned' : ''}">${tale.icon}</div>`;
  }).join('');
}

// ========== STORY READING ==========
function openTale(taleId) {
  const tale = TALES.find(t => t.id === taleId);
  if (!tale) return;
  state.currentTale = tale;
  state.currentPage = 0;
  showScreen('story-screen');
  document.getElementById('tale-title').textContent = `${tale.icon} ${tale.name}`;
  renderPage();
}

function renderPage() {
  const tale = state.currentTale;
  const pageIdx = state.currentPage;
  const unlocked = state.unlockedPages[tale.id];

  // Progress dots
  const progressEl = document.getElementById('page-progress');
  progressEl.innerHTML = tale.pages.map((_, i) => {
    let cls = 'progress-dot';
    if (unlocked[i]) cls += ' read';
    if (i === pageIdx) cls += ' current';
    if (!unlocked[i] && i !== pageIdx) cls += ' locked';
    return `<span class="${cls}"></span>`;
  }).join('');

  // Page content
  const bookPage = document.getElementById('book-page');

  if (unlocked[pageIdx]) {
    // Show story content
    const page = tale.pages[pageIdx];
    bookPage.innerHTML = `
      <div class="page-illustration">${page.illustration}</div>
      <div class="page-text">${page.text}</div>
    `;
  } else {
    // Locked page
    bookPage.innerHTML = `
      <div class="page-locked">
        <span class="lock-icon">🔒</span>
        <span class="lock-text">Trả lời câu hỏi để mở trang này!</span>
        <button class="btn-unlock" id="btn-unlock">🧠 Trả lời ngay</button>
      </div>
    `;
    document.getElementById('btn-unlock').addEventListener('click', () => startQuiz());
  }

  // Page number
  document.getElementById('page-number').textContent = `Trang ${pageIdx + 1} / 6`;

  // Nav buttons
  document.getElementById('btn-prev').disabled = (pageIdx === 0);
  const nextBtn = document.getElementById('btn-next');
  if (pageIdx === 5 && unlocked[5]) {
    nextBtn.textContent = '🎉 Xong!';
    nextBtn.disabled = false;
  } else if (pageIdx >= 5) {
    nextBtn.textContent = 'Tiếp ▶';
    nextBtn.disabled = true;
  } else {
    nextBtn.textContent = 'Tiếp ▶';
    nextBtn.disabled = false;
  }

  // Animate page
  bookPage.style.animation = 'none';
  bookPage.offsetHeight;
  bookPage.style.animation = 'pageFlip 0.4s ease';
}

// ========== QUIZ ==========
let currentQuizQuestion = null;

async function fetchQuestion() {
  const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
  const grade = profile.grade || 2;
  const subjects = ['math', 'vietnamese', 'english'];
  const subject = subjects[Math.floor(Math.random() * subjects.length)];
  try {
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=1&grade=${grade}`);
    const questions = await res.json();
    if (questions && questions.length > 0) return questions[0];
  } catch(e) { /* fallback */ }
  // Fallback question
  return {
    question_text: '2 + 3 = ?',
    option_a: '4',
    option_b: '5',
    option_c: '6',
    option_d: '7',
    correct_answer: 'B'
  };
}

async function startQuiz() {
  showScreen('quiz-screen');
  const q = await fetchQuestion();
  currentQuizQuestion = q;
  renderQuiz(q);
  startTimer();
}

function renderQuiz(q) {
  document.getElementById('quiz-question').textContent = q.question_text;
  const optionsEl = document.getElementById('quiz-options');
  optionsEl.innerHTML = '';
  document.getElementById('quiz-feedback').textContent = '';

  const options = [
    { label: 'A', text: q.option_a },
    { label: 'B', text: q.option_b },
    { label: 'C', text: q.option_c },
    { label: 'D', text: q.option_d }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = `${opt.label}. ${opt.text}`;
    btn.addEventListener('click', () => handleAnswer(opt.label, q.correct_answer));
    optionsEl.appendChild(btn);
  });
}

function startTimer() {
  state.quizTimeLeft = TIMER_SECONDS;
  updateTimerDisplay();
  clearInterval(state.quizTimer);
  state.quizTimer = setInterval(() => {
    state.quizTimeLeft--;
    updateTimerDisplay();
    if (state.quizTimeLeft <= 0) {
      clearInterval(state.quizTimer);
      handleTimeout();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const pct = (state.quizTimeLeft / TIMER_SECONDS) * 100;
  document.getElementById('timer-fill').style.width = pct + '%';
  document.getElementById('timer-text').textContent = state.quizTimeLeft + 's';
}

function handleAnswer(selected, correct) {
  clearInterval(state.quizTimer);
  const options = document.querySelectorAll('.quiz-option');
  const selectedLower = selected.toLowerCase();
  const correctLower = correct.toLowerCase();
  options.forEach(btn => {
    btn.classList.add('disabled');
    const label = btn.textContent.charAt(0).toLowerCase();
    if (label === correctLower) btn.classList.add('correct');
    if (label === selectedLower && selectedLower !== correctLower) btn.classList.add('wrong');
  });

  const feedback = document.getElementById('quiz-feedback');
  if (selectedLower === correctLower) {
    feedback.textContent = '🎉 Đúng rồi! Trang mới đã mở!';
    feedback.style.color = '#2e7d32';
    setTimeout(() => unlockCurrentPage(), 1200);
  } else {
    feedback.textContent = '❌ Sai rồi! Thử lại câu khác nhé!';
    feedback.style.color = '#c62828';
    setTimeout(() => startQuiz(), 1500);
  }
}

function handleTimeout() {
  const options = document.querySelectorAll('.quiz-option');
  const correct = currentQuizQuestion.correct_answer;
  options.forEach(btn => {
    btn.classList.add('disabled');
    const label = btn.textContent.charAt(0).toLowerCase();
    if (label === correct.toLowerCase()) btn.classList.add('correct');
  });
  const feedback = document.getElementById('quiz-feedback');
  feedback.textContent = '⏰ Hết giờ! Thử lại câu khác nhé!';
  feedback.style.color = '#e65100';
  setTimeout(() => startQuiz(), 1500);
}

function unlockCurrentPage() {
  const tale = state.currentTale;
  const pageIdx = state.currentPage;
  state.unlockedPages[tale.id][pageIdx] = true;
  saveProgress();
  showScreen('story-screen');
  renderPage();
}

// ========== TALE COMPLETE ==========
function completeTale() {
  const tale = state.currentTale;
  if (!state.completedTales.includes(tale.id)) {
    state.completedTales.push(tale.id);
    saveProgress();
  }
  document.getElementById('complete-badge').textContent = tale.icon;
  document.getElementById('complete-tale-name').textContent = `"${tale.name}"`;
  showScreen('complete-screen');

  // Check and show parent linking prompt after game ends
  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

// ========== EVENT LISTENERS ==========
function init() {
  loadProgress();
  renderTaleSelect();

  // Back button
  document.getElementById('btn-back').addEventListener('click', () => {
    clearInterval(state.quizTimer);
    showScreen('tale-select');
    renderTaleSelect();
  });

  // Page navigation
  document.getElementById('btn-prev').addEventListener('click', () => {
    if (state.currentPage > 0) {
      state.currentPage--;
      renderPage();
    }
  });

  document.getElementById('btn-next').addEventListener('click', () => {
    if (state.currentPage === 5 && state.unlockedPages[state.currentTale.id][5]) {
      completeTale();
    } else if (state.currentPage < 5) {
      state.currentPage++;
      renderPage();
    }
  });

  // Complete screen -> back to tales
  document.getElementById('btn-to-tales').addEventListener('click', () => {
    showScreen('tale-select');
    renderTaleSelect();
  });
}

init();

})();
