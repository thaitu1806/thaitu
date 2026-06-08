// V12 Lật Hình Trí Tuệ - Quiz Memory Match
// Match question cards with answer cards

const PLAYER_COLORS = ['#9b59b6', '#3498db', '#27ae60', '#e74c3c'];

const State = {
  mode: 'solo',
  playerCount: 2,
  subject: 'math',
  gridSize: 8, // pairs count (total cards = gridSize * 2)
  players: [],
  currentPlayerIdx: 0,
  cards: [],
  flipped: [],
  matchedPairs: 0,
  totalPairs: 0,
  timerStart: 0,
  timerInterval: null,
  combo: 0,
  moves: 0,
};

// ===== SETUP =====
document.getElementById('mode-group').addEventListener('click', e => {
  const btn = e.target.closest('.btn-option');
  if (!btn) return;
  document.querySelectorAll('#mode-group .btn-option').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  State.mode = btn.dataset.mode;
  document.querySelectorAll('.versus-only').forEach(el => {
    el.classList.toggle('hidden', State.mode === 'solo');
  });
});

['player-count-group', 'subject-group', 'size-group'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', e => {
    const btn = e.target.closest('.btn-option');
    if (!btn) return;
    document.querySelectorAll(`#${id} .btn-option`).forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

document.getElementById('btn-start').addEventListener('click', startGame);

async function startGame() {
  State.subject = document.querySelector('#subject-group .active').dataset.subject;
  State.gridSize = parseInt(document.querySelector('#size-group .active').dataset.size);
  State.playerCount = State.mode === 'solo' ? 1 : parseInt(document.querySelector('#player-count-group .active')?.dataset.count || '2');
  State.totalPairs = State.gridSize;
  State.matchedPairs = 0;
  State.combo = 0;
  State.moves = 0;
  State.currentPlayerIdx = 0;
  State.flipped = [];

  // Create players
  State.players = [];
  for (let i = 0; i < State.playerCount; i++) {
    State.players.push({ name: State.playerCount === 1 ? 'Bạn' : `P${i+1}`, color: PLAYER_COLORS[i], score: 0 });
  }

  // Generate cards
  await generateCards();

  showScreen('game-screen');
  renderGrid();
  renderInfo();
  renderTurnBar();
  startTimer();
}

// ===== CARD GENERATION =====
async function generateCards() {
  const pairs = State.totalPairs;
  let questions = [];

  try {
    const subject = State.subject === 'mix' ? 'math' : State.subject;
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=easy&limit=${pairs}`);
    questions = await res.json();
    if (State.subject === 'mix') {
      const res2 = await fetch(`/api/questions?subject=vietnamese&difficulty=easy&limit=${Math.ceil(pairs/2)}`);
      const q2 = await res2.json();
      questions = [...questions.slice(0, Math.floor(pairs/2)), ...q2.slice(0, Math.ceil(pairs/2))];
    }
  } catch {}

  // Fallback
  if (!questions.length || questions.length < pairs) {
    questions = [];
    for (let i = 0; i < pairs; i++) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      questions.push({ id: i, question_text: `${a} + ${b} = ?`, correct_answer_text: String(a + b) });
    }
  }

  // Build card pairs: each pair = 1 question card + 1 answer card
  const cards = [];
  questions.slice(0, pairs).forEach((q, i) => {
    const answerText = q.correct_answer_text || getAnswerText(q);
    cards.push({ id: i, type: 'question', pairId: i, content: q.question_text });
    cards.push({ id: i + pairs, type: 'answer', pairId: i, content: answerText });
  });

  // Shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  State.cards = cards;
}

function getAnswerText(q) {
  // Extract correct answer text from options
  const key = q.correct_answer; // 'a', 'b', 'c', 'd'
  if (key === 'a') return q.option_a;
  if (key === 'b') return q.option_b;
  if (key === 'c') return q.option_c;
  if (key === 'd') return q.option_d;
  return '?';
}

// ===== RENDERING =====
function renderGrid() {
  const grid = document.getElementById('card-grid');
  grid.className = `card-grid size-${State.totalPairs * 2}`;

  // Determine columns based on total cards
  const totalCards = State.cards.length;
  if (totalCards <= 16) grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
  else if (totalCards <= 24) grid.style.gridTemplateColumns = 'repeat(4, 1fr)';
  else grid.style.gridTemplateColumns = 'repeat(4, 1fr)';

  grid.innerHTML = State.cards.map((card, idx) => `
    <div class="memory-card ${card.matched ? 'matched flipped' : ''}" data-idx="${idx}">
      <div class="card-inner">
        <div class="card-back">🧩</div>
        <div class="card-front type-${card.type}">${card.content}</div>
      </div>
    </div>
  `).join('');

  // Bind clicks
  grid.querySelectorAll('.memory-card').forEach(el => {
    el.addEventListener('click', () => onCardClick(parseInt(el.dataset.idx)));
  });
}

function renderInfo() {
  const info = document.getElementById('game-info');
  info.innerHTML = `<span>✅ ${State.matchedPairs}/${State.totalPairs}</span><span>🔄 ${State.moves}</span>${State.combo >= 2 ? `<span>🔥x${State.combo}</span>` : ''}`;
}

function renderTurnBar() {
  const bar = document.getElementById('turn-bar');
  if (State.mode === 'solo') { bar.innerHTML = ''; return; }
  bar.innerHTML = State.players.map((p, i) => `
    <div class="turn-player ${i === State.currentPlayerIdx ? 'active' : ''}" style="${i === State.currentPlayerIdx ? '' : 'background:transparent;color:var(--text);'}">
      <span style="color:${i === State.currentPlayerIdx ? '#fff' : p.color};">●</span>
      <span>${p.name}</span>
      <span class="score">${p.score}</span>
    </div>
  `).join('');
}

// ===== TIMER =====
function startTimer() {
  State.timerStart = Date.now();
  clearInterval(State.timerInterval);
  State.timerInterval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - State.timerStart) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    document.getElementById('timer').textContent = `⏱️ ${m}:${s.toString().padStart(2, '0')}`;
  }, 1000);
}

// ===== CARD CLICK LOGIC =====
let lockBoard = false;

function onCardClick(idx) {
  if (lockBoard) return;
  const card = State.cards[idx];
  if (card.matched) return;
  if (State.flipped.includes(idx)) return;

  // Flip card
  State.flipped.push(idx);
  const el = document.querySelectorAll('.memory-card')[idx];
  el.classList.add('flipped');

  if (State.flipped.length === 2) {
    State.moves++;
    lockBoard = true;
    checkMatch();
  }
}

function checkMatch() {
  const [idx1, idx2] = State.flipped;
  const card1 = State.cards[idx1];
  const card2 = State.cards[idx2];

  // Match if same pairId and different types (question + answer)
  const isMatch = card1.pairId === card2.pairId && card1.type !== card2.type;

  const el1 = document.querySelectorAll('.memory-card')[idx1];
  const el2 = document.querySelectorAll('.memory-card')[idx2];

  if (isMatch) {
    // Correct match!
    card1.matched = true;
    card2.matched = true;
    State.matchedPairs++;
    State.combo++;
    State.players[State.currentPlayerIdx].score++;

    el1.classList.add('matched');
    el2.classList.add('matched');

    State.flipped = [];
    lockBoard = false;
    renderInfo();
    renderTurnBar();

    // Check win
    if (State.matchedPairs >= State.totalPairs) {
      setTimeout(endGame, 500);
    }
  } else {
    // Wrong match
    State.combo = 0;
    el1.classList.add('wrong');
    el2.classList.add('wrong');

    setTimeout(() => {
      el1.classList.remove('flipped', 'wrong');
      el2.classList.remove('flipped', 'wrong');
      State.flipped = [];
      lockBoard = false;

      // Next player (versus mode)
      if (State.mode === 'versus') {
        State.currentPlayerIdx = (State.currentPlayerIdx + 1) % State.playerCount;
        renderTurnBar();
      }
      renderInfo();
    }, 1000);
  }
}

// ===== END GAME =====
function endGame() {
  clearInterval(State.timerInterval);
  const elapsed = Math.floor((Date.now() - State.timerStart) / 1000);
  const m = Math.floor(elapsed / 60);
  const s = elapsed % 60;

  showScreen('result-screen');
  const container = document.getElementById('result-container');

  let subtitle = '';
  if (State.mode === 'solo') {
    subtitle = `Thời gian: ${m}:${s.toString().padStart(2, '0')} | ${State.moves} lượt lật`;
  } else {
    const winner = [...State.players].sort((a, b) => b.score - a.score)[0];
    subtitle = `🏆 ${winner.name} thắng! (${winner.score} cặp)`;
  }

  container.innerHTML = `
    <div class="result-icon">🎉</div>
    <div class="result-title">Hoàn thành!</div>
    <div class="result-subtitle">${subtitle}</div>
    <div class="result-stats">
      ${State.players.map(p => `<div class="result-stat"><span style="color:${p.color}">● ${p.name}</span><span>${p.score} cặp</span></div>`).join('')}
      <div class="result-stat"><span>🔄 Tổng lượt lật</span><span>${State.moves}</span></div>
      <div class="result-stat"><span>⏱️ Thời gian</span><span>${m}:${s.toString().padStart(2, '0')}</span></div>
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
  document.getElementById(id)?.classList.add('active');
}
