// ===== TỈ PHÚ TRÍ TUỆ - Game Engine (V11 - Rectangular Loop) =====

// --- Profile check ---
(function() {
  const profile = localStorage.getItem('hocvui_profile');
  if (!profile) {
    window.location.href = '/home.html';
  }
})();

// --- Board data (34 cells, full 8x11 rectangular loop) ---
const BOARD = [
  // Top row (left to right): 0-7
  { id: 0, type: 'start', name: 'Xuất phát', icon: '🏠', price: 0, rent: 0 },
  { id: 1, type: 'land', name: 'Hà Nội', icon: '🏙️', price: 300, rent: 60 },
  { id: 2, type: 'quiz', name: 'Câu hỏi', icon: '❓', price: 0, rent: 0 },
  { id: 3, type: 'land', name: 'Hải Phòng', icon: '🌾', price: 200, rent: 40 },
  { id: 4, type: 'land', name: 'Ninh Bình', icon: '⛰️', price: 220, rent: 44 },
  { id: 5, type: 'lucky', name: 'Hộp quà', icon: '🎁', price: 0, rent: 0 },
  { id: 6, type: 'land', name: 'Huế', icon: '🏛️', price: 250, rent: 50 },
  { id: 7, type: 'land', name: 'Đà Nẵng', icon: '🏖️', price: 280, rent: 55 },
  // Right column (top to bottom): 8-16
  { id: 8, type: 'tax', name: 'Thuế', icon: '💰', price: 0, rent: 100 },
  { id: 9, type: 'land', name: 'Nha Trang', icon: '🌴', price: 260, rent: 50 },
  { id: 10, type: 'land', name: 'Quy Nhơn', icon: '🐟', price: 230, rent: 46 },
  { id: 11, type: 'quiz', name: 'Câu hỏi', icon: '❓', price: 0, rent: 0 },
  { id: 12, type: 'land', name: 'Đà Lạt', icon: '🌺', price: 270, rent: 55 },
  { id: 13, type: 'land', name: 'Buôn Ma Thuột', icon: '☕', price: 200, rent: 40 },
  { id: 14, type: 'lucky', name: 'Hộp quà', icon: '🎁', price: 0, rent: 0 },
  { id: 15, type: 'land', name: 'TP.HCM', icon: '🏙️', price: 350, rent: 70 },
  { id: 16, type: 'land', name: 'Vũng Tàu', icon: '🌊', price: 230, rent: 45 },
  // Bottom row (right to left): 17-24
  { id: 17, type: 'tax', name: 'Thuế', icon: '💰', price: 0, rent: 150 },
  { id: 18, type: 'land', name: 'Cần Thơ', icon: '🍜', price: 220, rent: 45 },
  { id: 19, type: 'land', name: 'Phú Quốc', icon: '🏝️', price: 300, rent: 60 },
  { id: 20, type: 'quiz', name: 'Câu hỏi', icon: '❓', price: 0, rent: 0 },
  { id: 21, type: 'land', name: 'Cà Mau', icon: '🦐', price: 180, rent: 36 },
  { id: 22, type: 'land', name: 'Rạch Giá', icon: '🐠', price: 190, rent: 38 },
  { id: 23, type: 'lucky', name: 'Hộp quà', icon: '🎁', price: 0, rent: 0 },
  { id: 24, type: 'land', name: 'Long An', icon: '🌻', price: 200, rent: 40 },
  // Left column (bottom to top): 25-33
  { id: 25, type: 'land', name: 'Hạ Long', icon: '🎋', price: 290, rent: 55 },
  { id: 26, type: 'land', name: 'Sapa', icon: '🌿', price: 240, rent: 48 },
  { id: 27, type: 'land', name: 'Hội An', icon: '🏺', price: 280, rent: 55 },
  { id: 28, type: 'tax', name: 'Thuế', icon: '💰', price: 0, rent: 120 },
  { id: 29, type: 'land', name: 'Mũi Né', icon: '🏄', price: 250, rent: 50 },
  { id: 30, type: 'land', name: 'Tây Ninh', icon: '⛩️', price: 210, rent: 42 },
  { id: 31, type: 'quiz', name: 'Câu hỏi', icon: '❓', price: 0, rent: 0 },
  { id: 32, type: 'land', name: 'Bắc Ninh', icon: '🏯', price: 230, rent: 46 },
  { id: 33, type: 'land', name: 'Thanh Hoá', icon: '🌾', price: 220, rent: 44 },
];

// Grid positions for 34 cells on 8 cols × 11 rows (full perimeter)
const GRID_POSITIONS = [
  // Top row: cells 0-7, row=1, col=1..8
  [1,1], [1,2], [1,3], [1,4], [1,5], [1,6], [1,7], [1,8],
  // Right column: cells 8-16, col=8, rows 2..10
  [2,8], [3,8], [4,8], [5,8], [6,8], [7,8], [8,8], [9,8], [10,8],
  // Bottom row: cells 17-24, row=11, cols 8..1
  [11,8], [11,7], [11,6], [11,5], [11,4], [11,3], [11,2], [11,1],
  // Left column: cells 25-33, col=1, rows 10..2
  [10,1], [9,1], [8,1], [7,1], [6,1], [5,1], [4,1], [3,1], [2,1],
];

const BOARD_SIZE = 34;

const LUCKY_EVENTS = [
  { text: '🎉 Trúng xổ số! +200 coin', amount: 200, type: 'gain' },
  { text: '💸 Phạt vi phạm! -100 coin', amount: -100, type: 'lose' },
  { text: '🎁 Quà sinh nhật! +150 coin', amount: 150, type: 'gain' },
  { text: '🏠 Nhận thừa kế! +1 đất miễn phí', amount: 0, type: 'free_land' },
  { text: '⚡ Sét đánh! Mất 1 đất', amount: 0, type: 'lose_land' },
];

const PLAYER_COLORS = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0'];

// --- 3D Dice dot patterns (positions 1-9 in 3x3 grid) ---
const DICE_DOT_PATTERNS = {
  1: [5],
  2: [3, 7],
  3: [3, 5, 7],
  4: [1, 3, 7, 9],
  5: [1, 3, 5, 7, 9],
  6: [1, 3, 4, 6, 7, 9],
};

// --- Audio (Web Audio API) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioCtx();
  return audioCtx;
}

function playTone(freq, duration, type = 'square', volume = 0.15) {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function sfxDice() { playTone(300, 0.1); setTimeout(() => playTone(400, 0.1), 100); setTimeout(() => playTone(500, 0.15), 200); }
function sfxCorrect() { playTone(523, 0.1, 'sine', 0.2); setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 100); setTimeout(() => playTone(784, 0.2, 'sine', 0.2), 200); }
function sfxWrong() { playTone(200, 0.3, 'sawtooth', 0.1); }
function sfxBuy() { playTone(440, 0.1, 'sine', 0.15); setTimeout(() => playTone(660, 0.15, 'sine', 0.15), 120); }
function sfxRent() { playTone(330, 0.2, 'triangle', 0.1); }
function sfxLucky() { playTone(600, 0.08, 'sine', 0.2); setTimeout(() => playTone(800, 0.08, 'sine', 0.2), 80); setTimeout(() => playTone(1000, 0.15, 'sine', 0.2), 160); }

