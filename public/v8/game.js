// V8 Xây Lâu Đài - Castle Builder
// Cooperative/Solo/Versus quiz game with block stacking

const THEMES = [
  { id: 'wood', name: 'Nhà Gỗ', icon: '🏠', unlock: 0, blocks: [ '🕷️', '🦂', '🐍', '🦎', '🐲', '🐉', '🦖', '🦕'], milestones: ['🌸','🌷','🌺','🏡'] },
  { id: 'stone', name: 'Lâu Đài Đá', icon: '🏰', unlock: 3, blocks: ['🧱','🔱', '💎', '🧨', '🎱', '🪓'], milestones: ['🏳️','⚔️','👑','🏰'] },
  { id: 'tree', name: 'Nhà Trên Cây', icon: '🌳', unlock: 6, blocks: ['🌿','🍃','🌻','🌹','🍄','🌲'], milestones: ['🐦','🦜','🌺','🌳'] },
  { id: 'space', name: 'Tháp Không Gian', icon: '🚀', unlock: 10, blocks: ['🔩','⚙️','🛸','🌟','🔩','⚙️'], milestones: ['🛰️','🌙','⭐','🚀'] },
  { id: 'candy', name: 'Nhà Kẹo', icon: '🍭', unlock: 15, blocks: ['🍫','🍪','🧁','🎂','🍫','🍪'], milestones: ['🍬','🍩','🎂','🍭'] },
];

const EARTHQUAKE_CHANCE = 0.08; // 8% mỗi câu
const TIMER_SECONDS = 12;

// ===== STATE =====
const State = {
  config: { mode: 'solo', theme: 'wood', subject: 'math', difficulty: 'easy' },
  gamesPlayed: 0,
  towerHeight: 0,
  maxHeight: 0,
  combo: 0,
  stats: { correct: 0, incorrect: 0, earthquakes: 0 },
  questions: [],
  questionIndex: 0,
  currentPlayer: 0, // for coop/versus
  players: [{ name: 'Bạn', score: 0 }],
  gameOver: false,
};

// Load progress
function loadProgress() {
  try {
    const data = JSON.parse(localStorage.getItem('v8_progress') || '{}');
    State.gamesPlayed = data.gamesPlayed || 0;
  } catch { State.gamesPlayed = 0; }
}

function saveProgress() {
  const data = { gamesPlayed: State.gamesPlayed };
  localStorage.setItem('v8_progress', JSON.stringify(data));
}

loadProgress();

// ===== SETUP =====
function renderThemes() {
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = THEMES.map(t => {
    const unlocked = State.gamesPlayed >= t.unlock;
    return `<div class="theme-card ${t.id === State.config.theme ? 'active' : ''} ${!unlocked ? 'locked' : ''}" data-theme="${t.id}" ${!unlocked ? 'title="Chơi thêm để mở khoá"' : ''}>
      <span class="theme-icon">${t.icon}</span>
      <span class="theme-name">${t.name}</span>
      ${!unlocked ? `<span class="theme-lock">🔒 ${t.unlock} ván</span>` : ''}
    </div>`;
  }).join('');
}
renderThemes();

document.getElementById('theme-grid').addEventListener('click', e => {
  const card = e.target.closest('.theme-card');
  if (!card || card.classList.contains('locked')) return;
  document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
  card.classList.add('active');
  State.config.theme = card.dataset.theme;
});

