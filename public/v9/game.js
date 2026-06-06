// V9 Đấu Tướng Trí Tuệ - Game Engine
// Chess-lite with quiz integration, bot AI, touch-first

// ===== CONSTANTS =====
const COLS = 4;
const ROWS = 6;
const BOT_ANSWER_RATE = 0.6; // 60% correct
const BOT_DELAY = 1500; // ms before bot acts
const QUIZ_RESULT_DELAY = 1200; // ms to show quiz result

// Piece types
const KING = 'king';
const SOLDIER = 'soldier';

// Players
const P1 = 1;
const P2 = 2;

// ===== GAME STATE =====
const State = {
  current: 'SETUP', // SETUP | LOADING | PLAYING | QUIZ | ANIMATING | GAME_OVER | RESULT
  settings: {
    p1Name: '',
    p2Name: 'Bot',
    p1Bot: false,
    p2Bot: true,
    subject: 'math',
    difficulty: 'easy',
  },
  board: [], // 2D array [row][col] = { player, type } | null
  turn: P1, // whose turn
  selectedPiece: null, // { row, col }
  validMoves: [], // [{ row, col, isCapture }]
  pendingMove: null, // { from, to }
  questions: [],
  questionIndex: 0,
  stats: {
    turns: 0,
    p1Correct: 0,
    p1Wrong: 0,
    p2Correct: 0,
    p2Wrong: 0,
  },
  winner: null,
  winReason: '',
};

// ===== AUDIO (Web Audio API) =====
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, duration, type = 'square') {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = 0.15;
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* ignore audio errors */ }
}
function sfxSelect() { playTone(600, 0.1); }
function sfxMove() { playTone(800, 0.15, 'triangle'); }
function sfxCapture() { playTone(200, 0.3, 'sawtooth'); }
function sfxCorrect() { playTone(880, 0.15); setTimeout(() => playTone(1100, 0.2), 100); }
function sfxWrong() { playTone(200, 0.3, 'sawtooth'); }
function sfxWin() { playTone(523, 0.2); setTimeout(() => playTone(659, 0.2), 150); setTimeout(() => playTone(784, 0.3), 300); }

// ===== INITIALIZATION =====
function initBoard() {
  // Create empty 6x4 board
  const board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // P1 (red) at bottom: rows 0-1 (visually bottom)
  // Row 0: Lính, Vua, Vua-placeholder, Lính → actually 1 Vua + 2 Lính
  // Layout: row 0 = [soldier, king, null, soldier], row 1 empty? 
  // Better: P1 row 0 center has king, flanks have soldiers
  // 4 cols: col 0,1,2,3
  // P1: King at (0, 1) or (0, 2), soldiers at (0, 0) and (0, 3)
  board[0][1] = { player: P1, type: KING };
  board[0][0] = { player: P1, type: SOLDIER };
  board[0][3] = { player: P1, type: SOLDIER };

  // P2 (blue) at top: row 5
  board[5][2] = { player: P2, type: KING };
  board[5][0] = { player: P2, type: SOLDIER };
  board[5][3] = { player: P2, type: SOLDIER };

  return board;
}

function getValidMoves(board, row, col) {
  const piece = board[row][col];
  if (!piece) return [];
  const moves = [];
  const { player, type } = piece;

  if (type === KING) {
    // King: 1 step in any of 8 directions
    const dirs = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for (const [dr, dc] of dirs) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
      const target = board[nr][nc];
      if (!target) {
        moves.push({ row: nr, col: nc, isCapture: false });
      } else if (target.player !== player) {
        moves.push({ row: nr, col: nc, isCapture: true });
      }
    }
  } else {
    // Soldier: moves forward 1, captures diagonally forward
    const forward = player === P1 ? 1 : -1;
    // Move forward (straight)
    const fr = row + forward;
    if (fr >= 0 && fr < ROWS) {
      const fc = col;
      if (!board[fr][fc]) {
        moves.push({ row: fr, col: fc, isCapture: false });
      }
      // Capture diagonally
      for (const dc of [-1, 1]) {
        const nc = col + dc;
        if (nc < 0 || nc >= COLS) continue;
        const target = board[fr][nc];
        if (target && target.player !== player) {
          moves.push({ row: fr, col: nc, isCapture: true });
        }
      }
    }
  }
  return moves;
}

