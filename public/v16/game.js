// V16 Đầu Bếp Nhí - Little Chef
// Cook dishes, serve customers, earn coins!

const RESTAURANTS = [
  { id: 'cart', name: 'Xe Đẩy', icon: '🛒', unlock: 0, customers: 6 },
  { id: 'small', name: 'Quán Nhỏ', icon: '🏪', unlock: 5, customers: 8 },
  { id: 'restaurant', name: 'Nhà Hàng', icon: '🍜', unlock: 15, customers: 10 },
  { id: 'fivestar', name: '5 Sao', icon: '⭐', unlock: 30, customers: 12 },
];

const DISHES = [
  { id: 'pho', name: 'Phở', emoji: '🍜', steps: ['🥩 Thái thịt','💧 Nấu nước','🍜 Bày tô'], baseCoins: 12 },
  { id: 'rice', name: 'Cơm Rang', emoji: '🍳', steps: ['🍚 Nấu cơm','🥚 Đập trứng','🍳 Xào'], baseCoins: 10 },
  { id: 'roll', name: 'Gỏi Cuốn', emoji: '🥗', steps: ['🥬 Rửa rau','🍤 Luộc tôm','🥗 Cuốn'], baseCoins: 11 },
  { id: 'flan', name: 'Bánh Flan', emoji: '🍮', steps: ['🥚 Đánh trứng','🍯 Pha caramel','🍮 Hấp'], baseCoins: 14, unlock: 10 },
  { id: 'cupcake', name: 'Cupcake', emoji: '🧁', steps: ['🧈 Trộn bột','🎨 Trang trí','🧁 Nướng'], baseCoins: 13, unlock: 20 },
  { id: 'pizza', name: 'Pizza', emoji: '🍕', steps: ['🫓 Cán bột','🧀 Phủ topping','🍕 Nướng'], baseCoins: 15, unlock: 35 },
  { id: 'sushi', name: 'Sushi', emoji: '🍣', steps: ['🍚 Nấu cơm','🐟 Cắt cá','🍣 Cuốn'], baseCoins: 16, unlock: 50 },
  { id: 'icecream', name: 'Kem', emoji: '🍦', steps: ['🥛 Pha sữa','❄️ Đông lạnh','🍦 Trang trí'], baseCoins: 14, unlock: 75 },
];

const CUSTOMERS = [
  { emoji: '👦', name: 'Bé Nam' }, { emoji: '👧', name: 'Bé Hoa' },
  { emoji: '👨', name: 'Chú Ba' }, { emoji: '👩', name: 'Cô Tư' },
  { emoji: '👴', name: 'Ông Hai' }, { emoji: '👵', name: 'Bà Năm' },
  { emoji: '🧑', name: 'Anh Minh' }, { emoji: '👱', name: 'Chị Lan' },
];

const QUESTION_TIME = 10;
const PATIENCE_TIME = 30; // seconds

// ===== STATE =====
const S = {
  config: { subject: 'math', difficulty: 'easy', restaurant: 'cart' },
  customersTotal: 6, customersCurrent: 0, customersServed: 0,
  coins: 0, combo: 0, maxCombo: 0,
  currentDish: null, currentStep: 0, burns: 0,
  currentCustomer: null, patience: PATIENCE_TIME,
  questions: [], qIndex: 0, correct: 0, incorrect: 0,
  questionTimer: null, timeLeft: 0, patienceTimer: null,
  gameOver: false,
};

// Persistence
function loadProgress() { try { return JSON.parse(localStorage.getItem('v16_progress')) || { shifts: 0, served: 0 }; } catch { return { shifts: 0, served: 0 }; } }
function saveProgress(p) { localStorage.setItem('v16_progress', JSON.stringify(p)); }
function getPlayerId() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.id; } catch { return null; } }
function getPlayerGrade() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.grade ?? 2; } catch { return 2; } }

let progress = loadProgress();

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== SETUP =====
function renderSetup() {
  document.getElementById('total-served').textContent = progress.served;
  const grid = document.getElementById('restaurant-grid');
  grid.innerHTML = RESTAURANTS.map(r => {
    const unlocked = progress.shifts >= r.unlock;
    const active = S.config.restaurant === r.id;
    return `<div class="rest-card ${active ? 'active' : ''} ${!unlocked ? 'locked' : ''}" data-rest="${r.id}">
      <div class="rest-icon">${r.icon}</div>
      <div class="rest-name">${r.name}${!unlocked ? ` (${r.unlock} ca)` : ''}</div>
    </div>`;
  }).join('');
}
renderSetup();