// --- Game State ---
let state = {
  players: [],
  currentPlayerIdx: 0,
  round: 1,
  maxRounds: 20,
  board: BOARD.map(c => ({ ...c, owner: null })),
  questions: [],
  questionIdx: 0,
  subject: 'mix',
  difficulty: 'easy',
  gameOver: false,
  turnInProgress: false,
};

// --- Fallback questions ---
const FALLBACK_QUESTIONS = [
  { id: 'f1', question_text: '2 + 3 = ?', option_a: '4', option_b: '5', option_c: '6', option_d: '7', correct_answer: 'B' },
  { id: 'f2', question_text: '5 + 4 = ?', option_a: '8', option_b: '10', option_c: '9', option_d: '7', correct_answer: 'C' },
  { id: 'f3', question_text: '10 - 3 = ?', option_a: '6', option_b: '8', option_c: '5', option_d: '7', correct_answer: 'D' },
  { id: 'f4', question_text: '6 + 6 = ?', option_a: '11', option_b: '13', option_c: '10', option_d: '12', correct_answer: 'D' },
  { id: 'f5', question_text: '8 - 5 = ?', option_a: '3', option_b: '4', option_c: '2', option_d: '5', correct_answer: 'A' },
  { id: 'f6', question_text: '7 + 2 = ?', option_a: '8', option_b: '10', option_c: '9', option_d: '11', correct_answer: 'C' },
  { id: 'f7', question_text: '9 - 4 = ?', option_a: '4', option_b: '6', option_c: '5', option_d: '3', correct_answer: 'C' },
  { id: 'f8', question_text: '3 + 7 = ?', option_a: '9', option_b: '11', option_c: '8', option_d: '10', correct_answer: 'D' },
  { id: 'f9', question_text: '4 + 4 = ?', option_a: '7', option_b: '9', option_c: '6', option_d: '8', correct_answer: 'D' },
  { id: 'f10', question_text: '12 - 7 = ?', option_a: '4', option_b: '6', option_c: '5', option_d: '3', correct_answer: 'C' },
  { id: 'f11', question_text: 'Con mèo kêu gì?', option_a: 'Gâu gâu', option_b: 'Meo meo', option_c: 'Cục cục', option_d: 'Be be', correct_answer: 'B' },
  { id: 'f12', question_text: 'Quả nào có màu vàng?', option_a: 'Dưa hấu', option_b: 'Nho', option_c: 'Chuối', option_d: 'Mận', correct_answer: 'C' },
];

// --- DOM refs ---
const $modeScreen = document.getElementById('mode-screen');
const $setupScreen = document.getElementById('setup-screen');
const $onlineScreen = document.getElementById('online-screen');
const $waitingScreen = document.getElementById('waiting-screen');
const $gameScreen = document.getElementById('game-screen');
const $resultScreen = document.getElementById('result-screen');
const $playerCountGroup = document.getElementById('player-count-group');
const $subjectGroup = document.getElementById('subject-group');
const $difficultyGroup = document.getElementById('difficulty-group');
const $playerSlots = document.getElementById('player-slots');
const $startBtn = document.getElementById('start-btn');
const $helpOverlay = document.getElementById('help-overlay');
const $playersBar = document.getElementById('players-bar');
const $roundNum = document.getElementById('round-num');
const $board = document.getElementById('board');
const $boardContainer = document.getElementById('board-container');
const $popupOverlay = document.getElementById('popup-overlay');

// Helper to update action info (uses center-info in board)
function setActionInfo(text) {
  const el = document.getElementById('center-info');
  if (el) el.textContent = text;
}

// Stub removed elements
const $diceBtn = { disabled: false, addEventListener() {} };
const $diceResult = { textContent: '', classList: { add() {}, remove() {} }, style: { animation: '' }, offsetWidth: 0 };
const $actionInfo = { set textContent(v) { setActionInfo(v); } };
const $popupContent = document.getElementById('popup-content');
const $resultTitle = document.getElementById('result-title');
const $resultRankings = document.getElementById('result-rankings');
const $playAgainBtn = document.getElementById('play-again-btn');

// --- Setup logic ---
let setupPlayerCount = 3;
let onlineMode = false; // Track if current game is online

function initSetup() {
  renderPlayerSlots();
  bindModeEvents();
  bindSetupEvents();
  bindOnlineEvents();
}

function bindModeEvents() {
  document.getElementById('mode-local-btn').addEventListener('click', () => showScreen('setup'));
  document.getElementById('mode-online-btn').addEventListener('click', () => {
    // Pre-fill name from profile
    const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
    const nameInput = document.getElementById('online-name');
    if (nameInput && !nameInput.value) nameInput.value = profile.name || '';
    showScreen('online');
  });
  document.getElementById('help-btn-mode').addEventListener('click', () => $helpOverlay.classList.remove('hidden'));
  document.getElementById('back-to-mode-btn').addEventListener('click', () => showScreen('mode'));
  document.getElementById('back-to-mode-btn2').addEventListener('click', () => showScreen('mode'));
  document.getElementById('back-to-mode-result').addEventListener('click', () => {
    resetState();
    showScreen('mode');
  });
}

function bindSetupEvents() {
  // Player count
  $playerCountGroup.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      $playerCountGroup.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setupPlayerCount = parseInt(btn.dataset.value);
      renderPlayerSlots();
    });
  });

  // Subject
  $subjectGroup.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      $subjectGroup.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Difficulty
  $difficultyGroup.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      $difficultyGroup.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  $startBtn.addEventListener('click', startGame);
  $playAgainBtn.addEventListener('click', () => {
    if (onlineMode) {
      showScreen('mode');
      resetState();
    } else {
      showScreen('setup');
      resetState();
    }
  });
}

function renderPlayerSlots() {
  const profile = JSON.parse(localStorage.getItem('hocvui_profile') || '{}');
  let html = '';
  for (let i = 0; i < setupPlayerCount; i++) {
    const isFirst = i === 0;
    const defaultName = isFirst ? (profile.name || 'Bạn') : `Bot ${i}`;
    const isBot = !isFirst;
    html += `
      <div class="player-slot">
        <div class="slot-color" style="background:${PLAYER_COLORS[i]}"></div>
        <input type="text" class="slot-name" data-idx="${i}" value="${defaultName}" maxlength="10">
        <button class="slot-toggle ${isBot ? 'bot' : 'human'}" data-idx="${i}">${isBot ? '🤖' : '👤'}</button>
      </div>
    `;
  }
  $playerSlots.innerHTML = html;

  // Toggle events
  $playerSlots.querySelectorAll('.slot-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const isBot = btn.classList.contains('bot');
      btn.classList.toggle('bot', !isBot);
      btn.classList.toggle('human', isBot);
      btn.textContent = isBot ? '👤' : '🤖';
    });
  });
}

