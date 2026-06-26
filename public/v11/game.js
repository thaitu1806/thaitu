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
  // Restore last dice result if available
  if (state.lastDice) {
    showDiceFace('dice-box-1', state.lastDice[0]);
    showDiceFace('dice-box-2', state.lastDice[1]);
  }
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
        <span class="badge-money">${p.bankrupt ? '💀' : p.money + '💰'}</span>
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
  const container = document.querySelector('.center-dice-row');
  const w1 = document.getElementById('dice-box-1');
  const w2 = document.getElementById('dice-box-2');

  if (container) container.classList.add('rolling');

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
    if (container) container.classList.remove('rolling');
    if (w1) { w1.classList.remove('rolling'); w1.classList.add('bounce'); showDiceFace('dice-box-1', die1); }
    if (w2) { w2.classList.remove('rolling'); w2.classList.add('bounce'); showDiceFace('dice-box-2', die2); }
    state.lastDice = [die1, die2];
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
    $actionInfo.textContent = `${player.name} đi qua Xuất phát! +200 💰`;
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
    $actionInfo.textContent = `${player.name} trả ${rent}💰 thuê cho ${owner.name}`;
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
    <h3>🏘️ ${cell.name} (${cell.price}💰)</h3>
    <p>Trả lời đúng = mua miễn phí!</p>
    <p style="margin-top:10px; font-size:1.05rem; font-weight:800;">${questionText}</p>
    <button class="btn-speak" onclick="window.ttsSpeak('${q.question_text.replace(/'/g,"\\'")}. A: ${q.option_a.replace(/'/g,"\\'")}. B: ${q.option_b.replace(/'/g,"\\'")}. C: ${q.option_c.replace(/'/g,"\\'")}. D: ${q.option_d.replace(/'/g,"\\'")}', 'vi')" style="margin:8px auto;display:flex;">🔊</button>
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
    <p>Mua ${cell.name} với giá ${cell.price}💰?</p>
    <p style="font-size:0.85rem; opacity:0.7;">Tiền hiện tại: ${player.money}💰</p>
    <div style="margin-top:14px;">
      ${canAfford ? `<button class="popup-btn btn-yes" id="popup-buy">Mua (${cell.price}💰)</button>` : ''}
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
    <p>Đúng +100 💰!</p>
    <p style="margin-top:10px; font-size:1.05rem; font-weight:800;">${q.question_text}</p>
    <button class="btn-speak" onclick="window.ttsSpeak('${q.question_text.replace(/'/g,"\\'")}. A: ${q.option_a.replace(/'/g,"\\'")}. B: ${q.option_b.replace(/'/g,"\\'")}. C: ${q.option_c.replace(/'/g,"\\'")}. D: ${q.option_d.replace(/'/g,"\\'")}', 'vi')" style="margin:8px auto;display:flex;">🔊</button>
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
          $actionInfo.textContent = `✅ Đúng! ${player.name} +100💰!`;
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
      message = '🎁 Không còn đất trống! +100💰';
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
  $actionInfo.textContent = `${player.name} nộp thuế -${cell.rent}💰`;
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
        $actionInfo.textContent = `❌ ${player.name} sai, mua ${cell.name} (${cell.price}💰)`;
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
      $actionInfo.textContent = `✅ ${player.name} trả lời đúng! +100💰`;
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
          <div class="rank-money">${p.bankrupt ? '💀 Phá sản' : p.money + ' 💰'}</div>
          <div class="rank-props">${p.properties.length} tỉnh thành</div>
        </div>
      </div>
    `;
  });

  $resultRankings.innerHTML = html;
  $resultTitle.textContent = `🏆 ${ranked[0].name} thắng!`;
  showScreen('result');

  // Check and show parent linking prompt after game ends
  const profile = JSON.parse(localStorage.getItem('hocvui_profile') || 'null');
  if (window.checkAndShowPrompt && profile?.id) {
    window.checkAndShowPrompt(profile.id);
  }
}

// --- Popup helpers ---
function showPopup(html) {
  $popupContent.innerHTML = html;
  $popupOverlay.classList.remove('hidden');
}

function hidePopup() {
  $popupOverlay.classList.add('hidden');
}

// ===== ONLINE MULTIPLAYER (Firebase Realtime Database) =====
const firebaseConfig = {
  apiKey: "AIzaSyAtaJOMc6E1Oq3QVXLX0b7ZXZwBSEnu_w8",
  authDomain: "hocvui-online.firebaseapp.com",
  databaseURL: "https://hocvui-online-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "hocvui-online",
  storageBucket: "hocvui-online.firebasestorage.app",
  messagingSenderId: "934232141607",
  appId: "1:934232141607:web:0d112c31184595936fc302",
};

firebase.initializeApp(firebaseConfig);
const fbDb = firebase.database();

let myRole = null;
let roomCode = null;
let roomRef = null;
let onlineOpponent = null;
let onlineName = '';

function bindOnlineEvents() {
  document.getElementById('online-subject-group').querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('online-subject-group').querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.getElementById('online-difficulty-group').querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('online-difficulty-group').querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.getElementById('online-player-count-group').querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('online-player-count-group').querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.getElementById('create-room-btn').addEventListener('click', createOnlineRoom);
  document.getElementById('join-room-btn').addEventListener('click', joinOnlineRoom);
  document.getElementById('leave-room-btn').addEventListener('click', leaveRoom);
  document.getElementById('start-online-btn').addEventListener('click', startOnlineGame);
}

async function createOnlineRoom() {
  const nameInput = document.getElementById('online-name');
  onlineName = nameInput.value.trim() || 'Người chơi';
  if (!onlineName) { nameInput.focus(); return; }

  const subject = document.getElementById('online-subject-group').querySelector('.active').dataset.value;
  const difficulty = document.getElementById('online-difficulty-group').querySelector('.active').dataset.value;
  const maxPlayers = parseInt(document.getElementById('online-player-count-group').querySelector('.active').dataset.value) || 2;

  roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
  roomRef = fbDb.ref('v11rooms/' + roomCode);

  await roomRef.set({
    host: onlineName,
    guest: null,
    settings: { subject, difficulty, maxPlayers },
    state: 'waiting',
    currentPlayerIdx: 0,
    round: 1,
    players: [
      { name: onlineName, money: 1500, position: 0, properties: [], bankrupt: false },
    ],
    board: BOARD.map(c => ({ owner: null })),
  });

  myRole = 'host';
  showScreen('waiting');
  document.getElementById('display-room-code').textContent = roomCode;
  document.getElementById('waiting-status').textContent = `Đang đợi (1/${maxPlayers} người)...`;
  renderWaitingPlayers([{ name: onlineName, color: PLAYER_COLORS[0], tag: 'Bạn (Host)' }]);
  document.getElementById('start-online-btn').classList.add('hidden');

  roomRef.on('value', onRoomUpdate);
  roomRef.onDisconnect().remove();
}

async function joinOnlineRoom() {
  const nameInput = document.getElementById('online-name');
  onlineName = nameInput.value.trim() || 'Người chơi';
  if (!onlineName) { nameInput.focus(); return; }

  const codeInput = document.getElementById('room-code-input');
  const code = codeInput.value.trim().toUpperCase();
  if (code.length !== 4) { codeInput.focus(); return; }

  roomRef = fbDb.ref('v11rooms/' + code);
  const snapshot = await roomRef.once('value');
  const room = snapshot.val();

  if (!room || room.state !== 'waiting') {
    alert('Phòng không tồn tại hoặc đã bắt đầu!');
    return;
  }

  const maxPlayers = room.settings?.maxPlayers || 2;
  const currentPlayers = room.players || [];

  if (currentPlayers.length >= maxPlayers) {
    alert('Phòng đã đầy!');
    return;
  }

  roomCode = code;
  myRole = 'guest';
  onlineOpponent = room.host;

  // Add self to players array
  const updatedPlayers = [...currentPlayers, { name: onlineName, money: 1500, position: 0, properties: [], bankrupt: false }];
  await roomRef.update({ players: updatedPlayers });

  showScreen('waiting');
  document.getElementById('display-room-code').textContent = roomCode;
  document.getElementById('waiting-status').textContent = `Đã vào phòng! (${updatedPlayers.length}/${maxPlayers})`;
  renderWaitingPlayers(updatedPlayers.map((p, i) => ({
    name: p.name, color: PLAYER_COLORS[i], tag: p.name === onlineName ? 'Bạn' : (i === 0 ? 'Host' : `P${i+1}`),
  })));
  document.getElementById('start-online-btn').classList.add('hidden');

  roomRef.on('value', onRoomUpdate);
}

function leaveRoom() {
  if (roomRef) { roomRef.off(); if (myRole === 'host') roomRef.remove(); }
  roomCode = null; myRole = null; roomRef = null;
  showScreen('mode');
}

async function startOnlineGame() {
  if (!roomRef || myRole !== 'host') return;

  const subject = document.getElementById('online-subject-group').querySelector('.active').dataset.value;
  const difficulty = document.getElementById('online-difficulty-group').querySelector('.active').dataset.value;

  // Fetch questions
  let questions = [];
  try {
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=40`);
    questions = await res.json();
  } catch {}
  if (!questions.length) questions = Array.from({length: 30}, (_, i) => ({ id: i, question_text: `${Math.floor(Math.random()*50)+1} + ${Math.floor(Math.random()*50)+1} = ?`, option_a: '1', option_b: '2', option_c: '3', option_d: '4', correct_answer: 'a' }));

  await roomRef.update({
    state: 'playing',
    questions: shuffleArray(questions),
    questionIdx: 0,
    currentPlayerIdx: 0,
    round: 1,
    turnAction: 'roll',
    board: BOARD.map(c => ({ owner: null })),
  });
}

