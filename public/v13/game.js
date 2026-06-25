// V13 Thám Hiểm Đại Dương - Ocean Explorer
// Full ocean view with diving submarine, swimming creatures, and popup questions

const DEPTH_ZONES = [
  { maxDepth: 100, name: 'Vùng Nắng', bg: ['#1a8fbe', '#106a8e'], creatures: ['🐠', '🐟', '🦐'], ambientFish: ['🐠','🐟','🐟','🐠'], seaweed: true, lightRays: 1 },
  { maxDepth: 300, name: 'Vùng Xanh', bg: ['#106a8e', '#0a4a6e'], creatures: ['🐙', '🦑', '🐡', '🦀'], ambientFish: ['🐡','🦀','🐙','🦑'], seaweed: true, lightRays: 0.5 },
  { maxDepth: 600, name: 'Vùng Tối', bg: ['#0a4a6e', '#062840'], creatures: ['🦈', '🐋', '🐳', '🎐'], ambientFish: ['🎐','🦈','🐋'], seaweed: false, lightRays: 0.15 },
  { maxDepth: 1000, name: 'Vực Thẳm', bg: ['#062840', '#010e1a'], creatures: ['🐉', '🦕', '🌺', '🌟'], ambientFish: ['🌺','🌟','🐉'], seaweed: false, lightRays: 0 },
];

const OXYGEN_TOTAL = 180;
const DEPTH_PER_CORRECT = 50;
const DEPTH_PUSHBACK = 30;
const PEARLS_BASE = 5;
const TREASURE_CHANCE = 0.12;
const QUESTION_TIMEOUT = 12; // seconds per question

// ===== STATE =====
const S = {
  config: { subject: 'math', difficulty: 'easy' },
  depth: 0, maxDepth: 0, pearls: 0, oxygen: OXYGEN_TOTAL,
  combo: 0, creaturesFound: [], questions: [], qIndex: 0,
  correct: 0, incorrect: 0, gameOver: false, oxygenTimer: null,
  ambientTimer: null, currentZoneIdx: 0, questionTimer: null, questionTimeLeft: 0,
};

function getCollection() { try { return JSON.parse(localStorage.getItem('v13_collection') || '[]'); } catch { return []; } }
function saveCollection(arr) { localStorage.setItem('v13_collection', JSON.stringify(arr)); }
function getPlayerId() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.id; } catch { return null; } }
function getPlayerGrade() { try { return JSON.parse(localStorage.getItem('hocvui_profile'))?.grade || 2; } catch { return 2; } }

// ===== SCREENS =====
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===== SETUP =====
document.getElementById('collection-count').textContent = getCollection().length;

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
  Object.assign(S, { depth: 0, maxDepth: 0, pearls: 0, oxygen: OXYGEN_TOTAL, combo: 0, creaturesFound: [], qIndex: 0, correct: 0, incorrect: 0, gameOver: false, currentZoneIdx: 0 });
  showScreen('game-screen');
  setupOceanWorld();
  setupDepthRuler();
  updateHUD();
  updateSubmarinePosition();
  startOxygenTimer();
  startAmbientLife();
  await fetchQuestions();
  showQuestion();
}

async function fetchQuestions() {
  const grade = getPlayerGrade();
  let subject = S.config.subject;
  if (subject === 'mix') subject = ['math', 'vietnamese', 'english'][Math.floor(Math.random() * 3)];
  try {
    const res = await fetch(`/api/questions?subject=${subject}&difficulty=${S.config.difficulty}&limit=30&grade=${grade}`);
    const data = await res.json();
    S.questions = (Array.isArray(data) ? data : data.questions || []).sort(() => Math.random() - 0.5);
  } catch { S.questions = []; }
  if (!S.questions.length) {
    S.questions = [{ question_text: 'Không tải được câu hỏi', option_a: 'Thử lại', option_b: '-', option_c: '-', option_d: '-', correct_answer: 'a' }];
  }
}

