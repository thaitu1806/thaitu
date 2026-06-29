// V31 - Bưu Điện Vui (Fun Post Office)
(function() {
'use strict';

const STORAGE_KEY = 'v31_post';
const TOTAL_HOUSES = 8;
const ROUND_TIME = 60; // 60 seconds total for the round
const QUESTION_TIME = 10; // 10 seconds per question

// State
let totalDeliveries = loadTotalDeliveries();
let selectedSubject = 'math';
let questions = [];
let currentHouse = 0;
let score = 0;
let deliveredCount = 0;
let combo = 0;
let roundTimer = null;
let roundTimeLeft = ROUND_TIME;
let questionTimer = null;
let questionTimeLeft = QUESTION_TIME;
let gameActive = false;

function loadTotalDeliveries() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved).totalDeliveries || 0;
  } catch(e) {}
  return 0;
}

function saveTotalDeliveries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ totalDeliveries }));
}

// Screen management
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ========== INIT ==========
function init() {
  document.getElementById('total-deliveries').textContent = totalDeliveries;
  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-replay').onclick = startGame;

  // Subject selector
  document.querySelectorAll('.subj-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.subj-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSubject = btn.dataset.subject;
    });
  });
}

async function startGame() {
  // Fetch questions
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade ?? 2;
    const res = await fetch(`/api/questions?subject=${selectedSubject}&difficulty=easy&limit=${TOTAL_HOUSES}&grade=${grade}`);
    questions = await res.json();
    if (!questions || questions.length === 0) {
      alert('Không tải được câu hỏi!');
      return;
    }
  } catch(e) {
    alert('Lỗi kết nối!');
    return;
  }

  // Reset state
  currentHouse = 0;
  score = 0;
  deliveredCount = 0;
  combo = 0;
  roundTimeLeft = ROUND_TIME;
  gameActive = true;

  // Reset houses
  document.querySelectorAll('.house').forEach(h => {
    h.classList.remove('delivered', 'current', 'skipped');
  });

  updateHeader();
  showScreen('game-screen');
  showTruck();
  startRoundTimer();
  showNextDelivery();
}

function showTruck() {
  const truck = document.getElementById('truck');
  truck.classList.add('visible');
}

function updateHeader() {
  document.getElementById('delivery-count').textContent = `📬 ${deliveredCount}/${TOTAL_HOUSES}`;
  document.getElementById('round-timer').textContent = `⏱️ ${Math.ceil(roundTimeLeft)}s`;
  document.getElementById('game-score').textContent = `⭐ ${score}`;
}

// ========== ROUND TIMER ==========
function startRoundTimer() {
  clearInterval(roundTimer);
  roundTimer = setInterval(() => {
    // Combo slows timer: each combo level reduces tick by 0.05s
    const reduction = Math.min(combo * 0.02, 0.05); // max slow: 50%
    roundTimeLeft -= (0.1 - reduction);
    
    document.getElementById('round-timer').textContent = `⏱️ ${Math.ceil(roundTimeLeft)}s`;
    
    if (roundTimeLeft <= 0) {
      clearInterval(roundTimer);
      gameActive = false;
      endGame();
    }
  }, 100);
}

// ========== DELIVERY / QUESTION ==========
function showNextDelivery() {
  if (!gameActive) return;
  if (currentHouse >= TOTAL_HOUSES) {
    // All houses done!
    clearInterval(roundTimer);
    gameActive = false;
    endGame();
    return;
  }

  // Highlight current house
  document.querySelectorAll('.house').forEach(h => h.classList.remove('current'));
  const houseEl = document.querySelector(`.house[data-house="${currentHouse + 1}"]`);
  if (houseEl) houseEl.classList.add('current');

  // Move truck toward house
  moveTruckToHouse(currentHouse);

  // Show question
  const q = questions[currentHouse];
  if (!q) {
    // Not enough questions, end
    clearInterval(roundTimer);
    gameActive = false;
    endGame();
    return;
  }

  document.getElementById('q-text').textContent = q.question_text;
  renderOptions(q);
  document.getElementById('q-feedback').textContent = '';
  document.getElementById('q-feedback').className = 'q-feedback';

  startQuestionTimer();
}

