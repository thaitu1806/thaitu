// V39 - Thời Trang Show (Fashion Show)
(function() {
'use strict';

const STORAGE_KEY = 'v39_fashion';
const TIMER_SECONDS = 10;
const TOTAL_QUESTIONS = 10;
const UNLOCK_COST = 3; // fabric needed to unlock each item

const CATEGORIES = [
  { id: 'hat', name: 'Mũ', emoji: '🎩' },
  { id: 'top', name: 'Áo', emoji: '👕' },
  { id: 'bottom', name: 'Quần', emoji: '👖' },
  { id: 'shoes', name: 'Giày', emoji: '👟' },
  { id: 'accessory', name: 'Phụ kiện', emoji: '🎀' }
];

const ITEMS = [
  // Hats
  { id: 'hat1', category: 'hat', emoji: '🎩', name: 'Mũ Phớt' },
  { id: 'hat2', category: 'hat', emoji: '👒', name: 'Mũ Rộng' },
  { id: 'hat3', category: 'hat', emoji: '🧢', name: 'Mũ Lưỡi Trai' },
  // Tops
  { id: 'top1', category: 'top', emoji: '👕', name: 'Áo Thun' },
  { id: 'top2', category: 'top', emoji: '👚', name: 'Áo Kiểu' },
  { id: 'top3', category: 'top', emoji: '🧥', name: 'Áo Khoác' },
  // Bottoms
  { id: 'bot1', category: 'bottom', emoji: '👖', name: 'Quần Jean' },
  { id: 'bot2', category: 'bottom', emoji: '👗', name: 'Váy Đầm' },
  { id: 'bot3', category: 'bottom', emoji: '🩳', name: 'Quần Short' },
  // Shoes
  { id: 'shoe1', category: 'shoes', emoji: '👟', name: 'Giày Thể Thao' },
  { id: 'shoe2', category: 'shoes', emoji: '👠', name: 'Giày Cao Gót' },
  { id: 'shoe3', category: 'shoes', emoji: '🥾', name: 'Bốt' },
  // Accessories
  { id: 'acc1', category: 'accessory', emoji: '🎀', name: 'Nơ' },
  { id: 'acc2', category: 'accessory', emoji: '👜', name: 'Túi Xách' },
  { id: 'acc3', category: 'accessory', emoji: '🕶️', name: 'Kính Mát' }
];

// State
let gameData = {
  fabric: 0,
  unlocked: [],  // item ids
  equipped: {}   // category -> item id
};

let questions = [];
let questionIndex = 0;
let fabricEarned = 0;
let totalCorrect = 0;
let totalAnswered = 0;
let timer = null;
let timeLeft = 0;
let activeCategory = 'hat';

// ========== PERSISTENCE ==========
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      gameData.fabric = data.fabric || 0;
      gameData.unlocked = data.unlocked || [];
      gameData.equipped = data.equipped || {};
    }
  } catch(e) {}
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
}

// ========== SCREENS ==========
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ========== START SCREEN ==========
function updateStartScreen() {
  document.getElementById('start-fabric').textContent = gameData.fabric;
  document.getElementById('start-unlocked').textContent = gameData.unlocked.length;
}