// ===== OCEAN WORLD SETUP =====
function setupOceanWorld() {
  const world = document.getElementById('ocean-world');
  if (!world) return;
  // Clear old content except light-rays
  world.querySelectorAll('.bubble, .seaweed, .swimming-creature, .depth-marker').forEach(el => el.remove());

  // Bubbles
  for (let i = 0; i < 20; i++) {
    const b = document.createElement('div');
    b.className = 'bubble';
    const size = 3 + Math.random() * 14;
    Object.assign(b.style, { width: size+'px', height: size+'px', left: Math.random()*100+'%', bottom: Math.random()*50+'%', animationDuration: (5+Math.random()*8)+'s', animationDelay: Math.random()*6+'s' });
    world.appendChild(b);
  }

  // Seaweed at bottom
  const seaweeds = ['🌿', '🌱', '🌾', '🌾'];
  for (let i = 0; i < 6; i++) {
    const sw = document.createElement('div');
    sw.className = 'seaweed';
    sw.textContent = seaweeds[Math.floor(Math.random() * seaweeds.length)];
    Object.assign(sw.style, { left: (5 + Math.random()*90)+'%', animationDelay: (Math.random()*2)+'s', fontSize: (1.5+Math.random()*1.5)+'rem' });
    world.appendChild(sw);
  }

  // Depth markers
  [100, 200, 300, 500, 700, 1000].forEach(d => {
    const marker = document.createElement('div');
    marker.className = 'depth-marker';
    marker.textContent = `── ${d}m ──`;
    marker.style.top = '50%'; // will be repositioned by zone transitions
    marker.style.display = 'none';
    world.appendChild(marker);
  });

  updateZoneVisuals();
}

function updateZoneVisuals() {
  const zone = getZone();
  const world = document.getElementById('ocean-world');
  if (!world) return;
  world.style.background = `linear-gradient(180deg, ${zone.bg[0]}, ${zone.bg[1]})`;

  // Light rays opacity
  const rays = document.getElementById('light-rays');
  if (rays) rays.style.opacity = zone.lightRays;

  // Show/hide seaweed based on zone
  world.querySelectorAll('.seaweed').forEach(sw => {
    sw.style.display = zone.seaweed ? '' : 'none';
  });
}

// ===== AMBIENT SWIMMING CREATURES =====
function startAmbientLife() {
  if (S.ambientTimer) clearInterval(S.ambientTimer);
  spawnAmbientCreature();
  S.ambientTimer = setInterval(() => {
    if (S.gameOver) { clearInterval(S.ambientTimer); S.ambientTimer = null; return; }
    spawnAmbientCreature();
  }, 3500);
}

function spawnAmbientCreature() {
  if (S.gameOver) return;
  const zone = getZone();
  if (!zone.ambientFish.length) return;

  const world = document.getElementById('ocean-world');
  if (!world) return;
  const fish = document.createElement('div');
  const emoji = zone.ambientFish[Math.floor(Math.random() * zone.ambientFish.length)];
  const goRight = Math.random() > 0.5;

  fish.className = 'swimming-creature' + (goRight ? ' rtl' : '');
  fish.textContent = emoji;
  const topPos = 15 + Math.random() * 65;
  const duration = 6 + Math.random() * 8;
  const size = 1.2 + Math.random() * 1;
  Object.assign(fish.style, { top: topPos+'%', animationDuration: duration+'s', fontSize: size+'rem' });
  world.appendChild(fish);

  // Remove after animation
  setTimeout(() => fish.remove(), duration * 1000 + 500);
}

// ===== DEPTH RULER =====
const RULER_MAX = 1000; // max depth shown on ruler
const RULER_TICKS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

function setupDepthRuler() {
  const track = document.querySelector('.ruler-track');
  if (!track) return;
  // Remove old ticks/labels
  track.querySelectorAll('.ruler-tick').forEach(t => t.remove());
  const labelsEl = document.getElementById('ruler-labels');
  if (labelsEl) labelsEl.innerHTML = '';

  RULER_TICKS.forEach(d => {
    const pct = (d / RULER_MAX) * 100;
    // Tick mark
    const tick = document.createElement('div');
    tick.className = 'ruler-tick' + (d % 200 === 0 ? ' major' : '');
    tick.style.top = pct + '%';
    track.appendChild(tick);
    // Label (only every 200m)
    if (d % 200 === 0 && labelsEl) {
      const lbl = document.createElement('div');
      lbl.className = 'ruler-label';
      lbl.style.top = pct + '%';
      lbl.textContent = d + 'm';
      lbl.dataset.depth = d;
      labelsEl.appendChild(lbl);
    }
  });
  updateDepthRuler();
}