function onRoomUpdate(snapshot) {
  const data = snapshot.val();
  if (!data) {
    showPopup('<h3>😢 Phòng đã bị đóng</h3><div style="margin-top:14px;"><button class="popup-btn btn-ok" onclick="hidePopup(); showScreen(\'mode\');">OK</button></div>');
    roomRef.off(); roomCode = null; return;
  }

  const maxPlayers = data.settings?.maxPlayers || 2;
  const players = data.players || [];

  // Waiting room updates
  if (data.state === 'waiting') {
    // Find my index
    const myIdx = players.findIndex(p => p.name === onlineName);

    document.getElementById('waiting-status').textContent = `Đang đợi (${players.length}/${maxPlayers} người)...`;
    renderWaitingPlayers(players.map((p, i) => ({
      name: p.name, color: PLAYER_COLORS[i],
      tag: p.name === onlineName ? 'Bạn' : (i === 0 ? 'Host' : `P${i+1}`),
    })));

    // Host can start when ≥2 players
    if (myRole === 'host' && players.length >= 2) {
      document.getElementById('start-online-btn').classList.remove('hidden');
      document.getElementById('start-online-btn').disabled = false;
      document.getElementById('start-online-btn').textContent = '🎲 Bắt đầu!';
    }
  }

  // Game started
  if (data.state === 'playing' && !state.online) {
    onlineMode = true;
    state.online = true;
    state.myIdx = players.findIndex(p => p.name === onlineName);
    state.players = players.map((p, i) => ({ ...p, id: i, isBot: false, color: PLAYER_COLORS[i] }));
    state.board = BOARD.map((c, i) => ({ ...c, owner: data.board ? (data.board[i]?.owner ?? null) : null }));
    state.currentPlayerIdx = data.currentPlayerIdx;
    state.round = data.round;
    state.gameOver = false;
    showScreen('game');
    renderBoard();
    renderPlayersBar();
    updateRound();
  }

  // Sync game state during play
  if (data.state === 'playing' && state.online) {
    if (data.players) {
      data.players.forEach((p, i) => {
        if (state.players[i]) {
          state.players[i].money = p.money;
          state.players[i].position = p.position;
          state.players[i].properties = p.properties || [];
          state.players[i].bankrupt = p.bankrupt || false;
        }
      });
    }
    if (data.board) data.board.forEach((c, i) => { if (c && state.board[i]) state.board[i].owner = c.owner ?? null; });
    state.currentPlayerIdx = data.currentPlayerIdx;
    state.round = data.round || state.round;

    renderBoard();
    renderPlayersBar();
    updateRound();

    // Handle turn actions
    const isMyTurn = data.currentPlayerIdx === state.myIdx;
    const centerRollBtn = document.getElementById('center-roll-btn');
    const centerInfo = document.getElementById('center-info');

    if (data.turnAction === 'roll') {
      if (isMyTurn) {
        if (centerInfo) centerInfo.textContent = 'Lượt của bạn! Tung xúc xắc!';
        if (centerRollBtn) { centerRollBtn.disabled = false; centerRollBtn.onclick = onlineDiceClick; }
      } else {
        if (centerInfo) centerInfo.textContent = `Đợi ${state.players[data.currentPlayerIdx]?.name || '...'}...`;
        if (centerRollBtn) centerRollBtn.disabled = true;
      }
    }

    // Dice result from others
    if (data.lastDice && data.lastDice.timestamp > (state._lastDiceTs || 0)) {
      state._lastDiceTs = data.lastDice.timestamp;
      state.lastDice = [data.lastDice.die1, data.lastDice.die2];
      showDiceFace('dice-box-1', data.lastDice.die1);
      showDiceFace('dice-box-2', data.lastDice.die2);
      setActionInfo(`🎲 ${data.lastDice.die1} + ${data.lastDice.die2} = ${data.lastDice.die1 + data.lastDice.die2} bước`);
    }

    if (data.actionText) setActionInfo(data.actionText);
  }

  // Game over
  if (data.state === 'finished') {
    handleOnlineGameOver(data);
  }
}