// --- Fetch questions ---
async function fetchQuestions(subject, difficulty) {
  try {
    if (subject === 'mix') {
      const [mathRes, vietRes] = await Promise.all([
        fetch(`/api/questions?subject=math&difficulty=${difficulty}&limit=25`),
        fetch(`/api/questions?subject=vietnamese&difficulty=${difficulty}&limit=25`),
      ]);
      const math = await mathRes.json();
      const viet = await vietRes.json();
      const combined = [...(Array.isArray(math) ? math : []), ...(Array.isArray(viet) ? viet : [])];
      return shuffleArray(combined);
    } else {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=50`);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch(e) {
    return [];
  }
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Start game ---
async function startGame() {
  onlineMode = false;
  const subject = $subjectGroup.querySelector('.active').dataset.value;
  const difficulty = $difficultyGroup.querySelector('.active').dataset.value;

  // Build players
  const players = [];
  const slots = $playerSlots.querySelectorAll('.player-slot');
  slots.forEach((slot, i) => {
    const name = slot.querySelector('.slot-name').value.trim() || `P${i + 1}`;
    const isBot = slot.querySelector('.slot-toggle').classList.contains('bot');
    players.push({
      id: i,
      name,
      isBot,
      money: 1500,
      position: 0,
      properties: [],
      bankrupt: false,
      color: PLAYER_COLORS[i],
    });
  });

  // Fetch questions
  $startBtn.textContent = '⏳ Đang tải...';
  $startBtn.disabled = true;
  let questions = await fetchQuestions(subject, difficulty);
  if (questions.length < 5) {
    questions = [...FALLBACK_QUESTIONS];
  }
  $startBtn.textContent = '🎲 Bắt đầu chơi!';
  $startBtn.disabled = false;

  // Init state
  state = {
    players,
    currentPlayerIdx: 0,
    round: 1,
    maxRounds: 20,
    board: BOARD.map(c => ({ ...c, owner: null })),
    questions: shuffleArray(questions),
    questionIdx: 0,
    subject,
    difficulty,
    gameOver: false,
    turnInProgress: false,
  };

  showScreen('game');
  renderBoard();
  renderPlayersBar();
  updateRound();
  startTurn();
}

// --- Screen management ---
function showScreen(name) {
  $modeScreen.classList.remove('active');
  $setupScreen.classList.remove('active');
  $onlineScreen.classList.remove('active');
  $waitingScreen.classList.remove('active');
  $gameScreen.classList.remove('active');
  $resultScreen.classList.remove('active');
  if (name === 'mode') $modeScreen.classList.add('active');
  if (name === 'setup') $setupScreen.classList.add('active');
  if (name === 'online') $onlineScreen.classList.add('active');
  if (name === 'waiting') $waitingScreen.classList.add('active');
  if (name === 'game') $gameScreen.classList.add('active');
  if (name === 'result') $resultScreen.classList.add('active');
}

function resetState() {
  state.gameOver = false;
  state.turnInProgress = false;
}

// --- 3D Dice rendering (V5 style - 6 faces per cube) ---
function initDiceCube(wrapperId) {
  const wrapper = document.getElementById(wrapperId);
  if (!wrapper) return;
  wrapper.innerHTML = '';
  for (let v = 1; v <= 6; v++) {
    const face = document.createElement('div');
    face.className = `dice-face dice-face--${v}`;
    const pattern = DICE_DOT_PATTERNS[v];
    for (let i = 1; i <= 9; i++) {
      const dot = document.createElement('span');
      dot.className = pattern.includes(i) ? 'dot visible' : 'dot';
      face.appendChild(dot);
    }
    wrapper.appendChild(face);
  }
  wrapper.dataset.showing = '1';
}

function showDiceFace(wrapperId, value) {
  const wrapper = document.getElementById(wrapperId);
  if (wrapper) wrapper.dataset.showing = String(value);
}

function renderDice(containerId, value, colorClass) {
  showDiceFace(containerId, value);
}

// --- Render board ---
function renderBoard() {
  let html = '';

  state.board.forEach((cell, idx) => {
    const [row, col] = GRID_POSITIONS[idx];
    const typeClass = `type-${cell.type}`;
    const ownerHTML = cell.owner !== null
      ? `<div class="cell-owner" style="background:${state.players[cell.owner].color}"></div>`
      : '';

    // Players on this cell
    const playersHere = state.players.filter(p => !p.bankrupt && p.position === idx);
    const tokensHTML = playersHere.map(p =>
      `<div class="token" style="background:${p.color}" title="${p.name}">🐴</div>`
    ).join('');

    const isHighlight = playersHere.length > 0;

    html += `
      <div class="board-cell ${typeClass} ${isHighlight ? 'highlight' : ''}" data-idx="${idx}" style="grid-row:${row}; grid-column:${col};">
        <div class="cell-icon">${cell.icon}</div>
        <div class="cell-info">
          <div class="cell-name">${cell.name}</div>
        </div>
        ${ownerHTML}
        <div class="cell-players">${tokensHTML}</div>
      </div>
    `;
  });

  // Center area with 3D dice and roll button
  html += `
    <div class="board-center">
      <div class="center-dice-row">
        <div class="dice-wrapper" id="dice-box-1" data-showing="1"></div>
        <div class="dice-wrapper" id="dice-box-2" data-showing="1"></div>
      </div>
      <button id="center-roll-btn" class="btn-dice">🎲 Tung xúc xắc</button>
      <div class="center-info" id="center-info"></div>
    </div>
  `;

  $board.innerHTML = html;

  // Bind center roll button
  const centerRollBtn = document.getElementById('center-roll-btn');
  if (centerRollBtn) {
    if (onlineMode) {
      centerRollBtn.addEventListener('click', onlineDiceClick);
    } else {
      centerRollBtn.addEventListener('click', onDiceClick);
    }
  }

  // Initialize 3D dice cubes
  initDiceCube('dice-box-1');
  initDiceCube('dice-box-2');
}

function getRent(cell) {
  if (cell.owner === null) return cell.rent;
  const owner = state.players[cell.owner];
  const propCount = owner.properties.length;
  return propCount >= 3 ? cell.rent * 2 : cell.rent;
}

// --- Render players bar ---
function renderPlayersBar() {
  let html = '';
  state.players.forEach((p, i) => {
    const isActive = i === state.currentPlayerIdx && !p.bankrupt;
    const bankruptClass = p.bankrupt ? 'bankrupt' : '';
    const activeClass = isActive ? 'active-turn' : '';
    html += `
      <div class="player-badge ${activeClass} ${bankruptClass}" style="border-color:${isActive ? p.color : 'transparent'}">
        <div class="badge-dot" style="background:${p.color}"></div>
        <span>${p.name}${p.isBot ? '🤖' : ''}</span>
        <span class="badge-money">${p.bankrupt ? '💀' : p.money + '🪙'}</span>
      </div>
    `;
  });
  $playersBar.innerHTML = html;
}

function updateRound() {
  $roundNum.textContent = state.round;
}

// --- Turn logic ---
function getCurrentPlayer() {
  return state.players[state.currentPlayerIdx];
}

function startTurn() {
  if (state.gameOver) return;
  if (onlineMode) return; // Online mode uses server-driven turns

  const player = getCurrentPlayer();
  if (player.bankrupt) {
    nextPlayer();
    return;
  }

  state.turnInProgress = true;
  renderPlayersBar();
  $diceResult.classList.add('hidden');
  $actionInfo.textContent = `Lượt: ${player.name}`;

  // Update center info
  const centerInfo = document.getElementById('center-info');
  if (centerInfo) centerInfo.textContent = `Lượt: ${player.name}`;

  // Enable/disable buttons based on bot
  const centerRollBtn = document.getElementById('center-roll-btn');
  if (player.isBot) {
    $diceBtn.disabled = true;
    if (centerRollBtn) centerRollBtn.disabled = true;
    setTimeout(() => botTurn(), 1500);
  } else {
    $diceBtn.disabled = false;
    if (centerRollBtn) centerRollBtn.disabled = false;
  }
}

function scrollToCell(idx) {
  // Board is fully visible in grid layout, no scrolling needed
}

function onDiceClick() {
  if (state.gameOver || !state.turnInProgress) return;
  const player = getCurrentPlayer();
  if (player.isBot || player.bankrupt) return;
  $diceBtn.disabled = true;
  const centerRollBtn = document.getElementById('center-roll-btn');
  if (centerRollBtn) centerRollBtn.disabled = true;
  rollDice();
}

function rollDice() {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const totalSteps = die1 + die2;

  sfxDice();

  // Start 3D tumble animation with random directions
  const w1 = document.getElementById('dice-box-1');
  const w2 = document.getElementById('dice-box-2');
  if (w1) {
    w1.style.setProperty('--rx-dir', Math.random() > 0.5 ? '1' : '-1');
    w1.style.setProperty('--ry-dir', Math.random() > 0.5 ? '1' : '-1');
    w1.style.setProperty('--rz-dir', Math.random() > 0.5 ? '1' : '-1');
    w1.classList.add('rolling');
  }
  if (w2) {
    w2.style.setProperty('--rx-dir', Math.random() > 0.5 ? '1' : '-1');
    w2.style.setProperty('--ry-dir', Math.random() > 0.5 ? '1' : '-1');
    w2.style.setProperty('--rz-dir', Math.random() > 0.5 ? '1' : '-1');
    w2.classList.add('rolling');
  }

  // After tumble, stop and show result face with bounce
  setTimeout(() => {
    if (w1) { w1.classList.remove('rolling'); w1.classList.add('bounce'); showDiceFace('dice-box-1', die1); }
    if (w2) { w2.classList.remove('rolling'); w2.classList.add('bounce'); showDiceFace('dice-box-2', die2); }
    setActionInfo(`🎲 ${die1} + ${die2} = ${totalSteps} bước`);
    setTimeout(() => {
      if (w1) w1.classList.remove('bounce');
      if (w2) w2.classList.remove('bounce');
    }, 500);
  }, 1000);

  setTimeout(() => movePlayer(totalSteps), 1500);
}

function movePlayer(steps) {
  const player = getCurrentPlayer();
  const oldPos = player.position;
  const newPos = (oldPos + steps) % BOARD_SIZE;

  // Check if passed START
  if (newPos < oldPos || (oldPos + steps >= BOARD_SIZE)) {
    player.money += 200;
    $actionInfo.textContent = `${player.name} đi qua Xuất phát! +200 🪙`;
  }

  player.position = newPos;
  renderBoard();
  renderPlayersBar();

  setTimeout(() => handleLanding(), 500);
}

function handleLanding() {
  const player = getCurrentPlayer();
  const cell = state.board[player.position];

  switch (cell.type) {
    case 'start':
      $actionInfo.textContent = `${player.name} ở Xuất phát!`;
      endTurn();
      break;
    case 'land':
      handleLand(player, cell);
      break;
    case 'quiz':
      handleQuiz(player, false);
      break;
    case 'lucky':
      handleLucky(player);
      break;
    case 'tax':
      handleTax(player, cell);
      break;
    default:
      endTurn();
  }
}

// --- Land cell logic ---
function handleLand(player, cell) {
  if (cell.owner === null) {
    if (player.isBot) {
      botHandleLand(player, cell);
    } else {
      humanHandleLand(player, cell);
    }
  } else if (cell.owner === player.id) {
    $actionInfo.textContent = `Đất của ${player.name}. Nghỉ ngơi~`;
    endTurn();
  } else {
    // Pay rent
    const rent = getRent(cell);
    const owner = state.players[cell.owner];
    sfxRent();
    player.money -= rent;
    owner.money += rent;
    $actionInfo.textContent = `${player.name} trả ${rent}🪙 thuê cho ${owner.name}`;
    renderPlayersBar();

    if (player.money <= 0) {
      handleBankrupt(player);
    } else {
      endTurn();
    }
  }
}

function humanHandleLand(player, cell) {
  showQuizForLand(player, cell);
}

function showQuizForLand(player, cell) {
  const q = getNextQuestion();
  const questionText = q.question_text;

  let html = `
    <h3>🏘️ ${cell.name} (${cell.price}🪙)</h3>
    <p>Trả lời đúng = mua miễn phí!</p>
    <p style="margin-top:10px; font-size:1.05rem; font-weight:800;">${questionText}</p>
    <div class="quiz-options">
      <button class="quiz-opt" data-ans="A">A. ${q.option_a}</button>
      <button class="quiz-opt" data-ans="B">B. ${q.option_b}</button>
      <button class="quiz-opt" data-ans="C">C. ${q.option_c}</button>
      <button class="quiz-opt" data-ans="D">D. ${q.option_d}</button>
    </div>
  `;
  showPopup(html);

  $popupContent.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const ans = btn.dataset.ans;
      const correct = q.correct_answer.toUpperCase();
      const isCorrect = ans === correct;

      $popupContent.querySelectorAll('.quiz-opt').forEach(b => {
        if (b.dataset.ans === correct) b.classList.add('correct');
        if (b.dataset.ans === ans && !isCorrect) b.classList.add('wrong');
        b.style.pointerEvents = 'none';
      });

      if (isCorrect) {
        sfxCorrect();
        sfxBuy();
        cell.owner = player.id;
        player.properties.push(cell.id);
        setTimeout(() => {
          hidePopup();
          $actionInfo.textContent = `✅ Đúng! ${player.name} mua ${cell.name} miễn phí!`;
          renderBoard();
          renderPlayersBar();
          endTurn();
        }, 1200);
      } else {
        sfxWrong();
        setTimeout(() => {
          showBuyOrSkipPopup(player, cell);
        }, 1200);
      }
    });
  });
}

function showBuyOrSkipPopup(player, cell) {
  const canAfford = player.money >= cell.price;
  let html = `
    <h3>❌ Sai rồi!</h3>
    <p>Mua ${cell.name} với giá ${cell.price}🪙?</p>
    <p style="font-size:0.85rem; opacity:0.7;">Tiền hiện tại: ${player.money}🪙</p>
    <div style="margin-top:14px;">
      ${canAfford ? `<button class="popup-btn btn-yes" id="popup-buy">Mua (${cell.price}🪙)</button>` : ''}
      <button class="popup-btn btn-no" id="popup-skip">Bỏ qua</button>
    </div>
  `;
  $popupContent.innerHTML = html;

  if (canAfford) {
    document.getElementById('popup-buy').addEventListener('click', () => {
      player.money -= cell.price;
      cell.owner = player.id;
      player.properties.push(cell.id);
      sfxBuy();
      hidePopup();
      $actionInfo.textContent = `${player.name} mua ${cell.name}!`;
      renderBoard();
      renderPlayersBar();
      endTurn();
    });
  }

  document.getElementById('popup-skip').addEventListener('click', () => {
    hidePopup();
    $actionInfo.textContent = `${player.name} bỏ qua ${cell.name}`;
    endTurn();
  });
}

// --- Quiz cell logic ---
function handleQuiz(player, isForLand) {
  if (player.isBot) {
    botHandleQuiz(player);
    return;
  }

  const q = getNextQuestion();
  let html = `
    <h3>❓ Câu hỏi</h3>
    <p>Đúng +100 🪙!</p>
    <p style="margin-top:10px; font-size:1.05rem; font-weight:800;">${q.question_text}</p>
    <div class="quiz-options">
      <button class="quiz-opt" data-ans="A">A. ${q.option_a}</button>
      <button class="quiz-opt" data-ans="B">B. ${q.option_b}</button>
      <button class="quiz-opt" data-ans="C">C. ${q.option_c}</button>
      <button class="quiz-opt" data-ans="D">D. ${q.option_d}</button>
    </div>
  `;
  showPopup(html);

  $popupContent.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const ans = btn.dataset.ans;
      const correct = q.correct_answer.toUpperCase();
      const isCorrect = ans === correct;

      $popupContent.querySelectorAll('.quiz-opt').forEach(b => {
        if (b.dataset.ans === correct) b.classList.add('correct');
        if (b.dataset.ans === ans && !isCorrect) b.classList.add('wrong');
        b.style.pointerEvents = 'none';
      });

      if (isCorrect) {
        sfxCorrect();
        player.money += 100;
        setTimeout(() => {
          hidePopup();
          $actionInfo.textContent = `✅ Đúng! ${player.name} +100🪙!`;
          renderPlayersBar();
          endTurn();
        }, 1000);
      } else {
        sfxWrong();
        setTimeout(() => {
          hidePopup();
          $actionInfo.textContent = `❌ Sai! Đáp án đúng: ${correct}`;
          endTurn();
        }, 1000);
      }
    });
  });
}

// --- Lucky cell logic ---
function handleLucky(player) {
  sfxLucky();
  const event = LUCKY_EVENTS[Math.floor(Math.random() * LUCKY_EVENTS.length)];
  let message = event.text;

  if (event.type === 'gain') {
    player.money += event.amount;
  } else if (event.type === 'lose') {
    player.money += event.amount;
  } else if (event.type === 'free_land') {
    const unowned = state.board.filter(c => c.type === 'land' && c.owner === null);
    if (unowned.length > 0) {
      const land = unowned[Math.floor(Math.random() * unowned.length)];
      land.owner = player.id;
      player.properties.push(land.id);
      message += ` → ${land.name}`;
    } else {
      message = '🎁 Không còn đất trống! +100🪙';
      player.money += 100;
    }
  } else if (event.type === 'lose_land') {
    if (player.properties.length > 0) {
      const propId = player.properties[Math.floor(Math.random() * player.properties.length)];
      player.properties = player.properties.filter(id => id !== propId);
      const cell = state.board.find(c => c.id === propId);
      if (cell) {
        cell.owner = null;
        message += ` → Mất ${cell.name}`;
      }
    } else {
      message = '⚡ Không có đất để mất! An toàn~';
    }
  }

  if (player.isBot) {
    $actionInfo.textContent = `${player.name}: ${message}`;
    renderBoard();
    renderPlayersBar();
    if (player.money <= 0) {
      handleBankrupt(player);
    } else {
      endTurn();
    }
    return;
  }

  let html = `
    <h3>🎁 Hộp quà!</h3>
    <p style="font-size:1.1rem; margin-top:10px;">${message}</p>
    <div style="margin-top:16px;">
      <button class="popup-btn btn-ok" id="popup-lucky-ok">OK</button>
    </div>
  `;
  showPopup(html);
  document.getElementById('popup-lucky-ok').addEventListener('click', () => {
    hidePopup();
    renderBoard();
    renderPlayersBar();
    if (player.money <= 0) {
      handleBankrupt(player);
    } else {
      endTurn();
    }
  });
}

// --- Tax cell logic ---
function handleTax(player, cell) {
  player.money -= cell.rent;
  $actionInfo.textContent = `${player.name} nộp thuế -${cell.rent}🪙`;
  renderPlayersBar();

  if (player.money <= 0) {
    handleBankrupt(player);
  } else {
    endTurn();
  }
}

// --- Bankruptcy ---
function handleBankrupt(player) {
  player.bankrupt = true;
  player.money = 0;
  player.properties.forEach(propId => {
    const cell = state.board.find(c => c.id === propId);
    if (cell) cell.owner = null;
  });
  player.properties = [];

  $actionInfo.textContent = `💀 ${player.name} phá sản!`;
  renderBoard();
  renderPlayersBar();

  const activePlayers = state.players.filter(p => !p.bankrupt);
  if (activePlayers.length <= 1) {
    setTimeout(() => endGame(), 1000);
  } else {
    endTurn();
  }
}

// --- Question management ---
function getNextQuestion() {
  if (state.questionIdx >= state.questions.length) {
    state.questions = shuffleArray(state.questions);
    state.questionIdx = 0;
  }
  return state.questions[state.questionIdx++];
}

// --- Bot AI ---
function botTurn() {
  if (state.gameOver) return;
  rollDice();
}

function botHandleLand(player, cell) {
  const q = getNextQuestion();
  const isCorrect = Math.random() < 0.6;

  setTimeout(() => {
    if (isCorrect) {
      sfxCorrect();
      sfxBuy();
      cell.owner = player.id;
      player.properties.push(cell.id);
      $actionInfo.textContent = `✅ ${player.name} trả lời đúng! Mua ${cell.name} miễn phí!`;
    } else {
      if (player.money >= cell.price) {
        player.money -= cell.price;
        cell.owner = player.id;
        player.properties.push(cell.id);
        sfxBuy();
        $actionInfo.textContent = `❌ ${player.name} sai, mua ${cell.name} (${cell.price}🪙)`;
      } else {
        $actionInfo.textContent = `❌ ${player.name} sai, không đủ tiền. Bỏ qua!`;
      }
    }
    renderBoard();
    renderPlayersBar();
    endTurn();
  }, 1200);
}

function botHandleQuiz(player) {
  const q = getNextQuestion();
  const isCorrect = Math.random() < 0.6;

  setTimeout(() => {
    if (isCorrect) {
      sfxCorrect();
      player.money += 100;
      $actionInfo.textContent = `✅ ${player.name} trả lời đúng! +100🪙`;
    } else {
      sfxWrong();
      $actionInfo.textContent = `❌ ${player.name} trả lời sai!`;
    }
    renderPlayersBar();
    endTurn();
  }, 1200);
}

// --- End turn / Next player ---
function endTurn() {
  state.turnInProgress = false;
  if (onlineMode) return; // Online turns are server-driven

  if (state.gameOver) return;

  const activePlayers = state.players.filter(p => !p.bankrupt);
  if (activePlayers.length <= 1) {
    setTimeout(() => endGame(), 800);
    return;
  }

  setTimeout(() => nextPlayer(), 1000);
}

function nextPlayer() {
  if (state.gameOver) return;
  if (onlineMode) return; // Online turns are server-driven

  let nextIdx = (state.currentPlayerIdx + 1) % state.players.length;

  // Check if we completed a round
  if (nextIdx === 0) {
    state.round++;
    updateRound();
    if (state.round > state.maxRounds) {
      endGame();
      return;
    }
  }

  // Skip bankrupt players
  let tries = 0;
  while (state.players[nextIdx].bankrupt && tries < state.players.length) {
    nextIdx = (nextIdx + 1) % state.players.length;
    if (nextIdx === 0) {
      state.round++;
      updateRound();
      if (state.round > state.maxRounds) {
        endGame();
        return;
      }
    }
    tries++;
  }

  state.currentPlayerIdx = nextIdx;
  startTurn();
}

// --- End game ---
function endGame() {
  state.gameOver = true;

  const ranked = [...state.players].sort((a, b) => {
    if (a.bankrupt && !b.bankrupt) return 1;
    if (!a.bankrupt && b.bankrupt) return -1;
    return b.money - a.money;
  });

  const medals = ['🥇', '🥈', '🥉', '4️⃣'];

  let html = '';
  ranked.forEach((p, i) => {
    const isWinner = i === 0;
    html += `
      <div class="rank-item ${isWinner ? 'winner' : ''}">
        <div class="rank-pos">${medals[i] || ''}</div>
        <div class="rank-info">
          <div class="rank-name">${p.name}${p.isBot ? ' 🤖' : ''}</div>
          <div class="rank-money">${p.bankrupt ? '💀 Phá sản' : p.money + ' 🪙'}</div>
          <div class="rank-props">${p.properties.length} tỉnh thành</div>
        </div>
      </div>
    `;
  });

  $resultRankings.innerHTML = html;
  $resultTitle.textContent = `🏆 ${ranked[0].name} thắng!`;
  showScreen('result');
}

// --- Popup helpers ---
function showPopup(html) {
  $popupContent.innerHTML = html;
  $popupOverlay.classList.remove('hidden');
}

function hidePopup() {
  $popupOverlay.classList.add('hidden');
}

// ===== ONLINE MULTIPLAYER (WebSocket) =====
let ws = null;
let myRole = null; // 'host' or 'guest'
let roomCode = null;
let onlineOpponent = null;
let onlineName = '';
let onlineDiceResolve = null; // for awaiting dice results from server

function getWsUrl() {
  const loc = window.location;
  const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${loc.host}`;
}

function bindOnlineEvents() {
  // Subject group in online screen
  document.getElementById('online-subject-group').querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('online-subject-group').querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Difficulty group in online screen
  document.getElementById('online-difficulty-group').querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('online-difficulty-group').querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('create-room-btn').addEventListener('click', createOnlineRoom);
  document.getElementById('join-room-btn').addEventListener('click', joinOnlineRoom);
  document.getElementById('leave-room-btn').addEventListener('click', leaveRoom);
  document.getElementById('start-online-btn').addEventListener('click', startOnlineGame);
}

function connectWs() {
  return new Promise((resolve, reject) => {
    if (ws && ws.readyState === WebSocket.OPEN) { resolve(); return; }
    ws = new WebSocket(getWsUrl());
    ws.onopen = () => resolve();
    ws.onerror = () => reject(new Error('WebSocket connection failed'));
    ws.onclose = () => {
      if (roomCode) {
        showPopup('<h3>⚠️ Mất kết nối</h3><p>Kết nối đã bị ngắt.</p><div style="margin-top:14px;"><button class="popup-btn btn-ok" onclick="hidePopup(); showScreen(\'mode\');">OK</button></div>');
        roomCode = null;
      }
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleOnlineMessage(msg);
      } catch(e) {}
    };
  });
}

async function createOnlineRoom() {
  const nameInput = document.getElementById('online-name');
  onlineName = nameInput.value.trim() || 'Người chơi';
  if (!onlineName) { nameInput.focus(); return; }

  const subject = document.getElementById('online-subject-group').querySelector('.active').dataset.value;
  const difficulty = document.getElementById('online-difficulty-group').querySelector('.active').dataset.value;

  try {
    await connectWs();
    ws.send(JSON.stringify({
      type: 'v11_create',
      name: onlineName,
      settings: { subject, difficulty, maxRounds: 20 }
    }));
  } catch(e) {
    alert('Không thể kết nối server. Vui lòng thử lại!');
  }
}

async function joinOnlineRoom() {
  const nameInput = document.getElementById('online-name');
  onlineName = nameInput.value.trim() || 'Người chơi';
  if (!onlineName) { nameInput.focus(); return; }

  const codeInput = document.getElementById('room-code-input');
  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 4) { codeInput.focus(); return; }

  try {
    await connectWs();
    ws.send(JSON.stringify({
      type: 'v11_join',
      name: onlineName,
      code: code
    }));
  } catch(e) {
    alert('Không thể kết nối server. Vui lòng thử lại!');
  }
}