function checkWin(board, lastMovePlayer) {
  // Win condition 1: Captured opponent's King
  let p1King = false, p2King = false;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.type === KING) {
        if (p.player === P1) p1King = true;
        if (p.player === P2) p2King = true;
      }
    }
  }
  if (!p1King) return { winner: P2, reason: 'Bắt được Vua đối phương!' };
  if (!p2King) return { winner: P1, reason: 'Bắt được Vua đối phương!' };

  // Win condition 2: King reaches opponent's back row
  // P1 king reaches row 5 (top)
  for (let c = 0; c < COLS; c++) {
    const p = board[5][c];
    if (p && p.player === P1 && p.type === KING) {
      return { winner: P1, reason: 'Vua đã đến hàng cuối đối phương!' };
    }
  }
  // P2 king reaches row 0 (bottom)
  for (let c = 0; c < COLS; c++) {
    const p = board[0][c];
    if (p && p.player === P2 && p.type === KING) {
      return { winner: P2, reason: 'Vua đã đến hàng cuối đối phương!' };
    }
  }

  return null;
}

// Check if a player has any valid moves
function hasAnyMoves(board, player) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = board[r][c];
      if (p && p.player === player) {
        if (getValidMoves(board, r, c).length > 0) return true;
      }
    }
  }
  return false;
}