function onlineDiceClick() {
  const centerRollBtn = document.getElementById('center-roll-btn');
  if (centerRollBtn) centerRollBtn.disabled = true;

  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  const total = die1 + die2;

  sfxDice();
  const w1 = document.getElementById('dice-box-1');
  const w2 = document.getElementById('dice-box-2');
  const container = document.querySelector('.center-dice-row');
  if (container) container.classList.add('rolling');
  if (w1) { w1.style.setProperty('--rx-dir', Math.random()>0.5?'1':'-1'); w1.style.setProperty('--ry-dir', Math.random()>0.5?'1':'-1'); w1.style.setProperty('--rz-dir', Math.random()>0.5?'1':'-1'); w1.classList.add('rolling'); }
  if (w2) { w2.style.setProperty('--rx-dir', Math.random()>0.5?'1':'-1'); w2.style.setProperty('--ry-dir', Math.random()>0.5?'1':'-1'); w2.style.setProperty('--rz-dir', Math.random()>0.5?'1':'-1'); w2.classList.add('rolling'); }

  setTimeout(() => {
    if (container) container.classList.remove('rolling');
    if (w1) { w1.classList.remove('rolling'); w1.classList.add('bounce'); showDiceFace('dice-box-1', die1); }
    if (w2) { w2.classList.remove('rolling'); w2.classList.add('bounce'); showDiceFace('dice-box-2', die2); }
    state.lastDice = [die1, die2];
    setTimeout(() => { if(w1) w1.classList.remove('bounce'); if(w2) w2.classList.remove('bounce'); }, 500);
  }, 1000);

  // Calculate new position and update Firebase
  setTimeout(() => {
    const player = state.players[state.myIdx];
    const newPos = (player.position + total) % BOARD_SIZE;
    const passedStart = (player.position + total) >= BOARD_SIZE;
    const newMoney = player.money + (passedStart ? 200 : 0);

    const updates = {
      [`players/${state.myIdx}/position`]: newPos,
      [`players/${state.myIdx}/money`]: newMoney,
      lastDice: { die1, die2, timestamp: Date.now() },
      turnAction: 'landed',
      actionText: `🎲 ${player.name}: ${die1} + ${die2} = ${total} bước`,
    };

    roomRef.update(updates).then(() => {
      // Handle landing logic (simplified for online — host resolves)
      handleOnlineLanding(newPos);
    });
  }, 1500);
}

