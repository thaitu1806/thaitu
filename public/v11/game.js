// ===== TỈ PHÚ TRÍ TUỆ - Game Engine =====

// --- Profile check ---
(function() {
  const profile = localStorage.getItem('hocvui_profile');
  if (!profile) {
    window.location.href = '/home.html';
  }
})();

// --- Board data ---
const BOARD = [
  { id: 0, type: 'start', name: 'Xuất phát', icon: '🏠', price: 0, rent: 0 },
  { id: 1, type: 'land', name: 'Hà Nội', icon: '🏙️', price: 300, rent: 60 },
  { id: 2, type: 'quiz', name: 'Câu hỏi', icon: '❓', price: 0, rent: 0 },
  { id: 3, type: 'land', name: 'Hải Phòng', icon: '🌾', price: 200, rent: 40 },
  { id: 4, type: 'land', name: 'Huế', icon: '🏛️', price: 250, rent: 50 },
  { id: 5, type: 'lucky', name: 'Hộp quà', icon: '🎁', price: 0, rent: 0 },
  { id: 6, type: 'land', name: 'Đà Nẵng', icon: '🏖️', price: 280, rent: 55 },
  { id: 7, type: 'land', name: 'Nha Trang', icon: '🌴', price: 260, rent: 50 },
  { id: 8, type: 'tax', name: 'Thuế', icon: '💰', price: 0, rent: 100 },
  { id: 9, type: 'land', name: 'Đà Lạt', icon: '🌺', price: 270, rent: 55 },
  { id: 10, type: 'land', name: 'TP.HCM', icon: '🏙️', price: 350, rent: 70 },
  { id: 11, type: 'quiz', name: 'Câu hỏi', icon: '❓', price: 0, rent: 0 },
  { id: 12, type: 'land', name: 'Cần Thơ', icon: '🍜', price: 220, rent: 45 },
  { id: 13, type: 'land', name: 'Phú Quốc', icon: '🏝️', price: 300, rent: 60 },
  { id: 14, type: 'lucky', name: 'Hộp quà', icon: '🎁', price: 0, rent: 0 },
  { id: 15, type: 'land', name: 'Hạ Long', icon: '🎋', price: 290, rent: 55 },
  { id: 16, type: 'land', name: 'Sapa', icon: '🌿', price: 240, rent: 48 },
  { id: 17, type: 'tax', name: 'Thuế', icon: '💰', price: 0, rent: 150 },
  { id: 18, type: 'land', name: 'Hội An', icon: '🏺', price: 280, rent: 55 },
  { id: 19, type: 'land', name: 'Vũng Tàu', icon: '🌊', price: 230, rent: 45 },
];

const LUCKY_EVENTS = [
  { text: '🎉 Trúng xổ số! +200 coin', amount: 200, type: 'gain' },
  { text: '💸 Phạt vi phạm! -100 coin', amount: -100, type: 'lose' },
  { text: '🎁 Quà sinh nhật! +150 coin', amount: 150, type: 'gain' },
  { text: '🏠 Nhận thừa kế! +1 đất miễn phí', amount: 0, type: 'free_land' },
  { text: '⚡ Sét đánh! Mất 1 đất', amount: 0, type: 'lose_land' },
];

const PLAYER_COLORS = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0'];
const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

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
const $setupScreen = document.getElementById('setup-screen');
const $gameScreen = document.getElementById('game-screen');
const $resultScreen = document.getElementById('result-screen');
const $playerCountGroup = document.getElementById('player-count-group');
const $subjectGroup = document.getElementById('subject-group');
const $difficultyGroup = document.getElementById('difficulty-group');
const $playerSlots = document.getElementById('player-slots');
const $startBtn = document.getElementById('start-btn');
const $helpBtn = document.getElementById('help-btn');
const $helpOverlay = document.getElementById('help-overlay');
const $playersBar = document.getElementById('players-bar');
const $roundNum = document.getElementById('round-num');
const $board = document.getElementById('board');
const $boardContainer = document.getElementById('board-container');
const $diceBtn = document.getElementById('dice-btn');
const $diceResult = document.getElementById('dice-result');
const $actionInfo = document.getElementById('action-info');
const $popupOverlay = document.getElementById('popup-overlay');
const $popupContent = document.getElementById('popup-content');
const $resultTitle = document.getElementById('result-title');
const $resultRankings = document.getElementById('result-rankings');
const $playAgainBtn = document.getElementById('play-again-btn');

// --- Setup logic ---
let setupPlayerCount = 3;