document.getElementById('subject-group').addEventListener('click', e => {
  const btn = e.target.closest('.btn-option'); if (!btn) return;
  document.querySelectorAll('#subject-group .btn-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); S.config.subject = btn.dataset.subject;
});
document.getElementById('difficulty-group').addEventListener('click', e => {
  const btn = e.target.closest('.btn-option'); if (!btn) return;
  document.querySelectorAll('#difficulty-group .btn-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active'); S.config.difficulty = btn.dataset.difficulty;
});
document.getElementById('restaurant-grid').addEventListener('click', e => {
  const card = e.target.closest('.rest-card');
  if (!card || card.classList.contains('locked')) return;
  document.querySelectorAll('.rest-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  S.config.restaurant = card.dataset.rest;
});
document.getElementById('btn-start').addEventListener('click', startGame);

// ===== GAME START =====
async function startGame() {
  const rest = RESTAURANTS.find(r => r.id === S.config.restaurant) || RESTAURANTS[0];
  Object.assign(S, { customersTotal: rest.customers, customersCurrent: 0, customersServed: 0, coins: 0, combo: 0, maxCombo: 0, currentDish: null, currentStep: 0, burns: 0, currentCustomer: null, patience: PATIENCE_TIME, qIndex: 0, correct: 0, incorrect: 0, gameOver: false });
  showScreen('game-screen');
  document.getElementById('hud-total').textContent = S.customersTotal;
  await fetchQuestions();
  nextCustomer();
}

async function fetchQuestions() {
  const grade = getPlayerGrade();
  let subject = S.config.subject;
  if (subject === 'mix') subject = ['math','vietnamese','english'][Math.floor(Math.random()*3)];
  try {
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=${S.config.difficulty}&limit=50&grade=${grade}`);
    const data = await res.json();
    S.questions = (Array.isArray(data) ? data : data.questions || []).sort(() => Math.random() - 0.5);
  } catch { S.questions = []; }
  if (!S.questions.length) S.questions = [{ question_text: 'Lỗi tải câu hỏi', option_a: 'OK', option_b: '-', option_c: '-', option_d: '-', correct_answer: 'a' }];
}

// ===== CUSTOMER =====
function nextCustomer() {
  if (S.customersCurrent >= S.customersTotal) { endGame(); return; }
  S.customersCurrent++;
  S.burns = 0;
  S.currentStep = 0;

  // Random customer & dish
  S.currentCustomer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  const available = DISHES.filter(d => !d.unlock || progress.served >= d.unlock);
  S.currentDish = available[Math.floor(Math.random() * available.length)];
  S.patience = PATIENCE_TIME;

  // Update UI
  document.getElementById('customer-emoji').textContent = S.currentCustomer.emoji;
  document.getElementById('customer-bubble').textContent = `Cho tôi ${S.currentDish.name} nhé!`;
  document.getElementById('dish-name').textContent = `${S.currentDish.emoji} ${S.currentDish.name}`;
  document.getElementById('burn-indicator').textContent = '';
  document.getElementById('hud-served').textContent = S.customersServed;
  document.getElementById('hud-coins').textContent = S.coins;
  document.getElementById('hud-combo').textContent = S.combo >= 2 ? `🔥x${S.combo}` : '';

  renderCookingSteps();
  startPatience();
  showNextQuestion();
}

function renderCookingSteps() {
  const stepsEl = document.getElementById('cooking-steps');
  stepsEl.innerHTML = S.currentDish.steps.map((step, i) => {
    let cls = '';
    if (i < S.currentStep) cls = 'done';
    else if (i === S.currentStep) cls = 'active';
    return `<div class="cook-step ${cls}" data-step="${i}"><span class="step-icon">${step.split(' ')[0]}</span><span class="step-label">${step.split(' ').slice(1).join(' ')}</span></div>`;
  }).join('');
}

// ===== PATIENCE =====
function startPatience() {
  stopPatience();
  S.patienceTimer = setInterval(() => {
    S.patience -= 0.5;
    const pct = Math.max(0, (S.patience / PATIENCE_TIME) * 100);
    const fill = document.getElementById('patience-fill');
    if (fill) fill.style.width = pct + '%';
    if (S.patience <= 0) { stopPatience(); customerLeft(); }
  }, 500);
}
function stopPatience() { if (S.patienceTimer) { clearInterval(S.patienceTimer); S.patienceTimer = null; } }

function customerLeft() {
  S.combo = 0;
  showServeAnimation('😠', 'Khách bỏ đi!', '0 xu');
  document.getElementById('customer-emoji').classList.add('angry');
  setTimeout(() => {
    document.getElementById('customer-emoji').classList.remove('angry');
    nextCustomer();
  }, 1500);
}

// ===== QUESTION =====
function showNextQuestion() {
  if (S.qIndex >= S.questions.length) { S.qIndex = 0; S.questions.sort(() => Math.random() - 0.5); }
  const q = S.questions[S.qIndex];
  document.getElementById('qp-text').textContent = q.question_text;
  const btns = document.querySelectorAll('.qp-btn');
  ['a','b','c','d'].forEach((o,i) => { btns[i].textContent = q[`option_${o}`]; btns[i].className = 'qp-btn'; btns[i].disabled = false; });
  document.getElementById('qp-status').textContent = '';
  document.getElementById('qp-status').className = 'qp-status';
  startQuestionTimer();
}

function startQuestionTimer() {
  stopQuestionTimer();
  S.timeLeft = QUESTION_TIME;
  updateTimerBar();
  S.questionTimer = setInterval(() => {
    S.timeLeft -= 0.1;
    updateTimerBar();
    if (S.timeLeft <= 0) { stopQuestionTimer(); handleTimeout(); }
  }, 100);
}
function stopQuestionTimer() { if (S.questionTimer) { clearInterval(S.questionTimer); S.questionTimer = null; } }
function updateTimerBar() {
  const fill = document.getElementById('qp-timer-fill');
  if (!fill) return;
  const pct = Math.max(0, (S.timeLeft / QUESTION_TIME) * 100);
  fill.style.width = pct + '%';
  fill.classList.toggle('urgent', S.timeLeft <= 3);
}

function handleTimeout() {
  const q = S.questions[S.qIndex];
  document.querySelectorAll('.qp-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  const cb = document.querySelector(`.qp-btn[data-opt="${q.correct_answer}"]`);
  if (cb) cb.classList.add('correct');
  handleWrong();
}

// ===== ANSWERS =====
document.getElementById('qp-answers').addEventListener('click', e => {
  const btn = e.target.closest('.qp-btn');
  if (!btn || btn.disabled || S.gameOver) return;
  stopQuestionTimer();
  const q = S.questions[S.qIndex];
  const selected = btn.dataset.opt;
  const correct = q.correct_answer;
  const isCorrect = selected.toLowerCase() === correct.toLowerCase();

  document.querySelectorAll('.qp-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  if (isCorrect) { btn.classList.add('correct'); handleCorrect(); }
  else { btn.classList.add('wrong'); document.querySelector(`.qp-btn[data-opt="${correct}"]`)?.classList.add('correct'); handleWrong(); }
  logAnswer(q, selected, correct, isCorrect);
});

function handleCorrect() {
  S.correct++;
  const st = document.getElementById('qp-status');
  st.textContent = '✅ Ngon!'; st.className = 'qp-status good';

  // Mark step done
  const steps = document.querySelectorAll('.cook-step');
  if (steps[S.currentStep]) { steps[S.currentStep].classList.remove('active'); steps[S.currentStep].classList.add('done'); }
  S.currentStep++;

  S.qIndex++;
  setTimeout(() => {
    if (S.currentStep >= 3) { dishComplete(); }
    else { renderCookingSteps(); showNextQuestion(); }
  }, 700);
}

function handleWrong() {
  S.incorrect++;
  S.burns++;
  const st = document.getElementById('qp-status');
  st.textContent = `🔥 Cháy! (${S.burns}/2)`; st.className = 'qp-status bad';
  document.getElementById('burn-indicator').textContent = '🔥'.repeat(S.burns);

  // Mark step burned
  const steps = document.querySelectorAll('.cook-step');
  if (steps[S.currentStep]) { steps[S.currentStep].classList.add('burned'); setTimeout(() => steps[S.currentStep]?.classList.remove('burned'), 500); }

  S.qIndex++;
  setTimeout(() => {
    if (S.burns >= 2) { dishFailed(); }
    else { showNextQuestion(); }
  }, 700);
}

// ===== DISH COMPLETE/FAIL =====
function dishComplete() {
  stopPatience();
  S.customersServed++;
  const tipMultiplier = S.burns === 0 ? (S.timeLeft > 5 ? 2 : 1.5) : 1;
  const earned = Math.round(S.currentDish.baseCoins * tipMultiplier);
  S.coins += earned;
  S.combo++;
  if (S.combo > S.maxCombo) S.maxCombo = S.combo;

  const tipText = tipMultiplier >= 2 ? ' (Perfect! x2)' : tipMultiplier >= 1.5 ? ' (Tip!)' : '';
  document.getElementById('customer-emoji').classList.add('happy');
  showServeAnimation('😍', `${S.currentDish.emoji} Ngon quá!`, `+${earned} xu${tipText}`);

  setTimeout(() => {
    document.getElementById('customer-emoji').classList.remove('happy');
    document.getElementById('hud-coins').textContent = S.coins;
    document.getElementById('hud-combo').textContent = S.combo >= 2 ? `🔥x${S.combo}` : '';
    nextCustomer();
  }, 1800);
}

function dishFailed() {
  stopPatience();
  S.combo = 0;
  document.getElementById('customer-emoji').classList.add('angry');
  showServeAnimation('😠', 'Cháy rồi! Khách bỏ đi!', '0 xu');

  setTimeout(() => {
    document.getElementById('customer-emoji').classList.remove('angry');
    document.getElementById('hud-combo').textContent = '';
    nextCustomer();
  }, 1800);
}

function showServeAnimation(emoji, text, coins) {
  const overlay = document.getElementById('serve-overlay');
  document.getElementById('serve-content').innerHTML = `<div class="serve-emoji">${emoji}</div><div class="serve-text">${text}</div><div class="serve-coins">${coins}</div>`;
  overlay.classList.add('active');
  setTimeout(() => overlay.classList.remove('active'), 1500);
}

// ===== END GAME =====
function endGame() {
  S.gameOver = true;
  stopQuestionTimer();
  stopPatience();

  progress.shifts++;
  progress.served += S.customersServed;
  saveProgress(progress);
  saveSession();

  const stars = S.customersServed >= S.customersTotal ? 3 : S.customersServed >= S.customersTotal * 0.7 ? 2 : S.customersServed >= 1 ? 1 : 0;

  // Check unlocks
  let unlockText = '';
  const newDish = DISHES.find(d => d.unlock && progress.served >= d.unlock && progress.served - S.customersServed < d.unlock);
  if (newDish) unlockText = `<div class="result-unlock"><div class="result-unlock-text">🎉 Mở khóa: ${newDish.emoji} ${newDish.name}!</div></div>`;

  document.getElementById('result-container').innerHTML = `
    <div class="result-title">👨‍🍳 Hết ca!</div>
    <div class="result-emoji">${stars >= 3 ? '🌟🌟🌟' : stars >= 2 ? '⭐⭐' : '⭐'}</div>
    <div class="result-stats">
      <div class="result-stat"><span>🍽️ Khách phục vụ</span><strong>${S.customersServed}/${S.customersTotal}</strong></div>
      <div class="result-stat"><span>💰 Xu kiếm</span><strong>${S.coins}</strong></div>
      <div class="result-stat"><span>✅ Câu đúng</span><strong>${S.correct}</strong></div>
      <div class="result-stat"><span>🔥 Combo max</span><strong>x${S.maxCombo}</strong></div>
      <div class="result-stat"><span>⭐ Đánh giá</span><strong>${'⭐'.repeat(stars)}</strong></div>
      <div class="result-stat"><span>📊 Tổng ca</span><strong>${progress.shifts}</strong></div>
    </div>
    ${unlockText}
    <div class="result-btns">
      <button class="result-btn primary" onclick="location.reload()">🔄 Ca tiếp</button>
      <button class="result-btn secondary" onclick="location.href='/'">🏠 Trang chủ</button>
    </div>`;
  showScreen('result-screen');
  if (window.checkAndShowPrompt && getPlayerId()) window.checkAndShowPrompt(getPlayerId());
}

// ===== SESSION =====
async function saveSession() {
  const playerId = getPlayerId(); if (!playerId) return;
  const stars = S.customersServed >= S.customersTotal ? 3 : S.customersServed >= S.customersTotal * 0.7 ? 2 : 1;
  try { await fetch('/api/sessions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player_id: playerId, subject: S.config.subject === 'mix' ? 'math' : S.config.subject, difficulty: S.config.difficulty, score: S.coins, total_questions: S.correct + S.incorrect, correct_answers: S.correct, stars_earned: stars, combo_max: S.maxCombo }) }); } catch {}
}
async function logAnswer(q, selected, correct, isCorrect) {
  const playerId = getPlayerId(); if (!playerId) return;
  try { await fetch('/api/answers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ session_id: 0, player_id: playerId, question_id: q.id||0, selected_answer: selected, correct_answer: correct, is_correct: isCorrect?1:0, time_spent_ms: Math.round((QUESTION_TIME-S.timeLeft)*1000), difficulty: S.config.difficulty, combo_streak: S.combo }) }); } catch {}
}

// ===== CHARACTER SYSTEM INTEGRATION (presentation only) =====
(function () {
  'use strict';
  let chefChar = null;
  let helperChar = null;
  let happyTimer = null;

  function mountChefs() {
    const C = window.HocVuiCharacters;
    const chefHost = document.getElementById('chef-avatar');
    const helperHost = document.getElementById('helper-avatar');
    if (chefHost && !chefChar) {
      chefHost.textContent = '';
      if (C && C.hasSpecies('chef')) {
        chefChar = C.createCharacter('chef', chefHost, { state: 'idle' });
      } else {
        chefHost.textContent = '👨‍🍳';
      }
    }
    if (helperHost && !helperChar) {
      helperHost.textContent = '';
      if (C && C.hasSpecies('helper')) {
        helperChar = C.createCharacter('helper', helperHost, { state: 'idle' });
      } else {
        helperHost.textContent = '🍲';
      }
    }
  }

  function cheer(duration) {
    if (chefChar) chefChar.setState('happy');
    if (helperChar) helperChar.setState('happy');
    if (happyTimer) clearTimeout(happyTimer);
    happyTimer = setTimeout(() => {
      if (chefChar) chefChar.setState('idle');
      if (helperChar) helperChar.setState('idle');
    }, duration || 700);
  }

  // Particle helper — sparkles around the chef on a correct answer.
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

  // Confetti burst — played when a dish is completed.
  function spawnConfetti(parent, count) {
    if (!parent) return;
    const colors = ['#fbbf24', '#f97316', '#22c55e', '#ef4444', '#0077b6', '#fff'];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-confetti';
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--tx', (Math.random() * 160 - 80) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 60 + 40) + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v16_spawnParticles = spawnParticles;
  window.__v16_spawnConfetti = spawnConfetti;

  // Mount the chef when a new customer arrives. nextCustomer() is called by
  // global name inside startGame(), so reassigning it here runs reliably
  // (the btn-start listener captured the original startGame reference).
  if (typeof nextCustomer === 'function') {
    const origNext = nextCustomer;
    nextCustomer = function () {
      mountChefs();
      if (chefChar) chefChar.setState('idle');
      if (helperChar) helperChar.setState('idle');
      return origNext.apply(this, arguments);
    };
  }

  // Correct answer — quick cheer + sparkles around the chef.
  if (typeof handleCorrect === 'function') {
    const origCorrect = handleCorrect;
    handleCorrect = function () {
      cheer(700);
      const stage = document.querySelector('.chef-stage');
      if (stage) spawnParticles(stage, 'sparkle', 7);
      return origCorrect.apply(this, arguments);
    };
  }

  // Dish complete — bigger celebration + confetti.
  if (typeof dishComplete === 'function') {
    const origComplete = dishComplete;
    dishComplete = function () {
      cheer(1500);
      const stage = document.querySelector('.chef-stage');
      if (stage) spawnConfetti(stage, 18);
      return origComplete.apply(this, arguments);
    };
  }

  // Modals (guide + exit) ---------------------------------------------------
  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }
  ready(function () {
    const $ = id => document.getElementById(id);
    const guide = $('guide-modal');
    const guideBtn = $('btn-guide');
    if (guide && guideBtn) {
      guideBtn.addEventListener('click', () => { guide.style.display = 'flex'; });
      const gc = $('btn-guide-close');
      if (gc) gc.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const ec = $('btn-exit-cancel');
      if (ec) ec.addEventListener('click', () => { exit.style.display = 'none'; });
      const ef = $('btn-exit-confirm');
      if (ef) ef.addEventListener('click', () => {
        exit.style.display = 'none';
        // Stop loops/timers before leaving.
        try { stopQuestionTimer(); } catch (e) {}
        try { stopPatience(); } catch (e) {}
        try { S.gameOver = true; } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