function handleOnlineLanding(cellIdx) {
  const cell = BOARD[cellIdx];
  const player = state.players[state.myIdx];

  if (cell.type === 'quiz') {
    showOnlineQuiz(player, cell);
  } else if (cell.type === 'land' && cell.owner === null) {
    showOnlineQuiz(player, cell); // Quiz to buy
  } else if (cell.type === 'land' && cell.owner !== null && cell.owner !== state.myIdx) {
    // Pay rent
    const rent = getRent(cell);
    roomRef.update({
      [`players/${state.myIdx}/money`]: player.money - rent,
      [`players/${cell.owner}/money`]: state.players[cell.owner].money + rent,
      actionText: `💰 ${player.name} trả ${rent}💰 tiền thuê cho ${state.players[cell.owner].name}`,
      turnAction: 'done',
    });
    sfxRent();
  } else if (cell.type === 'lucky') {
    const event = LUCKY_EVENTS[Math.floor(Math.random() * LUCKY_EVENTS.length)];
    let newMoney = player.money + (event.amount || 0);
    roomRef.update({
      [`players/${state.myIdx}/money`]: newMoney,
      actionText: event.text,
      turnAction: 'done',
    });
    sfxLucky();
  } else if (cell.type === 'tax') {
    roomRef.update({
      [`players/${state.myIdx}/money`]: player.money - cell.rent,
      actionText: `💰 ${player.name} nộp thuế ${cell.rent}💰`,
      turnAction: 'done',
    });
  } else {
    roomRef.update({ turnAction: 'done' });
  }

  // Advance turn after delay
  setTimeout(() => {
    if (myRole === 'host') {
      // Find next non-bankrupt player
      let nextIdx = (state.currentPlayerIdx + 1) % state.players.length;
      let attempts = 0;
      while (state.players[nextIdx]?.bankrupt && attempts < state.players.length) {
        nextIdx = (nextIdx + 1) % state.players.length;
        attempts++;
      }
      const nextRound = nextIdx <= state.currentPlayerIdx ? state.round + 1 : state.round;
      roomRef.update({ currentPlayerIdx: nextIdx, round: nextRound, turnAction: 'roll' });
    }
  }, 2000);
}

