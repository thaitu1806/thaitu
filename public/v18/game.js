// V18 Ninja Toán Học - Math Ninja
// Slash scrolls with correct answers, survive waves, earn belts!

const BELTS = [
  { name: 'Trắng', color: 'belt-white', emoji: '⬜', minWaves: 0 },
  { name: 'Vàng', color: 'belt-yellow', emoji: '🟡', minWaves: 10 },
  { name: 'Xanh Lá', color: 'belt-green', emoji: '🟢', minWaves: 25 },
  { name: 'Xanh Dương', color: 'belt-blue', emoji: '🔵', minWaves: 50 },
  { name: 'Nâu', color: 'belt-brown', emoji: '🟤', minWaves: 80 },
  { name: 'Đen', color: 'belt-black', emoji: '⚫', minWaves: 120 },
];

const BASE_TIMER = 8; // seconds
const BOSS_EVERY = 5; // every 5 waves = boss
const BOSS_REQUIRED = 3; // correct answers needed for boss
const POINTS_BASE = 10;

// ===== STATE =====
const S = {
  config: { subject: 'math', difficulty: 'easy' },
  lives: 3,
  wave: 1,
  score: 0,
  combo: 0,
  maxCombo: 0,
  questionsInWave: 0,
  correctInWave: 0,
  totalCorrect: 0,
  totalWrong: 0,
  questions: [],
  qIndex: 0,
  gameOver: false,
  timerInterval: null,
  timeLeft: BASE_TIMER,
  isBoss: false,
  bossCorrect: 0,
  sessionId: null,
};

function getPlayerId() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.id; } catch { return null; } }
function getPlayerGrade() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.grade || 2; } catch { return 2; } }

function getTotalWaves() { return parseInt(localStorage.getItem('v18_total_waves') || '0'); }
function saveTotalWaves(w) { localStorage.setItem('v18_total_waves', String(w)); }

function getCurrentBelt() {
  const waves = getTotalWaves();
  let belt = BELTS[0];
  for (const b of BELTS) { if (waves >= b.minWaves) belt = b; }
  return belt;
}

function getTimerForWave(wave) {
  // Timer gets shorter in later waves: min 4s
  return Math.max(4, BASE_TIMER - Math.floor((wave - 1) / 3) * 0.5);
}

function getQuestionsPerWave(wave) {
  // Start with 3, increase gradually
  return Math.min(3 + Math.floor((wave - 1) / 2), 8);
}

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== SETUP =====
document.getElementById('current-belt').textContent = getCurrentBelt().name;
document.getElementById('total-waves').textContent = getTotalWaves();

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
document.getElementById('btn-start').addEventListener('click', startGame);

// ===== GAME START =====
async function startGame() {
  Object.assign(S, {
    lives: 3, wave: 1, score: 0, combo: 0, maxCombo: 0,
    questionsInWave: 0, correctInWave: 0, totalCorrect: 0, totalWrong: 0,
    qIndex: 0, gameOver: false, isBoss: false, bossCorrect: 0, sessionId: null,
  });
  showScreen('game-screen');
  updateHUD();
  await fetchQuestions();
  startWave();
}