// ===== API =====
async function fetchQuestions(subject, difficulty) {
  const params = new URLSearchParams({ limit: '30' });
  if (subject !== 'mix') params.set('subject', subject);
  if (difficulty !== 'mix') params.set('difficulty', difficulty);
  try {
    const res = await fetch(`/api/questions?${params}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (e) {
    console.warn('Failed to fetch questions, using fallback');
    return generateFallbackQuestions();
  }
}

function generateFallbackQuestions() {
  const questions = [];
  for (let i = 0; i < 30; i++) {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const correct = a + b;
    const options = shuffleArray([
      correct,
      correct + 1,
      correct - 1,
      correct + 2,
    ]);
    const correctOpt = ['a','b','c','d'][options.indexOf(correct)];
    questions.push({
      question: `${a} + ${b} = ?`,
      option_a: String(options[0]),
      option_b: String(options[1]),
      option_c: String(options[2]),
      option_d: String(options[3]),
      correct_answer: correctOpt,
    });
  }
  return questions;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== DOM HELPERS =====
function $(id) { return document.getElementById(id); }
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

// ===== SETUP SCREEN =====
function initSetup() {
  // Auto-fill from profile
  const profile = localStorage.getItem('hocvui_profile');
  if (!profile) {
    window.location.href = '/';
    return;
  }
  const { name } = JSON.parse(profile);
  $('p1-name').value = name || '';

  // Toggle bot/human buttons
  $('p1-type').addEventListener('click', () => toggleType('p1'));
  $('p2-type').addEventListener('click', () => toggleType('p2'));

  // Button groups
  setupBtnGroup('subject-group', v => { State.settings.subject = v; });
  setupBtnGroup('difficulty-group', v => { State.settings.difficulty = v; });

  // Start button
  $('btn-start').addEventListener('click', startGame);
}

function toggleType(player) {
  const btn = $(`${player}-type`);
  const input = $(`${player}-name`);
  if (btn.dataset.type === 'human') {
    btn.dataset.type = 'bot';
    btn.textContent = '🤖';
    btn.className = 'btn-toggle-type is-bot';
    if (!input.value || input.value === input.placeholder) input.value = 'Bot';
  } else {
    btn.dataset.type = 'human';
    btn.textContent = '👤';
    btn.className = 'btn-toggle-type is-human';
    if (input.value === 'Bot') input.value = '';
  }
}

function setupBtnGroup(groupId, onChange) {
  const group = $(groupId);
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-option');
    if (!btn) return;
    group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    onChange(btn.dataset.value);
  });
}

// ===== START GAME =====
async function startGame() {
  const p1Name = $('p1-name').value.trim() || 'Đỏ';
  const p2Name = $('p2-name').value.trim() || 'Xanh';
  const p1Bot = $('p1-type').dataset.type === 'bot';
  const p2Bot = $('p2-type').dataset.type === 'bot';

  State.settings.p1Name = p1Name;
  State.settings.p2Name = p2Name;
  State.settings.p1Bot = p1Bot;
  State.settings.p2Bot = p2Bot;

  // Reset state
  State.board = initBoard();
  State.turn = P1;
  State.selectedPiece = null;
  State.validMoves = [];
  State.pendingMove = null;
  State.questionIndex = 0;
  State.stats = { turns: 0, p1Correct: 0, p1Wrong: 0, p2Correct: 0, p2Wrong: 0 };
  State.winner = null;
  State.winReason = '';
  State.current = 'LOADING';

  $('btn-start').textContent = '⏳ Đang tải...';
  $('btn-start').disabled = true;

  // Fetch questions
  State.questions = await fetchQuestions(State.settings.subject, State.settings.difficulty);
  if (State.questions.length === 0) {
    State.questions = generateFallbackQuestions();
  }

  $('btn-start').textContent = '⚔️ Bắt đầu đấu!';
  $('btn-start').disabled = false;

  State.current = 'PLAYING';
  showScreen('game-screen');
  renderBoard();
  updateTurnInfo();
  updateStatus('Chọn quân để di chuyển');

  // Setup exit button
  $('btn-exit').onclick = () => $('exit-overlay').classList.add('active');
  $('exit-cancel').onclick = () => $('exit-overlay').classList.remove('active');
  $('exit-confirm').onclick = () => {
    $('exit-overlay').classList.remove('active');
    State.current = 'SETUP';
    showScreen('setup-screen');
  };

  // If current player is bot, trigger bot turn
  if (isCurrentPlayerBot()) {
    setTimeout(botTurn, BOT_DELAY);
  }
}

// ===== RENDERING =====
function renderBoard() {
  const boardEl = $('board');
  boardEl.innerHTML = '';

  // Render from top (row 5) to bottom (row 0) so row 0 is at bottom visually
  for (let r = ROWS - 1; r >= 0; r--) {
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement('div');
      const isLight = (r + c) % 2 === 0;
      cell.className = `cell ${isLight ? 'light' : 'dark'}`;
      cell.dataset.row = r;
      cell.dataset.col = c;

      const piece = State.board[r][c];
      if (piece) {
        const pieceEl = document.createElement('div');
        const playerClass = piece.player === P1 ? 'p1' : 'p2';
        pieceEl.className = `piece ${playerClass} ${piece.type}`;
        pieceEl.textContent = piece.type === KING ? '👑' : '⚔️';
        cell.appendChild(pieceEl);
      }

      // Highlight selected
      if (State.selectedPiece && State.selectedPiece.row === r && State.selectedPiece.col === c) {
        cell.classList.add('selected');
      }

      // Highlight valid moves
      const vm = State.validMoves.find(m => m.row === r && m.col === c);
      if (vm) {
        cell.classList.add(vm.isCapture ? 'valid-capture' : 'valid-move');
      }

      cell.addEventListener('click', () => onCellClick(r, c));
      boardEl.appendChild(cell);
    }
  }
}

function updateTurnInfo() {
  const name = State.turn === P1 ? State.settings.p1Name : State.settings.p2Name;
  const color = State.turn === P1 ? '🔴' : '🔵';
  $('turn-info').textContent = `${color} Lượt: ${name}`;
}

function updateStatus(msg) {
  $('game-status').textContent = msg;
}

// ===== INTERACTION =====
function isCurrentPlayerBot() {
  return State.turn === P1 ? State.settings.p1Bot : State.settings.p2Bot;
}

function onCellClick(row, col) {
  if (State.current !== 'PLAYING') return;
  if (isCurrentPlayerBot()) return; // ignore clicks during bot turn

  const piece = State.board[row][col];

  // If clicking a valid move destination
  const moveTarget = State.validMoves.find(m => m.row === row && m.col === col);
  if (moveTarget && State.selectedPiece) {
    // Set pending move and show quiz
    State.pendingMove = {
      from: { row: State.selectedPiece.row, col: State.selectedPiece.col },
      to: { row, col },
    };
    showQuiz();
    return;
  }

  // If clicking own piece, select it
  if (piece && piece.player === State.turn) {
    const moves = getValidMoves(State.board, row, col);
    if (moves.length === 0) {
      updateStatus('Quân này không thể đi!');
      return;
    }
    State.selectedPiece = { row, col };
    State.validMoves = moves;
    sfxSelect();
    renderBoard();
    updateStatus('Chọn ô đích để di chuyển');
    return;
  }

  // Deselect
  State.selectedPiece = null;
  State.validMoves = [];
  renderBoard();
  updateStatus('Chọn quân để di chuyển');
}

// ===== QUIZ =====
function getNextQuestion() {
  if (State.questionIndex >= State.questions.length) {
    // Recycle
    State.questions = shuffleArray(State.questions);
    State.questionIndex = 0;
  }
  return State.questions[State.questionIndex++];
}

function showQuiz() {
  State.current = 'QUIZ';
  const question = getNextQuestion();
  State._currentQuestion = question;

  const overlay = $('quiz-overlay');
  const playerName = State.turn === P1 ? State.settings.p1Name : State.settings.p2Name;
  $('quiz-header').textContent = `${State.turn === P1 ? '🔴' : '🔵'} ${playerName} — Trả lời đúng để đi!`;
  $('quiz-question').textContent = question.question;
  $('quiz-result').textContent = '';
  $('quiz-result').className = 'quiz-result';

  const answers = $('quiz-answers');
  const opts = ['a', 'b', 'c', 'd'];
  answers.querySelectorAll('.quiz-btn').forEach((btn, i) => {
    const opt = opts[i];
    btn.textContent = question[`option_${opt}`];
    btn.dataset.opt = opt;
    btn.className = 'quiz-btn';
    btn.disabled = false;
    btn.onclick = () => handleAnswer(opt);
  });

  overlay.classList.add('active');

  // If current player is bot, auto-answer
  if (isCurrentPlayerBot()) {
    setTimeout(() => botAnswer(question), BOT_DELAY);
  }
}

function botAnswer(question) {
  const isCorrect = Math.random() < BOT_ANSWER_RATE;
  const opts = ['a', 'b', 'c', 'd'];
  let chosen;
  if (isCorrect) {
    chosen = question.correct_answer;
  } else {
    const wrong = opts.filter(o => o !== question.correct_answer);
    chosen = wrong[Math.floor(Math.random() * wrong.length)];
  }
  handleAnswer(chosen);
}

function handleAnswer(chosen) {
  const question = State._currentQuestion;
  const correct = question.correct_answer;
  const isCorrect = chosen === correct;

  // Disable all buttons
  const buttons = $('quiz-answers').querySelectorAll('.quiz-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.classList.add('disabled');
    if (btn.dataset.opt === correct) btn.classList.add('correct');
    if (btn.dataset.opt === chosen && !isCorrect) btn.classList.add('wrong');
  });

  // Update stats
  if (State.turn === P1) {
    if (isCorrect) State.stats.p1Correct++; else State.stats.p1Wrong++;
  } else {
    if (isCorrect) State.stats.p2Correct++; else State.stats.p2Wrong++;
  }

  // Show result
  const resultEl = $('quiz-result');
  if (isCorrect) {
    resultEl.textContent = '✅ Đúng rồi! Được đi!';
    resultEl.className = 'quiz-result correct';
    sfxCorrect();
  } else {
    resultEl.textContent = '❌ Sai rồi! Mất lượt!';
    resultEl.className = 'quiz-result wrong';
    sfxWrong();
  }

  // After delay, process result
  setTimeout(() => {
    $('quiz-overlay').classList.remove('active');
    if (isCorrect) {
      executeMove();
    } else {
      // Lose turn
      endTurn();
    }
  }, QUIZ_RESULT_DELAY);
}

// ===== MOVE EXECUTION =====
function executeMove() {
  const { from, to } = State.pendingMove;
  const piece = State.board[from.row][from.col];
  const captured = State.board[to.row][to.col];

  // Move piece
  State.board[to.row][to.col] = piece;
  State.board[from.row][from.col] = null;

  if (captured) {
    sfxCapture();
  } else {
    sfxMove();
  }

  State.current = 'ANIMATING';
  renderBoard();

  // Check win
  const winResult = checkWin(State.board, State.turn);
  if (winResult) {
    setTimeout(() => {
      State.winner = winResult.winner;
      State.winReason = winResult.reason;
      State.current = 'GAME_OVER';
      showResult();
    }, 500);
    return;
  }

  // End turn
  setTimeout(() => endTurn(), 300);
}

function endTurn() {
  State.stats.turns++;
  State.selectedPiece = null;
  State.validMoves = [];
  State.pendingMove = null;

  // Switch turn
  State.turn = State.turn === P1 ? P2 : P1;
  State.current = 'PLAYING';

  // Check if next player has any moves
  if (!hasAnyMoves(State.board, State.turn)) {
    // No moves available - skip or check if stalemate
    // In this simplified game, if no moves, other player wins
    State.winner = State.turn === P1 ? P2 : P1;
    State.winReason = 'Đối phương không thể di chuyển!';
    State.current = 'GAME_OVER';
    showResult();
    return;
  }

  renderBoard();
  updateTurnInfo();
  updateStatus('Chọn quân để di chuyển');

  // If next player is bot, trigger bot turn
  if (isCurrentPlayerBot()) {
    updateStatus('🤖 Bot đang suy nghĩ...');
    setTimeout(botTurn, BOT_DELAY);
  }
}

// ===== BOT AI =====
function botTurn() {
  if (State.current !== 'PLAYING') return;

  // Collect all pieces with valid moves
  const candidates = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = State.board[r][c];
      if (p && p.player === State.turn) {
        const moves = getValidMoves(State.board, r, c);
        if (moves.length > 0) {
          candidates.push({ row: r, col: c, moves });
        }
      }
    }
  }

  if (candidates.length === 0) return; // shouldn't happen, already checked

  // Simple AI: prefer captures, then random
  let chosen = null;
  let chosenMove = null;

  // Look for capture moves first
  for (const cand of candidates) {
    const captures = cand.moves.filter(m => m.isCapture);
    if (captures.length > 0) {
      chosen = cand;
      chosenMove = captures[Math.floor(Math.random() * captures.length)];
      break;
    }
  }

  // If no captures, pick random
  if (!chosen) {
    chosen = candidates[Math.floor(Math.random() * candidates.length)];
    chosenMove = chosen.moves[Math.floor(Math.random() * chosen.moves.length)];
  }

  // Select piece visually
  State.selectedPiece = { row: chosen.row, col: chosen.col };
  State.validMoves = chosen.moves;
  renderBoard();

  // After brief delay, set pending move and show quiz
  setTimeout(() => {
    State.pendingMove = {
      from: { row: chosen.row, col: chosen.col },
      to: { row: chosenMove.row, col: chosenMove.col },
    };
    showQuiz();
  }, 600);
}

// ===== RESULT SCREEN =====
function showResult() {
  sfxWin();
  const winnerName = State.winner === P1 ? State.settings.p1Name : State.settings.p2Name;
  const color = State.winner === P1 ? '🔴' : '🔵';

  $('result-title').textContent = `${color} ${winnerName} thắng!`;
  $('result-winner').textContent = '🎉 Chúc mừng! 🎉';
  $('result-reason').textContent = State.winReason;

  $('stats-turns').textContent = State.stats.turns;
  $('stats-p1').textContent = `${State.stats.p1Correct} ✅ / ${State.stats.p1Wrong} ❌`;
  $('stats-p2').textContent = `${State.stats.p2Correct} ✅ / ${State.stats.p2Wrong} ❌`;

  // Update labels with names
  const statRows = document.querySelectorAll('.stat-row');
  if (statRows[1]) statRows[1].querySelector('span').textContent = `🔴 ${State.settings.p1Name}`;
  if (statRows[2]) statRows[2].querySelector('span').textContent = `🔵 ${State.settings.p2Name}`;

  $('btn-play-again').onclick = () => {
    State.current = 'SETUP';
    showScreen('setup-screen');
  };

  showScreen('result-screen');
}

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  initSetup();
});