function showOnlineQuiz(player, cell) {
  roomRef.once('value').then(snap => {
    const data = snap.val();
    const idx = data.questionIdx || 0;
    const q = data.questions[idx];
    if (!q) { roomRef.update({ turnAction: 'done' }); return; }

    roomRef.update({ questionIdx: idx + 1 });

    const isLand = cell.type === 'land';
    const title = isLand ? `🏘️ ${cell.name} (${cell.price}💰)` : '❓ Câu hỏi';
    const desc = isLand ? 'Đúng = mua miễn phí!' : 'Đúng +100💰!';

    showPopup(`
      <h3>${title}</h3><p>${desc}</p>
      <p style="margin-top:10px;font-size:1.05rem;font-weight:800;">${q.question_text}</p>
      <div class="quiz-options">
        <button class="quiz-opt" data-ans="a">A. ${q.option_a}</button>
        <button class="quiz-opt" data-ans="b">B. ${q.option_b}</button>
        <button class="quiz-opt" data-ans="c">C. ${q.option_c}</button>
        <button class="quiz-opt" data-ans="d">D. ${q.option_d}</button>
      </div>
    `);

    $popupContent.querySelectorAll('.quiz-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        $popupContent.querySelectorAll('.quiz-opt').forEach(b => b.style.pointerEvents = 'none');
        const correct = btn.dataset.ans.toLowerCase() === q.correct_answer.toLowerCase();
        btn.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) {
          const cb = $popupContent.querySelector(`.quiz-opt[data-ans="${q.correct_answer}"]`);
          if (cb) cb.classList.add('correct');
        }

        setTimeout(() => {
          hidePopup();
          if (correct) {
            sfxCorrect();
            if (isLand) {
              sfxBuy();
              roomRef.update({
                [`board/${cell.id}/owner`]: state.myIdx,
                actionText: `✅ ${player.name} mua ${cell.name}!`,
                turnAction: 'done',
              });
            } else {
              roomRef.update({
                [`players/${state.myIdx}/money`]: player.money + 100,
                actionText: `✅ ${player.name} đúng! +100💰`,
                turnAction: 'done',
              });
            }
          } else {
            sfxWrong();
            roomRef.update({
              actionText: `❌ ${player.name} sai!`,
              turnAction: 'done',
            });
          }
        }, 1000);
      });
    });
  });
}

