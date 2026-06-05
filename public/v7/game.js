// V7 Leo Núi Trí Tuệ - Knowledge Climbing
// Vertical board, branching paths, combo system, weather events, items

const COLORS = ['#e74c3c', '#3498db', '#27ae60', '#f39c12'];
const EMOJIS = ['🧗‍♂️', '🧗‍♀️', '🏂', '⛷️'];
const NAMES_DEFAULT = ['Người chơi 1', 'Người chơi 2', 'Người chơi 3', 'Người chơi 4'];

const WEATHER_EVENTS = [
  { emoji: '🌧️', text: 'Mưa to! Tất cả trượt 1 ô!', effect: 'rain' },
  { emoji: '☀️', text: 'Nắng đẹp! Bonus turn!', effect: 'sun' },
  { emoji: '⚡', text: 'Sấm sét! Random 1 người lùi 2 ô!', effect: 'thunder' },
  { emoji: '🌈', text: 'Cầu vồng! Tất cả tiến 1 ô!', effect: 'rainbow' },
];

const ITEMS = [
  { emoji: '🛡️', name: 'Khiên', desc: 'Chống trượt 1 lần' },
  { emoji: '⚡', name: 'Tia sét', desc: 'Đẩy đối thủ lùi 2 ô' },
  { emoji: '🪜', name: 'Thang', desc: 'Nhảy +3 ô' },
];

// ===== STATE =====
const State = {
  screen: 'setup',
  config: { playerCount: 2, subject: 'math', difficulty: 'easy', height: 15 },
  players: [],
  currentPlayerIndex: 0,
  board: [], // array of rows, each row has tiles
  questions: [],
  questionIndex: 0,
  combo: 0,
  turnCount: 0,
  weatherCountdown: 0,
};

// ===== PLAYER SLOTS =====
function renderPlayerSlots() {
  const container = document.getElementById('player-slots');
  if (!container) return;
  const count = State.config.playerCount;
  const profile = JSON.parse(localStorage.getItem('hocvui_profile') || 'null');
  
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const isFirst = i === 0;
    const defaultName = isFirst && profile?.name ? profile.name : NAMES_DEFAULT[i];
    const defaultType = isFirst ? 'human' : 'bot';
    
    container.innerHTML += `
      <div class="player-slot" data-index="${i}">
        <div class="player-slot-color" style="background:${COLORS[i]}">${EMOJIS[i]}</div>
        <div class="player-slot-info">
          <input type="text" class="player-slot-name" data-index="${i}" value="${defaultName}" maxlength="10">
          <div class="player-slot-type">${defaultType === 'human' ? '👤 Người chơi' : '🤖 Máy'}</div>
        </div>
        <button class="btn-toggle-type ${defaultType === 'human' ? 'is-human' : 'is-bot'}" data-index="${i}" data-type="${defaultType}">
          ${defaultType === 'human' ? '👤' : '🤖'}
        </button>
      </div>
    `;
  }
  
  // Bind toggles
  container.querySelectorAll('.btn-toggle-type').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index);
      const slot = container.querySelector(`.player-slot[data-index="${idx}"]`);
      const typeLabel = slot.querySelector('.player-slot-type');
      if (btn.dataset.type === 'human') {
        btn.dataset.type = 'bot';
        btn.textContent = '🤖';
        btn.classList.remove('is-human');
        btn.classList.add('is-bot');
        typeLabel.textContent = '🤖 Máy';
      } else {
        btn.dataset.type = 'human';
        btn.textContent = '👤';
        btn.classList.remove('is-bot');
        btn.classList.add('is-human');
        typeLabel.textContent = '👤 Người chơi';
      }
    });
  });
}