function updateDepthRuler() {
  const pct = Math.min((S.depth / RULER_MAX) * 100, 100);
  const marker = document.getElementById('ruler-marker');
  if (marker) marker.style.top = pct + '%';
  const tag = document.getElementById('ruler-depth-tag');
  if (tag) tag.textContent = S.depth + 'm';

  // Highlight nearest label
  document.querySelectorAll('.ruler-label').forEach(lbl => {
    const d = parseInt(lbl.dataset.depth);
    lbl.classList.toggle('current', Math.abs(d - S.depth) < 50);
  });
}

// ===== SUBMARINE POSITION =====
function updateSubmarinePosition() {
  // Submarine moves in sync with the ruler — from top:50px (0m) to bottom:200px (1000m)
  // This matches the ruler's top:50px bottom:200px positioning
  const maxVisualDepth = 1000;
  const pct = Math.min(S.depth / maxVisualDepth, 1);
  // Ruler goes from ~50px from top to ~200px from bottom of screen
  // So submarine top should go from about 12% to about 55% of viewport
  const topPos = 12 + pct * 43; // 12% (surface) → 55% (deep)
  const wrap = document.getElementById('submarine-wrap');
  if (wrap) wrap.style.top = topPos + '%';
}

function animateSubmarine(direction) {
  const sub = document.getElementById('submarine');
  if (!sub) return;
  sub.classList.remove('diving', 'rising');
  void sub.offsetHeight; // reflow
  sub.classList.add(direction);
  setTimeout(() => sub.classList.remove(direction), 700);
}

// ===== HUD =====
function updateHUD() {
  document.getElementById('depth-text').textContent = S.depth + 'm';
  document.getElementById('pearl-count').textContent = S.pearls;
  updateOxygenBar();
  updateDepthRuler();

  // Check zone change
  const newZoneIdx = DEPTH_ZONES.findIndex(z => S.depth <= z.maxDepth);
  const zoneIdx = newZoneIdx >= 0 ? newZoneIdx : DEPTH_ZONES.length - 1;
  if (zoneIdx !== S.currentZoneIdx) {
    S.currentZoneIdx = zoneIdx;
    updateZoneVisuals();
  }
}

function getZone() {
  for (const z of DEPTH_ZONES) { if (S.depth <= z.maxDepth) return z; }
  return DEPTH_ZONES[DEPTH_ZONES.length - 1];
}

// ===== OXYGEN =====
function startOxygenTimer() {
  if (S.oxygenTimer) clearInterval(S.oxygenTimer);
  S.oxygenTimer = setInterval(() => {
    if (S.gameOver) return;
    S.oxygen -= 1;
    updateOxygenBar();
    if (S.oxygen <= 0) endGame('oxygen');
  }, 1000);
}

function updateOxygenBar() {
  const pct = Math.max(0, (S.oxygen / OXYGEN_TOTAL) * 100);
  const fill = document.getElementById('oxygen-fill');
  if (!fill) return;
  fill.style.width = pct + '%';
  fill.classList.toggle('low', pct < 20);
}

// ===== QUESTION (POPUP) =====
function stopQuestionTimer() {
  if (S.questionTimer) { clearInterval(S.questionTimer); S.questionTimer = null; }
}

function startQuestionTimer() {
  stopQuestionTimer();
  S.questionTimeLeft = QUESTION_TIMEOUT;
  updateTimerBar();
  S.questionTimer = setInterval(() => {
    S.questionTimeLeft -= 0.1;
    updateTimerBar();
    if (S.questionTimeLeft <= 0) {
      stopQuestionTimer();
      handleTimeout();
    }
  }, 100);
}

function updateTimerBar() {
  const fill = document.getElementById('q-timer-fill');
  if (!fill) return;
  const pct = Math.max(0, (S.questionTimeLeft / QUESTION_TIMEOUT) * 100);
  fill.style.width = pct + '%';
  fill.classList.toggle('urgent', S.questionTimeLeft <= 3);
}