function moveTruckToHouse(index) {
  const truck = document.getElementById('truck');
  const houseEl = document.querySelector(`.house[data-house="${index + 1}"]`);
  if (!houseEl || !truck) return;

  const map = document.getElementById('city-map');
  const mapRect = map.getBoundingClientRect();
  const houseRect = houseEl.getBoundingClientRect();

  const x = houseRect.left - mapRect.left + houseRect.width / 2;
  const y = houseRect.top - mapRect.top - 20;

  truck.style.left = x + 'px';
  truck.style.top = y + 'px';
  truck.style.transform = 'translate(-50%, 0)';
}

function renderOptions(q) {
  const optionsGrid = document.getElementById('q-options');
  optionsGrid.innerHTML = '';

  const options = [
    { key: 'A', text: q.option_a },
    { key: 'B', text: q.option_b },
    { key: 'C', text: q.option_c },
    { key: 'D', text: q.option_d }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = `${opt.key}. ${opt.text}`;
    btn.onclick = () => handleAnswer(opt.key, q);
    optionsGrid.appendChild(btn);
  });
}

function startQuestionTimer() {
  clearInterval(questionTimer);
  questionTimeLeft = QUESTION_TIME;
  const fill = document.getElementById('timer-fill');
  fill.style.width = '100%';
  fill.classList.remove('warning');

  questionTimer = setInterval(() => {
    questionTimeLeft -= 0.1;
    const pct = (questionTimeLeft / QUESTION_TIME) * 100;
    fill.style.width = pct + '%';
    if (questionTimeLeft <= 3) fill.classList.add('warning');
    if (questionTimeLeft <= 0) {
      clearInterval(questionTimer);
      handleTimeout();
    }
  }, 100);
}

function handleAnswer(selected, q) {
  if (!gameActive) return;
  clearInterval(questionTimer);

  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const isCorrect = selected.toLowerCase() === q.correct_answer.toLowerCase();

  // Highlight answers
  btns.forEach(b => {
    const btnKey = b.textContent.charAt(0).toLowerCase();
    if (btnKey === q.correct_answer.toLowerCase()) b.classList.add('correct');
    if (!isCorrect && btnKey === selected.toLowerCase()) b.classList.add('wrong');
  });

  const houseEl = document.querySelector(`.house[data-house="${currentHouse + 1}"]`);
  const fb = document.getElementById('q-feedback');

  if (isCorrect) {
    combo++;
    deliveredCount++;
    const points = 10 + (combo * 2); // Combo bonus
    score += points;
    if (houseEl) houseEl.classList.add('delivered');
    fb.textContent = `📬 Giao thành công! +${points} điểm (combo x${combo})`;
    fb.className = 'q-feedback correct';
  } else {
    combo = 0;
    if (houseEl) houseEl.classList.add('skipped');
    fb.textContent = '📭 Thư bị trả lại!';
    fb.className = 'q-feedback wrong';
  }

  // Log answer
  logAnswer(q, selected, isCorrect);

  updateHeader();

  setTimeout(() => {
    currentHouse++;
    showNextDelivery();
  }, 1200);
}

function handleTimeout() {
  if (!gameActive) return;
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const q = questions[currentHouse];
  btns.forEach(b => {
    if (b.textContent.charAt(0).toLowerCase() === q.correct_answer.toLowerCase()) b.classList.add('correct');
  });

  combo = 0;
  const houseEl = document.querySelector(`.house[data-house="${currentHouse + 1}"]`);
  if (houseEl) houseEl.classList.add('skipped');

  const fb = document.getElementById('q-feedback');
  fb.textContent = '⏰ Hết giờ! Thư bị trả lại!';
  fb.className = 'q-feedback wrong';

  logAnswer(q, null, false);
  updateHeader();

  setTimeout(() => {
    currentHouse++;
    showNextDelivery();
  }, 1200);
}

