// V36 - Thợ Lặn Kho Báu (Treasure Diver)
(function() {
'use strict';

const STORAGE_KEY = 'v36_diver';
const GRID_SIZE = 25;
const TIMER_SECONDS = 10;

// Grid distribution: 10 coin, 5 diamond, 4 map, 6 bomb = 25
const TILE_TYPES = {
  coin: { emoji: '💰', count: 10, points: 10, label: 'Xu' },
  diamond: { emoji: '💎', count: 5, points: 30, label: 'Kim cương' },
  map: { emoji: '🗺️', count: 4, points: 20, label: 'Mảnh bản đồ' },
  bomb: { emoji: '💣', count: 6, points: -1, label: 'Bom' }
};

const TREASURE_BONUS = 100;

let highScore = 0;
let questions = [];
let questionIndex = 0;
let grid = [];
let lives = 3;
let coins = 0;
let mapPieces = 0;
let tilesRevealed = 0;
let totalCorrect = 0;
let totalAnswered = 0;
let selectedTile = null;
let timer = null;
let timeLeft = 0;
let gameActive = false;

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      highScore = data.highScore || 0;
    }
  } catch(e) {}
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ highScore }));
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateGrid() {
  const tiles = [];
  Object.entries(TILE_TYPES).forEach(([type, config]) => {
    for (let i = 0; i < config.count; i++) {
      tiles.push({ type, emoji: config.emoji, points: config.points });
    }
  });
  return shuffleArray(tiles);
}

// ========== INIT ==========
function init() {
  loadData();
  document.getElementById('high-score').textContent = highScore;
  document.getElementById('btn-start').onclick = startGame;
  document.getElementById('btn-replay').onclick = startGame;
  createBubbles();
}

function createBubbles() {
  for (let i = 0; i < 8; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const size = 10 + Math.random() * 30;
    bubble.style.width = size + 'px';
    bubble.style.height = size + 'px';
    bubble.style.left = Math.random() * 100 + '%';
    bubble.style.animationDuration = (5 + Math.random() * 8) + 's';
    bubble.style.animationDelay = (Math.random() * 5) + 's';
    document.body.appendChild(bubble);
  }
}