function leaveRoom() {
  if (ws) {
    ws.send(JSON.stringify({ type: 'v11_leave' }));
    ws.close();
    ws = null;
  }
  roomCode = null;
  myRole = null;
  showScreen('mode');
}

function startOnlineGame() {
  if (!ws || myRole !== 'host') return;
  ws.send(JSON.stringify({ type: 'v11_start' }));
  document.getElementById('start-online-btn').disabled = true;
  document.getElementById('start-online-btn').textContent = '⏳ Đang tải...';
}

function handleOnlineMessage(msg) {
  switch (msg.type) {
    case 'v11_created':
      roomCode = msg.code;
      myRole = 'host';
      showScreen('waiting');
      document.getElementById('display-room-code').textContent = msg.code;
      document.getElementById('waiting-status').textContent = 'Đang đợi đối thủ...';
      renderWaitingPlayers([{ name: onlineName, color: PLAYER_COLORS[0], tag: 'Bạn (Host)' }]);
      document.getElementById('start-online-btn').classList.add('hidden');
      break;

    case 'v11_joined':
      roomCode = msg.code;
      myRole = 'guest';
      onlineOpponent = msg.hostName;
      showScreen('waiting');
      document.getElementById('display-room-code').textContent = msg.code;
      document.getElementById('waiting-status').textContent = 'Đã vào phòng! Đợi host bắt đầu...';
      renderWaitingPlayers([
        { name: msg.hostName, color: PLAYER_COLORS[0], tag: 'Host' },
        { name: onlineName, color: PLAYER_COLORS[1], tag: 'Bạn' },
      ]);
      document.getElementById('start-online-btn').classList.add('hidden');
      break;

    case 'v11_guest_joined':
      onlineOpponent = msg.guestName;
      document.getElementById('waiting-status').textContent = `${msg.guestName} đã vào! Bắt đầu thôi!`;
      renderWaitingPlayers([
        { name: onlineName, color: PLAYER_COLORS[0], tag: 'Bạn (Host)' },
        { name: msg.guestName, color: PLAYER_COLORS[1], tag: 'Khách' },
      ]);
      document.getElementById('start-online-btn').classList.remove('hidden');
      document.getElementById('start-online-btn').disabled = false;
      document.getElementById('start-online-btn').textContent = '🎲 Bắt đầu!';
      break;

    case 'v11_game_start':
      onlineMode = true;
      startOnlineMatch(msg);
      break;

    case 'v11_turn':
      handleOnlineTurn(msg);
      break;

    case 'v11_dice_result':
      handleOnlineDiceResult(msg);
      break;

    case 'v11_question':
      handleOnlineQuestion(msg);
      break;

    case 'v11_answer_result':
      handleOnlineAnswerResult(msg);
      break;

    case 'v11_state_update':
      handleOnlineStateUpdate(msg);
      break;

    case 'v11_game_over':
      handleOnlineGameOver(msg);
      break;

    case 'v11_opponent_left':
      showPopup('<h3>😢 Đối thủ đã rời phòng</h3><p>Trận đấu kết thúc!</p><div style="margin-top:14px;"><button class="popup-btn btn-ok" onclick="hidePopup(); showScreen(\'mode\'); resetState();">OK</button></div>');
      roomCode = null;
      break;

    case 'error':
      alert(msg.message || 'Có lỗi xảy ra!');
      break;
  }
}