function initSetup() {
  renderPlayerSlots();
  bindSetupEvents();
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
  $helpBtn.addEventListener('click', () => $helpOverlay.classList.remove('hidden'));
  $playAgainBtn.addEventListener('click', () => {
    showScreen('setup');
    resetState();
  });

  $diceBtn.addEventListener('click', onDiceClick);
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
        <input type="text" class="slot-name" data-idx="${i}" value="${defaultName}" maxlength="10" ${isFirst ? '' : ''}>
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
    let url;
    if (subject === 'mix') {
      // Fetch both subjects
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
  $setupScreen.classList.remove('active');
  $gameScreen.classList.remove('active');
  $resultScreen.classList.remove('active');
  if (name === 'setup') $setupScreen.classList.add('active');
  if (name === 'game') $gameScreen.classList.add('active');
  if (name === 'result') $resultScreen.classList.add('active');
}

function resetState() {
  state.gameOver = false;
  state.turnInProgress = false;
}

// --- Render board ---

// Grid positions for 20 cells on a 6x6 rectangular loop
// Format: [row, col] (1-indexed for CSS grid)
const GRID_POSITIONS = [
  // Bottom row: cells 0-5 (left to right), row 6
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6],
  // Right column: cells 6-10 (bottom to top), col 6
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6],
  // Top row: cells 11-15 (right to left), row 1
  [1, 5], [1, 4], [1, 3], [1, 2], [1, 1],
  // Left column: cells 16-19 (top to bottom), col 1
  [2, 1], [3, 1], [4, 1], [5, 1],
];

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
      `<div class="token" style="background:${p.color}" title="${p.name}"></div>`
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

  // Center area with horse + 2 dice
  html += `
    <div class="board-center">
      <div class="center-horse" id="center-horse">🐴</div>
      <div class="center-dice-row">
        <div class="center-die" id="center-die-1">⚀</div>
        <div class="center-die" id="center-die-2">⚀</div>
      </div>
      <div class="center-info" id="center-info"></div>
    </div>
  `;

  $board.innerHTML = html;
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

  const player = getCurrentPlayer();
  if (player.bankrupt) {
    nextPlayer();
    return;
  }

  state.turnInProgress = true;
  renderPlayersBar();
  $diceResult.classList.add('hidden');
  $actionInfo.textContent = `Lượt: ${player.name}`;

  // Update center info and horse color
  const centerInfo = document.getElementById('center-info');
  if (centerInfo) centerInfo.textContent = `Lượt: ${player.name}`;
  const centerHorse = document.getElementById('center-horse');
  if (centerHorse) {
    centerHorse.style.color = player.color;
    centerHorse.style.textShadow = `0 0 12px ${player.color}`;
  }

  if (player.isBot) {
    $diceBtn.disabled = true;
    setTimeout(() => botTurn(), 1500);
  } else {
    $diceBtn.disabled = false;
  }

  // Scroll to player position
  scrollToCell(player.position);
}

function scrollToCell(idx) {
  // No scrolling needed - board is always fully visible in grid layout
}

function onDiceClick() {
  if (state.gameOver || !state.turnInProgress) return;
  const player = getCurrentPlayer();
  if (player.isBot || player.bankrupt) return;
  $diceBtn.disabled = true;
  rollDice();
}

function rollDice() {
  const value = Math.floor(Math.random() * 6) + 1;
  sfxDice();
  $diceResult.textContent = DICE_FACES[value - 1];
  $diceResult.classList.remove('hidden');
  $diceResult.style.animation = 'none';
  void $diceResult.offsetWidth;
  $diceResult.style.animation = 'diceAnim 0.5s ease';

  // Update center dice display (split into 2 dice visually)
  const die1 = Math.ceil(value / 2);
  const die2 = value - die1;
  const centerDie1 = document.getElementById('center-die-1');
  const centerDie2 = document.getElementById('center-die-2');
  if (centerDie1) centerDie1.textContent = DICE_FACES[Math.max(0, die1 - 1)];
  if (centerDie2) centerDie2.textContent = DICE_FACES[Math.max(0, die2 - 1)];

  setTimeout(() => movePlayer(value), 600);
}

function movePlayer(steps) {
  const player = getCurrentPlayer();
  const oldPos = player.position;
  const newPos = (oldPos + steps) % 20;

  // Check if passed START
  if (newPos < oldPos || (oldPos + steps >= 20)) {
    player.money += 200;
    $actionInfo.textContent = `${player.name} đi qua Xuất phát! +200 🪙`;
  }

  player.position = newPos;
  renderBoard();
  renderPlayersBar();
  scrollToCell(newPos);

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
    // Unowned - ask quiz to buy free
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
  // Show quiz popup - correct = buy free, wrong = pay or skip
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

  // Bind answer buttons
  $popupContent.querySelectorAll('.quiz-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const ans = btn.dataset.ans;
      const correct = q.correct_answer.toUpperCase();
      const isCorrect = ans === correct;

      // Show result
      $popupContent.querySelectorAll('.quiz-opt').forEach(b => {
        if (b.dataset.ans === correct) b.classList.add('correct');
        if (b.dataset.ans === ans && !isCorrect) b.classList.add('wrong');
        b.style.pointerEvents = 'none';
      });

      if (isCorrect) {
        sfxCorrect();
        sfxBuy();
        // Buy for free
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
        // Must pay or skip
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
    player.money += event.amount; // negative
  } else if (event.type === 'free_land') {
    // Give random unowned land
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
  // Return properties to unowned
  player.properties.forEach(propId => {
    const cell = state.board.find(c => c.id === propId);
    if (cell) cell.owner = null;
  });
  player.properties = [];

  $actionInfo.textContent = `💀 ${player.name} phá sản!`;
  renderBoard();
  renderPlayersBar();

  // Check win condition
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
  // Bot answers quiz with 60% correct rate
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
      // Bot always buys if can afford
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

  if (state.gameOver) return;

  // Check win condition
  const activePlayers = state.players.filter(p => !p.bankrupt);
  if (activePlayers.length <= 1) {
    setTimeout(() => endGame(), 800);
    return;
  }

  setTimeout(() => nextPlayer(), 1000);
}

function nextPlayer() {
  if (state.gameOver) return;

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

  // Rank by money (non-bankrupt first, then by money)
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

// --- Init ---
initSetup();