document.getElementById('mode-group').addEventListener('click', e => {
  const btn = e.target.closest('.btn-option');
  if (!btn) return;
  document.querySelectorAll('#mode-group .btn-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  State.config.mode = btn.dataset.mode;
});

document.getElementById('subject-group').addEventListener('click', e => {
  const btn = e.target.closest('.btn-option');
  if (!btn) return;
  document.querySelectorAll('#subject-group .btn-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  State.config.subject = btn.dataset.subject;
});

document.getElementById('difficulty-group').addEventListener('click', e => {
  const btn = e.target.closest('.btn-option');
  if (!btn) return;
  document.querySelectorAll('#difficulty-group .btn-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  State.config.difficulty = btn.dataset.difficulty;
});

document.getElementById('btn-start').addEventListener('click', startGame);

// ===== GAME =====
async function startGame() {
  State.towerHeight = 0;
  State.maxHeight = 0;
  State.combo = 0;
  State.stats = { correct: 0, incorrect: 0, earthquakes: 0 };
  State.gameOver = false;
  State.questionIndex = 0;

  if (State.config.mode === 'versus') {
    State.players = [{ name: 'P1', score: 0 }, { name: 'P2', score: 0 }];
    State.currentPlayer = 0;
  } else if (State.config.mode === 'coop') {
    State.players = [{ name: 'P1', score: 0 }, { name: 'P2', score: 0 }];
    State.currentPlayer = 0;
  } else {
    State.players = [{ name: 'Bạn', score: 0 }];
    State.currentPlayer = 0;
  }

  await fetchQuestions();
  showScreen('game-screen');

  const area = document.getElementById('castle-area');
  area.className = `castle-area theme-${State.config.theme}`;
  document.getElementById('castle-tower').innerHTML = '';
  updateGameInfo();
  nextQuestion();
}

async function fetchQuestions() {
  const { subject, difficulty } = State.config;
  try {
    let qs;
    if (subject === 'mix') {
      const [m, v] = await Promise.all([
        fetch(`/api/questions?subject=math&difficulty=${difficulty}&limit=25`).then(r => r.json()),
        fetch(`/api/questions?subject=vietnamese&difficulty=${difficulty}&limit=25`).then(r => r.json()),
      ]);
      qs = [...m, ...v];
    } else {
      qs = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=50`).then(r => r.json());
    }
    State.questions = Array.isArray(qs) && qs.length > 0 ? shuffle(qs) : fallbackQs(40);
  } catch { State.questions = fallbackQs(40); }
}

function getQuestion() {
  if (State.questionIndex >= State.questions.length) {
    State.questions = [...State.questions, ...fallbackQs(20)];
  }
  return State.questions[State.questionIndex++];
}

function fallbackQs(n) {
  const qs = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor(Math.random() * 50) + 1, b = Math.floor(Math.random() * 50) + 1;
    const c = a + b;
    const opts = shuffle([c, c+1, c-1, c+2]);
    qs.push({ id: 8000+i, question_text: `${a} + ${b} = ?`, option_a: String(opts[0]), option_b: String(opts[1]), option_c: String(opts[2]), option_d: String(opts[3]), correct_answer: 'abcd'[opts.indexOf(c)] });
  }
  return qs;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// ===== QUESTION FLOW =====
let timerId = null;

function nextQuestion() {
  if (State.gameOver) return;

  // Earthquake random check
  if (State.towerHeight > 3 && Math.random() < EARTHQUAKE_CHANCE) {
    triggerEarthquake();
    return;
  }

  const q = getQuestion();
  const player = State.players[State.currentPlayer];
  document.getElementById('q-text').textContent = q.question_text;
  document.getElementById('status-text').textContent = State.config.mode !== 'solo' ? `🎮 ${player.name}` : '';

  const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
  const btns = document.querySelectorAll('#answer-grid .ans-btn');
  btns.forEach((btn, i) => {
    btn.textContent = `${'ABCD'[i]}. ${opts[i]}`;
    btn.className = 'ans-btn';
    btn.disabled = false;
    btn.dataset.opt = 'abcd'[i];
  });

  State._q = q;
  startTimer();
}

function startTimer() {
  clearInterval(timerId);
  const bar = document.getElementById('timer-bar');
  bar.style.width = '100%';
  bar.className = 'timer-bar';
  const start = Date.now();
  timerId = setInterval(() => {
    const elapsed = (Date.now() - start) / 1000;
    const pct = Math.max(0, 1 - elapsed / TIMER_SECONDS);
    bar.style.width = (pct * 100) + '%';
    if (pct <= 0.2) bar.className = 'timer-bar danger';
    else if (pct <= 0.5) bar.className = 'timer-bar warn';
    if (elapsed >= TIMER_SECONDS) {
      clearInterval(timerId);
      handleTimeout();
    }
  }, 100);
}

function handleTimeout() {
  document.querySelectorAll('#answer-grid .ans-btn').forEach(b => b.disabled = true);
  document.getElementById('status-text').textContent = '⏰ Hết giờ!';
  State.combo = 0;
  // Remove top block
  removeTopBlock();
  setTimeout(() => advanceTurn(), 1000);
}

// ===== ANSWER =====
document.getElementById('answer-grid').addEventListener('click', e => {
  const btn = e.target.closest('.ans-btn');
  if (!btn || btn.disabled || State.gameOver) return;
  clearInterval(timerId);

  const q = State._q;
  const isCorrect = btn.dataset.opt === q.correct_answer;
  document.querySelectorAll('#answer-grid .ans-btn').forEach(b => b.disabled = true);
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    const cb = document.querySelector(`#answer-grid .ans-btn[data-opt="${q.correct_answer}"]`);
    if (cb) cb.classList.add('correct');
  }

  if (isCorrect) {
    State.stats.correct++;
    State.combo++;
    State.players[State.currentPlayer].score++;
    addBlock();
    document.getElementById('status-text').textContent = State.combo >= 3 ? `🔥 Combo x${State.combo}!` : '✅ Đúng!';
    // Combo bonus: extra block at x5
    if (State.combo % 5 === 0 && State.combo > 0) {
      setTimeout(() => addBlock(), 300);
      document.getElementById('status-text').textContent = `🔥🔥 Combo x${State.combo}! +2 gạch!`;
    }
  } else {
    State.stats.incorrect++;
    State.combo = 0;
    removeTopBlock();
    document.getElementById('status-text').textContent = '❌ Sai! Mất 1 gạch!';
  }

  updateGameInfo();
  setTimeout(() => advanceTurn(), 1000);
});

function advanceTurn() {
  if (State.gameOver) return;
  // Versus: check if one player hit 20
  if (State.config.mode === 'versus') {
    if (State.players.some(p => p.score >= 20)) {
      endGame();
      return;
    }
  }
  // Coop/Solo: game over when tower falls to 0 after reaching 5+, or reaches 30
  if (State.towerHeight >= 30) { endGame(); return; }

  if (State.config.mode !== 'solo') {
    State.currentPlayer = (State.currentPlayer + 1) % State.players.length;
  }
  nextQuestion();
}

// ===== CASTLE BLOCKS =====
function addBlock() {
  const theme = THEMES.find(t => t.id === State.config.theme);
  const blocks = theme.blocks;
  const emoji = blocks[Math.floor(Math.random() * blocks.length)];

  State.towerHeight++;
  State.maxHeight = Math.max(State.maxHeight, State.towerHeight);

  const tower = document.getElementById('castle-tower');
  const block = document.createElement('div');
  block.className = 'castle-block';
  block.style.background = getBlockColor(State.towerHeight);
  // Fill block with repeating emojis
  block.textContent = emoji.repeat(8);
  block.dataset.level = State.towerHeight;

  // Milestone every 5 blocks
  if (State.towerHeight % 5 === 0) {
    const milestones = theme.milestones;
    const badge = document.createElement('span');
    badge.className = 'milestone-badge';
    badge.textContent = milestones[Math.min(Math.floor(State.towerHeight / 5) - 1, milestones.length - 1)];
    block.appendChild(badge);
  }

  tower.appendChild(block);
  const area = document.getElementById('castle-area');
  area.scrollTop = 0;
}

function removeTopBlock() {
  if (State.towerHeight <= 0) return;
  const tower = document.getElementById('castle-tower');
  const last = tower.lastElementChild;
  if (last) {
    last.classList.add('fall');
    setTimeout(() => last.remove(), 500);
  }
  State.towerHeight = Math.max(0, State.towerHeight - 1);
}

function getBlockColor(height) {
  // Warm gradient from bottom (earth tones) to top (sky tones)
  const warmColors = [
    '#f8d7a4', '#f5c78e', '#f2b878', '#efaa63', '#edb35b',
    '#f0c27f', '#fce38a', '#a8e6cf', '#dcedc1', '#ffd3b6',
    '#ffaaa5', '#ff8b94', '#b5ead7', '#c7ceea', '#e2f0cb',
    '#ffdac1', '#e8d5b7', '#b8e994', '#78e08f', '#38ada9',
  ];
  return warmColors[(height - 1) % warmColors.length];
}

// ===== EARTHQUAKE =====
function triggerEarthquake() {
  State.stats.earthquakes++;
  const tower = document.getElementById('castle-tower');
  // Shake all blocks
  tower.querySelectorAll('.castle-block').forEach(b => b.classList.add('shake'));

  document.getElementById('q-text').textContent = '🌋 ĐỘNG ĐẤT!';
  document.getElementById('status-text').textContent = 'Mất 2 tầng!';
  document.querySelectorAll('#answer-grid .ans-btn').forEach(b => b.disabled = true);

  setTimeout(() => {
    removeTopBlock();
    setTimeout(() => removeTopBlock(), 200);
    tower.querySelectorAll('.castle-block').forEach(b => b.classList.remove('shake'));
    updateGameInfo();
    setTimeout(() => advanceTurn(), 800);
  }, 1000);
}

// ===== GAME INFO =====
function updateGameInfo() {
  const info = document.getElementById('game-info');
  const theme = THEMES.find(t => t.id === State.config.theme);
  info.innerHTML = `<span>${theme.icon} ${State.towerHeight} tầng</span><span>🔥 x${State.combo}</span><span>✅ ${State.stats.correct}</span>`;
}

// ===== END GAME =====
function endGame() {
  State.gameOver = true;
  clearInterval(timerId);
  State.gamesPlayed++;
  saveProgress();

  showScreen('result-screen');
  const container = document.getElementById('result-container');

  let winnerText = '';
  if (State.config.mode === 'versus') {
    const winner = State.players[0].score >= State.players[1].score ? State.players[0] : State.players[1];
    winnerText = `<div class="result-height">${winner.name} thắng! (${winner.score} điểm)</div>`;
  } else {
    winnerText = `<div class="result-height">Cao nhất: ${State.maxHeight} tầng!</div>`;
  }

  container.innerHTML = `
    <div class="result-trophy">🏰</div>
    <div class="result-title">Hoàn thành!</div>
    ${winnerText}
    <div class="result-stats">
      <div class="result-stat"><span>✅ Đúng</span><span>${State.stats.correct}</span></div>
      <div class="result-stat"><span>❌ Sai</span><span>${State.stats.incorrect}</span></div>
      <div class="result-stat"><span>🌋 Động đất</span><span>${State.stats.earthquakes}</span></div>
      <div class="result-stat"><span>🏆 Tổng ván đã chơi</span><span>${State.gamesPlayed}</span></div>
    </div>
    <div class="result-btns">
      <button class="result-btn again" onclick="location.reload()">🔄 Chơi lại</button>
      <button class="result-btn home" onclick="location.href='/'">🏠 Về trang chủ</button>
    </div>
  `;
}

// ===== EXIT =====
document.getElementById('btn-exit').addEventListener('click', () => document.getElementById('exit-overlay').classList.add('active'));
document.getElementById('exit-cancel').addEventListener('click', () => document.getElementById('exit-overlay').classList.remove('active'));
document.getElementById('exit-confirm').addEventListener('click', () => { window.location.href = '/'; });

// ===== SCREEN =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// TTS speak button
document.getElementById('btn-speak-v8')?.addEventListener('click', () => {
  const q = State._q;
  if (!q) return;
  window.ttsSpeakQuestion(q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, State.config?.subject);
});