async function startGame() {
  try {
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const grade = profile.grade || 2;
    const subjects = ['math', 'vietnamese', 'english'];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=${GRID_SIZE}&grade=${grade}`);
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
  grid = generateGrid();
  lives = 3;
  coins = 0;
  mapPieces = 0;
  tilesRevealed = 0;
  totalCorrect = 0;
  totalAnswered = 0;
  questionIndex = 0;
  selectedTile = null;
  gameActive = true;

  showScreen('game-screen');
  updateUI();
  renderGrid();
  hideQuestionBox();
}

function updateUI() {
  document.getElementById('lives').textContent = lives;
  document.getElementById('coins').textContent = coins;
  document.getElementById('map-count').textContent = mapPieces;

  const chest = document.getElementById('treasure-chest');
  if (mapPieces >= 4) {
    chest.classList.add('found');
    chest.querySelector('.chest-icon').textContent = '🎁';
    chest.querySelector('.chest-label').textContent = 'Kho báu đã mở! +100 xu!';
  } else {
    chest.classList.remove('found');
    chest.querySelector('.chest-icon').textContent = '🧳';
    chest.querySelector('.chest-label').textContent = `Tìm ${4 - mapPieces} mảnh bản đồ nữa!`;
  }
}

function renderGrid() {
  const gridDiv = document.getElementById('dive-grid');
  gridDiv.innerHTML = '';

  grid.forEach((tile, index) => {
    const el = document.createElement('div');
    el.className = 'grid-tile';
    el.dataset.index = index;
    if (tile.revealed) {
      el.classList.add('revealed', `tile-${tile.type}`);
      el.textContent = tile.emoji;
      el.style.setProperty('--content', `"${tile.emoji}"`);
    }
    el.onclick = () => selectTile(index);
    gridDiv.appendChild(el);
  });
}

function selectTile(index) {
  if (!gameActive) return;
  if (grid[index].revealed) return;
  if (selectedTile !== null) return; // Already answering

  selectedTile = index;

  // Highlight selected tile
  const tiles = document.querySelectorAll('.grid-tile');
  tiles.forEach(t => t.classList.remove('selected'));
  tiles[index].classList.add('selected');

  // Show question
  showQuestion();
}

function showQuestion() {
  if (questionIndex >= questions.length) {
    // Ran out of questions - end game
    endGame();
    return;
  }

  const q = questions[questionIndex];
  const qBox = document.getElementById('question-box');
  qBox.style.display = 'block';

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

  // Highlight answers
  const q = questions[questionIndex];
  btns.forEach(b => {
    const correctText = q[`option_${correct.toLowerCase()}`];
    if (b.textContent === correctText) b.classList.add('correct');
    if (!isCorrect && b.textContent === q[`option_${selected.toLowerCase()}`]) b.classList.add('wrong');
  });

  questionIndex++;

  if (isCorrect) {
    totalCorrect++;
    setTimeout(() => revealTile(), 800);
  } else {
    setTimeout(() => {
      // Wrong answer - tile stays hidden, deselect
      deselectTile();
      hideQuestionBox();
    }, 800);
  }
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

  setTimeout(() => {
    deselectTile();
    hideQuestionBox();
  }, 800);
}

function revealTile() {
  if (selectedTile === null) return;

  const tile = grid[selectedTile];
  tile.revealed = true;
  tilesRevealed++;

  // Update grid visual
  const tileEl = document.querySelectorAll('.grid-tile')[selectedTile];
  tileEl.classList.add('revealed', `tile-${tile.type}`);
  tileEl.classList.remove('selected');
  tileEl.textContent = tile.emoji;

  // Process tile effect
  switch (tile.type) {
    case 'coin':
      coins += tile.points;
      break;
    case 'diamond':
      coins += tile.points;
      showExplosion('💎');
      break;
    case 'map':
      mapPieces++;
      coins += tile.points;
      showExplosion('🗺️');
      if (mapPieces >= 4) {
        coins += TREASURE_BONUS;
        setTimeout(() => showExplosion('🎁'), 300);
      }
      break;
    case 'bomb':
      lives--;
      showExplosion('💥');
      break;
  }

  updateUI();
  deselectTile();
  hideQuestionBox();

  // Check end conditions
  if (lives <= 0) {
    gameActive = false;
    setTimeout(() => endGame(), 800);
  } else if (tilesRevealed >= GRID_SIZE) {
    gameActive = false;
    setTimeout(() => endGame(), 800);
  }
}

function deselectTile() {
  if (selectedTile !== null) {
    const tiles = document.querySelectorAll('.grid-tile');
    tiles[selectedTile].classList.remove('selected');
  }
  selectedTile = null;
}

function hideQuestionBox() {
  document.getElementById('question-box').style.display = 'none';
}

function showExplosion(emoji) {
  const el = document.createElement('div');
  el.className = 'explosion';
  el.textContent = emoji;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 800);
}

function startTimer() {
  clearInterval(timer);
  timeLeft = TIMER_SECONDS;
  const fill = document.getElementById('timer-fill');
  fill.style.width = '100%';
  fill.classList.remove('warning');

  timer = setInterval(() => {
    timeLeft -= 0.1;
    const pct = (timeLeft / TIMER_SECONDS) * 100;
    fill.style.width = pct + '%';
    if (timeLeft <= 3) fill.classList.add('warning');
    if (timeLeft <= 0) {
      clearInterval(timer);
      handleTimeout();
    }
  }, 100);
}

function endGame() {
  clearInterval(timer);
  gameActive = false;
  showScreen('result-screen');

  document.getElementById('result-score').textContent = coins;

  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const treasureFound = mapPieces >= 4;

  if (coins > highScore) {
    highScore = coins;
    saveData();
    document.getElementById('result-title').textContent = '🎉 Kỷ Lục Mới!';
  } else {
    document.getElementById('result-title').textContent = treasureFound ? '🎁 Tìm Được Kho Báu!' : '🤿 Kết Quả!';
  }

  document.getElementById('result-detail').innerHTML = `
    ✅ Đúng: ${totalCorrect}/${totalAnswered} (${accuracy}%)<br>
    🗺️ Bản đồ: ${mapPieces}/4 ${treasureFound ? '✅' : ''}<br>
    💣 Bom trúng: ${3 - lives}<br>
    📦 Ô đã lật: ${tilesRevealed}/${GRID_SIZE}<br>
    🏆 Kỷ lục: ${highScore} xu
  `;

  spawnConfetti();
  saveSession();

  if (typeof checkAndShowPrompt === 'function') {
    checkAndShowPrompt();
  }
}

function spawnConfetti() {
  const container = document.getElementById('confetti');
  container.innerHTML = '';
  const colors = ['#00b4d8', '#48cae4', '#90e0ef', '#ffd60a', '#a855f7', '#22c55e'];
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
        score: coins,
        total_questions: totalAnswered,
        correct_answers: totalCorrect,
        stars_earned: Math.floor(totalCorrect / 3),
        combo_max: mapPieces,
        mode: 'v36'
      })
    });
  } catch(e) {}
}

// ===== CHARACTER SYSTEM INTEGRATION (presentation only) =====
let diverChar = null;
let chestChar = null;

function mountDiver() {
  const host = document.getElementById('start-diver');
  if (!host) return;
  host.innerHTML = '';
  diverChar = null;
  const C = window.HocVuiCharacters;
  if (C && C.hasSpecies('diver')) {
    diverChar = C.createCharacter('diver', host, { state: 'idle' });
  } else {
    host.textContent = '🤿';
  }
}

function mountChest() {
  const host = document.getElementById('chest-sprite');
  if (!host) return;
  host.innerHTML = '';
  chestChar = null;
  const C = window.HocVuiCharacters;
  const iconEl = document.querySelector('#treasure-chest .chest-icon');
  if (C && C.hasSpecies('chest')) {
    chestChar = C.createCharacter('chest', host, { state: 'idle' });
    if (iconEl) iconEl.style.display = 'none';
  } else {
    if (iconEl) iconEl.style.display = '';
  }
}

// Sparkle particle helper — bursts around an element on a happy moment.
function diverSpawnSparkles(parent, count) {
  if (!parent) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'pfx pfx-sparkle';
    p.style.setProperty('--tx', (Math.random() * 70 - 35) + 'px');
    p.style.setProperty('--ty', -(Math.random() * 40 + 20) + 'px');
    p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
    parent.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

// Confetti burst around an element (used when the treasure is unlocked).
function diverSpawnConfetti(parent, count) {
  if (!parent) return;
  const colors = ['#ffd60a', '#00b4d8', '#48cae4', '#90e0ef', '#a855f7', '#22c55e'];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'pfx pfx-confetti';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.setProperty('--tx', (Math.random() * 120 - 60) + 'px');
    p.style.setProperty('--ty', (Math.random() * 60 + 30) + 'px');
    p.style.setProperty('--delay', (Math.random() * 0.2) + 's');
    parent.appendChild(p);
    p.addEventListener('animationend', () => p.remove(), { once: true });
  }
}

// Wrap startGame to mount the chest mascot for each new game (presentation).
const __origStartGame = startGame;
startGame = async function () {
  const r = await __origStartGame.apply(this, arguments);
  mountChest();
  return r;
};

// Wrap updateUI to sync the chest mascot state with map progress.
const __origUpdateUI = updateUI;
updateUI = function () {
  const r = __origUpdateUI.apply(this, arguments);
  if (chestChar) chestChar.setState(mapPieces >= 4 ? 'happy' : 'idle');
  return r;
};

// Wrap handleAnswer to celebrate a correct answer on the diver sprite.
const __origHandleAnswer = handleAnswer;
handleAnswer = function (selected, correct) {
  const wasCorrect = String(selected).toLowerCase() === String(correct).toLowerCase();
  const r = __origHandleAnswer.apply(this, arguments);
  if (wasCorrect) {
    if (diverChar) {
      diverChar.setState('happy');
      setTimeout(() => { if (diverChar) diverChar.setState('idle'); }, 700);
    }
    const startDiver = document.getElementById('start-diver');
    if (startDiver) diverSpawnSparkles(startDiver, 6);
  }
  return r;
};

// Wrap revealTile to sparkle on the revealed tile, and confetti on treasure.
const __origRevealTile = revealTile;
revealTile = function () {
  const idx = selectedTile;
  const beforeMap = mapPieces;
  const r = __origRevealTile.apply(this, arguments);
  if (idx !== null) {
    const tileEl = document.querySelectorAll('.grid-tile')[idx];
    if (tileEl) diverSpawnSparkles(tileEl, 5);
  }
  // Treasure just completed → celebrate on the chest.
  if (beforeMap < 4 && mapPieces >= 4) {
    if (chestChar) {
      chestChar.setState('happy');
    }
    const chestHost = document.getElementById('treasure-chest');
    if (chestHost) diverSpawnConfetti(chestHost, 14);
  }
  return r;
};

// Modals (guide + exit) ---------------------------------------------------
function setupModals() {
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
      // Stop timers/loops before leaving.
      try { clearInterval(timer); } catch (e) {}
      gameActive = false;
      window.location.reload();
    });
    exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
  }
}

init();
mountDiver();
setupModals();

})();