function handleOnlineGameOver(data) {
  state.gameOver = true;
  roomRef.off();

  const ranked = [...state.players].sort((a, b) => {
    if (a.bankrupt && !b.bankrupt) return 1;
    if (!a.bankrupt && b.bankrupt) return -1;
    return b.money - a.money;
  });

  const medals = ['🥇', '🥈', '🥉', '4️⃣'];
  let html = '';
  ranked.forEach((p, i) => {
    html += `<div class="rank-item ${i===0?'winner':''}"><div class="rank-pos">${medals[i]||''}</div><div class="rank-info"><div class="rank-name">${p.name}</div><div class="rank-money">${p.bankrupt?'💀 Phá sản':p.money+' 💰'}</div></div></div>`;
  });

  $resultRankings.innerHTML = html;
  $resultTitle.textContent = `🏆 ${ranked[0].name} thắng!`;
  showScreen('result');
  roomCode = null;
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

// --- Init ---
initSetup();

// ===== CHARACTER SYSTEM INTEGRATION (presentation only) =====
// Mounts animated tycoon sprites on the board tokens + a money-bag mascot in
// the board centre, wires the guide/exit modals, and adds particle bursts on
// positive events. All additive — no game logic is modified.
(function () {
  'use strict';

  const SLOT_COLORS = (typeof PLAYER_COLORS !== 'undefined')
    ? PLAYER_COLORS
    : ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0'];

  // Normalise a hex colour to "r,g,b" for matching against computed styles.
  function hexToKey(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex.trim());
    if (!m) return hex.toLowerCase();
    return parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16);
  }
  function rgbToKey(rgb) {
    const m = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(rgb || '');
    return m ? (m[1] + ',' + m[2] + ',' + m[3]) : '';
  }
  const COLOR_TO_SLOT = {};
  SLOT_COLORS.forEach((c, i) => { COLOR_TO_SLOT[hexToKey(c)] = i; });

  // index → mounted character (rebuilt every renderBoard)
  let tokenChars = {};
  let bagChar = null;

  function mountTokens() {
    tokenChars = {};
    const C = window.HocVuiCharacters;
    document.querySelectorAll('#board .cell-players .token').forEach(host => {
      // Resolve which player slot this token belongs to via its colour.
      let slot = COLOR_TO_SLOT[rgbToKey(getComputedStyle(host).backgroundColor)];
      if (slot === undefined) {
        const inline = host.getAttribute('style') || '';
        const hm = /#([0-9a-fA-F]{6})/.exec(inline);
        if (hm) slot = COLOR_TO_SLOT[hexToKey(hm[0])];
      }
      const speciesId = 'tycoon' + (slot != null ? slot : 0);
      if (C && C.hasSpecies(speciesId)) {
        host.textContent = '';
        host.classList.add('token--sprite');
        const ch = C.createCharacter(speciesId, host, { state: 'idle' });
        if (slot != null) tokenChars[slot] = ch;
      }
      // else: leave the existing emoji fallback in place.
    });
  }

  function mountMascot() {
    const center = document.querySelector('#board .board-center');
    if (!center) return;
    if (center.querySelector('.mascot-host')) return;
    const C = window.HocVuiCharacters;
    const host = document.createElement('div');
    host.className = 'mascot-host';
    // Insert mascot above the dice row.
    center.insertBefore(host, center.firstChild);
    if (C && C.hasSpecies('moneybag')) {
      bagChar = C.createCharacter('moneybag', host, { state: 'idle' });
    } else {
      host.textContent = '💰';
    }
  }

  // Particle helper — sparkle/confetti bursts around an element.
  function spawnParticles(parent, kind, count) {
    if (!parent) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'pfx pfx-' + kind;
      p.style.setProperty('--tx', (Math.random() * 70 - 35) + 'px');
      p.style.setProperty('--ty', -(Math.random() * 45 + 20) + 'px');
      p.style.setProperty('--delay', (Math.random() * 0.15) + 's');
      parent.appendChild(p);
      p.addEventListener('animationend', () => p.remove(), { once: true });
    }
  }
  window.__v11_spawnParticles = spawnParticles;

  // Resolve the slot index of the player whose turn is currently active.
  function activeSlot() {
    try {
      if (typeof onlineMode !== 'undefined' && onlineMode && state && state.myIdx != null) {
        // In online play the local player only animates on their own turn.
        return state.currentPlayerIdx;
      }
      return state ? state.currentPlayerIdx : 0;
    } catch (e) { return 0; }
  }

  // Celebrate on the active player's token: happy bounce + sparkles.
  function celebrateActive() {
    const slot = activeSlot();
    const ch = tokenChars[slot];
    if (ch) {
      ch.setState('happy');
      spawnParticles(ch.root, 'sparkle', 6);
      setTimeout(() => { try { ch.setState('idle'); } catch (e) {} }, 700);
    }
    if (bagChar) {
      bagChar.setState('happy');
      setTimeout(() => { try { bagChar.setState('idle'); } catch (e) {} }, 700);
    }
  }

  // Wrap renderBoard so sprites are (re)mounted after every board paint.
  if (typeof window.renderBoard === 'function' || typeof renderBoard === 'function') {
    const origRender = renderBoard;
    renderBoard = function () {
      const r = origRender.apply(this, arguments);
      try { mountTokens(); mountMascot(); } catch (e) {}
      return r;
    };
  }

  // Wrap positive-event sound effects as cheap, reliable celebration hooks.
  // sfxCorrect → correct answer, sfxBuy → bought land/earned, sfxLucky → bonus.
  ['sfxCorrect', 'sfxBuy', 'sfxLucky'].forEach(function (name) {
    if (typeof window[name] === 'function') {
      const orig = window[name];
      window[name] = function () {
        const r = orig.apply(this, arguments);
        try { celebrateActive(); } catch (e) {}
        return r;
      };
    }
  });

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
        // Stop loops/turns and detach the online room before leaving.
        try { if (typeof state !== 'undefined') state.gameOver = true; } catch (e) {}
        try { if (typeof roomRef !== 'undefined' && roomRef) roomRef.off(); } catch (e) {}
        window.location.reload();
      });
      exit.addEventListener('click', e => { if (e.target === exit) exit.style.display = 'none'; });
    }
  });
})();