function renderWaitingPlayers(players) {
  const container = document.getElementById('waiting-players');
  container.innerHTML = players.map(p => `
    <div class="waiting-player">
      <div class="wp-dot" style="background:${p.color}"></div>
      <span class="wp-name">${p.name}</span>
      <span class="wp-tag">${p.tag}</span>
    </div>
  `).join('');
}

function startOnlineMatch(msg) {
  // Initialize game state from server data
  const myIdx = myRole === 'host' ? 0 : 1;
  const players = [
    { id: 0, name: msg.hostName, isBot: false, money: 1500, position: 0, properties: [], bankrupt: false, color: PLAYER_COLORS[0] },
    { id: 1, name: msg.guestName, isBot: false, money: 1500, position: 0, properties: [], bankrupt: false, color: PLAYER_COLORS[1] },
  ];

  state = {
    players,
    currentPlayerIdx: 0,
    round: 1,
    maxRounds: msg.maxRounds || 20,
    board: BOARD.map(c => ({ ...c, owner: null })),
    questions: [],
    questionIdx: 0,
    subject: msg.settings?.subject || 'mix',
    difficulty: msg.settings?.difficulty || 'easy',
    gameOver: false,
    turnInProgress: false,
    online: true,
    myIdx,
  };

  showScreen('game');
  renderBoard();
  renderPlayersBar();
  updateRound();
}