function handleTimeout() {
  // Treat timeout as wrong answer
  const q = S.questions[S.qIndex];
  const correct = q.correct_answer;
  document.querySelectorAll('.ans-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });
  document.querySelector(`.ans-btn[data-opt="${correct}"]`).classList.add('correct');

  S.incorrect++; S.combo = 0;
  S.depth = Math.max(0, S.depth - DEPTH_PUSHBACK);

  const st = document.getElementById('status-text');
  st.textContent = '⏱️ Hết giờ! Bị đẩy lên!';
  st.className = 'status-text bad';

  animateSubmarine('rising');
  updateSubmarinePosition();
  updateHUD();

  logAnswer(q, '', correct, false);

  setTimeout(() => {
    if (!S.gameOver) {
      document.getElementById('question-popup').classList.add('hidden');
      setTimeout(() => { S.qIndex++; showQuestion(); }, 400);
    }
  }, 1000);
}

function showQuestion() {
  if (S.gameOver) return;
  if (S.qIndex >= S.questions.length) { S.qIndex = 0; S.questions.sort(() => Math.random() - 0.5); }

  const q = S.questions[S.qIndex];
  document.getElementById('q-text').textContent = q.question_text;
  const btns = document.querySelectorAll('.ans-btn');
  ['a','b','c','d'].forEach((o, i) => {
    btns[i].textContent = q[`option_${o}`];
    btns[i].className = 'ans-btn';
    btns[i].disabled = false;
  });
  document.getElementById('status-text').textContent = '';
  document.getElementById('status-text').className = 'status-text';
  document.getElementById('question-popup').classList.remove('hidden');
  startQuestionTimer();
}

// ===== ANSWER =====
document.getElementById('answer-grid').addEventListener('click', e => {
  const btn = e.target.closest('.ans-btn');
  if (!btn || btn.disabled || S.gameOver) return;

  const selected = btn.dataset.opt;
  const q = S.questions[S.qIndex];
  const correct = q.correct_answer;
  const isCorrect = selected.toLowerCase() === correct.toLowerCase();

  stopQuestionTimer();
  document.querySelectorAll('.ans-btn').forEach(b => { b.disabled = true; b.classList.add('disabled'); });

  if (isCorrect) { btn.classList.add('correct'); handleCorrect(); }
  else { btn.classList.add('wrong'); document.querySelector(`.ans-btn[data-opt="${correct}"]`).classList.add('correct'); handleWrong(); }

  logAnswer(q, selected, correct, isCorrect);

  // Brief hide popup, then show next question
  setTimeout(() => {
    if (!S.gameOver) {
      document.getElementById('question-popup').classList.add('hidden');
      setTimeout(() => { S.qIndex++; showQuestion(); }, 400);
    }
  }, 1000);
});

function handleCorrect() {
  S.correct++; S.combo++;
  const bonus = S.combo >= 5 ? 3 : S.combo >= 3 ? 2 : 1;
  const earned = PEARLS_BASE * bonus;
  S.pearls += earned;
  S.depth += DEPTH_PER_CORRECT;
  if (S.depth > S.maxDepth) S.maxDepth = S.depth;

  const comboText = S.combo >= 3 ? ` 🔥x${S.combo}` : '';
  const st = document.getElementById('status-text');
  st.textContent = `✅ +${earned} ngọc trai!${comboText}`;
  st.className = 'status-text good';

  animateSubmarine('diving');
  updateSubmarinePosition();
  updateHUD();
  maybeDiscoverCreature();
  maybeTreasure();
}

function handleWrong() {
  S.incorrect++; S.combo = 0;
  S.depth = Math.max(0, S.depth - DEPTH_PUSHBACK);

  const st = document.getElementById('status-text');
  st.textContent = '❌ Bị đẩy lên! Cố lên nhé!';
  st.className = 'status-text bad';

  animateSubmarine('rising');
  updateSubmarinePosition();
  updateHUD();
}

// ===== CREATURE DISCOVERY =====
function maybeDiscoverCreature() {
  if (S.correct % 2 !== 0) return;
  const zone = getZone();
  const pool = zone.creatures.filter(c => !S.creaturesFound.includes(c));
  if (!pool.length) return;

  const creature = pool[Math.floor(Math.random() * pool.length)];
  S.creaturesFound.push(creature);

  // Show creature popup near submarine
  const existing = document.querySelector('.creature-discover');
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.className = 'creature-discover';
  el.innerHTML = `${creature}<div class="creature-label">Phát hiện!</div>`;
  document.getElementById('game-screen').appendChild(el);

  setTimeout(() => el.remove(), 2500);
}

// ===== TREASURE =====
function maybeTreasure() {
  if (Math.random() > TREASURE_CHANCE || S.depth < 100) return;

  const bonusPearls = 10 + Math.floor(Math.random() * 15);
  S.pearls += bonusPearls;
  S.oxygen = Math.min(OXYGEN_TOTAL, S.oxygen + 15);

  document.getElementById('treasure-text').textContent = `+${bonusPearls} ngọc trai! +15s O₂!`;
  document.getElementById('treasure-popup').classList.add('active');
  setTimeout(() => document.getElementById('treasure-popup').classList.remove('active'), 1800);
  updateHUD();
}

// ===== END GAME =====
function endGame(reason) {
  if (S.gameOver) return;
  S.gameOver = true;
  if (S.oxygenTimer) { clearInterval(S.oxygenTimer); S.oxygenTimer = null; }
  if (S.ambientTimer) { clearInterval(S.ambientTimer); S.ambientTimer = null; }
  stopQuestionTimer();

  const collection = getCollection();
  S.creaturesFound.forEach(c => { if (!collection.includes(c)) collection.push(c); });
  saveCollection(collection);
  saveSession();
  setTimeout(() => showResults(reason, collection), 600);
}

function showResults(reason, collection) {
  const reasonText = reason === 'oxygen' ? '⏱️ Hết oxy!' : '🔼 Đã nổi lên an toàn!';
  const stars = S.maxDepth >= 800 ? 3 : S.maxDepth >= 400 ? 2 : S.maxDepth >= 100 ? 1 : 0;

  document.getElementById('result-container').innerHTML = `
    <div class="result-title">${reasonText}</div>
    <div class="result-depth">${S.maxDepth}m</div>
    <div style="font-size:1rem;color:rgba(255,255,255,0.7);">Độ sâu tối đa</div>
    <div class="result-stats">
      <div class="result-stat"><span>💎 Ngọc trai</span><strong>${S.pearls}</strong></div>
      <div class="result-stat"><span>✅ Đúng</span><strong>${S.correct}</strong></div>
      <div class="result-stat"><span>❌ Sai</span><strong>${S.incorrect}</strong></div>
      <div class="result-stat"><span>⭐ Sao</span><strong>${'⭐'.repeat(stars) || '—'}</strong></div>
      <div class="result-stat"><span>🐚 Bộ sưu tập</span><strong>${collection.length}/20</strong></div>
    </div>
    ${S.creaturesFound.length > 0 ? `<div class="result-creatures"><div class="result-creatures-title">Sinh vật phát hiện:</div><div class="result-creatures-list">${S.creaturesFound.join(' ')}</div></div>` : ''}
    <div class="result-btns">
      <button class="result-btn primary" onclick="resetAndPlay()">🔄 Lặn lại</button>
      <button class="result-btn secondary" onclick="goHome()">🏠 Trang chủ</button>
    </div>`;
  showScreen('result-screen');

  if (window.checkAndShowPrompt && getPlayerId()) window.checkAndShowPrompt(getPlayerId());
}

function resetAndPlay() { showScreen('setup-screen'); document.getElementById('collection-count').textContent = getCollection().length; }
function goHome() { window.location.href = '/'; }

// ===== SURFACE BUTTON =====
document.getElementById('btn-surface').addEventListener('click', () => {
  if (S.gameOver) return;
  document.getElementById('exit-pearls').textContent = S.pearls;
  document.getElementById('exit-overlay').classList.add('active');
});
document.getElementById('exit-cancel').addEventListener('click', () => document.getElementById('exit-overlay').classList.remove('active'));
document.getElementById('exit-confirm').addEventListener('click', () => { document.getElementById('exit-overlay').classList.remove('active'); endGame('surface'); });

// ===== SESSION & ANSWER LOGGING =====
async function saveSession() {
  const playerId = getPlayerId(); if (!playerId) return;
  const stars = S.maxDepth >= 800 ? 3 : S.maxDepth >= 400 ? 2 : S.maxDepth >= 100 ? 1 : 0;
  try { await fetch('/api/sessions', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ player_id: playerId, subject: S.config.subject === 'mix' ? 'math' : S.config.subject, difficulty: S.config.difficulty, score: S.pearls, total_questions: S.correct + S.incorrect, correct_answers: S.correct, stars_earned: stars, combo_max: S.combo }) }); } catch {}
}

async function logAnswer(q, selected, correct, isCorrect) {
  const playerId = getPlayerId(); if (!playerId) return;
  try { await fetch('/api/answers', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ session_id: 0, player_id: playerId, question_id: q.id || 0, selected_answer: selected, correct_answer: correct, is_correct: isCorrect ? 1 : 0, time_spent_ms: 0, difficulty: S.config.difficulty, combo_streak: S.combo }) }); } catch {}
}