// ========== END GAME ==========
function endGame() {
  clearInterval(roundTimer);
  clearInterval(questionTimer);

  // Time bonus: if all delivered before time runs out
  let timeBonus = 0;
  if (deliveredCount === TOTAL_HOUSES && roundTimeLeft > 0) {
    timeBonus = Math.floor(roundTimeLeft) * 2;
    score += timeBonus;
  }

  // Update total deliveries
  totalDeliveries += deliveredCount;
  saveTotalDeliveries();

  showScreen('result-screen');

  document.getElementById('result-score').textContent = score;

  let detailHTML = `📬 Thư đã giao: ${deliveredCount}/${TOTAL_HOUSES}<br>`;
  if (timeBonus > 0) {
    detailHTML += `⏱️ Thưởng thời gian: +${timeBonus} điểm<br>`;
  }
  if (deliveredCount === TOTAL_HOUSES) {
    document.getElementById('result-title').textContent = '🎉 Hoàn Thành Xuất Sắc!';
    detailHTML += '🏆 Giao hết thư đúng hạn!';
  } else {
    document.getElementById('result-title').textContent = '📮 Kết Quả Giao Thư!';
  }
  document.getElementById('result-detail').innerHTML = detailHTML;

  spawnConfetti();
  saveSession();

  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

// ========== UTILS ==========
function spawnConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#4CAF50', '#FFC107', '#FF9800', '#2196F3', '#9C27B0', '#FF5722', '#00BCD4'];

  for (let i = 0; i < 25; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = (Math.random() * 2) + 's';
    piece.style.animationDuration = (2 + Math.random() * 2) + 's';
    container.appendChild(piece);
  }
}

async function logAnswer(q, selected, isCorrect) {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: null,
        player_id: profile.id,
        question_id: q.id,
        selected_answer: selected || '',
        correct_answer: q.correct_answer,
        is_correct: isCorrect
      })
    });
  } catch(e) {}
}

async function saveSession() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: profile.id,
        subject: selectedSubject,
        difficulty: 'easy',
        score: score,
        total_questions: TOTAL_HOUSES,
        correct_answers: deliveredCount,
        stars_earned: Math.floor(deliveredCount / 2),
        combo_max: combo,
        mode: 'v31'
      })
    });
  } catch(e) {}
}

// ========== START ==========
init();

})();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only, additive) =====
// V31's game logic lives in the closed IIFE above and is left untouched.
// This block only adds visuals: a chibi postman sprite on the delivery truck,
// sparkle particles on a successful delivery, and styled guide/exit modals.
(function () {
  'use strict';

  let postman = null;

  function mountPostman() {
    const host = document.getElementById('truck');
    if (!host || host.dataset.mounted === '1') return;
    host.dataset.mounted = '1';
    host.textContent = '';
    const C = window.HocVuiCharacters;
    if (C && C.hasSpecies('postman')) {
      postman = C.createCharacter('postman', host, { state: 'idle' });
    } else {
      host.textContent = '🚗';
    }
  }

  // Sparkle particles around the truck on a good delivery.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 70 - 35) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 40 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v31_spawnParticles = spawnParticles;

  function celebrate() {
    if (postman) {
      postman.setState('happy');
      setTimeout(() => { if (postman) postman.setState('idle'); }, 800);
    }
    const host = document.getElementById('truck');
    if (host) spawnParticles(host, 'sparkle', 7);
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  ready(function () {
    const $ = id => document.getElementById(id);

    // Mount the postman when the game screen activates.
    const gameScreen = $('game-screen');
    if (gameScreen) {
      const screenObs = new MutationObserver(() => {
        if (gameScreen.classList.contains('active')) mountPostman();
      });
      screenObs.observe(gameScreen, { attributes: true, attributeFilter: ['class'] });
      if (gameScreen.classList.contains('active')) mountPostman();
    }

    // React to delivery feedback: "correct" => postman celebrates.
    const fb = $('q-feedback');
    if (fb) {
      const fbObs = new MutationObserver(() => {
        if (fb.classList.contains('correct')) celebrate();
      });
      fbObs.observe(fb, { attributes: true, attributeFilter: ['class'] });
    }

    // Guide modal --------------------------------------------------------
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const gc = $('btn-guide-close');
      if (gc) gc.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }

    // Exit modal ---------------------------------------------------------
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const ec = $('btn-exit-cancel');
      if (ec) ec.addEventListener('click', () => { exit.style.display = 'none'; });
      const ef = $('btn-exit-confirm');
      if (ef) ef.addEventListener('click', () => {
        exit.style.display = 'none';
        // Stop every running timer/loop before leaving (state is private to the
        // logic IIFE, so clear the whole timer range non-invasively).
        try {
          const hi = setTimeout(function () {}, 0);
          for (let i = 0; i <= hi; i++) { clearTimeout(i); clearInterval(i); }
        } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