function handleOnlineTurn(msg) {
  state.currentPlayerIdx = msg.currentPlayerIdx;
  state.round = msg.round || state.round;
  state.turnInProgress = true;
  updateRound();
  renderPlayersBar();

  const isMyTurn = msg.currentPlayerIdx === state.myIdx;
  const centerInfo = document.getElementById('center-info');
  const centerRollBtn = document.getElementById('center-roll-btn');

  if (isMyTurn) {
    if (centerInfo) centerInfo.textContent = `Lượt của bạn! Tung xúc xắc!`;
    if (centerRollBtn) {
      centerRollBtn.disabled = false;
      centerRollBtn.onclick = onlineDiceClick;
    }
  } else {
    if (centerInfo) centerInfo.textContent = `Đợi ${state.players[msg.currentPlayerIdx].name} tung xúc xắc...`;
    if (centerRollBtn) centerRollBtn.disabled = true;
  }
}

function onlineDiceClick() {
  const centerRollBtn = document.getElementById('center-roll-btn');
  if (centerRollBtn) centerRollBtn.disabled = true;
  ws.send(JSON.stringify({ type: 'v11_roll_dice' }));
}

function handleOnlineDiceResult(msg) {
  const { die1, die2, playerIdx, newPosition, passedStart, moneyAfterMove } = msg;
  const player = state.players[playerIdx];

  sfxDice();

  // Animate 3D dice
  const w1 = document.getElementById('dice-box-1');
  const w2 = document.getElementById('dice-box-2');
  if (w1) { w1.style.setProperty('--rx-dir', Math.random()>0.5?'1':'-1'); w1.style.setProperty('--ry-dir', Math.random()>0.5?'1':'-1'); w1.style.setProperty('--rz-dir', Math.random()>0.5?'1':'-1'); w1.classList.add('rolling'); }
  if (w2) { w2.style.setProperty('--rx-dir', Math.random()>0.5?'1':'-1'); w2.style.setProperty('--ry-dir', Math.random()>0.5?'1':'-1'); w2.style.setProperty('--rz-dir', Math.random()>0.5?'1':'-1'); w2.classList.add('rolling'); }

  setTimeout(() => {
    if (w1) { w1.classList.remove('rolling'); w1.classList.add('bounce'); showDiceFace('dice-box-1', die1); }
    if (w2) { w2.classList.remove('rolling'); w2.classList.add('bounce'); showDiceFace('dice-box-2', die2); }
    setActionInfo(`🎲 ${die1} + ${die2} = ${die1+die2} bước`);
    setTimeout(() => { if(w1) w1.classList.remove('bounce'); if(w2) w2.classList.remove('bounce'); }, 500);
  }, 1000);

  setTimeout(() => {
    player.position = newPosition;
    player.money = moneyAfterMove;
    if (passedStart) setActionInfo(`${player.name} đi qua Xuất phát! +200 🪙`);
    renderBoard();
    renderPlayersBar();
  }, 1500);
}