async function fetchQuestions() {
  const grade = getPlayerGrade();
  let subject = S.config.subject;
  if (subject === 'mix') subject = ['math', 'vietnamese', 'english'][Math.floor(Math.random() * 3)];
  try {
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=${S.config.difficulty}&limit=50&grade=${grade}`);
    const data = await res.json();
    S.questions = (Array.isArray(data) ? data : data.questions || []).sort(() => Math.random() - 0.5);
  } catch { S.questions = []; }
  if (!S.questions.length) {
    S.questions = [{ question_text: 'Không tải được câu hỏi', option_a: 'Thử lại', option_b: '-', option_c: '-', option_d: '-', correct_answer: 'a' }];
  }
}

// ===== WAVE SYSTEM =====
function startWave() {
  if (S.gameOver) return;

  S.questionsInWave = 0;
  S.correctInWave = 0;

  // Check if boss wave
  S.isBoss = (S.wave % BOSS_EVERY === 0);
  S.bossCorrect = 0;

  if (S.isBoss) {
    showBossIntro();
  } else {
    showQuestion();
  }
}

function showBossIntro() {
  const bossEl = document.getElementById('boss-indicator');
  document.getElementById('boss-progress').textContent = '⬜⬜⬜';
  bossEl.classList.add('active');

  setTimeout(() => {
    bossEl.classList.remove('active');
    showQuestion();
  }, 2000);
}

function completeWave() {
  const totalWaves = getTotalWaves() + 1;
  saveTotalWaves(totalWaves);
  S.wave++;
  updateHUD();

  // Brief pause then next wave
  setTimeout(() => {
    if (!S.gameOver) startWave();
  }, 800);
}

// ===== QUESTION DISPLAY =====
function showQuestion() {
  if (S.gameOver) return;
  if (S.qIndex >= S.questions.length) {
    S.qIndex = 0;
    S.questions.sort(() => Math.random() - 0.5);
  }

  const q = S.questions[S.qIndex];
  const scrollText = document.getElementById('scroll-text');
  const scrollContainer = document.getElementById('scroll-container');

  scrollText.textContent = q.question_text;

  // Animate scroll dropping in
  scrollContainer.classList.remove('entering', 'slashed');
  void scrollContainer.offsetHeight;
  scrollContainer.classList.add('entering');

  // Set answer buttons
  const btns = document.querySelectorAll('.ans-btn');
  ['a', 'b', 'c', 'd'].forEach((o, i) => {
    btns[i].textContent = q[`option_${o}`];
    btns[i].className = 'ans-btn';
    btns[i].disabled = false;
    btns[i].dataset.opt = o;
  });

  startTimer();
}

// ===== TIMER =====
function startTimer() {
  stopTimer();
  const maxTime = getTimerForWave(S.wave);
  S.timeLeft = maxTime;
  updateTimerBar(maxTime);

  S.timerInterval = setInterval(() => {
    S.timeLeft -= 0.1;
    updateTimerBar(maxTime);
    if (S.timeLeft <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 100);
}

function stopTimer() {
  if (S.timerInterval) { clearInterval(S.timerInterval); S.timerInterval = null; }
}

function updateTimerBar(maxTime) {
  const fill = document.getElementById('timer-fill');
  const pct = Math.max(0, (S.timeLeft / maxTime) * 100);
  fill.style.width = pct + '%';
  fill.classList.remove('urgent', 'warning');
  if (S.timeLeft <= 2) fill.classList.add('urgent');
  else if (S.timeLeft <= 4) fill.classList.add('warning');
}

function handleTimeout() {
  const q = S.questions[S.qIndex];
  const correct = q.correct_answer;

  // Show correct answer
  document.querySelectorAll('.ans-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  document.querySelector(`.ans-btn[data-opt="${correct}"]`).classList.add('correct');

  handleWrongAnswer(q, '', correct);
}

// ===== ANSWER HANDLING =====
document.getElementById('answer-area').addEventListener('click', e => {
  const btn = e.target.closest('.ans-btn');
  if (!btn || btn.disabled || S.gameOver) return;

  stopTimer();
  const selected = btn.dataset.opt;
  const q = S.questions[S.qIndex];
  const correct = q.correct_answer;
  const isCorrect = selected.toLowerCase() === correct.toLowerCase();

  document.querySelectorAll('.ans-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });

  if (isCorrect) {
    btn.classList.add('correct');
    handleCorrectAnswer(q, selected, correct);
  } else {
    btn.classList.add('wrong');
    document.querySelector(`.ans-btn[data-opt="${correct}"]`).classList.add('correct');
    handleWrongAnswer(q, selected, correct);
  }

  logAnswer(q, selected, correct, isCorrect);
});

function handleCorrectAnswer(q, selected, correct) {
  S.totalCorrect++;
  S.combo++;
  if (S.combo > S.maxCombo) S.maxCombo = S.combo;
  S.questionsInWave++;
  S.correctInWave++;

  // Score: base * combo multiplier
  const multiplier = Math.min(S.combo, 5);
  const points = POINTS_BASE * multiplier;
  S.score += points;

  // Slash effect
  triggerSlash();
  animateNinja('attacking');
  showScorePopup(`+${points}`);

  // Boss mode tracking
  if (S.isBoss) {
    S.bossCorrect++;
    updateBossProgress();
    if (S.bossCorrect >= BOSS_REQUIRED) {
      // Boss defeated!
      setTimeout(() => {
        S.score += 50; // bonus
        showScorePopup('+50 BOSS!');
        completeWave();
      }, 600);
      updateHUD();
      S.qIndex++;
      return;
    }
  }

  updateHUD();

  // Check wave completion (non-boss)
  if (!S.isBoss) {
    const needed = getQuestionsPerWave(S.wave);
    if (S.correctInWave >= needed) {
      S.qIndex++;
      setTimeout(() => completeWave(), 600);
      return;
    }
  }

  // Next question
  setTimeout(() => {
    S.qIndex++;
    showQuestion();
  }, 700);
}

function handleWrongAnswer(q, selected, correct) {
  S.totalWrong++;
  S.combo = 0;
  S.questionsInWave++;
  S.lives--;

  // Wrong flash
  triggerWrongFlash();
  animateNinja('hurt');

  // Boss mode: reset
  if (S.isBoss) {
    S.bossCorrect = 0;
    updateBossProgress();
  }

  updateHUD();

  if (S.lives <= 0) {
    setTimeout(() => endGame(), 800);
    return;
  }

  // Next question
  setTimeout(() => {
    S.qIndex++;
    showQuestion();
  }, 1000);
}

// ===== EFFECTS =====
function triggerSlash() {
  const el = document.getElementById('slash-effect');
  el.classList.remove('active');
  void el.offsetHeight;
  el.classList.add('active');

  // Also slash the scroll
  const scroll = document.getElementById('scroll-container');
  scroll.classList.remove('slashed');
  void scroll.offsetHeight;
  scroll.classList.add('slashed');
}

function triggerWrongFlash() {
  const el = document.getElementById('wrong-flash');
  el.classList.remove('active');
  void el.offsetHeight;
  el.classList.add('active');
}

function animateNinja(type) {
  const ninja = document.getElementById('ninja-player');
  ninja.classList.remove('attacking', 'hurt');
  void ninja.offsetHeight;
  ninja.classList.add(type);
  setTimeout(() => ninja.classList.remove(type), 500);
}

function showScorePopup(text) {
  const popup = document.createElement('div');
  popup.className = 'score-popup';
  popup.textContent = text;
  document.getElementById('game-screen').appendChild(popup);
  setTimeout(() => popup.remove(), 900);
}

function updateBossProgress() {
  const el = document.getElementById('boss-progress');
  let display = '';
  for (let i = 0; i < BOSS_REQUIRED; i++) {
    display += i < S.bossCorrect ? '🟢' : '⬜';
  }
  el.textContent = display;
}

// ===== HUD UPDATE =====
function updateHUD() {
  // Lives
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < S.lives ? '❤️' : '🖤';
  document.getElementById('hud-lives').textContent = hearts;

  // Belt
  const belt = getCurrentBelt();
  document.getElementById('hud-belt').textContent = `${belt.emoji}`;

  // Wave
  document.getElementById('hud-wave').textContent = `Sóng ${S.wave}`;

  // Score
  document.getElementById('hud-score').textContent = `⭐ ${S.score}`;

  // Combo
  const comboEl = document.getElementById('hud-combo');
  if (S.combo >= 2) {
    comboEl.textContent = `🔥x${S.combo}`;
  } else {
    comboEl.textContent = '';
  }
}

// ===== END GAME =====
function endGame() {
  if (S.gameOver) return;
  S.gameOver = true;
  stopTimer();

  const wavesThisGame = S.wave - 1;
  const totalWaves = getTotalWaves();
  const belt = getCurrentBelt();
  const stars = wavesThisGame >= 10 ? 3 : wavesThisGame >= 5 ? 2 : wavesThisGame >= 2 ? 1 : 0;
  const accuracy = S.totalCorrect + S.totalWrong > 0
    ? Math.round((S.totalCorrect / (S.totalCorrect + S.totalWrong)) * 100) : 0;

  // Check belt promotion
  let beltUpgrade = '';
  const prevBelt = getBeltForWaves(totalWaves - wavesThisGame);
  if (belt.name !== prevBelt.name) {
    beltUpgrade = `<div class="result-belt"><div class="result-belt-text">🎉 Lên đai! ${prevBelt.emoji} ${prevBelt.name} ➜ ${belt.emoji} <span class="${belt.color}">${belt.name}</span></div></div>`;
  }

  document.getElementById('result-container').innerHTML = `
    <div class="result-title">⚔️ Trận Đấu Kết Thúc!</div>
    <div class="result-subtitle">Ninja đã chiến đấu dũng cảm!</div>
    <div class="result-stats">
      <div class="result-stat"><span>🌊 Sóng vượt</span><strong>${wavesThisGame}</strong></div>
      <div class="result-stat"><span>⭐ Điểm</span><strong>${S.score}</strong></div>
      <div class="result-stat"><span>✅ Đúng</span><strong>${S.totalCorrect}</strong></div>
      <div class="result-stat"><span>❌ Sai</span><strong>${S.totalWrong}</strong></div>
      <div class="result-stat"><span>🔥 Combo max</span><strong>${S.maxCombo}</strong></div>
      <div class="result-stat"><span>🎯 Chính xác</span><strong>${accuracy}%</strong></div>
    </div>
    ${beltUpgrade}
    <div class="result-belt">
      <div class="result-belt-text">${belt.emoji} Đai: <span class="${belt.color}">${belt.name}</span> | Tổng sóng: ${totalWaves}</div>
    </div>
    <div class="result-btns">
      <button class="result-btn primary" onclick="resetAndPlay()">⚔️ Chiến tiếp</button>
      <button class="result-btn secondary" onclick="goHome()">🏠 Trang chủ</button>
    </div>
  `;

  showScreen('result-screen');
  saveSession(stars, accuracy);

  if (window.checkAndShowPrompt && getPlayerId()) window.checkAndShowPrompt(getPlayerId());
}

function getBeltForWaves(waves) {
  let belt = BELTS[0];
  for (const b of BELTS) { if (waves >= b.minWaves) belt = b; }
  return belt;
}

function resetAndPlay() {
  showScreen('setup-screen');
  document.getElementById('current-belt').textContent = getCurrentBelt().name;
  document.getElementById('total-waves').textContent = getTotalWaves();
}
function goHome() { window.location.href = '/'; }

// ===== SESSION & ANSWER LOGGING =====
async function saveSession(stars, accuracy) {
  const playerId = getPlayerId(); if (!playerId) return;
  try {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: playerId,
        subject: S.config.subject === 'mix' ? 'math' : S.config.subject,
        difficulty: S.config.difficulty,
        score: S.score,
        total_questions: S.totalCorrect + S.totalWrong,
        correct_answers: S.totalCorrect,
        stars_earned: stars,
        combo_max: S.maxCombo,
        mode: 'v18',
        accuracy: accuracy,
      }),
    });
    const data = await res.json();
    if (data.id) S.sessionId = data.id;
  } catch {}
}

async function logAnswer(q, selected, correct, isCorrect) {
  const playerId = getPlayerId(); if (!playerId) return;
  try {
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: S.sessionId || 0,
        player_id: playerId,
        question_id: q.id || 0,
        selected_answer: selected,
        correct_answer: correct,
        is_correct: isCorrect ? 1 : 0,
        time_spent_ms: 0,
      }),
    });
  } catch {}
}