// ========== QUIZ ==========
async function startQuiz() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade ?? 2;
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=${TOTAL_QUESTIONS}&grade=${grade}`);
    questions = await res.json();
    if (!questions || questions.length === 0) {
      alert('Không tải được câu hỏi!');
      return;
    }
  } catch(e) {
    alert('Lỗi kết nối!');
    return;
  }

  questionIndex = 0;
  fabricEarned = 0;
  totalCorrect = 0;
  totalAnswered = 0;

  showScreen('quiz-screen');
  document.getElementById('fabric').textContent = gameData.fabric;
  showQuestion();
}

function showQuestion() {
  if (questionIndex >= questions.length) {
    endQuiz();
    return;
  }

  const q = questions[questionIndex];
  document.getElementById('q-num').textContent = questionIndex + 1;
  document.getElementById('q-text').textContent = q.question_text;

  const optionsDiv = document.getElementById('q-options');
  optionsDiv.innerHTML = '';

  const options = [
    { key: 'a', text: q.option_a },
    { key: 'b', text: q.option_b },
    { key: 'c', text: q.option_c },
    { key: 'd', text: q.option_d }
  ];

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt.text;
    btn.onclick = () => handleAnswer(opt.key, q.correct_answer);
    optionsDiv.appendChild(btn);
  });

  startTimer();
}

function handleAnswer(selected, correct) {
  clearInterval(timer);
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));

  const isCorrect = selected.toLowerCase() === correct.toLowerCase();
  totalAnswered++;

  const q = questions[questionIndex];
  btns.forEach(b => {
    const correctText = q[`option_${correct.toLowerCase()}`];
    if (b.textContent === correctText) b.classList.add('correct');
    if (!isCorrect && b.textContent === q[`option_${selected.toLowerCase()}`]) b.classList.add('wrong');
  });

  if (isCorrect) {
    totalCorrect++;
    fabricEarned++;
    gameData.fabric++;
    document.getElementById('fabric').textContent = gameData.fabric;
  }

  questionIndex++;
  setTimeout(() => showQuestion(), 900);
}

function handleTimeout() {
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.classList.add('disabled'));
  totalAnswered++;

  const q = questions[questionIndex];
  btns.forEach(b => {
    const correctText = q[`option_${q.correct_answer.toLowerCase()}`];
    if (b.textContent === correctText) b.classList.add('correct');
  });

  questionIndex++;
  setTimeout(() => showQuestion(), 900);
}

function startTimer() {
  clearInterval(timer);
  timeLeft = TIMER_SECONDS;
  const fill = document.getElementById('timer-fill');
  const text = document.getElementById('timer-text');
  fill.style.width = '100%';
  fill.classList.remove('warning');
  text.textContent = TIMER_SECONDS;

  timer = setInterval(() => {
    timeLeft -= 0.1;
    const pct = (timeLeft / TIMER_SECONDS) * 100;
    fill.style.width = pct + '%';
    text.textContent = Math.ceil(timeLeft);
    if (timeLeft <= 3) fill.classList.add('warning');
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeout();
    }
  }, 100);
}

function endQuiz() {
  clearInterval(timer);
  saveData();
  saveSession();

  // Show fabric earned popup
  const popup = document.createElement('div');
  popup.className = 'fabric-earned';
  popup.innerHTML = `
    <h3>🧵 Kiếm Được Vải!</h3>
    <div class="big-num">+${fabricEarned}</div>
    <p>Tổng: ${gameData.fabric} vải | Đúng: ${totalCorrect}/${totalAnswered}</p>
  `;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
    showWardrobe();
  }, 2000);

  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

// ========== WARDROBE ==========
function showWardrobe() {
  showScreen('wardrobe-screen');
  document.getElementById('wardrobe-fabric').textContent = gameData.fabric;
  renderCategoryTabs();
  renderItems();
  renderEquipped();
}

function renderCategoryTabs() {
  const tabsDiv = document.getElementById('category-tabs');
  tabsDiv.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (cat.id === activeCategory ? ' active' : '');
    btn.textContent = `${cat.emoji} ${cat.name}`;
    btn.onclick = () => {
      activeCategory = cat.id;
      renderCategoryTabs();
      renderItems();
    };
    tabsDiv.appendChild(btn);
  });
}

function renderItems() {
  const grid = document.getElementById('items-grid');
  grid.innerHTML = '';

  const catItems = ITEMS.filter(i => i.category === activeCategory);
  catItems.forEach(item => {
    const isUnlocked = gameData.unlocked.includes(item.id);
    const isEquipped = gameData.equipped[item.category] === item.id;

    const card = document.createElement('div');
    card.className = 'item-card' + (isUnlocked ? ' unlocked' : ' locked') + (isEquipped ? ' equipped' : '');

    card.innerHTML = `
      <span class="item-emoji">${item.emoji}</span>
      <span class="item-name">${item.name}</span>
      <span class="item-cost">${isUnlocked ? (isEquipped ? '✅ Đang mặc' : '👆 Chọn') : '🔒 ' + UNLOCK_COST + ' vải'}</span>
    `;

    card.onclick = () => handleItemClick(item, isUnlocked, isEquipped);
    grid.appendChild(card);
  });
}

function handleItemClick(item, isUnlocked, isEquipped) {
  if (!isUnlocked) {
    // Try to unlock
    if (gameData.fabric >= UNLOCK_COST) {
      gameData.fabric -= UNLOCK_COST;
      gameData.unlocked.push(item.id);
      saveData();
      document.getElementById('wardrobe-fabric').textContent = gameData.fabric;
      renderItems();
      renderEquipped();
    } else {
      // Not enough fabric - flash
      const badge = document.querySelector('.fabric-badge');
      badge.style.background = 'rgba(244,67,54,0.5)';
      setTimeout(() => { badge.style.background = 'rgba(255,255,255,0.2)'; }, 500);
    }
  } else if (isEquipped) {
    // Unequip
    delete gameData.equipped[item.category];
    saveData();
    renderItems();
    renderEquipped();
  } else {
    // Equip
    gameData.equipped[item.category] = item.id;
    saveData();
    renderItems();
    renderEquipped();
  }
}

function renderEquipped() {
  const container = document.getElementById('equipped-items');
  container.innerHTML = '';

  const equippedCount = Object.keys(gameData.equipped).length;
  if (equippedCount === 0) {
    container.innerHTML = '<span style="color:rgba(255,255,255,0.5); font-size:0.9rem;">Chưa mặc gì...</span>';
    return;
  }

  // Show in order: hat, top, bottom, shoes, accessory
  ['hat', 'top', 'bottom', 'shoes', 'accessory'].forEach(cat => {
    const itemId = gameData.equipped[cat];
    if (itemId) {
      const item = ITEMS.find(i => i.id === itemId);
      if (item) {
        const el = document.createElement('span');
        el.className = 'equipped-item';
        el.textContent = item.emoji;
        el.title = item.name;
        container.appendChild(el);
      }
    }
  });
}

// ========== CATWALK ==========
function showCatwalk() {
  showScreen('catwalk-screen');

  // Build model display
  const modelDiv = document.getElementById('model-display');
  const equippedItems = [];
  ['hat', 'top', 'bottom', 'shoes', 'accessory'].forEach(cat => {
    const itemId = gameData.equipped[cat];
    if (itemId) {
      const item = ITEMS.find(i => i.id === itemId);
      if (item) equippedItems.push(item.emoji);
    }
  });

  modelDiv.textContent = equippedItems.length > 0 ? equippedItems.join(' ') : '🧍';

  // Calculate score
  const equippedCount = Object.keys(gameData.equipped).length;
  const baseScore = equippedCount * 20; // max 100 from 5 categories

  // Judge scores
  const judges = [
    { emoji: '👩‍🎨', name: 'Cô Hoa' },
    { emoji: '🧑‍💼', name: 'Chú Minh' },
    { emoji: '👵', name: 'Bà Lan' }
  ];

  const judgesDiv = document.getElementById('judges');
  judgesDiv.innerHTML = '';

  let totalScore = 0;
  judges.forEach(judge => {
    // Each judge gives score based on equipped items + small random
    const jScore = Math.min(100, baseScore + Math.floor(Math.random() * 10));
    totalScore += jScore;

    const el = document.createElement('div');
    el.className = 'judge';
    el.innerHTML = `
      <span class="judge-emoji">${judge.emoji}</span>
      <span class="judge-score">${jScore}</span>
    `;
    judgesDiv.appendChild(el);
  });

  const finalScore = Math.round(totalScore / 3);
  document.getElementById('catwalk-score').textContent = finalScore;

  // Detail
  const detail = document.getElementById('catwalk-detail');
  detail.innerHTML = `
    👗 Trang phục: ${equippedCount}/5 món<br>
    🧵 Vải còn: ${gameData.fabric}<br>
    👕 Đã mở khóa: ${gameData.unlocked.length}/15
  `;

  // Sparkles
  spawnSparkles();
  saveSession();
}

function spawnSparkles() {
  const container = document.getElementById('sparkles');
  container.innerHTML = '';
  const sparkleEmojis = ['✨', '⭐', '💫', '🌟', '💖'];
  for (let i = 0; i < 15; i++) {
    const el = document.createElement('div');
    el.className = 'sparkle';
    el.textContent = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
    el.style.left = Math.random() * 100 + '%';
    el.style.top = Math.random() * 100 + '%';
    el.style.animationDelay = (Math.random() * 3) + 's';
    container.appendChild(el);
  }
}

// ========== SESSION ==========
async function saveSession() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    if (!profile.id) return;
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: profile.id,
        subject: 'mixed',
        difficulty: 'easy',
        score: fabricEarned * 10,
        total_questions: totalAnswered || Object.keys(gameData.equipped).length,
        correct_answers: totalCorrect || Object.keys(gameData.equipped).length,
        stars_earned: Math.floor((totalCorrect || 0) / 3),
        combo_max: Object.keys(gameData.equipped).length,
        mode: 'v39'
      })
    });
  } catch(e) {}
}

// ========== INIT ==========
function init() {
  loadData();
  updateStartScreen();

  document.getElementById('btn-start').onclick = startQuiz;
  document.getElementById('btn-wardrobe').onclick = showWardrobe;
  document.getElementById('btn-catwalk').onclick = showCatwalk;
  document.getElementById('btn-back-start').onclick = () => {
    showScreen('start-screen');
    updateStartScreen();
  };
  document.getElementById('btn-back-wardrobe').onclick = showWardrobe;
}

// ========== CHARACTER SYSTEM INTEGRATION (presentation only) ==========
// Additive layer: mounts animated chibi fashion sprites where emoji used to
// stand, wires the guide + styled exit modals, and adds vector particles.
// It wraps the inner presentation functions non-invasively — no game logic
// is rewritten.
let wardrobeChar = null;
let runwayChar = null;

function mountWardrobeModel() {
  const host = document.getElementById('char-body');
  if (!host) return;
  host.innerHTML = '';
  wardrobeChar = null;
  const C = window.HocVuiCharacters;
  if (C && C.hasSpecies('fashionista')) {
    wardrobeChar = C.createCharacter('fashionista', host, { state: 'idle' });
  } else {
    host.textContent = '🧍';
  }
}

function mountRunwayModel() {
  const host = document.getElementById('runway-model');
  if (!host) return;
  host.innerHTML = '';
  runwayChar = null;
  const C = window.HocVuiCharacters;
  if (C && C.hasSpecies('fashionista')) {
    runwayChar = C.createCharacter('fashionista', host, { state: 'happy' });
  } else {
    host.textContent = '🧍';
  }
}

// Vector particle helpers — sparkle burst + confetti rain on the runway.
function spawnParticles(parent, kind, count) {
  if (!parent) return;
  for (let i = 0; i < (count || 8); i++) {
    const p = document.createElement('span');
    p.className = 'pfx pfx-' + kind;
    p.style.setProperty('--tx', (Math.random() * 80 - 40) + 'px');
    p.style.setProperty('--ty', -(Math.random() * 50 + 25) + 'px');
    p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
    parent.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

function spawnConfetti(parent, count) {
  if (!parent) return;
  const colors = ['#ff6ec4', '#ffd700', '#7873f5', '#e040fb', '#4caf50'];
  for (let i = 0; i < (count || 18); i++) {
    const p = document.createElement('span');
    p.className = 'pfx pfx-confetti';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
    p.style.setProperty('--dur', (1.1 + Math.random() * 0.9) + 's');
    p.style.setProperty('--delay', (Math.random() * 0.4) + 's');
    parent.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

// Wrap showWardrobe — mount the idle model after the screen renders.
const _origShowWardrobe = showWardrobe;
showWardrobe = function () {
  const r = _origShowWardrobe.apply(this, arguments);
  mountWardrobeModel();
  return r;
};

// Wrap showCatwalk — mount the strutting model + celebratory particles.
const _origShowCatwalk = showCatwalk;
showCatwalk = function () {
  const r = _origShowCatwalk.apply(this, arguments);
  mountRunwayModel();
  if (runwayChar) {
    runwayChar.setState('happy');
    const stage = document.querySelector('#catwalk-screen .runway');
    if (stage) { spawnParticles(stage, 'sparkle', 10); spawnConfetti(stage, 20); }
  }
  return r;
};

// Wrap handleItemClick — happy bounce when the wardrobe model gets dressed.
const _origHandleItemClick = handleItemClick;
handleItemClick = function () {
  const r = _origHandleItemClick.apply(this, arguments);
  if (wardrobeChar) {
    wardrobeChar.setState('happy');
    const host = document.getElementById('char-body');
    if (host) spawnParticles(host, 'sparkle', 5);
    setTimeout(() => { if (wardrobeChar) wardrobeChar.setState('idle'); }, 650);
  }
  return r;
};

// Guide + styled exit modals (no window.confirm).
(function () {
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
      const close = $('btn-guide-close');
      if (close) close.addEventListener('click', () => { guide.style.display = 'none'; });
      guide.addEventListener('click', e => { if (e.target === guide) guide.style.display = 'none'; });
    }
    const exit = $('exit-modal');
    const exitBtn = $('btn-exit');
    if (exit && exitBtn) {
      exitBtn.addEventListener('click', () => { exit.style.display = 'flex'; });
      const cancel = $('btn-exit-cancel');
      if (cancel) cancel.addEventListener('click', () => { exit.style.display = 'none'; });
      const confirm = $('btn-exit-confirm');
      if (confirm) confirm.addEventListener('click', () => {
        exit.style.display = 'none';
        try { clearInterval(timer); } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();

init();

})();