function handleOnlineQuestion(msg) {
  const { question, context, cellName, cellPrice, playerIdx } = msg;
  const isMyTurn = playerIdx === state.myIdx;

  if (!isMyTurn) {
    setActionInfo(`${state.players[playerIdx].name} đang trả lời câu hỏi...`);
    return;
  }

  let title = '';
  let desc = '';
  if (context === 'land') {
    title = `🏘️ ${cellName} (${cellPrice}🪙)`;
    desc = 'Trả lời đúng = mua miễn phí!';
  } else {
    title = '❓ Câu hỏi';
    desc = 'Đúng +100 🪙!';
  }

  let html = `
    <h3>${title}</h3>
    <p>${desc}</p>
    <p style="margin-top:10px; font-size:1.05rem; font-weight:800;">${question.question_text}</p>
    <div class="quiz-options">
      <button class="quiz-opt" data-ans="A">A. ${question.option_a}</button>
      <button class="quiz-opt" data-ans="B">B. ${question.option_b}</button>
      <button class="quiz-opt" data-ans="C">C. ${question.option_c}</button>
      <button class="quiz-opt" data-ans="D">D. ${question.option_d}</button>
    </div>
  `;
  showPopup(html);

  $popupContent.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      // Disable all buttons
      $popupContent.querySelectorAll('.quiz-opt').forEach(b => b.style.pointerEvents = 'none');
      btn.style.background = 'rgba(255,255,255,0.3)';
      ws.send(JSON.stringify({ type: 'v11_answer', answer: btn.dataset.ans }));
    });
  });
}