// ===== SETUP =====
document.getElementById('player-count-group').addEventListener('click', e => {
  const btn = e.target.closest('.btn-option');
  if (!btn) return;
  document.querySelectorAll('#player-count-group .btn-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  State.config.playerCount = parseInt(btn.dataset.count);
  renderPlayerSlots();
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

document.getElementById('height-slider').addEventListener('input', e => {
  State.config.height = parseInt(e.target.value);
  document.getElementById('height-display').textContent = e.target.value;
});

renderPlayerSlots();

document.getElementById('btn-start').addEventListener('click', startGame);

// ===== GAME INIT =====
async function startGame() {
  // Create players
  State.players = [];
  const slots = document.querySelectorAll('.player-slot');
  for (let i = 0; i < State.config.playerCount; i++) {
    const slot = slots[i];
    const nameInput = slot?.querySelector('.player-slot-name');
    const typeBtn = slot?.querySelector('.btn-toggle-type');
    const name = nameInput?.value.trim() || NAMES_DEFAULT[i];
    const type = typeBtn?.dataset.type || 'human';
    
    State.players.push({
      index: i,
      name: name,
      type: type,
      color: COLORS[i],
      emoji: EMOJIS[i],
      position: 0,
      combo: 0,
      items: [],
      stats: { correct: 0, incorrect: 0, turns: 0 },
    });
  }

  // Generate board
  generateBoard();

  // Fetch questions
  await fetchQuestions();

  // Switch screen
  showScreen('game-screen');
  renderBoard();
  renderPlayerPositions();
  State.currentPlayerIndex = 0;
  State.turnCount = 0;
  State.weatherCountdown = 4 + Math.floor(Math.random() * 3); // every 4-6 turns
  startTurn();
}

function generateBoard() {
  const height = State.config.height;
  State.board = [];

  for (let row = 0; row <= height; row++) {
    if (row === 0) {
      State.board.push([{ type: 'start', emoji: '🏕️' }]);
    } else if (row === height) {
      State.board.push([{ type: 'summit', emoji: '🏔️' }]);
    } else {
      // Random row: 1-3 tiles with different types
      const tileCount = row % 3 === 0 ? 3 : 2;
      const tiles = [];
      for (let t = 0; t < tileCount; t++) {
        const rand = Math.random();
        if (rand < 0.1 && row > 2) {
          tiles.push({ type: 'weather', emoji: '🌦️' });
        } else if (rand < 0.2) {
          tiles.push({ type: 'item', emoji: ITEMS[Math.floor(Math.random() * ITEMS.length)].emoji });
        } else if (rand < 0.5) {
          tiles.push({ type: 'easy', emoji: '' });
        } else if (rand < 0.8) {
          tiles.push({ type: 'normal', emoji: '' });
        } else {
          tiles.push({ type: 'hard', emoji: '⚠️' });
        }
      }
      State.board.push(tiles);
    }
  }
}

async function fetchQuestions() {
  const { subject, difficulty } = State.config;
  try {
    let questions;
    if (subject === 'mix') {
      const [math, viet] = await Promise.all([
        fetch(`/api/questions?subject=math&difficulty=${difficulty}&limit=20`).then(r => r.json()),
        fetch(`/api/questions?subject=vietnamese&difficulty=${difficulty}&limit=20`).then(r => r.json()),
      ]);
      questions = [...math, ...viet];
    } else {
      const res = await fetch(`/api/questions?subject=${subject}&difficulty=${difficulty}&limit=40`);
      questions = await res.json();
    }
    if (Array.isArray(questions) && questions.length > 0) {
      State.questions = shuffleArray(questions);
    } else {
      State.questions = generateFallback(30);
    }
  } catch {
    State.questions = generateFallback(30);
  }
  State.questionIndex = 0;
}

function getNextQuestion() {
  if (State.questionIndex >= State.questions.length) {
    State.questions = [...State.questions, ...generateFallback(15)];
  }
  return State.questions[State.questionIndex++];
}

function generateFallback(count) {
  const qs = [];
  for (let i = 0; i < count; i++) {
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 50) + 1;
    const correct = a + b;
    const opts = shuffleArray([correct, correct + 1, correct - 1, correct + 2]);
    qs.push({
      id: 9000 + i,
      question_text: `${a} + ${b} = ?`,
      option_a: String(opts[0]), option_b: String(opts[1]),
      option_c: String(opts[2]), option_d: String(opts[3]),
      correct_answer: 'abcd'['abcd'.split('').findIndex((_, idx) => opts[idx] === correct)],
    });
  }
  return qs;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== RENDERING =====
function renderBoard() {
  const board = document.getElementById('mountain-board');
  board.innerHTML = '';

  State.board.forEach((row, rowIdx) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'mountain-row';
    rowEl.dataset.row = rowIdx;

    row.forEach((tile, tileIdx) => {
      const tileEl = document.createElement('div');
      let cls = 'mountain-tile';
      if (tile.type === 'summit') cls += ' tile-summit';
      else if (tile.type === 'start') cls += ' tile-start';
      else if (tile.type === 'weather') cls += ' tile-weather';
      else if (tile.type === 'item') cls += ' tile-item';
      else if (tile.type === 'easy') cls += ' path-easy';
      else if (tile.type === 'hard') cls += ' path-hard';
      else cls += ' path-normal';

      tileEl.className = cls;
      tileEl.dataset.row = rowIdx;
      tileEl.dataset.tile = tileIdx;
      tileEl.textContent = tile.emoji || rowIdx;

      // Show climbers only on the first tile of this row
      if (tileIdx === 0) {
        State.players.forEach(p => {
          if (p.position === rowIdx) {
            const climber = document.createElement('span');
            climber.className = 'climber';
            climber.style.background = p.color;
            climber.textContent = p.emoji;
            tileEl.appendChild(climber);
          }
        });
      }

      rowEl.appendChild(tileEl);
    });

    board.appendChild(rowEl);
  });

  // Scroll to current player's position
  scrollToRow(State.players[State.currentPlayerIndex].position);
}

function scrollToRow(row) {
  const wrapper = document.getElementById('mountain-wrapper');
  const rowEl = wrapper.querySelector(`[data-row="${row}"]`);
  if (rowEl && wrapper) {
    setTimeout(() => rowEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }
}

function renderPlayerPositions() {
  const container = document.getElementById('player-positions');
  container.innerHTML = State.players.map(p =>
    `<div class="player-pos-item">
      <span class="player-pos-dot" style="background:${p.color}"></span>
      <span>${p.name}: ${p.position}/${State.config.height}</span>
    </div>`
  ).join('');
}

// ===== TURN FLOW =====
function startTurn() {
  const player = State.players[State.currentPlayerIndex];
  player.stats.turns++;
  State.turnCount++;

  // Check weather event
  State.weatherCountdown--;
  if (State.weatherCountdown <= 0) {
    triggerWeather();
    State.weatherCountdown = 4 + Math.floor(Math.random() * 3);
    return; // weather handles nextTurn
  }

  // Show question
  const q = getNextQuestion();
  showQuestion(player, q);
}

function showQuestion(player, question) {
  document.getElementById('turn-badge').textContent = `${player.emoji} ${player.name} - Lượt ${State.turnCount}`;
  document.getElementById('question-text').textContent = question.question_text;

  const opts = [question.option_a, question.option_b, question.option_c, question.option_d];
  const btns = document.querySelectorAll('#answer-buttons .ans-btn');
  btns.forEach((btn, i) => {
    btn.textContent = `${'ABCD'[i]}. ${opts[i]}`;
    btn.className = 'ans-btn';
    btn.disabled = false;
    btn.dataset.opt = 'abcd'[i];
  });

  // Update combo display
  updateComboDisplay(player);

  // Store current question reference
  State._currentQuestion = question;

  // Start countdown timer (10 seconds)
  startQuestionTimer(10);

  // Bot auto-answer
  if (player.type === 'bot') {
    const delay = 1000 + Math.random() * 2000;
    setTimeout(() => {
      if (State._currentQuestion !== question) return; // question changed
      const btns = document.querySelectorAll('#answer-buttons .ans-btn');
      if (btns[0]?.disabled) return; // already answered
      
      const isCorrect = Math.random() < 0.65;
      let opt;
      if (isCorrect) {
        opt = question.correct_answer;
      } else {
        const wrongs = ['a','b','c','d'].filter(o => o !== question.correct_answer);
        opt = wrongs[Math.floor(Math.random() * wrongs.length)];
      }
      const btn = document.querySelector(`#answer-buttons .ans-btn[data-opt="${opt}"]`);
      if (btn && !btn.disabled) btn.click();
    }, delay);
  }
}

function updateComboDisplay(player) {
  const el = document.getElementById('combo-display');
  if (player.combo >= 2) {
    el.textContent = `🔥 Combo x${player.combo}!`;
  } else {
    el.textContent = '';
  }
}

// ===== QUESTION TIMER =====
const QUESTION_TIME = 10; // seconds
let questionTimerId = null;

function startQuestionTimer(seconds) {
  clearInterval(questionTimerId);
  const bar = document.getElementById('q-timer-bar');
  if (!bar) return;
  bar.style.width = '100%';
  bar.className = 'timer-bar';

  const startTime = Date.now();
  const duration = seconds * 1000;

  questionTimerId = setInterval(() => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, 1 - elapsed / duration);
    bar.style.width = (remaining * 100) + '%';

    if (remaining <= 0.2) bar.className = 'timer-bar danger';
    else if (remaining <= 0.5) bar.className = 'timer-bar warn';

    if (elapsed >= duration) {
      clearInterval(questionTimerId);
      // Time's up — skip turn
      const player = State.players[State.currentPlayerIndex];
      player.combo = 0;
      document.querySelectorAll('#answer-buttons .ans-btn').forEach(b => b.disabled = true);
      document.getElementById('question-text').textContent = '⏰ Hết giờ! Bỏ lượt.';
      updateComboDisplay(player);
      renderPlayerPositions();
      setTimeout(() => {
        State.currentPlayerIndex = (State.currentPlayerIndex + 1) % State.players.length;
        startTurn();
        renderBoard();
      }, 1000);
    }
  }, 100);
}

function stopQuestionTimer() {
  clearInterval(questionTimerId);
}

// Answer handling
document.getElementById('answer-buttons').addEventListener('click', e => {
  const btn = e.target.closest('.ans-btn');
  if (!btn || btn.disabled) return;
  stopQuestionTimer();

  const player = State.players[State.currentPlayerIndex];
  const q = State._currentQuestion;
  const selected = btn.dataset.opt;
  const isCorrect = selected === q.correct_answer;

  // Disable all
  document.querySelectorAll('#answer-buttons .ans-btn').forEach(b => b.disabled = true);
  btn.classList.add(isCorrect ? 'correct' : 'wrong');
  if (!isCorrect) {
    const correctBtn = document.querySelector(`#answer-buttons .ans-btn[data-opt="${q.correct_answer}"]`);
    if (correctBtn) correctBtn.classList.add('correct');
  }

  if (isCorrect) {
    player.stats.correct++;
    player.combo++;
    const moveAmount = player.combo >= 3 ? 2 : 1; // combo x3+ = move 2
    movePlayer(player, moveAmount);
  } else {
    player.stats.incorrect++;
    player.combo = 0;
    // Wrong on hard tile = slide back 1
    const currentRow = State.board[player.position];
    if (currentRow && currentRow.some(t => t.type === 'hard')) {
      movePlayer(player, -1);
    }
  }

  updateComboDisplay(player);
  renderPlayerPositions();

  // Check win
  if (player.position >= State.config.height) {
    setTimeout(() => showVictory(player), 600);
    return;
  }

  // Next turn
  setTimeout(() => {
    State.currentPlayerIndex = (State.currentPlayerIndex + 1) % State.players.length;
    startTurn();
    renderBoard();
  }, 1000);
});

function movePlayer(player, amount) {
  player.position = Math.max(0, Math.min(player.position + amount, State.config.height));
  renderBoard();

  // Check item tile
  const row = State.board[player.position];
  if (row && row.some(t => t.type === 'item')) {
    const item = ITEMS[Math.floor(Math.random() * ITEMS.length)];
    player.items.push(item);
    showNotify(`${item.emoji} ${player.name} nhận ${item.name}!`);
  }
}

// ===== WEATHER =====
function triggerWeather() {
  const event = WEATHER_EVENTS[Math.floor(Math.random() * WEATHER_EVENTS.length)];
  const overlay = document.getElementById('weather-overlay');
  overlay.innerHTML = `<div class="weather-card"><div class="weather-emoji">${event.emoji}</div><div class="weather-text">${event.text}</div></div>`;
  overlay.classList.add('active');

  setTimeout(() => {
    // Apply effect
    switch (event.effect) {
      case 'rain':
        State.players.forEach(p => { p.position = Math.max(0, p.position - 1); });
        break;
      case 'sun':
        // Bonus: current player gets extra turn (don't advance index)
        break;
      case 'thunder': {
        const victim = State.players[Math.floor(Math.random() * State.players.length)];
        victim.position = Math.max(0, victim.position - 2);
        break;
      }
      case 'rainbow':
        State.players.forEach(p => { p.position = Math.min(State.config.height, p.position + 1); });
        break;
    }

    overlay.classList.remove('active');
    renderBoard();
    renderPlayerPositions();

    // Check win after weather
    const winner = State.players.find(p => p.position >= State.config.height);
    if (winner) {
      setTimeout(() => showVictory(winner), 400);
      return;
    }

    // Next turn (sun = same player)
    if (event.effect !== 'sun') {
      State.currentPlayerIndex = (State.currentPlayerIndex + 1) % State.players.length;
    }
    setTimeout(() => startTurn(), 500);
  }, 2000);
}

// ===== NOTIFY =====
function showNotify(text) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.85);color:#fff;padding:14px 24px;border-radius:14px;font-family:var(--font);font-weight:800;z-index:600;opacity:0;transition:opacity 0.3s;';
  el.textContent = text;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.style.opacity = '1');
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 1500);
}