function handleOnlineAnswerResult(msg) {
  const { correct, correctAnswer, playerIdx, context, bought, cellName, moneyChange } = msg;
  const isMyTurn = playerIdx === state.myIdx;

  if (isMyTurn) {
    // Show result in popup
    $popupContent.querySelectorAll('.quiz-opt').forEach(b => {
      if (b.dataset.ans === correctAnswer) b.classList.add('correct');
      if (b.dataset.ans !== correctAnswer && b.style.background) b.classList.add('wrong');
    });

    setTimeout(() => {
      hidePopup();
      if (correct) {
        sfxCorrect();
        if (context === 'land' && bought) {
          sfxBuy();
          setActionInfo(`✅ Đúng! Bạn mua ${cellName} miễn phí!`);
        } else if (context === 'quiz') {
          setActionInfo(`✅ Đúng! +100🪙!`);
        }
      } else {
        sfxWrong();
        if (context === 'land') {
          // Show buy/skip option
          if (msg.canBuy) {
            showOnlineBuyPopup(cellName, msg.cellPrice);
          } else {
            setActionInfo(`❌ Sai! Không đủ tiền mua ${cellName}`);
          }
        } else {
          setActionInfo(`❌ Sai! Đáp án: ${correctAnswer}`);
        }
      }
    }, 1000);
  } else {
    // Opponent's turn result
    const name = state.players[playerIdx].name;
    if (correct) {
      sfxCorrect();
      if (context === 'land' && bought) {
        setActionInfo(`✅ ${name} trả lời đúng! Mua ${cellName}!`);
      } else if (context === 'quiz') {
        setActionInfo(`✅ ${name} đúng! +100🪙`);
      }
    } else {
      setActionInfo(`❌ ${name} trả lời sai!`);
    }
  }
}

function showOnlineBuyPopup(cellName, cellPrice) {
  let html = `
    <h3>❌ Sai rồi!</h3>
    <p>Mua ${cellName} với giá ${cellPrice}🪙?</p>
    <div style="margin-top:14px;">
      <button class="popup-btn btn-yes" id="popup-online-buy">Mua (${cellPrice}🪙)</button>
      <button class="popup-btn btn-no" id="popup-online-skip">Bỏ qua</button>
    </div>
  `;
  showPopup(html);

  document.getElementById('popup-online-buy').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'v11_buy', buy: true }));
    hidePopup();
  });
  document.getElementById('popup-online-skip').addEventListener('click', () => {
    ws.send(JSON.stringify({ type: 'v11_buy', buy: false }));
    hidePopup();
  });
}

function handleOnlineStateUpdate(msg) {
  // Sync full game state from server
  if (msg.players) {
    msg.players.forEach((p, i) => {
      state.players[i].money = p.money;
      state.players[i].position = p.position;
      state.players[i].properties = p.properties || [];
      state.players[i].bankrupt = p.bankrupt || false;
    });
  }
  if (msg.board) {
    msg.board.forEach((cell, i) => {
      state.board[i].owner = cell.owner;
    });
  }
  if (msg.round) state.round = msg.round;
  if (msg.actionText) setActionInfo(msg.actionText);

  // Handle lucky/tax events with popup for the active player
  if (msg.eventPopup && msg.eventPlayerIdx === state.myIdx) {
    let html = `
      <h3>${msg.eventPopup.title}</h3>
      <p style="font-size:1.1rem; margin-top:10px;">${msg.eventPopup.text}</p>
      <div style="margin-top:16px;">
        <button class="popup-btn btn-ok" id="popup-event-ok">OK</button>
      </div>
    `;
    showPopup(html);
    document.getElementById('popup-event-ok').addEventListener('click', () => {
      hidePopup();
      ws.send(JSON.stringify({ type: 'v11_event_ack' }));
    });
  } else if (msg.eventPopup) {
    // Opponent's event - just show action text
    if (msg.eventPopup.sfx === 'lucky') sfxLucky();
  }

  renderBoard();
  renderPlayersBar();
  updateRound();
}

function handleOnlineGameOver(msg) {
  state.gameOver = true;

  const ranked = msg.rankings || [...state.players].sort((a, b) => {
    if (a.bankrupt && !b.bankrupt) return 1;
    if (!a.bankrupt && b.bankrupt) return -1;
    return b.money - a.money;
  });

  const medals = ['🥇', '🥈', '🥉', '4️⃣'];
  let html = '';
  ranked.forEach((p, i) => {
    const isWinner = i === 0;
    html += `
      <div class="rank-item ${isWinner ? 'winner' : ''}">
        <div class="rank-pos">${medals[i] || ''}</div>
        <div class="rank-info">
          <div class="rank-name">${p.name}</div>
          <div class="rank-money">${p.bankrupt ? '💀 Phá sản' : p.money + ' 🪙'}</div>
          <div class="rank-props">${p.properties?.length || 0} tỉnh thành</div>
        </div>
      </div>
    `;
  });

  $resultRankings.innerHTML = html;
  $resultTitle.textContent = `🏆 ${ranked[0].name} thắng!`;
  showScreen('result');

  if (ws) { ws.close(); ws = null; }
  roomCode = null;
}

// --- Init ---
initSetup();