// ===== VICTORY =====
function showVictory(winner) {
  showScreen('victory-screen');
  const container = document.getElementById('victory-container');
  container.innerHTML = `
    <div class="victory-trophy">🏆</div>
    <div class="victory-title">Lên đỉnh!</div>
    <div class="victory-name" style="color:${winner.color}">${winner.emoji} ${winner.name}</div>
    <div class="victory-stats">
      ${State.players.map(p => `
        <div class="victory-stat"><span style="color:${p.color}">${p.emoji} ${p.name}</span><span>✅${p.stats.correct} ❌${p.stats.incorrect}</span></div>
      `).join('')}
      <div class="victory-stat"><span>Tổng lượt</span><span>${State.turnCount}</span></div>
    </div>
    <div class="victory-btns">
      <button class="victory-btn play-again" onclick="location.reload()">🔄 Chơi lại</button>
      <button class="victory-btn go-home" onclick="location.href='/'">🏠 Về trang chủ</button>
    </div>
  `;
}

// ===== EXIT =====
document.getElementById('btn-exit').addEventListener('click', () => {
  document.getElementById('exit-overlay').classList.add('active');
});
document.getElementById('exit-cancel').addEventListener('click', () => {
  document.getElementById('exit-overlay').classList.remove('active');
});
document.getElementById('exit-confirm').addEventListener('click', () => {
  window.location.href = '/';
});

// ===== SCREEN MANAGEMENT =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
